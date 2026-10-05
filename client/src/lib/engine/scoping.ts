import type { Decision, Effort, Feature, Ideation, Scoping } from '../types'
import type { Challenge } from './ideation'
import { stripEndPunct } from './text'

export const EFFORT_HOURS: Record<Effort, number> = { S: 8, M: 20, L: 40 }
export const EFFORT_LABEL: Record<Effort, string> = { S: 'Small · ~1 day', M: 'Medium · ~2–3 days', L: 'Large · ~1 week' }
/** Integration, testing and deployment overhead on top of feature work. */
export const BUFFER = 0.25

export const PAY_TEST = 'Does this feature change whether someone pays (or switches)?'
export const CORE_TEST = 'Is it needed for the one core flow?'

export type Verdict = Decision | 'undecided'

/** The co-founder's rule: keep what the core flow needs, defer what drives payment, cut the rest. */
export function autoVerdict(f: Feature): Verdict {
  if (f.core === 'yes') return 'keep'
  if (f.core === 'no') return f.pays === 'yes' ? 'later' : f.pays === 'no' ? 'cut' : 'undecided'
  return 'undecided'
}

export function verdict(f: Feature): Verdict {
  return f.override ?? autoVerdict(f)
}

export function verdictReason(f: Feature): string {
  const auto = autoVerdict(f)
  if (f.override && f.override !== auto) {
    return f.override === 'keep' && auto === 'cut'
      ? 'You kept this even though it doesn’t affect payment or the core flow. Are you sure it belongs in v1?'
      : 'You overrode the co-founder’s verdict.'
  }
  switch (auto) {
    case 'keep':
      return f.pays === 'yes'
        ? 'Part of the core flow and it drives payment.'
        : 'Needed for the core flow, but it doesn’t drive payment. Build the simplest version that works.'
    case 'later':
      return 'Could drive payment, but the core flow works without it. Ship it in v2 once v1 has users.'
    case 'cut':
      return 'Doesn’t change whether someone pays and isn’t needed for the core flow.'
    default:
      return 'Answer both questions to get a verdict.'
  }
}

export interface Timeline {
  keepHours: number
  totalHours: number
  weeks: number
  fits: boolean
  capacity: number
}

export function timeline(s: Scoping): Timeline {
  const keepHours = s.features.filter((f) => verdict(f) === 'keep').reduce((sum, f) => sum + EFFORT_HOURS[f.effort], 0)
  const totalHours = Math.round(keepHours * (1 + BUFFER))
  const capacity = Math.max(1, s.hoursPerWeek)
  const weeks = totalHours / capacity
  return { keepHours, totalHours, weeks, fits: weeks <= s.weeksTarget, capacity }
}

export function grouped(features: Feature[]): Record<Verdict, Feature[]> {
  const out: Record<Verdict, Feature[]> = { keep: [], later: [], cut: [], undecided: [] }
  for (const f of features) out[verdict(f)].push(f)
  return out
}

export function scopingChallenges(s: Scoping, i: Ideation): Challenge[] {
  const out: Challenge[] = []
  const groups = grouped(s.features)
  const t = timeline(s)

  if (!s.features.length) {
    out.push({
      id: 'no-features',
      level: 'block',
      title: 'List every feature you’re imagining',
      body: 'Dump them all, including the shiny ones. The co-founder will challenge each one.',
    })
  }

  if (!s.coreFlow.length) {
    out.push({
      id: 'no-flow',
      level: 'block',
      title: 'What is the one core flow?',
      body: 'Write the steps a user takes from opening the app to getting the outcome. One flow, not five.',
    })
  } else if (s.coreFlow.length > 7) {
    out.push({
      id: 'long-flow',
      level: 'warn',
      title: `Your core flow has ${s.coreFlow.length} steps`,
      body: 'Can a user reach the outcome in five steps or fewer? Every step is a place to drop off.',
    })
  }

  if (s.features.length && !t.fits) {
    const keepers = [...groups.keep].sort((a, b) => {
      // Simplify what doesn't drive payment first, then the biggest items.
      const pa = a.pays === 'yes' ? 1 : 0
      const pb = b.pays === 'yes' ? 1 : 0
      return pa - pb || EFFORT_HOURS[b.effort] - EFFORT_HOURS[a.effort]
    })
    const suspects = keepers.slice(0, 2).map((f) => `“${f.name}”`)
    out.push({
      id: 'over-budget',
      level: 'block',
      title: `v1 needs ~${t.weeks.toFixed(1)} weeks, but the target is ${s.weeksTarget}`,
      body: `At ${s.hoursPerWeek} hours a week this won’t ship in time. Cut or simplify ${suspects.join(' and ')} first.`,
    })
  }

  if (groups.keep.length > 6) {
    out.push({
      id: 'too-many',
      level: 'warn',
      title: `You’re keeping ${groups.keep.length} features`,
      body: 'A three-week MVP usually fits three to six. Complexity is the enemy of shipping fast.',
    })
  }

  for (const f of groups.keep.filter((f) => f.effort === 'L')) {
    out.push({
      id: `large-${f.id}`,
      level: 'warn',
      title: `“${f.name}” is a large build`,
      body: 'Can you fake it manually for v1? A spreadsheet, a WhatsApp message or a human behind the scenes is fine to start.',
    })
  }

  for (const f of s.features.filter((f) => f.override === 'keep' && autoVerdict(f) === 'cut')) {
    out.push({
      id: `override-${f.id}`,
      level: 'warn',
      title: `Is “${f.name}” really v1?`,
      body: 'It doesn’t affect payment or the core flow. Founders naturally over-build; this is where weeks disappear.',
    })
  }

  if (groups.undecided.length) {
    out.push({
      id: 'undecided',
      level: 'tip',
      title: `${groups.undecided.length} feature${groups.undecided.length > 1 ? 's' : ''} still undecided`,
      body: `Answer the two questions for each: “${PAY_TEST}” and “${CORE_TEST}”`,
    })
  }

  if (!s.outcome.trim()) {
    out.push({
      id: 'no-outcome',
      level: 'tip',
      title: 'Define one clear outcome',
      body: i.outcome.trim()
        ? `Make it measurable. Your one-liner says “${stripEndPunct(i.outcome)}”. How will you know it happened?`
        : 'What does success look like for the user at the end of the core flow? Make it measurable.',
    })
  }

  return out
}

export const STACK_BOUNDARY = [
  { layer: 'Frontend', choice: 'React with minimal pages' },
  { layer: 'Backend', choice: 'Node.js + Express REST API' },
  { layer: 'Database', choice: 'MongoDB with Mongoose schemas' },
  { layer: 'Auth', choice: 'Email + password with JWT' },
]

/** Tempting extras founders usually add. Useful for showing how the pay test cuts scope. */
export const COMMON_FEATURES = [
  'Sign up and log in',
  'Notifications',
  'Online payments',
  'Search and filters',
  'Admin dashboard',
  'Analytics dashboard',
  'In-app chat',
  'Ratings and reviews',
  'Referral rewards',
  'Social sharing',
  'Dark mode',
  'AI recommendations',
  'Native mobile app',
]
