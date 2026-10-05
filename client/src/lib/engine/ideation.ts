import type { Ideation } from '../types'
import { capitalize, clamp, findTerms, lines, lowerFirst, stripEndPunct, wordCount } from './text'

export type Level = 'block' | 'warn' | 'tip'

export interface Challenge {
  id: string
  level: Level
  title: string
  body: string
  field?: keyof Ideation
}

export type Tone = 'good' | 'warn' | 'bad'

export interface IdeaScores {
  clarity: number
  pain: number
  need: number
  overall: number
  verdict: { label: string; tone: Tone }
}

// Audience words that describe a market, not a person.
export const VAGUE_USER_TERMS = [
  'everyone',
  'everybody',
  'anyone',
  'anybody',
  'people',
  'users',
  'students',
  'college students',
  'businesses',
  'small businesses',
  'business owners',
  'companies',
  'customers',
  'consumers',
  'individuals',
  'professionals',
  'working professionals',
  'millennials',
  'gen z',
  'teams',
  'creators',
  'parents',
  'developers',
  'startups',
  'brands',
  'shops',
  'organisations',
  'organizations',
  'the public',
  'general public',
  'kids',
  'youth',
  'employees',
  'freelancers',
  'entrepreneurs',
] as const

const QUALIFIERS = [
  'who',
  'with',
  'at',
  'in',
  'during',
  'between',
  'that',
  'whose',
  'on',
  'for',
  'from',
  'after',
  'before',
  'preparing',
  'running',
  'managing',
  'living',
  'working',
  'studying',
  'using',
  'aged',
] as const

const GENERIC_PAIN_TERMS = [
  'hard',
  'difficult',
  'inconvenient',
  'annoying',
  'boring',
  'frustrating',
  'time consuming',
  'time-consuming',
  'problem',
  'issue',
  'struggle',
  'tough',
  'messy',
  'complicated',
  'confusing',
] as const

export const BUZZWORDS = [
  'revolutionary',
  'revolutionize',
  'revolutionise',
  'disrupt',
  'disruptive',
  'synergy',
  'leverage',
  'cutting-edge',
  'cutting edge',
  'seamless',
  'seamlessly',
  'next-gen',
  'next generation',
  'world-class',
  'innovative',
  'game-changer',
  'game changer',
  'one-stop',
  'one stop',
  'ai-powered',
  'blockchain',
  'paradigm',
  'holistic',
  'empower',
  'ecosystem',
  'best-in-class',
  'state-of-the-art',
] as const

const EXAMPLE_FOR_TERM: Record<string, string> = {
  students: 'hostel students who miss lunch between back-to-back labs',
  'college students': 'first-year students who can’t find project teammates outside their branch',
  people: 'night-shift nurses who can’t cook after a 12-hour shift',
  users: 'Instagram sellers who manage orders in their DMs',
  businesses: 'single-outlet bakeries that take cake orders over WhatsApp',
  'small businesses': 'kirana store owners who track credit customers in a notebook',
  developers: 'solo developers shipping their first paid side project',
  parents: 'working parents who juggle school pickups across two kids',
  freelancers: 'freelance designers who chase international clients for payment',
}

export function hasQualifier(text: string): boolean {
  return findTerms(text, QUALIFIERS).length > 0
}

/** Numbers, compound descriptors ("first-year") or proper nouns make a user concrete. */
export function hasSpecificMarker(text: string): boolean {
  return /\d/.test(text) || /\p{L}+-\p{L}+/u.test(text) || /\s\p{Lu}\p{Ll}+/u.test(text)
}

/** Returns the vague audience word in the target user, or null if it is specific enough. */
export function vagueUserTerm(targetUser: string): string | null {
  const t = targetUser.trim()
  if (!t) return null
  const matches = findTerms(t, VAGUE_USER_TERMS)
  if (!matches.length) return null
  const wc = wordCount(t)
  const vague = wc <= 2 || (wc <= 4 && !hasQualifier(t))
  if (!vague) return null
  return matches.sort((a, b) => b.length - a.length)[0]
}

export function exampleForTerm(term: string): string {
  return EXAMPLE_FOR_TERM[term] ?? 'final-year students preparing for placement interviews'
}

