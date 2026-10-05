import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import Project, { STAGE_FIELDS } from '../models/Project.js'

const router = Router()
router.use(requireAuth)

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/** Only the name and stage sub-documents can be written by the client. */
function pick(body = {}) {
  const out = {}
  if (typeof body.name === 'string') out.name = body.name
  for (const key of STAGE_FIELDS) if (isObject(body[key])) out[key] = body[key]
  return out
}

router.get('/', async (req, res) => {
  const projects = await Project.find({ userId: req.userId }).sort({ updatedAt: -1 }).limit(100)
  res.json(projects)
})

router.post('/', async (req, res) => {
  const project = await Project.create({ name: 'Untitled idea', ...pick(req.body), userId: req.userId })
  res.status(201).json(project)
})

router.get('/:id', async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, userId: req.userId })
  if (!project) return res.status(404).json({ error: 'Project not found' })
  res.json(project)
})

router.put('/:id', async (req, res) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: pick(req.body) },
    { returnDocument: 'after', runValidators: true },
  )
  if (!project) return res.status(404).json({ error: 'Project not found' })
  res.json(project)
})

router.delete('/:id', async (req, res) => {
  const result = await Project.deleteOne({ _id: req.params.id, userId: req.userId })
  if (!result.deletedCount) return res.status(404).json({ error: 'Project not found' })
  res.status(204).end()
})

export default router
