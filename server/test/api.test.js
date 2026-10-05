import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let mongo
let createApp
let parseChatBody
let dailyBudget

// A stand-in for the model provider: streams two text chunks, then reports the model that answered.
function fakeAi({ enabled = true, fail = false, draftData } = {}) {
  const calls = []
  return {
    calls,
    provider: 'test',
    enabled: () => enabled,
    model: () => 'model-test',
    async *stream(params) {
      calls.push(params)
      if (fail) throw new Error('boom')
      yield { type: 'text', text: 'Who exactly ' }
      yield { type: 'text', text: 'is the user?' }
      yield { type: 'done', model: 'model-test' }
    },
    async draft(params) {
      calls.push(params)
      if (fail) throw new Error('boom')
      return { data: draftData ?? {}, model: 'model-test' }
    },
  }
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  process.env.JWT_SECRET = 'test-secret'
  process.env.MONGODB_URI = mongo.getUri('ai_cofounder_test')
  ;({ createApp } = await import('../src/app.js'))
  ;({ parseChatBody, dailyBudget } = await import('../src/routes/ai.js'))
  await mongoose.connect(process.env.MONGODB_URI)
}, 120_000)

afterAll(async () => {
  await mongoose.disconnect()
  await mongo?.stop()
})

async function register(app, email) {
  const res = await request(app).post('/api/auth/register').send({ name: 'Asha', email, password: 'correct-horse' })
  expect(res.status).toBe(201)
  return res.body.token
}