export function isGenericPain(pain: string): boolean {
  const wc = wordCount(pain)
  if (wc === 0) return false
  if (wc < 6) return true
  return wc < 10 && findTerms(pain, GENERIC_PAIN_TERMS).length > 0
}

export function scoreIdea(i: Ideation): IdeaScores {
  // Clarity: how precisely the user and their moment of pain are described.
  const userWords = wordCount(i.targetUser)
  let clarity = 0
  if (userWords) {
    clarity = Math.min(userWords, 8) * 6
    if (hasQualifier(i.targetUser)) clarity += 20
    if (hasSpecificMarker(i.targetUser)) clarity += 10
    if (wordCount(i.userContext) >= 5) clarity += 20
    if (vagueUserTerm(i.targetUser)) clarity = Math.min(clarity, 30)
  }

  // Pain: frequency, severity and evidence of a real workaround.
  const freqPts = { daily: 35, weekly: 25, monthly: 12, rarely: 4, '': 0 }[i.frequency]
  let pain = freqPts + i.severity * 9
  const painWords = wordCount(i.pain)
  if (painWords >= 12) pain += 10
  else if (painWords >= 6) pain += 5
  if (wordCount(i.currentSolution) >= 4) pain += 10
  if (!painWords) pain = Math.min(pain, 40)

  // Need: does this need to exist, and is it different enough to switch to?
  const alts = lines(i.alternatives).length
  let need = alts >= 2 ? 25 : alts === 1 ? 20 : 0
  const diffWords = wordCount(i.differentiator)
  need += diffWords >= 12 ? 35 : diffWords >= 6 ? 20 : diffWords > 0 ? 8 : 0
  const nowWords = wordCount(i.whyNow)
  need += nowWords >= 6 ? 20 : nowWords > 0 ? 10 : 0
  need += { yes: 20, maybe: 12, no: 0, '': 0 }[i.willingnessToPay]

  clarity = clamp(Math.round(clarity))
  pain = clamp(Math.round(pain))
  need = clamp(Math.round(need))
  const overall = Math.round(0.35 * clarity + 0.35 * pain + 0.3 * need)

  const verdict: IdeaScores['verdict'] =
    overall >= 75
      ? { label: 'Sharp enough to validate', tone: 'good' }
      : overall >= 50
        ? { label: 'Getting sharper', tone: 'warn' }
        : { label: 'Still a direction, not an idea', tone: 'bad' }

  return { clarity, pain, need, overall, verdict }
}

