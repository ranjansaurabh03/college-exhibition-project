import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { sanitizeDraft } from '../ai/drafts.js'
import { describeAiError } from '../ai/gemini.js'
import { config } from '../config.js'
import { connectDb, dbConnected } from '../db.js'
import Usage from '../models/Usage.js'

const STAGES = ['ideation', 'validation', 'scoping', 'building']

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 })
}

const projectOf = (body) => (body.project && typeof body.project === 'object' ? body.project : {})

export function parseChatBody(body) {
  if (!body || typeof body !== 'object') throw badRequest('Send a JSON body with stage, project and messages')
  const { stage, messages } = body
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
  return { stage, project: projectOf(body), messages: clean }
}

export function parseDraftBody(body) {
  if (!body || typeof body !== 'object') throw badRequest('Send a JSON body with stage and project')
  if (!STAGES.includes(body.stage)) throw badRequest(`stage must be one of: ${STAGES.join(', ')}`)
  return { stage: body.stage, project: projectOf(body) }
}

/**
 * A global daily budget for AI calls, so a public deployment can't exhaust the API quota.
 * Counted in MongoDB when it's available (shared by every serverless instance),
 * otherwise in memory.
 */
export function dailyBudget(limit, { useDb = dbConnected } = {}) {
  const memory = { day: '', used: 0 }
  return {
    async take() {
      const today = new Date().toISOString().slice(0, 10)
      if (useDb()) {
        try {
          const doc = await Usage.findOneAndUpdate(
            { _id: `ai:${today}` },
            { $inc: { count: 1 } },
            { upsert: true, returnDocument: 'after' },
          )
          return doc.count <= limit
        } catch (err) {
          console.error('AI usage counter failed, using the in-memory count:', err.message)
        }
      }
      if (today !== memory.day) {
        memory.day = today
        memory.used = 0
      }
      if (memory.used >= limit) return false
      memory.used++
      return true
    },
  }
}

export function aiRoutes(ai) {
  const router = Router()
  const budget = dailyBudget(config.aiDailyLimit)
  const perIp = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 40,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => config.isTest,
    message: { error: 'Too many co-founder requests. Wait a few minutes and try again.' },
  })

  async function guard(res) {
    if (!ai.enabled()) {
      res.status(503).json({ error: 'The AI co-founder is not configured on this server.' })
      return false
    }
    await connectDb().catch(() => false) // so the daily budget is shared across instances when possible
    if (!(await budget.take())) {
      res.status(429).json({ error: 'Today’s AI limit has been reached. Try again tomorrow.' })
      return false
    }
    return true
  }

  router.get('/status', (_req, res) => {
    res.json({ enabled: ai.enabled(), model: ai.enabled() ? ai.model() : null, provider: ai.provider })
  })

  // Streams the reply as server-sent events: {type:"text"} chunks, then {type:"done", model} or {type:"error"}.
  router.post('/chat', perIp, async (req, res) => {
    const body = parseChatBody(req.body)
    if (!(await guard(res))) return

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
      for await (const event of ai.stream({ ...body, signal: abort.signal })) send(event)
    } catch (err) {
      if (!abort.signal.aborted) {
        console.error('AI chat failed:', err?.status ?? '', err?.message)
        send({ type: 'error', message: describeAiError(err) })
      }
    } finally {
      res.end()
    }
  })

  // One structured, validated draft for a stage. The client fills only empty fields.
  router.post('/draft', perIp, async (req, res) => {
    const body = parseDraftBody(req.body)
    if (!(await guard(res))) return
    try {
      const { data, model } = await ai.draft(body)
      res.json({ draft: sanitizeDraft(body.stage, data), model })
    } catch (err) {
      console.error('AI draft failed:', err?.status ?? '', err?.message)
      res.status(err?.status === 400 ? 400 : 502).json({ error: describeAiError(err) })
    }
  })

  return router
}