describe('health and auth', () => {
  it('reports health with the database connected', async () => {
    const res = await request(createApp({ ai: fakeAi({ enabled: false }) })).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true, db: true, ai: false })
    const status = await request(createApp({ ai: fakeAi() })).get('/api/status')
    expect(status.body).toEqual({ ai: { enabled: true, model: 'model-test', provider: 'test' }, db: { enabled: true } })
  })

  it('registers, rejects duplicates and bad input, and logs in', async () => {
    const app = createApp({ ai: fakeAi() })
    const token = await register(app, 'Asha@College.edu')
    expect(token).toBeTruthy()
    expect((await request(app).post('/api/auth/register').send({ name: 'A', email: 'asha@college.edu', password: 'correct-horse' })).status).toBe(409)
    expect((await request(app).post('/api/auth/register').send({ name: 'A', email: 'not-an-email', password: 'correct-horse' })).status).toBe(400)
    expect((await request(app).post('/api/auth/register').send({ name: 'A', email: 'b@x.io', password: 'short' })).status).toBe(400)
    expect((await request(app).post('/api/auth/login').send({ email: 'asha@college.edu', password: 'wrong-password' })).status).toBe(401)
    const login = await request(app).post('/api/auth/login').send({ email: 'ASHA@college.edu', password: 'correct-horse' })
    expect(login.status).toBe(200)
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`)
    expect(me.body.user).toMatchObject({ name: 'Asha', email: 'asha@college.edu' })
    expect(me.body.user.passwordHash).toBeUndefined()
  })

  it('rejects missing and forged tokens', async () => {
    const app = createApp({ ai: fakeAi() })
    expect((await request(app).get('/api/projects')).status).toBe(401)
    expect((await request(app).get('/api/projects').set('Authorization', 'Bearer forged')).status).toBe(401)
  })

  it('returns JSON errors for malformed bodies and unknown routes', async () => {
    const app = createApp({ ai: fakeAi() })
    const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":')
    expect(bad.status).toBe(400)
    expect(bad.body.error).toBe('Invalid JSON')
    expect((await request(app).get('/api/nope')).status).toBe(404)
  })
})

describe('projects', () => {
  it('supports create, list, read, update and delete for the owner only', async () => {
    const app = createApp({ ai: fakeAi() })
    const token = await register(app, 'owner@college.edu')
    const auth = { Authorization: `Bearer ${token}` }

    const created = await request(app)
      .post('/api/projects')
      .set(auth)
      .send({ name: 'CanteenQ', ideation: { targetUser: 'hostel students' }, userId: 'someone-else', hacker: true })
    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({ name: 'CanteenQ', ideation: { targetUser: 'hostel students' } })
    expect(created.body.id).toMatch(/^p_/)
    expect(created.body.userId).toBeUndefined()
    expect(created.body.hacker).toBeUndefined()
    const id = created.body.id

    const list = await request(app).get('/api/projects').set(auth)
    expect(list.body.map((p) => p.id)).toEqual([id])

    const updated = await request(app).put(`/api/projects/${id}`).set(auth).send({ scoping: { features: [{ name: 'Login' }] } })
    expect(updated.status).toBe(200)
    expect(updated.body.scoping.features[0].name).toBe('Login')
    expect(updated.body.ideation.targetUser).toBe('hostel students')
    expect(updated.body.name).toBe('CanteenQ')

    // Another user can't see, change or delete it. Their PUT creates their own copy instead.
    const other = { Authorization: `Bearer ${await register(app, 'other@college.edu')}` }
    expect((await request(app).get(`/api/projects/${id}`).set(other)).status).toBe(404)
    expect((await request(app).delete(`/api/projects/${id}`).set(other)).status).toBe(404)
    const theirs = await request(app).put(`/api/projects/${id}`).set(other).send({ name: 'Mine' })
    expect(theirs.status).toBe(200)
    expect((await request(app).get(`/api/projects/${id}`).set(auth)).body.name).toBe('CanteenQ')

    expect((await request(app).get('/api/projects/bad%20id!').set(auth)).status).toBe(400)
    expect((await request(app).post('/api/projects').set(auth).send({ id, name: 'Dup' })).status).toBe(409)
    expect((await request(app).delete(`/api/projects/${id}`).set(auth)).status).toBe(204)
    expect((await request(app).get(`/api/projects/${id}`).set(auth)).status).toBe(404)
  })

  it('syncs with last-write-wins on the device timestamps', async () => {
    const app = createApp({ ai: fakeAi() })
    const auth = { Authorization: `Bearer ${await register(app, 'sync@college.edu')}` }

    const first = await request(app).put('/api/projects/demo-canteenq').set(auth).send({ name: 'CanteenQ', createdAt: 1000, updatedAt: 2000, isDemo: true })
    expect(first.status).toBe(200)
    expect(first.body).toMatchObject({ id: 'demo-canteenq', name: 'CanteenQ', createdAt: 1000, updatedAt: 2000, isDemo: true })

    const newer = await request(app).put('/api/projects/demo-canteenq').set(auth).send({ name: 'CanteenQ v2', updatedAt: 3000 })
    expect(newer.body).toMatchObject({ name: 'CanteenQ v2', createdAt: 1000, updatedAt: 3000 })

    const stale = await request(app).put('/api/projects/demo-canteenq').set(auth).send({ name: 'Old edit', updatedAt: 2500 })
    expect(stale.status).toBe(409)
    expect(stale.body.project).toMatchObject({ name: 'CanteenQ v2', updatedAt: 3000 })
  })
})

describe('co-founder chat', () => {
  const body = { stage: 'ideation', project: { name: 'CanteenQ' }, messages: [{ role: 'user', content: 'Is my idea good?' }] }

  it('reports status and refuses when no API key is configured', async () => {
    const app = createApp({ ai: fakeAi({ enabled: false }) })
    expect((await request(app).get('/api/ai/status')).body).toEqual({ enabled: false, model: null, provider: 'test' })
    expect((await request(app).post('/api/ai/chat').send(body)).status).toBe(503)
    expect((await request(app).post('/api/ai/draft').send({ stage: 'ideation', project: {} })).status).toBe(503)
  })

  it('streams the reply as server-sent events', async () => {
    const ai = fakeAi()
    const res = await request(createApp({ ai })).post('/api/ai/chat').send(body)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/event-stream')
    const events = res.text
      .split('\n\n')
      .filter(Boolean)
      .map((chunk) => JSON.parse(chunk.replace(/^data: /, '')))
    expect(events).toEqual([
      { type: 'text', text: 'Who exactly ' },
      { type: 'text', text: 'is the user?' },
      { type: 'done', model: 'model-test' },
    ])
    expect(ai.calls[0]).toMatchObject({ stage: 'ideation', messages: body.messages })
  })

  it('turns failures into error events', async () => {
    const failed = await request(createApp({ ai: fakeAi({ fail: true }) })).post('/api/ai/chat').send(body)
    expect(failed.text).toContain('"type":"error"')
  })

  it('validates the conversation before calling the model', async () => {
    const ai = fakeAi()
    const app = createApp({ ai })
    expect((await request(app).post('/api/ai/chat').send({ ...body, stage: 'marketing' })).status).toBe(400)
    expect((await request(app).post('/api/ai/chat').send({ ...body, messages: [] })).status).toBe(400)
    expect((await request(app).post('/api/ai/draft').send({ stage: 'marketing' })).status).toBe(400)
    expect(ai.calls).toHaveLength(0)
  })

  it('returns a sanitised draft: known keys only, enums enforced, lengths capped', async () => {
    const draftData = {
      targetUser: 'First-year hostel students with back-to-back labs',
      frequency: 'hourly',
      severity: 9,
      alternatives: ['Zomato: no campus delivery', 'Canteen WhatsApp group: orders get lost'],
      pain: 'x'.repeat(1000),
      hacker: '<script>',
    }
    const res = await request(createApp({ ai: fakeAi({ draftData }) })).post('/api/ai/draft').send({ stage: 'ideation', project: { ideation: { rawIdea: 'canteen' } } })
    expect(res.status).toBe(200)
    expect(res.body.model).toBe('model-test')
    expect(res.body.draft.targetUser).toBe('First-year hostel students with back-to-back labs')
    expect(res.body.draft.frequency).toBe('')
    expect(res.body.draft.severity).toBe(5)
    expect(res.body.draft.alternatives).toBe('Zomato: no campus delivery\nCanteen WhatsApp group: orders get lost')
    expect(res.body.draft.pain).toHaveLength(400)
    expect(res.body.draft.hacker).toBeUndefined()
  })

  it('sanitises scoping and building drafts too', async () => {
    const scoping = await request(createApp({ ai: fakeAi({ draftData: { features: [{ name: 'Login', pays: 'no', core: 'yes', effort: 'XL' }, { name: '' }], coreFlow: ['Open app', 7], outcome: 'Lunch in 2 minutes' } }) }))
      .post('/api/ai/draft')
      .send({ stage: 'scoping', project: {} })
    expect(scoping.body.draft).toEqual({ features: [{ name: 'Login', pays: 'no', core: 'yes', effort: 'M' }], coreFlow: ['Open app'], outcome: 'Lunch in 2 minutes' })
    const building = await request(createApp({ ai: fakeAi({ draftData: { entityName: 'Order!', fields: [{ name: 'total amount', type: 'Money', required: 1 }] } }) }))
      .post('/api/ai/draft')
      .send({ stage: 'building', project: {} })
    expect(building.body.draft).toEqual({ entityName: 'Order', fields: [{ name: 'totalamount', type: 'String', required: true }] })
  })
})

describe('chat helpers', () => {
  it('requires the conversation to start and end with the founder', () => {
    expect(() => parseChatBody({ stage: 'scoping', messages: [{ role: 'assistant', content: 'hi' }] })).toThrow(/start and end/)
    expect(() => parseChatBody({ stage: 'scoping', messages: [{ role: 'user', content: 'x'.repeat(4001) }] })).toThrow(/1–4000/)
    expect(parseChatBody({ stage: 'scoping', messages: [{ role: 'user', content: 'ok', extra: 1 }] }).messages).toEqual([{ role: 'user', content: 'ok' }])
  })

  it('caps AI calls per day in memory when there is no database', async () => {
    const budget = dailyBudget(2, { useDb: () => false })
    expect([await budget.take(), await budget.take(), await budget.take()]).toEqual([true, true, false])
  })

  it('shares the daily cap through MongoDB when connected', async () => {
    const a = dailyBudget(2)
    const b = dailyBudget(2) // a second serverless instance
    await mongoose.connection.collection('usages').deleteMany({})
    expect([await a.take(), await b.take(), await a.take()]).toEqual([true, true, false])
  })
})
