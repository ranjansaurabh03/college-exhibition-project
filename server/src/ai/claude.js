import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config.js'
import { projectContext, SYSTEM_PROMPT } from './prompts.js'

let client
const getClient = () => (client ??= new Anthropic({ apiKey: config.anthropicApiKey }))

// Only send options to models that accept them.
const SUPPORTS_FALLBACKS = /^claude-(opus-5|fable-5-1)$/
const SUPPORTS_EFFORT = /^claude-(opus|sonnet-5|fable)/

export const claude = {
  enabled: () => Boolean(config.anthropicApiKey),
  model: () => config.claudeModel,

  /** Streams the co-founder's reply. Returns the SDK stream (async-iterable, with finalMessage()). */
  streamReply({ stage, project, messages, signal }) {
    const model = config.claudeModel
    const params = {
      model,
      max_tokens: 8000,
      system: [
        { type: 'text', text: SYSTEM_PROMPT },
        { type: 'text', text: projectContext(stage, project) },
      ],
      messages,
    }
    // Chat is latency-sensitive: low effort keeps replies quick.
    if (SUPPORTS_EFFORT.test(model)) params.output_config = { effort: 'low' }
    // If a safety classifier declines, retry server-side on Anthropic's recommended fallback model.
    if (SUPPORTS_FALLBACKS.test(model)) {
      params.betas = ['server-side-fallback-2026-07-01']
      params.fallbacks = 'default'
    }
    return getClient().beta.messages.stream(params, { signal })
  },
}

export function describeClaudeError(err) {
  if (err instanceof Anthropic.AuthenticationError) return 'The server’s Claude API key was rejected.'
  if (err instanceof Anthropic.PermissionDeniedError) return 'The Claude API key does not have access to this model.'
  if (err instanceof Anthropic.RateLimitError) return 'Claude is busy right now. Try again in a minute.'
  if (err instanceof Anthropic.BadRequestError) return 'Claude rejected the request.'
  if (err instanceof Anthropic.APIConnectionError) return 'Could not reach Claude. Check the server’s network.'
  if (err instanceof Anthropic.APIError) return `Claude API error (${err.status ?? 'unknown'}).`
  return 'Something went wrong while talking to Claude.'
}
