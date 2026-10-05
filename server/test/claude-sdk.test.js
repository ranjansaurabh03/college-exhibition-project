import { createServer } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Runs the real Anthropic SDK against a local mock of the Messages API, so the exact
// request we build (model, beta header, fallbacks, effort, system blocks) is checked
// without an API key or network access.

const SSE = [
  ['message_start', { type: 'message_start', message: { id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 12, output_tokens: 1 } } }],
  ['content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }],
  ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Which students, ' } }],
  ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'exactly?' } }],
  ['content_block_stop', { type: 'content_block_stop', index: 0 }],
  ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 6 } }],
  ['message_stop', { type: 'message_stop' }],
]

let server
let captured
let claude

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      captured = { url: req.url, headers: req.headers, body: JSON.parse(raw) }
      res.writeHead(200, { 'Content-Type': 'text/event-stream' })
      for (const [event, data] of SSE) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      res.end()
    })
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  process.env.ANTHROPIC_API_KEY = 'test-key'
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${server.address().port}`
  process.env.CLAUDE_MODEL = 'claude-opus-5'
  ;({ claude } = await import('../src/ai/claude.js'))
})

afterAll(() => new Promise((r) => server.close(r)))

describe('Claude request through the real SDK', () => {
  it('sends a well-formed streaming request and parses the reply', async () => {
    expect(claude.enabled()).toBe(true)
    const stream = claude.streamReply({
      stage: 'ideation',
      project: { name: 'CanteenQ', ideation: { productName: 'CanteenQ', targetUser: 'students' } },
      messages: [{ role: 'user', content: 'Is my user specific enough?' }],
    })
    let text = ''
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') text += event.delta.text
    }
    const final = await stream.finalMessage()

    expect(text).toBe('Which students, exactly?')
    expect(final.stop_reason).toBe('end_turn')

    expect(captured.url).toMatch(/^\/v1\/messages/)
    expect(captured.headers['x-api-key']).toBe('test-key')
    expect(captured.headers['anthropic-beta']).toContain('server-side-fallback-2026-07-01')
    expect(captured.body).toMatchObject({
      model: 'claude-opus-5',
      stream: true,
      fallbacks: 'default',
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: 'Is my user specific enough?' }],
    })
    expect(captured.body.betas).toBeUndefined()
    expect(captured.body.system[0].text).toContain('AI co-founder')
    expect(captured.body.system[1].text).toContain('<project stage="ideation">')
  })
})
