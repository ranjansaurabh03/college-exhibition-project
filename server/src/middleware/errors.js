export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found' })
}

// Express 5 forwards errors thrown in async handlers here.
export function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large' })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' })
  if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ error: err.message })
  if (err.status >= 400 && err.status < 500) return res.status(err.status).json({ error: err.message })
  console.error(err)
  res.status(500).json({ error: 'Something went wrong' })
}
