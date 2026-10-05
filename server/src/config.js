import { existsSync } from 'node:fs'

// Local development reads server/.env; tests stay hermetic and set their own env.
if (!process.env.VITEST && existsSync('.env')) process.loadEnvFile('.env')

const list = (v) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

export const config = {
  port: Number(process.env.PORT) || 8080,
  // Optional: without it, accounts and cloud projects are disabled but the AI co-founder still works.
  mongoUri: process.env.MONGODB_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  clientOrigins: list(process.env.CLIENT_ORIGIN),
  // Google Gemini powers the live co-founder. Without a key the app falls back to its rule engine.
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  geminiFallbackModel: process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash',
  geminiThinking: process.env.GEMINI_THINKING || 'low',
  geminiBaseUrl: process.env.GEMINI_BASE_URL ?? '',
  aiDailyLimit: Number(process.env.AI_DAILY_LIMIT) || 300,
  isTest: Boolean(process.env.VITEST),
}

export function assertConfig() {
  if (config.mongoUri && !config.jwtSecret) {
    throw new Error('JWT_SECRET is required when MONGODB_URI is set. Copy .env.example to .env and fill it in.')
  }
}
