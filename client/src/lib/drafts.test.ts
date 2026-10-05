import { describe, expect, it } from 'vitest'
import { demoProject } from './demo'
import { mergeDraft } from './drafts'
import { newProject } from './factory'

describe('mergeDraft', () => {
  it('fills only the empty ideation fields', () => {
    const p = newProject('x')
    p.ideation.rawIdea = 'laundry'
    p.ideation.targetUser = 'My own words'
    const { partial, filled } = mergeDraft('ideation', p, {
      targetUser: 'AI words',
      pain: 'Machines are always busy',
      severity: 4,
      frequency: 'weekly',
      notAField: 'ignored',
      whyNow: '',
    })
    expect(partial).toEqual({ pain: 'Machines are always busy', severity: 4, frequency: 'weekly' })
    expect(filled).toEqual(['pain', 'severity', 'frequency'])
  })

  it('never touches a fully answered canvas', () => {
    const demo = demoProject()
    expect(mergeDraft('ideation', demo, { targetUser: 'Someone else', pain: 'Other' }).filled).toEqual([])
    expect(mergeDraft('scoping', demo, { features: [{ name: 'X', pays: 'yes', core: 'yes', effort: 'S' }] }).filled).toEqual([])
    expect(mergeDraft('building', demo, { entityName: 'Booking', fields: [] }).filled).toEqual([])
  })

  it('fills landing copy field by field', () => {
    const p = newProject('x')
    p.validation.landing.cta = 'Mine'
    const { partial, filled } = mergeDraft('validation', p, { landing: { headline: 'H', subheadline: 'S', cta: 'Theirs' } })
    expect(filled).toEqual(['headline', 'subheadline'])
    expect(partial).toEqual({ landing: { headline: 'H', subheadline: 'S', cta: 'Mine' } })
  })

  it('gives drafted features and fields their own ids', () => {
    const p = newProject('x')
    const scoping = mergeDraft('scoping', p, {
      features: [{ name: 'Login', pays: 'no', core: 'yes', effort: 'S' }],
      coreFlow: ['Open app', 'Order'],
      outcome: 'Lunch in two minutes',
    })
    expect(scoping.filled).toEqual(['features', 'coreFlow', 'outcome'])
    expect((scoping.partial.features as { id: string }[])[0].id).toMatch(/^f_/)
    const building = mergeDraft('building', p, { entityName: 'Order', fields: [{ name: 'items', type: 'String', required: true }] })
    expect((building.partial.fields as { id: string }[])[0].id).toMatch(/^b_/)
  })
})
