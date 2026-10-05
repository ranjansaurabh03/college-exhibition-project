import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, config.jwtSecret, { expiresIn: '7d' })
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Please log in' })
  try {
    req.userId = jwt.verify(token, config.jwtSecret).sub
    next()
  } catch {
    res.status(401).json({ error: 'Your session expired. Please log in again.' })
  }
}
