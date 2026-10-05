import mongoose from 'mongoose'
import { config } from './config.js'

let pending = null

/**
 * Connects once and reuses the connection (important on serverless hosts, where
 * a warm instance serves many requests). Returns false when no database is configured.
 */
export async function connectDb() {
  if (!config.mongoUri) return false
  if (mongoose.connection.readyState === 1) return true
  pending ??= mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 }).catch((err) => {
    pending = null
    throw err
  })
  await pending
  return true
}

export function dbConnected() {
  return mongoose.connection.readyState === 1
}

/** Route guard for features that need MongoDB (accounts, cloud projects). */
export async function requireDb(_req, res, next) {
  let ok
  try {
    ok = await connectDb()
  } catch (err) {
    console.error('MongoDB connection failed:', err.message)
    return res.status(503).json({ error: 'The database is unavailable right now. Try again in a minute.' })
  }
  if (!ok) return res.status(503).json({ error: 'Cloud storage is not configured on this server.' })
  next()
}
