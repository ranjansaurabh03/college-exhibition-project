import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import Project, { STAGE_FIELDS } from '../models/Project.js'

const router = Router()
router.use(requireAuth)

const ID = /^[\w-]{1,64}$/
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isTime = (v) => Number.isFinite(v) && v > 0

/** Only the name, demo flag and stage sub-documents can be written by the client. */
function pick(body = {}) {
  const out = {}
  if (typeof body.name === 'string' && body.name.trim()) out.name = body.name
  if (typeof body.isDemo === 'boolean') out.isDemo = body.isDemo
  for (const key of STAGE_FIELDS) if (isObject(body[key])) out[key] = body[key]
  return out
}

function checkId(req, res, next) {
  if (!ID.test(req.params.id)) return res.status(400).json({ error: 'Invalid project id' })
  next()
}

router.get('/', async (req, res) => {
  const projects = await Project.find({ userId: req.userId }).sort({ clientUpdatedAt: -1 }).limit(200)
  res.json(projects)
})

router.post('/', async (req, res) => {
  const clientId = typeof req.body?.id === 'string' && ID.test(req.body.id) ? req.body.id : `p_${randomBytes(6).toString('hex')}`
  if (await Project.exists({ userId: req.userId, clientId })) return res.status(409).json({ error: 'A project with this id already exists' })
  const project = await Project.create({ name: 'Untitled idea', ...pick(req.body), userId: req.userId, clientId })
  res.status(201).json(project)
})

router.get('/:id', checkId, async (req, res) => {
  const project = await Project.findOne({ userId: req.userId, clientId: req.params.id })
  if (!project) return res.status(404).json({ error: 'Project not found' })
  res.json(project)
})

/**
 * Create or replace a project (sync). Last write wins: an update older than the stored
 * copy is rejected with 409 and the newer copy, so the device can take it instead.
 */
router.put('/:id', checkId, async (req, res) => {
  const updatedAt = isTime(req.body?.updatedAt) ? req.body.updatedAt : Date.now()
  const createdAt = isTime(req.body?.createdAt) ? req.body.createdAt : updatedAt
  const fields = pick(req.body)
  const onInsert = { userId: req.userId, clientId: req.params.id, clientCreatedAt: createdAt }
  if (!fields.name) onInsert.name = 'Untitled idea'
  try {
    const project = await Project.findOneAndUpdate(
      { userId: req.userId, clientId: req.params.id, clientUpdatedAt: { $lte: updatedAt } },
      { $set: { ...fields, clientUpdatedAt: updatedAt }, $setOnInsert: onInsert },
      { upsert: true, returnDocument: 'after', runValidators: true },
    )
    res.json(project)
  } catch (err) {
    // A newer copy exists, so the filter didn't match and the upsert hit the unique index.
    if (err?.code === 11000) {
      const current = await Project.findOne({ userId: req.userId, clientId: req.params.id })
      return res.status(409).json({ error: 'A newer version of this project exists', project: current })
    }
    throw err
  }
})

router.delete('/:id', checkId, async (req, res) => {
  const result = await Project.deleteOne({ userId: req.userId, clientId: req.params.id })
  if (!result.deletedCount) return res.status(404).json({ error: 'Project not found' })
  res.status(204).end()
})

export default router
