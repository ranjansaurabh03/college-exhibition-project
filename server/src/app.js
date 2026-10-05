import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import { claude } from './ai/claude.js'
import { config } from './config.js'
import { connectDb, requireDb } from './db.js'
import { errorHandler, notFound } from './middleware/errors.js'
import { aiRoutes } from './routes/ai.js'
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'

/** Builds the Express app. `ai` is injectable so tests can stub Claude. */
export function createApp({ ai = claude } = {}) {
  const app = express()
  app.disable('x-powered-by')
  // Render and Vercel sit behind one proxy; this lets rate limiting see real client IPs.
  app.set('trust proxy', 1)
  app.use(cors({ origin: config.clientOrigins.length ? config.clientOrigins : true }))
  app.use(express.json({ limit: '1mb' }))

  // What this deployment can do; the web app checks it on load.
  app.get('/api/status', async (_req, res) => {
    const db = await connectDb().catch(() => false)
    res.json({ ai: { enabled: ai.enabled(), model: ai.enabled() ? ai.model() : null }, db: { enabled: db } })
  })

  app.get('/api/health', async (_req, res) => {
    const db = await connectDb().catch(() => false)
    res.json({ ok: true, db, ai: ai.enabled() })
  })

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => config.isTest,
    message: { error: 'Too many attempts. Try again in a few minutes.' },
  })

  app.use('/api/auth', authLimiter, requireDb, authRoutes)
  app.use('/api/projects', requireDb, projectRoutes)
  app.use('/api/ai', aiRoutes(ai))
  app.use(notFound)
  app.use(errorHandler)
  return app
}
