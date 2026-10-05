import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { demoProject } from '../demo'
import { newProject } from '../factory'
import { camelCase, cleanFields, generateStarter, kebabCase, names, pascalCase, pluralize } from './codegen'

describe('naming helpers', () => {
  it('converts free text into identifiers', () => {
    expect(pascalCase('canteen order')).toBe('CanteenOrder')
    expect(camelCase('Total Amount (₹)')).toBe('totalAmount')
    expect(kebabCase('CanteenQ App!')).toBe('canteen-q-app')
    expect(pluralize('order')).toBe('orders')
    expect(pluralize('category')).toBe('categories')
    expect(pluralize('batch')).toBe('batches')
  })

  it('drops reserved, duplicate and empty field names', () => {
    const out = cleanFields([
      { id: '1', name: 'Title', type: 'String', required: true },
      { id: '2', name: 'title', type: 'String', required: false },
      { id: '3', name: '_id', type: 'String', required: false },
      { id: '4', name: 'createdAt', type: 'Date', required: false },
      { id: '5', name: '!!!', type: 'String', required: false },
      { id: '6', name: 'class', type: 'String', required: false },
    ])
    expect(out.map((f) => f.name)).toEqual(['title'])
  })

  it('never generates a second User model', () => {
    const p = newProject('x')
    p.building.entityName = 'user'
    expect(names(p).Entity).toBe('Profile')
  })
})

describe('generateStarter', () => {
  const files = generateStarter(demoProject())
  const byPath = Object.fromEntries(files.map((f) => [f.path, f.content]))

  it('produces a full MERN project', () => {
    expect(Object.keys(byPath).sort()).toEqual(
      [
        '.gitignore',
        'README.md',
        'client/index.html',
        'client/package.json',
        'client/src/App.jsx',
        'client/src/api.js',
        'client/src/main.jsx',
        'client/src/pages/AuthPage.jsx',
        'client/src/pages/OrdersPage.jsx',
        'client/src/styles.css',
        'client/vite.config.js',
        'server/.env.example',
        'server/package.json',
        'server/src/index.js',
        'server/src/middleware/auth.js',
        'server/src/models/Order.js',
        'server/src/models/User.js',
        'server/src/routes/auth.js',
        'server/src/routes/orders.js',
      ].sort(),
    )
  })

  it('maps the designed fields into the Mongoose schema and the allow-list', () => {
    expect(byPath['server/src/models/Order.js']).toContain('totalAmount: { type: Number, required: true },')
    expect(byPath['server/src/models/Order.js']).toContain('isReady: { type: Boolean, default: false },')
    expect(byPath['server/src/routes/orders.js']).toContain("const FIELDS = ['items', 'totalAmount', 'pickupTime', 'token', 'isReady']")
  })

  it('writes valid package.json files', () => {
    expect(JSON.parse(byPath['server/package.json']).dependencies.mongoose).toBeTruthy()
    expect(JSON.parse(byPath['client/package.json']).devDependencies.vite).toBeTruthy()
  })

  it('falls back to a default entity for an empty project', () => {
    const empty = generateStarter(newProject('Blank'))
    expect(empty.find((f) => f.path === 'server/src/models/Item.js')!.content).toContain('title: { type: String, required: true')
  })

  // EMIT_DIR=/some/path npx vitest run codegen → writes the demo starter to disk for a real install + run.
  it.runIf(Boolean(process.env.EMIT_DIR))('emits the demo starter to EMIT_DIR', () => {
    const root = process.env.EMIT_DIR!
    for (const f of files) {
      const target = join(root, f.path)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, f.content)
    }
  })
})
