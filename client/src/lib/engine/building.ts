import type { Project } from '../types'
import { camelCase, cleanFields } from './codegen'
import type { Challenge } from './ideation'
import { scopingChallenges } from './scoping'

/** Field suggestions for common MVP objects, keyed by entity name. */
export const FIELD_PRESETS: Record<string, { name: string; type: 'String' | 'Number' | 'Boolean' | 'Date'; required: boolean }[]> = {
  Order: [
    { name: 'items', type: 'String', required: true },
    { name: 'totalAmount', type: 'Number', required: true },
    { name: 'status', type: 'String', required: false },
  ],
  Booking: [
    { name: 'slot', type: 'Date', required: true },
    { name: 'resource', type: 'String', required: true },
    { name: 'confirmed', type: 'Boolean', required: false },
  ],
  Listing: [
    { name: 'title', type: 'String', required: true },
    { name: 'price', type: 'Number', required: true },
    { name: 'location', type: 'String', required: false },
  ],
  Task: [
    { name: 'title', type: 'String', required: true },
    { name: 'dueDate', type: 'Date', required: false },
    { name: 'done', type: 'Boolean', required: false },
  ],
}

export function buildingChallenges(p: Project): Challenge[] {
  const out: Challenge[] = []
  if (!p.building.entityName.trim()) {
    out.push({
      id: 'no-entity',
      level: 'block',
      title: 'What is the one core object?',
      body: 'Every MVP manages one main thing: an order, a booking, a listing. Name yours and the code follows.',
    })
  }
  const named = p.building.fields.filter((f) => f.name.trim())
  if (!named.length) {
    out.push({
      id: 'no-fields',
      level: 'block',
      title: 'Add the fields it needs',
      body: 'Only what the core flow uses. MongoDB’s flexible schema means you can add more later without migrations.',
    })
  }
  const kept = new Set(cleanFields(p.building.fields).map((f) => f.name))
  const skipped = named.filter((f) => !kept.has(camelCase(f.name)) || named.filter((g) => camelCase(g.name) === camelCase(f.name)).length > 1)
  if (skipped.length) {
    out.push({
      id: 'skipped-fields',
      level: 'warn',
      title: 'Some fields will be skipped',
      body: `${[...new Set(skipped.map((f) => `“${f.name}”`))].join(', ')} ${skipped.length > 1 ? 'are' : 'is'} reserved, duplicated or not a valid name. owner, createdAt and updatedAt are added automatically.`,
    })
  }
  if (named.length > 10) {
    out.push({
      id: 'many-fields',
      level: 'warn',
      title: `${named.length} fields is a lot for v1`,
      body: 'Keep only what the core flow reads or writes. Every field is a form input someone has to fill in.',
    })
  }
  if (named.length && !named.some((f) => f.required)) {
    out.push({ id: 'no-required', level: 'tip', title: 'Mark at least one field as required', body: 'Required fields are validated by the Mongoose schema on the server.' })
  }
  if (scopingChallenges(p.scoping, p.ideation).some((c) => c.level === 'block')) {
    out.push({
      id: 'scope-open',
      level: 'tip',
      title: 'Scope isn’t settled yet',
      body: 'The generated README lists your v1, later and cut features. Settle Scoping so the code matches the plan.',
    })
  }
  return out
}