/** The co-founder's pushbacks, most important first. */
export function ideationChallenges(i: Ideation): Challenge[] {
  const out: Challenge[] = []
  const vague = vagueUserTerm(i.targetUser)

  if (!i.targetUser.trim()) {
    out.push({
      id: 'user-missing',
      level: 'block',
      field: 'targetUser',
      title: 'Who exactly is the user?',
      body: 'Name one specific person with a real, recurring problem. A vague audience leads to a vague product.',
    })
  } else if (vague) {
    out.push({
      id: 'user-vague',
      level: 'block',
      field: 'targetUser',
      title: `“${capitalize(vague)}” is an audience, not a user`,
      body: `Which ${vague}, doing what, and when does the problem hit? For example: “${exampleForTerm(vague)}”.`,
    })
  }

  if (!i.pain.trim()) {
    out.push({
      id: 'pain-missing',
      level: 'block',
      field: 'pain',
      title: 'What is the pain?',
      body: 'Describe the painful moment in the user’s own words. Is it urgent? Is it frequent? Would they pay to fix it?',
    })
  } else if (isGenericPain(i.pain)) {
    out.push({
      id: 'pain-generic',
      level: 'warn',
      field: 'pain',
      title: 'The pain sounds generic',
      body: 'What exactly goes wrong, and what does it cost them in time, money or stress? Specific pain is testable pain.',
    })
  }

  if (!i.frequency) {
    out.push({
      id: 'freq-missing',
      level: 'warn',
      field: 'frequency',
      title: 'How often does it happen?',
      body: 'Frequent problems create habits, and habits create products people come back to.',
    })
  } else if (i.frequency === 'monthly' || i.frequency === 'rarely') {
    out.push({
      id: 'freq-low',
      level: 'warn',
      field: 'frequency',
      title: `A ${i.frequency === 'rarely' ? 'rare' : 'monthly'} annoyance rarely makes people switch`,
      body: 'Look for a more frequent version of the problem, or a moment when it is truly urgent.',
    })
  }

  if (!i.severity) {
    out.push({
      id: 'sev-missing',
      level: 'warn',
      field: 'severity',
      title: 'How bad is it, from 1 to 5?',
      body: 'Pressure-test the severity before building anything. Mild pain makes for polite users and no customers.',
    })
  } else if (i.severity <= 2) {
    out.push({
      id: 'sev-low',
      level: 'warn',
      field: 'severity',
      title: 'Low severity',
      body: 'Would anyone pay or change behaviour to fix a mild problem? Find the users for whom it hurts most.',
    })
  }

  if (!i.currentSolution.trim()) {
    out.push({
      id: 'workaround-missing',
      level: 'warn',
      field: 'currentSolution',
      title: 'How are they solving it right now?',
      body: 'Every real problem already has a workaround, even if it is “doing nothing”. That workaround is your real competitor.',
    })
  }

  if (!lines(i.alternatives).length) {
    out.push({
      id: 'alts-missing',
      level: 'warn',
      field: 'alternatives',
      title: 'Does this need to exist?',
      body: 'List existing products or habits. If nothing exists, ask why. Often it means the problem isn’t painful enough.',
    })
  }

  const diffWords = wordCount(i.differentiator)
  if (diffWords < 6) {
    out.push({
      id: 'diff-thin',
      level: diffWords ? 'warn' : 'block',
      field: 'differentiator',
      title: 'What makes this different?',
      body: 'Explain what you can do that the current workaround cannot. “Better UI” is not a reason to switch.',
    })
  }

  if (i.willingnessToPay === 'no') {
    out.push({
      id: 'wtp-no',
      level: 'warn',
      field: 'willingnessToPay',
      title: 'Nobody would pay or switch',
      body: 'If users won’t pay or change behaviour, this is a nice-to-have. Look for a sharper, more urgent pain.',
    })
  } else if (!i.willingnessToPay) {
    out.push({
      id: 'wtp-missing',
      level: 'tip',
      field: 'willingnessToPay',
      title: 'Would they pay or change behaviour?',
      body: 'You don’t need a price yet, but you need a reason to believe they would.',
    })
  }

  if (!i.whyNow.trim()) {
    out.push({
      id: 'whynow-missing',
      level: 'tip',
      field: 'whyNow',
      title: 'Why now?',
      body: 'What changed (technology, rules, habits) that makes this possible or urgent today?',
    })
  }

  if (!i.productName.trim() || !i.outcome.trim() || !i.approach.trim()) {
    out.push({
      id: 'oneliner-incomplete',
      level: 'tip',
      title: 'Sharpen the one-liner',
      body: 'Fill in the product name, outcome and approach to get a crisp statement you can test with real users.',
    })
  }

  return out
}

function normalizeOutcome(s: string): string {
  return lowerFirst(stripEndPunct(s).replace(/^(to|helps? them|helps? users?)\s+/i, ''))
}

function normalizeApproach(s: string): string {
  return lowerFirst(stripEndPunct(s).replace(/^by\s+/i, ''))
}

/** "[Product] helps [user] do [outcome] by [unique approach]." */
export function oneLiner(i: Ideation): string {
  const product = i.productName.trim() || '[Product]'
  const user = i.targetUser.trim() ? lowerFirst(stripEndPunct(i.targetUser)) : '[user]'
  const outcome = i.outcome.trim() ? normalizeOutcome(i.outcome) : 'do [outcome]'
  const approach = i.approach.trim() ? normalizeApproach(i.approach) : '[unique approach]'
  return `${product} helps ${user} ${outcome} by ${approach}.`
}

export interface LintResult {
  level: Level | 'good'
  message: string
}

