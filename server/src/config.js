import { existsSync } from 'node:fs'

if (existsSync('.env')) process.loadEnvFile('.env')

const list = (v) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

export const config = {
  port: Number(process.env.PORT) || 8080,
  mongoUri: process.env.MONGODB_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  clientOrigins: list(process.env.CLIENT_ORIGIN),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-opus-5',
  aiDailyLimit: Number(process.env.AI_DAILY_LIMIT) || 300,
  isTest: Boolean(process.env.VITEST),
}

export function assertConfig() {
  const missing = []
  if (!config.mongoUri) missing.push('MONGODB_URI')
  if (!config.jwtSecret) missing.push('JWT_SECRET')
  if (missing.length) {
    throw new Error(`Missing ${missing.join(' and ')}. Copy .env.example to .env and fill it in.`)
  }
}
