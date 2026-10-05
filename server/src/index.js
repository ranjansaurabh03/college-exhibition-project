import { claude } from './ai/claude.js'
import { createApp } from './app.js'
import { assertConfig, config } from './config.js'
import { connectDb } from './db.js'

try {
  assertConfig()
} catch (err) {
  console.error(err.message)
  process.exit(1)
}

const db = await connectDb()
createApp().listen(config.port, () => {
  console.log(`AI Co-Founder API listening on http://localhost:${config.port}`)
  console.log(db ? 'MongoDB connected' : 'MongoDB not configured: accounts and cloud projects are disabled (set MONGODB_URI)')
  console.log(claude.enabled() ? `Claude chat enabled (${config.claudeModel})` : 'Claude chat disabled (set ANTHROPIC_API_KEY to enable)')
})
