import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import mongoose from 'mongoose'
import { claude } from './ai/claude.js'
import { config } from './config.js'
import { errorHandler, notFound } from './middleware/errors.js'
import { aiRoutes } from './routes/ai.js'
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'

/** Builds the Express app. `ai` is injectable so tests can stub Claude. */
export function createApp({ ai = claude } = {}) {
  const app = express()
  app.disable('x-powered-by')
  // Hosts like Render sit behind one proxy; this lets rate limiting see real client IPs.
  app.set('trust proxy', 1)
  app.use(cors({ origin: config.clientOrigins.length ? config.clientOrigins : true }))
  app.use(express.json({ limit: '200kb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, db: mongoose.connection.readyState === 1, ai: ai.enabled() })
  })

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => config.isTest,
    message: { error: 'Too many attempts. Try again in a few minutes.' },
  })

  app.use('/api/auth', authLimiter, authRoutes)
  app.use('/api/projects', projectRoutes)
  app.use('/api/ai', aiRoutes(ai))
  app.use(notFound)
  app.use(errorHandler)
  return app
}
