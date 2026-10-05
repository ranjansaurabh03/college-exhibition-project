import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { describeClaudeError } from '../ai/claude.js'
import { config } from '../config.js'

const STAGES = ['ideation', 'validation', 'scoping', 'building']

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 })
}

export function parseChatBody(body) {
  if (!body || typeof body !== 'object') throw badRequest('Send a JSON body with stage, project and messages')
  const { stage, project, messages } = body
  if (!STAGES.includes(stage)) throw badRequest(`stage must be one of: ${STAGES.join(', ')}`)
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20) {
    throw badRequest('Send between 1 and 20 messages')
  }
  const clean = messages.map((m) => {
    const ok =
      m &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim() &&
      m.content.length <= 4000
    if (!ok) throw badRequest('Each message needs a role (user or assistant) and 1–4000 characters of text')
    return { role: m.role, content: m.content }
  })
  if (clean[0].role !== 'user' || clean.at(-1).role !== 'user') {
    throw badRequest('The conversation must start and end with a user message')
  }
  return { stage, project: project && typeof project === 'object' ? project : {}, messages: clean }
}

/** A global daily budget for AI calls, so a public deployment can't drain the API credit. */
export function dailyBudget(limit) {
  let day = ''
  let used = 0
  return {
    take() {
      const today = new Date().toISOString().slice(0, 10)
      if (today !== day) {
        day = today
        used = 0
      }
      if (used >= limit) return false
      used++
      return true
    },
  }
}

export function aiRoutes(ai) {
  const router = Router()
  const budget = dailyBudget(config.aiDailyLimit)
  const perIp = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => config.isTest,
    message: { error: 'Too many co-founder messages. Wait a few minutes and try again.' },
  })

  router.get('/status', (_req, res) => {
    res.json({ enabled: ai.enabled(), model: ai.enabled() ? ai.model() : null })
  })

  // Streams the reply as server-sent events: {type:"text"} chunks, then {type:"done"} or {type:"error"}.
  router.post('/chat', perIp, async (req, res) => {
    if (!ai.enabled()) return res.status(503).json({ error: 'The co-founder chat is not configured on this server.' })
    const body = parseChatBody(req.body)
    if (!budget.take()) return res.status(429).json({ error: 'Today’s AI limit has been reached. Try again tomorrow.' })

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`)
    const abort = new AbortController()
    res.on('close', () => {
      if (!res.writableEnded) abort.abort()
    })

    try {
      const stream = ai.streamReply({ ...body, signal: abort.signal })
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          send({ type: 'text', text: event.delta.text })
        }
      }
      const final = await stream.finalMessage()
      if (final.stop_reason === 'refusal') {
        send({ type: 'error', message: 'The co-founder can’t help with that request.' })
      } else {
        send({ type: 'done', stopReason: final.stop_reason, model: final.model })
      }
    } catch (err) {
      if (!abort.signal.aborted) send({ type: 'error', message: describeClaudeError(err) })
    } finally {
      res.end()
    }
  })

  return router
}
