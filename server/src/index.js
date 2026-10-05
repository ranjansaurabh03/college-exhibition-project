import mongoose from 'mongoose'
import { claude } from './ai/claude.js'
import { createApp } from './app.js'
import { assertConfig, config } from './config.js'

try {
  assertConfig()
} catch (err) {
  console.error(err.message)
  process.exit(1)
}

await mongoose.connect(config.mongoUri)
createApp().listen(config.port, () => {
  console.log(`AI Co-Founder API listening on http://localhost:${config.port}`)
  console.log(claude.enabled() ? `Claude chat enabled (${config.claudeModel})` : 'Claude chat disabled (set ANTHROPIC_API_KEY to enable)')
})
