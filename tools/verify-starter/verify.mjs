// Boots a generated starter's API against an in-memory MongoDB and exercises it end to end.
// Usage: node verify.mjs <path-to-generated-starter>/server
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { MongoMemoryServer } from 'mongodb-memory-server'

const serverDir = resolve(process.argv[2] ?? '')
const PORT = 5055
const mongo = await MongoMemoryServer.create()
const child = spawn(process.execPath, ['src/index.js'], {
  cwd: serverDir,
  env: { ...process.env, MONGODB_URI: mongo.getUri('starter'), JWT_SECRET: 'verify-secret', PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let log = ''
child.stdout.on('data', (d) => (log += d))
child.stderr.on('data', (d) => (log += d))

const ready = await new Promise((done) => {
  const timer = setTimeout(() => done(false), 30_000)
  child.stdout.on('data', () => {
    if (log.includes('API ready')) {
      clearTimeout(timer)
      done(true)
    }
  })
})

const base = `http://localhost:${PORT}/api`
let passed = 0
let failed = 0
function check(name, ok) {
  ok ? passed++ : failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
}
async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { status: res.status, data }
}

// The demo starter's entity is Order with fields items, totalAmount, pickupTime, token, isReady.
try {
  check('server boots', ready)
  check('health', (await call('/health')).status === 200)
  const reg = await call('/auth/register', { method: 'POST', body: { name: 'Asha', email: 'Asha@College.edu', password: 'supersecret' } })
  check('register → 201', reg.status === 201 && Boolean(reg.data?.token))
  check('duplicate email → 409', (await call('/auth/register', { method: 'POST', body: { name: 'A', email: 'asha@college.edu', password: 'supersecret' } })).status === 409)
  check('short password → 400', (await call('/auth/register', { method: 'POST', body: { name: 'B', email: 'b@x.com', password: 'short' } })).status === 400)
  check('wrong password → 401', (await call('/auth/login', { method: 'POST', body: { email: 'asha@college.edu', password: 'wrongpass' } })).status === 401)
  const login = await call('/auth/login', { method: 'POST', body: { email: 'asha@college.edu', password: 'supersecret' } })
  check('login → 200', login.status === 200)
  const token = login.data?.token
  check('me', (await call('/auth/me', { token })).data?.user?.email === 'asha@college.edu')
  check('no token → 401', (await call('/orders')).status === 401)
  check('bad token → 401', (await call('/orders', { token: 'abc' })).status === 401)
  const created = await call('/orders', {
    method: 'POST',
    token,
    body: { items: '2x veg thali', totalAmount: 120, pickupTime: new Date().toISOString(), token: 'A17', owner: '000000000000000000000000', extra: 1 },
  })
  check('create → 201', created.status === 201)
  check('create ignores owner and unknown fields', created.data?.extra === undefined && created.data?.owner !== '000000000000000000000000' && created.data?.isReady === false)
  check('missing required fields → 400', (await call('/orders', { method: 'POST', token, body: { items: 'no amount' } })).status === 400)
  check('list → 1 item', (await call('/orders', { token })).data?.length === 1)
  const id = created.data?._id
  const patched = await call(`/orders/${id}`, { method: 'PATCH', token, body: { isReady: true } })
  check('patch → 200', patched.status === 200 && patched.data?.isReady === true)
  check('patch with wrong type → 400', (await call(`/orders/${id}`, { method: 'PATCH', token, body: { totalAmount: 'lots' } })).status === 400)
  check('get one → 200', (await call(`/orders/${id}`, { token })).status === 200)
  check('invalid id → 400', (await call('/orders/not-an-id', { token })).status === 400)
  const other = await call('/auth/register', { method: 'POST', body: { name: 'Ravi', email: 'ravi@college.edu', password: 'anothersecret' } })
  check('other user cannot read', (await call(`/orders/${id}`, { token: other.data?.token })).status === 404)
  check('other user sees an empty list', (await call('/orders', { token: other.data?.token })).data?.length === 0)
  check('other user cannot delete', (await call(`/orders/${id}`, { method: 'DELETE', token: other.data?.token })).status === 404)
  check('delete → 204', (await call(`/orders/${id}`, { method: 'DELETE', token })).status === 204)
  check('deleted → 404', (await call(`/orders/${id}`, { token })).status === 404)
  check('unknown route → 404', (await call('/nope')).status === 404)
} finally {
  child.kill()
  await mongo.stop()
  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed) {
    console.log('--- server log ---\n' + log)
    process.exitCode = 1
  }
}
