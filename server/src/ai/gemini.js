import { GoogleGenAI } from '@google/genai'
import { config } from '../config.js'
import { DRAFT_SCHEMAS, draftInstruction, projectContext, SYSTEM_PROMPT } from './prompts.js'

export class AiError extends Error {
  constructor(message, status = 502) {
    super(message)
    this.status = status
  }
}

let client
function getClient() {
  client ??= new GoogleGenAI({
    apiKey: config.geminiApiKey,
    ...(config.geminiBaseUrl ? { httpOptions: { baseUrl: config.geminiBaseUrl } } : {}),
  })
  return client
}

// Failures where the fallback model can help: quota or rate limits, an unavailable model, overload.
const RETRYABLE = new Set([404, 429, 500, 503])
const statusOf = (err) => err?.status ?? err?.code

/** The configured model first, then the fallback (deduplicated). */
function models() {
  return [config.geminiModel, config.geminiFallbackModel].filter((m, i, all) => m && all.indexOf(m) === i)
}

/** Our turns → Gemini Interactions steps. The full history is sent each time, so nothing is stored by Google. */
function toSteps(messages) {
  return messages.map((m) => ({
    type: m.role === 'user' ? 'user_input' : 'model_output',
    content: [{ type: 'text', text: m.content }],
  }))
}

const generation = (maxTokens) => ({ thinking_level: config.geminiThinking, max_output_tokens: maxTokens })
// No silent SDK retries: on a quota or overload error we switch to the fallback model straight away.
const requestOptions = (signal) => ({ retries: { strategy: 'none' }, fetchOptions: { signal } })

export const gemini = {
  provider: 'gemini',
  enabled: () => Boolean(config.geminiApiKey),
  model: () => config.geminiModel,

  /**
   * Streams the co-founder's reply: yields { type: 'text', text } chunks, then { type: 'done', model }
   * naming the model that actually answered. Falls back to the second model only if nothing was sent yet.
   */
  async *stream({ stage, project, messages, signal }) {
    const list = models()
    for (let i = 0; i < list.length; i++) {
      const model = list[i]
      let sent = false
      try {
        const events = await getClient().interactions.create(
          {
            model,
            input: toSteps(messages),
            system_instruction: `${SYSTEM_PROMPT}\n\n${projectContext(stage, project)}`,
            stream: true,
            store: false,
            generation_config: generation(4096),
          },
          requestOptions(signal),
        )
        let status = 'completed'
        for await (const ev of events) {
          if (ev.event_type === 'step.delta' && ev.delta?.type === 'text' && ev.delta.text) {
            sent = true
            yield { type: 'text', text: ev.delta.text }
          } else if (ev.event_type === 'error') {
            throw new AiError(ev.error?.message ?? 'Gemini reported an error.', ev.error?.code ?? 502)
          } else if (ev.event_type === 'interaction.completed') {
            status = ev.interaction?.status ?? 'completed'
          }
        }
        if (status !== 'completed') throw new AiError(`Gemini stopped before finishing (${status}). Try again.`)
        if (!sent) throw new AiError('Gemini returned an empty reply. Try rephrasing.')
        yield { type: 'done', model }
        return
      } catch (err) {
        if (signal?.aborted || sent || i === list.length - 1 || !RETRYABLE.has(statusOf(err))) throw err
      }
    }
  },

  /** A structured draft for one stage, validated against its JSON schema by Gemini. */
  async draft({ stage, project, signal }) {
    const list = models()
    for (let i = 0; i < list.length; i++) {
      const model = list[i]
      try {
        const interaction = await getClient().interactions.create(
          {
            model,
            input: `${draftInstruction(stage)}\n\n${projectContext(stage, project)}`,
            system_instruction: SYSTEM_PROMPT,
            store: false,
            response_format: { type: 'text', mime_type: 'application/json', schema: DRAFT_SCHEMAS[stage] },
            generation_config: generation(4096),
          },
          requestOptions(signal),
        )
        if (interaction.status && interaction.status !== 'completed') {
          throw new AiError(`Gemini stopped before finishing (${interaction.status}). Try again.`)
        }
        try {
          return { data: JSON.parse(interaction.output_text ?? ''), model }
        } catch {
          throw new AiError('Gemini returned a draft that wasn’t valid JSON. Try again.')
        }
      } catch (err) {
        if (signal?.aborted || i === list.length - 1 || !RETRYABLE.has(statusOf(err))) throw err
      }
    }
    throw new AiError('No Gemini model is configured.', 503)
  },
}

/** Friendly, specific error text for the founder. */
export function describeAiError(err) {
  const status = statusOf(err)
  if (err instanceof AiError) return err.message
  if (status === 401 || status === 403) return 'The server’s Gemini API key was rejected.'
  if (status === 429) return 'Gemini’s free quota is busy right now. Try again in a minute.'
  if (status === 400) return 'Gemini rejected the request.'
  if (status >= 500) return 'Gemini is having trouble right now. Try again shortly.'
  return 'Something went wrong while talking to Gemini.'
}