export function lintOneLiner(text: string, i: Ideation): LintResult[] {
  const out: LintResult[] = []
  if (/\[[^\]]+\]/.test(text)) {
    out.push({ level: 'block', message: 'Fill in the blanks: product, user, outcome and approach.' })
    return out
  }
  const wc = wordCount(text)
  if (wc > 32) out.push({ level: 'warn', message: `${wc} words. Aim for 25 or fewer so people can repeat it after one hearing.` })
  const buzz = findTerms(text, BUZZWORDS)
  if (buzz.length) out.push({ level: 'warn', message: `Cut the buzzwords: ${buzz.map((b) => `“${b}”`).join(', ')}. Say what it does.` })
  const vague = vagueUserTerm(i.targetUser)
  if (vague) out.push({ level: 'warn', message: `“${vague}” is too broad. Name one specific user.` })
  if (wordCount(i.outcome) < 3) out.push({ level: 'tip', message: 'Make the outcome concrete and observable (start with a verb).' })
  if (!out.length) out.push({ level: 'good', message: 'Clear, specific and testable. Use it as your landing-page headline next.' })
  return out
}

// ---------------------------------------------------------------------------
// Guided interview: the co-founder asks one question at a time.

export interface InterviewStep {
  field: keyof Ideation
  kind: 'text' | 'long' | 'choice'
  question: string
  why: string
  placeholder?: string
  choices?: { value: string; label: string }[]
}

export const INTERVIEW: InterviewStep[] = [
  {
    field: 'rawIdea',
    kind: 'long',
    question: 'Let’s start messy. What’s the idea, in a sentence or two? It’s fine if it’s vague.',
    why: 'Most founders start with a feeling. That’s a direction, not an idea yet. We’ll sharpen it together.',
    placeholder: 'e.g. something for students so they waste less time in the canteen',
  },
  {
    field: 'targetUser',
    kind: 'text',
    question: 'Who exactly is the user? Describe one specific person, not a market.',
    why: 'A vague audience leads to a vague product.',
    placeholder: 'e.g. final-year students preparing for placement interviews',
  },
  {
    field: 'userContext',
    kind: 'text',
    question: 'When and where does the problem hit them?',
    why: 'The moment of pain tells you where your product has to show up.',
    placeholder: 'e.g. the 20-minute gap between morning labs and afternoon lectures',
  },
  {
    field: 'pain',
    kind: 'long',
    question: 'What is the pain? Describe what goes wrong and what it costs them.',
    why: 'Pressure-test the severity before building anything.',
  },
  {
    field: 'frequency',
    kind: 'choice',
    question: 'How often does this happen to them?',
    why: 'Frequent pain builds habits. Rare pain gets forgotten.',
    choices: [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'rarely', label: 'Rarely' },
    ],
  },
  {
    field: 'severity',
    kind: 'choice',
    question: 'How bad is it when it happens? 1 is mildly annoying, 5 is “I’d pay to fix this today”.',
    why: 'Would users pay or change behaviour to fix it?',
    choices: [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) })),
  },
  {
    field: 'currentSolution',
    kind: 'long',
    question: 'How are they solving it right now, and why is that painful enough to switch?',
    why: 'The current workaround is your real competitor.',
  },
  {
    field: 'alternatives',
    kind: 'long',
    question: 'Which products or habits already try to solve this? One per line, with what’s missing.',
    why: 'Does this need to exist? If nothing exists, ask why.',
  },
  {
    field: 'differentiator',
    kind: 'long',
    question: 'What can you do that those alternatives can’t?',
    why: '“Better UI” is not a reason to switch.',
  },
  {
    field: 'whyNow',
    kind: 'text',
    question: 'Why now? What changed that makes this possible or urgent today?',
    why: 'Timing explains why nobody has done it well yet.',
  },
  {
    field: 'willingnessToPay',
    kind: 'choice',
    question: 'Would they pay, or at least change their behaviour, to fix this?',
    why: 'Interest is cheap. Payment or effort is the real signal.',
    choices: [
      { value: 'yes', label: 'Yes, they’d pay' },
      { value: 'maybe', label: 'Maybe, they’d switch' },
      { value: 'no', label: 'Probably not' },
    ],
  },
  {
    field: 'productName',
    kind: 'text',
    question: 'Give it a working name. It can change later.',
    why: 'A name makes the one-liner concrete.',
  },
  {
    field: 'outcome',
    kind: 'text',
    question: 'Finish this sentence: “[Product] helps [user] …”. What outcome do they get? Start with a verb.',
    why: 'Outcomes are observable. Features are not outcomes.',
    placeholder: 'e.g. get lunch between back-to-back labs',
  },
  {
    field: 'approach',
    kind: 'text',
    question: 'And the unique approach: “… by …”. How do you deliver that outcome?',
    why: 'This is what makes you different from the workaround.',
    placeholder: 'e.g. letting them pre-order and pick up in under two minutes',
  },
]

