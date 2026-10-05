import { describe, expect, it } from 'vitest'
import { demoProject } from '../demo'
import { emptyIdeation, emptyScoping } from '../factory'
import type { Feature } from '../types'
import { autoVerdict, grouped, scopingChallenges, timeline, verdict, verdictReason } from './scoping'

const f = (over: Partial<Feature>): Feature => ({ id: 'x', name: 'Feature', pays: '', core: '', effort: 'M', ...over })

describe('verdicts', () => {
  it('keeps what the core flow needs, defers what drives payment, cuts the rest', () => {
    expect(autoVerdict(f({ core: 'yes', pays: 'no' }))).toBe('keep')
    expect(autoVerdict(f({ core: 'yes', pays: 'yes' }))).toBe('keep')
    expect(autoVerdict(f({ core: 'no', pays: 'yes' }))).toBe('later')
    expect(autoVerdict(f({ core: 'no', pays: 'no' }))).toBe('cut')
    expect(autoVerdict(f({ core: '', pays: 'yes' }))).toBe('undecided')
  })

  it('respects overrides and questions keeping a cut feature', () => {
    const dark = f({ name: 'Dark mode', core: 'no', pays: 'no', override: 'keep' })
    expect(verdict(dark)).toBe('keep')
    expect(verdictReason(dark)).toContain('Are you sure')
  })
})

describe('timeline', () => {
  it('sums kept effort plus a 25% buffer', () => {
    const s = { ...emptyScoping(), hoursPerWeek: 20, weeksTarget: 3, features: [f({ core: 'yes', effort: 'L' }), f({ id: 'y', core: 'yes', effort: 'S' })] }
    const t = timeline(s)
    expect(t.keepHours).toBe(48)
    expect(t.totalHours).toBe(60)
    expect(t.weeks).toBe(3)
    expect(t.fits).toBe(true)
  })

  it('fits the demo MVP into three weeks', () => {
    const t = timeline(demoProject().scoping)
    expect(t.keepHours).toBe(64)
    expect(t.fits).toBe(true)
  })
})

describe('scopingChallenges', () => {
  it('asks for features and a core flow first', () => {
    const ids = scopingChallenges(emptyScoping(), emptyIdeation()).map((c) => c.id)
    expect(ids.slice(0, 2)).toEqual(['no-features', 'no-flow'])
  })

  it('pushes back when v1 does not fit the target', () => {
    const s = {
      ...emptyScoping(),
      coreFlow: ['a'],
      outcome: 'x',
      hoursPerWeek: 10,
      features: [
        f({ id: 'a', name: 'Payments', core: 'yes', pays: 'yes', effort: 'L' }),
        f({ id: 'b', name: 'Admin panel', core: 'yes', pays: 'no', effort: 'L' }),
      ],
    }
    const c = scopingChallenges(s, emptyIdeation())
    const over = c.find((x) => x.id === 'over-budget')!
    expect(over.level).toBe('block')
    // Simplify what doesn't drive payment first.
    expect(over.body).toContain('“Admin panel” and “Payments”')
    expect(c.some((x) => x.id === 'large-a')).toBe(true)
  })

  it('has no blocking challenges for the demo', () => {
    const p = demoProject()
    expect(scopingChallenges(p.scoping, p.ideation).filter((c) => c.level === 'block')).toEqual([])
    expect(grouped(p.scoping.features).keep).toHaveLength(5)
  })
})
