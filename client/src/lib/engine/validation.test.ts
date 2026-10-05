import { describe, expect, it } from 'vitest'
import { demoProject } from '../demo'
import { emptyIdeation, emptyValidation } from '../factory'
import {
  classifyResponse,
  interpretSignals,
  landingCopy,
  landingHtml,
  outreachKit,
  summarizeResponses,
  surveyAsText,
  surveyQuestions,
} from './validation'

const demo = demoProject()

describe('landingCopy', () => {
  it('builds the hero from the one-liner parts', () => {
    const c = landingCopy(demo.ideation, demo.validation.landing)
    expect(c.headline).toBe('Grab lunch in the 20-minute break.')
    expect(c.subheadline).toBe('Pre-order and skip the queue. Built for first-year hostel students with back-to-back lab sessions.')
    expect(c.sections.map((s) => s.title)).toEqual(['The problem', 'How CanteenQ fixes it', 'Why now'])
  })

  it('prefers the founder’s overrides', () => {
    const c = landingCopy(demo.ideation, { headline: 'Lunch, sorted.', subheadline: '', cta: 'Get early access' })
    expect(c.headline).toBe('Lunch, sorted.')
    expect(c.cta).toBe('Get early access')
  })

  it('works for an empty canvas', () => {
    const c = landingCopy(emptyIdeation(), emptyValidation().landing)
    expect(c.headline.length).toBeGreaterThan(0)
    expect(c.sections).toEqual([])
  })

  it('escapes user text in the downloadable HTML', () => {
    const i = { ...demo.ideation, productName: '<script>alert(1)</script>' }
    const html = landingHtml(landingCopy(i, demo.validation.landing))
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('outreachKit and survey', () => {
  it('writes three problem-first templates', () => {
    const kit = outreachKit(demo.ideation)
    expect(kit.map((k) => k.id)).toEqual(['email', 'dm', 'post'])
    expect(kit[0].subject).toBe('Student project: how do you grab lunch in the 20-minute break?')
    expect(kit[1].body).toContain('How do you usually grab lunch in the 20-minute break?')
  })

  it('includes the Sean Ellis question and exports as text', () => {
    const qs = surveyQuestions(demo.ideation)
    expect(qs.some((q) => q.options?.includes('Very disappointed'))).toBe(true)
    expect(surveyAsText(qs)).toMatch(/^1\. /)
  })
})

describe('interpretSignals', () => {
  it('reports no data for an empty funnel', () => {
    const r = interpretSignals(emptyValidation().signals)
    expect(r.hasData).toBe(false)
    expect(r.score).toBe(0)
    expect(r.metrics.every((m) => m.band === 'none')).toBe(true)
  })

  it('rates the demo funnel as strong overall', () => {
    const r = interpretSignals(demo.validation.signals)
    const byKey = Object.fromEntries(r.metrics.map((m) => [m.key, m.band]))
    expect(byKey).toEqual({ landing: 'strong', reply: 'promising', calls: 'strong', ellis: 'strong', preorders: 'strong' })
    expect(r.score).toBe(94)
    expect(r.verdict.tone).toBe('good')
  })

  it('warns about impossible numbers and small samples', () => {
    const r = interpretSignals({ ...emptyValidation().signals, visitors: 40, signups: 50, surveyResponses: 10, veryDisappointed: 2 })
    expect(r.warnings.some((w) => w.includes('can’t exceed visitors'))).toBe(true)
    expect(r.warnings.some((w) => w.includes('small sample'))).toBe(true)
  })

  it('scores a weak funnel low', () => {
    const r = interpretSignals({ ...emptyValidation().signals, visitors: 500, signups: 5, outreachSent: 50, replies: 2 })
    expect(r.score).toBeLessThan(45)
    expect(r.verdict.tone).toBe('bad')
  })
})

describe('classifyResponse', () => {
  it('separates polite interest from genuine intent and friction', () => {
    expect(classifyResponse('Sounds cool, all the best!').cls).toBe('polite')
    expect(classifyResponse('Interesting, let me know when it’s ready.').cls).toBe('polite')
    expect(classifyResponse('When can I start using it? I never get lunch.').cls).toBe('intent')
    expect(classifyResponse('I’d pay ₹10 extra if it saves me the queue.').cls).toBe('intent')
    expect(classifyResponse('Not sure the canteen staff will follow the tokens.').cls).toBe('friction')
    expect(classifyResponse('ok').cls).toBe('unclear')
  })

  it('summarises the demo replies', () => {
    const s = summarizeResponses(demo.validation.responses)
    expect(s.counts).toEqual({ intent: 4, friction: 1, polite: 3, unclear: 0 })
    expect(s.insights[0]).toBe('4 of 8 replies show genuine intent (50%).')
  })
})