export function isAnswered(i: Ideation, field: keyof Ideation): boolean {
  const v = i[field]
  return typeof v === 'number' ? v > 0 : String(v).trim().length > 0
}

export function nextInterviewIndex(i: Ideation): number {
  const idx = INTERVIEW.findIndex((s) => !isAnswered(i, s.field))
  return idx === -1 ? INTERVIEW.length : idx
}

export interface InterviewReply {
  accept: boolean
  reply: string
}

/**
 * The co-founder's reaction to an answer. `attempt` counts earlier pushbacks on the
 * same question; after one pushback the answer is accepted so the founder is never stuck.
 */
export function reactToAnswer(field: keyof Ideation, value: string, attempt: number): InterviewReply {
  const v = value.trim()
  switch (field) {
    case 'rawIdea':
      return {
        accept: true,
        reply: 'Good, that’s our starting direction. Now let’s pressure-test it with the questions that matter.',
      }
    case 'targetUser': {
      const vague = vagueUserTerm(v)
      if (vague && attempt === 0) {
        return {
          accept: false,
          reply: `“${capitalize(vague)}” is an audience, not a user. Which ${vague} exactly? Add who they are, where they are, or when the problem hits. For example: “${exampleForTerm(vague)}”.`,
        }
      }
      return {
        accept: true,
        reply: vague
          ? 'Still broad, but let’s move on. We’ll narrow it during validation.'
          : `Good. “${stripEndPunct(v)}” is specific enough to find and talk to this week.`,
      }
    }
    case 'pain':
      if (isGenericPain(v) && attempt === 0) {
        return {
          accept: false,
          reply: 'That sounds generic. What exactly goes wrong, and what does it cost them in time, money or stress?',
        }
      }
      return { accept: true, reply: 'That’s a real, describable pain. Now, how often does it happen?' }
    case 'frequency':
      return v === 'monthly' || v === 'rarely'
        ? { accept: true, reply: 'Careful: infrequent pain rarely makes people switch. Look for the most frequent version of it.' }
        : { accept: true, reply: 'Frequent pain is good news. It means a habit, and habits make products sticky.' }
    case 'severity':
      return Number(v) <= 2
        ? { accept: true, reply: 'Mild pain makes for polite users and no customers. Keep that in mind when we validate.' }
        : { accept: true, reply: 'That’s strong enough to justify a test. Let’s see what they do about it today.' }
    case 'currentSolution':
      return { accept: true, reply: 'That workaround is your real competitor. Your product has to be clearly better than it.' }
    case 'alternatives':
      return { accept: true, reply: 'Noted. Knowing the alternatives tells us where the gap is.' }
    case 'differentiator':
      if (wordCount(v) < 6 && attempt === 0) {
        return { accept: false, reply: 'Push further. What can you do that they can’t, in one concrete sentence?' }
      }
      return { accept: true, reply: 'That’s a real reason to switch. Hold on to it; it becomes your landing-page promise.' }
    case 'whyNow':
      return { accept: true, reply: 'Good timing argument. It also explains why nobody has nailed this yet.' }
    case 'willingnessToPay':
      return v === 'no'
        ? { accept: true, reply: 'Then validation must prove otherwise before we write any code. Let’s still sharpen the one-liner.' }
        : { accept: true, reply: 'We’ll test that with real people in the Validation stage. Now let’s sharpen the one-liner.' }
    case 'productName':
      return { accept: true, reply: `${stripEndPunct(v)}. Works for now.` }
    case 'outcome':
      return { accept: true, reply: 'Observable outcome, good. Last piece: how do you deliver it?' }
    case 'approach':
      return { accept: true, reply: 'That’s your one-liner. Check the scorecard, then move on to Validation.' }
    default:
      return { accept: true, reply: 'Got it.' }
  }
}
