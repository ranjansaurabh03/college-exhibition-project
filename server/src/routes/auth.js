import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { requireAuth, signToken } from '../middleware/auth.js'
import User from '../models/User.js'

const router = Router()
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email })

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body ?? {}
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Name is required' })
  if (typeof email !== 'string' || !EMAIL.test(email)) return res.status(400).json({ error: 'A valid email is required' })
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }
  if (await User.exists({ email: email.toLowerCase().trim() })) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) })
  res.status(201).json({ token: signToken(user.id), user: publicUser(user) })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {}
  const user = typeof email === 'string' ? await User.findOne({ email: email.toLowerCase().trim() }) : null
  if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Wrong email or password' })
  }
  res.json({ token: signToken(user.id), user: publicUser(user) })
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ user: publicUser(user) })
})

export default router
