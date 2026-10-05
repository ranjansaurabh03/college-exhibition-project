import { describe, expect, it } from 'vitest'
import { demoProject } from '../demo'
import { emptyIdeation } from '../factory'
import {
  ideationChallenges,
  isGenericPain,
  lintOneLiner,
  nextInterviewIndex,
  oneLiner,
  reactToAnswer,
  scoreIdea,
  vagueUserTerm,
} from './ideation'

describe('vagueUserTerm', () => {
  it('flags audiences that are not users', () => {
    expect(vagueUserTerm('students')).toBe('students')
    expect(vagueUserTerm('College students')).toBe('college students')
    expect(vagueUserTerm('small businesses')).toBe('small businesses')
    expect(vagueUserTerm('everyone')).toBe('everyone')
  })

  it('accepts narrowed-down users', () => {
    expect(vagueUserTerm('students who cook in hostels')).toBeNull()
    expect(vagueUserTerm('First-year hostel students with back-to-back lab sessions')).toBeNull()
    expect(vagueUserTerm('kirana store owners')).toBeNull()
    expect(vagueUserTerm('')).toBeNull()
  })
})

describe('isGenericPain', () => {
  it('flags short or generic pain statements', () => {
    expect(isGenericPain('It is hard')).toBe(true)
    expect(isGenericPain('Managing tasks is difficult and confusing')).toBe(true)
  })
  it('accepts specific pain', () => {
    expect(isGenericPain('They skip lunch because the canteen queue takes 20 minutes between labs')).toBe(false)
  })
})

describe('scoreIdea', () => {
  it('scores an empty idea at zero', () => {
    const s = scoreIdea(emptyIdeation())
    expect(s.overall).toBe(0)
    expect(s.verdict.tone).toBe('bad')
  })

  it('rates the demo idea as ready to validate', () => {
    const s = scoreIdea(demoProject().ideation)
    expect(s.clarity).toBeGreaterThanOrEqual(80)
    expect(s.pain).toBeGreaterThanOrEqual(80)
    expect(s.overall).toBeGreaterThanOrEqual(75)
    expect(s.verdict.tone).toBe('good')
  })

  it('caps clarity when the user is vague', () => {
    const i = { ...demoProject().ideation, targetUser: 'students' }
    expect(scoreIdea(i).clarity).toBeLessThanOrEqual(30)
  })

  it('keeps every score within 0–100', () => {
    const i = { ...demoProject().ideation, severity: 5, frequency: 'daily' as const }
    const s = scoreIdea(i)
    for (const v of [s.clarity, s.pain, s.need, s.overall]) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    }
  })
})

describe('ideationChallenges', () => {
  it('asks the core questions first for an empty idea', () => {
    const ids = ideationChallenges(emptyIdeation()).map((c) => c.id)
    expect(ids[0]).toBe('user-missing')
    expect(ids).toContain('pain-missing')
    expect(ids).toContain('alts-missing')
  })

  it('pushes back on a vague user', () => {
    const c = ideationChallenges({ ...emptyIdeation(), targetUser: 'students' })
    expect(c[0].id).toBe('user-vague')
    expect(c[0].level).toBe('block')
  })

  it('has no blocking challenges for the demo idea', () => {
    expect(ideationChallenges(demoProject().ideation).filter((c) => c.level === 'block')).toHaveLength(0)
  })
})

describe('oneLiner', () => {
  it('fills the template from the canvas', () => {
    expect(oneLiner(demoProject().ideation)).toBe(
      'CanteenQ helps first-year hostel students with back-to-back lab sessions grab lunch in the 20-minute break by letting them pre-order and skip the queue.',
    )
  })

  it('keeps the demo one-liner short and lint-clean', () => {
    const i = demoProject().ideation
    expect(lintOneLiner(oneLiner(i), i)).toEqual([{ level: 'good', message: expect.any(String) }])
  })

  it('normalises leading "to" and "by"', () => {
    const i = { ...emptyIdeation(), productName: 'X', targetUser: 'Kirana owners', outcome: 'To track credit.', approach: 'By scanning notebooks' }
    expect(oneLiner(i)).toBe('X helps kirana owners track credit by scanning notebooks.')
  })

  it('keeps placeholders for missing parts and lint blocks them', () => {
    const text = oneLiner(emptyIdeation())
    expect(text).toContain('[Product]')
    expect(lintOneLiner(text, emptyIdeation())[0].level).toBe('block')
  })

  it('flags buzzwords', () => {
    const i = { ...emptyIdeation(), productName: 'Y', targetUser: 'night-shift nurses in Pune', outcome: 'eat well', approach: 'a revolutionary seamless platform' }
    const lint = lintOneLiner(oneLiner(i), i)
    expect(lint.some((l) => l.message.includes('buzzwords'))).toBe(true)
  })
})

describe('interview', () => {
  it('resumes at the first unanswered question', () => {
    expect(nextInterviewIndex(emptyIdeation())).toBe(0)
    expect(nextInterviewIndex({ ...emptyIdeation(), rawIdea: 'x' })).toBe(1)
  })

  it('pushes back once on a vague user, then accepts', () => {
    expect(reactToAnswer('targetUser', 'students', 0).accept).toBe(false)
    expect(reactToAnswer('targetUser', 'students', 1).accept).toBe(true)
    expect(reactToAnswer('targetUser', 'hostel students who skip lunch between labs', 0).accept).toBe(true)
  })
})
