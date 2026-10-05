import { createServer } from 'node:http'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Runs the real @google/genai SDK against a local mock of the Gemini Interactions API, so the exact
// request we build (model, turns, system instruction, store:false, thinking level) and the fallback
// path are checked without a key or network access.

let server
let requests
let respond
let gemini

const sse = (res, events) => {
  res.writeHead(200, { 'Content-Type': 'text/event-stream' })
  for (const e of events) res.write(`event: ${e.event_type}\ndata: ${JSON.stringify(e)}\n\n`)
  res.end()
}

const streamed = (...chunks) => [
  { event_type: 'interaction.created', interaction: { id: 'i1', status: 'in_progress' } },
  ...chunks.map((text) => ({ event_type: 'step.delta', index: 0, delta: { type: 'text', text } })),
  { event_type: 'interaction.completed', interaction: { id: 'i1', status: 'completed' } },
]

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      const body = JSON.parse(raw || '{}')
      requests.push({ url: req.url, headers: req.headers, body })
      respond(req, res, body)
    })
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  process.env.GEMINI_API_KEY = 'test-key'
  process.env.GEMINI_BASE_URL = `http://127.0.0.1:${server.address().port}`
  process.env.GEMINI_MODEL = 'gemini-primary'
  process.env.GEMINI_FALLBACK_MODEL = 'gemini-fallback'
  ;({ gemini } = await import('../src/ai/gemini.js'))
})

beforeEach(() => {
  requests = []
})

afterAll(() => new Promise((r) => server.close(r)))

async function collect(iterable) {
  const out = []
  for await (const e of iterable) out.push(e)
  return out
}

describe('Gemini chat through the real SDK', () => {
  it('sends the full conversation statelessly and streams the reply', async () => {
    respond = (_req, res) => sse(res, streamed('Which students, ', 'exactly?'))
    const events = await collect(
      gemini.stream({
        stage: 'ideation',
        project: { name: 'CanteenQ', ideation: { productName: 'CanteenQ', targetUser: 'students' } },
        messages: [
          { role: 'user', content: 'My idea is canteen pre-ordering.' },
          { role: 'assistant', content: 'Who is the user?' },
          { role: 'user', content: 'Students. Specific enough?' },
        ],
      }),
    )
    expect(events).toEqual([
      { type: 'text', text: 'Which students, ' },
      { type: 'text', text: 'exactly?' },
      { type: 'done', model: 'gemini-primary' },
    ])
    const { url, headers, body } = requests[0]
    expect(url).toBe('/v1beta/interactions')
    expect(headers['x-goog-api-key']).toBe('test-key')
    expect(body).toMatchObject({
      model: 'gemini-primary',
      stream: true,
      store: false,
      generation_config: { thinking_level: 'low' },
      input: [
        { type: 'user_input', content: [{ type: 'text', text: 'My idea is canteen pre-ordering.' }] },
        { type: 'model_output', content: [{ type: 'text', text: 'Who is the user?' }] },
        { type: 'user_input', content: [{ type: 'text', text: 'Students. Specific enough?' }] },
      ],
    })
    expect(body.system_instruction).toContain('AI co-founder')
    expect(body.system_instruction).toContain('<project stage="ideation">')
  })

  it('falls back to the second model on a quota error and reports which model answered', async () => {
    respond = (_req, res, body) => {
      if (body.model === 'gemini-primary') {
        res.writeHead(429, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ error: { code: 429, message: 'Quota exceeded', status: 'RESOURCE_EXHAUSTED' } }))
      }
      sse(res, streamed('From the fallback.'))
    }
    const events = await collect(gemini.stream({ stage: 'scoping', project: {}, messages: [{ role: 'user', content: 'Cut what?' }] }))
    expect(events.at(-1)).toEqual({ type: 'done', model: 'gemini-fallback' })
    expect(requests.map((r) => r.body.model)).toEqual(['gemini-primary', 'gemini-fallback'])
  })

  it('does not hide errors that a fallback cannot fix', async () => {
    respond = (_req, res) => {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: { code: 400, message: 'Bad request', status: 'INVALID_ARGUMENT' } }))
    }
    await expect(collect(gemini.stream({ stage: 'ideation', project: {}, messages: [{ role: 'user', content: 'hi' }] }))).rejects.toMatchObject({ status: 400 })
    expect(requests).toHaveLength(1)
  })
})

describe('Gemini drafts through the real SDK', () => {
  it('requests JSON that follows the stage schema and parses it', async () => {
    respond = (_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          id: 'i2',
          status: 'completed',
          steps: [{ type: 'model_output', content: [{ type: 'text', text: '{"entityName":"Order","fields":[]}' }] }],
          outputs: [{ type: 'text', text: '{"entityName":"Order","fields":[]}' }],
        }),
      )
    }
    const result = await gemini.draft({ stage: 'building', project: { name: 'CanteenQ' } })
    expect(result).toEqual({ data: { entityName: 'Order', fields: [] }, model: 'gemini-primary' })
    const { body } = requests[0]
    expect(body.response_format).toMatchObject({ type: 'text', mime_type: 'application/json' })
    expect(body.response_format.schema.required).toEqual(['entityName', 'fields'])
    expect(body.generation_config).toMatchObject({ thinking_level: 'minimal' })
    expect(body.store).toBe(false)
  })
})
