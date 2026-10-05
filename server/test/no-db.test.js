import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'

// Without MONGODB_URI the API still serves the Claude chat; accounts and projects report 503.
let createApp

const fakeAi = {
  enabled: () => true,
  model: () => 'claude-test',
  streamReply: () => ({
    async *[Symbol.asyncIterator]() {
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } }
    },
    finalMessage: async () => ({ stop_reason: 'end_turn', model: 'claude-test' }),
  }),
}

beforeAll(async () => {
  delete process.env.MONGODB_URI
  process.env.JWT_SECRET = ''
  ;({ createApp } = await import('../src/app.js'))
})

describe('without a database', () => {
  it('reports what is available', async () => {
    const res = await request(createApp({ ai: fakeAi })).get('/api/status')
    expect(res.body).toEqual({ ai: { enabled: true, model: 'claude-test' }, db: { enabled: false } })
  })

  it('turns away account and project requests with 503', async () => {
    const app = createApp({ ai: fakeAi })
    expect((await request(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'x' })).status).toBe(503)
    expect((await request(app).get('/api/projects')).status).toBe(503)
  })

  it('still streams the co-founder chat', async () => {
    const res = await request(createApp({ ai: fakeAi }))
      .post('/api/ai/chat')
      .send({ stage: 'scoping', messages: [{ role: 'user', content: 'What should I cut?' }] })
    expect(res.status).toBe(200)
    expect(res.text).toContain('"text":"Hello"')
    expect(res.text).toContain('"type":"done"')
  })
})
