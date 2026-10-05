import type { Ideation, LandingOverrides, Signals } from '../types'
import type { Challenge } from './ideation'
import { asSentence, capitalize, escapeHtml, findTerms, lines, lowerFirst, pct, stripEndPunct } from './text'

// ---------------------------------------------------------------------------
// Landing page

export interface LandingCopy {
  productName: string
  headline: string
  subheadline: string
  cta: string
  sections: { title: string; body: string }[]
}

function outcomePhrase(i: Ideation): string {
  return lowerFirst(stripEndPunct(i.outcome).replace(/^(to|helps? them|helps? users?)\s+/i, ''))
}

function approachAsAction(i: Ideation): string {
  return stripEndPunct(i.approach)
    .replace(/^by\s+/i, '')
    .replace(/^(letting|helping|allowing|enabling)\s+(them|users|people|you)\s+(to\s+)?/i, '')
}

export function landingCopy(i: Ideation, o: LandingOverrides): LandingCopy {
  const productName = i.productName.trim() || 'Your product'
  const user = stripEndPunct(i.targetUser)

  const generatedHeadline = i.outcome.trim()
    ? capitalize(outcomePhrase(i)) + '.'
    : i.pain.trim()
      ? `Stop losing time to this problem.`
      : `${productName}, built for one painful problem.`

  const action = approachAsAction(i)
  const generatedSub = [action ? asSentence(action) : '', user ? `Built for ${lowerFirst(user)}.` : '']
    .filter(Boolean)
    .join(' ')

  const sections = [
    { title: 'The problem', body: asSentence(i.pain) },
    { title: `How ${productName} fixes it`, body: asSentence(i.differentiator) },
    { title: 'Why now', body: asSentence(i.whyNow) },
  ].filter((s) => s.body)

  return {
    productName,
    headline: o.headline.trim() || generatedHeadline,
    subheadline: o.subheadline.trim() || generatedSub || `${productName} is in early access.`,
    cta: o.cta.trim() || 'Join the waitlist',
    sections,
  }
}

/** A standalone, dependency-free landing page the founder can host anywhere. */
export function landingHtml(copy: LandingCopy): string {
  const e = escapeHtml
  const cards = copy.sections
    .map((s, i) => `      <div class="card"><span class="num">0${i + 1}</span><h3>${e(s.title)}</h3><p>${e(s.body)}</p></div>`)
    .join('\n')
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${e(copy.productName)}: ${e(copy.headline)}</title>
  <meta name="description" content="${e(copy.subheadline)}" />
  <style>
    *{box-sizing:border-box}
    body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#fafafb;color:#0b0c11;line-height:1.55;-webkit-font-smoothing:antialiased}
    body::before{content:"";position:fixed;inset:-20% -10% auto;height:75vh;z-index:-1;pointer-events:none;background:radial-gradient(40% 50% at 25% 30%,rgba(124,92,255,.2),transparent 70%),radial-gradient(35% 45% at 78% 22%,rgba(34,211,238,.18),transparent 70%)}
    .wrap{max-width:1040px;margin:0 auto;padding:0 20px}
    header{display:flex;align-items:center;gap:10px;padding:20px 0;font-weight:700;font-size:17px;letter-spacing:-.01em}
    .logo{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#7c5cff,#22d3ee)}
    .hero{padding:72px 0 40px;text-align:center}
    .badge{display:inline-flex;align-items:center;gap:8px;margin-bottom:22px;padding:6px 12px;border:1px solid #e4e4ea;border-radius:999px;background:rgba(255,255,255,.75);font-size:13px;color:#3a3f4c}
    .dot{width:7px;height:7px;border-radius:50%;background:#16a34a}
    h1{max-width:820px;margin:0 auto 18px;font-size:clamp(36px,7vw,64px);line-height:1.03;letter-spacing:-.035em}
    .sub{max-width:620px;margin:0 auto 32px;font-size:19px;color:#4b5161}
    form{display:flex;flex-wrap:wrap;gap:6px;max-width:480px;margin:0 auto;padding:6px;border:1px solid #e4e4ea;border-radius:16px;background:#fff;box-shadow:0 16px 40px -24px rgba(11,12,17,.35)}
    input{flex:1;min-width:200px;height:46px;padding:0 12px;border:0;border-radius:11px;background:transparent;color:inherit;font-size:16px}
    input:focus{outline:2px solid #7c5cff;outline-offset:0}
    button{flex:none;height:46px;padding:0 20px;border:0;border-radius:11px;background:#0b0c11;color:#fff;font-weight:600;font-size:15px;cursor:pointer;transition:transform .15s,opacity .15s}
    button:hover{opacity:.9;transform:translateY(-1px)}
    .thanks{display:none;margin-top:16px;color:#15803d;font-weight:600}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;padding:48px 0 72px}
    .card{padding:24px;border:1px solid #e4e4ea;border-radius:20px;background:rgba(255,255,255,.85)}
    .num{font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;color:#6d28d9}
    .card h3{margin:12px 0 6px;font-size:18px;letter-spacing:-.01em}
    .card p{margin:0;color:#3a3f4c}
    footer{padding:24px 0 40px;border-top:1px solid #e4e4ea;text-align:center;color:#646a79;font-size:13px}
  </style>
</head>
<body>
  <div class="wrap">
    <header><span class="logo" aria-hidden="true"></span>${e(copy.productName)}</header>
    <section class="hero">
      <p class="badge"><span class="dot" aria-hidden="true"></span>Now in early access</p>
      <h1>${e(copy.headline)}</h1>
      <p class="sub">${e(copy.subheadline)}</p>
      <!-- Connect this form to Google Forms, Formspree or your own API to collect real sign-ups. -->
      <form id="waitlist">
        <input type="email" required placeholder="you@college.edu" aria-label="Email address" />
        <button type="submit">${e(copy.cta)}</button>
      </form>
      <p class="thanks" id="thanks">You’re on the list. We’ll be in touch soon.</p>
    </section>
    <section class="grid">
${cards}
    </section>
    <footer>${e(copy.productName)} · Early access</footer>
  </div>
  <script>
    document.getElementById('waitlist').addEventListener('submit', function (ev) {
      ev.preventDefault();
      this.style.display = 'none';
      document.getElementById('thanks').style.display = 'block';
    });
  </script>
</body>
</html>
`
}

// ---------------------------------------------------------------------------
// Outreach (Mom Test style: ask about their life, not your idea)

export interface OutreachTemplate {
  id: 'email' | 'dm' | 'post'
  channel: string
  subject?: string
  body: string
}

export const MOM_TEST_RULES = [
  'Ask about their life, not your idea.',
  'Ask about specific past events, not opinions about the future.',
  'Talk less, listen more. Silence gets you the real answer.',
  'Compliments are not data. Commitments (time, money, intros) are.',
]

export function outreachKit(i: Ideation): OutreachTemplate[] {
  const user = i.targetUser.trim() ? lowerFirst(stripEndPunct(i.targetUser)) : 'people like you'
  const outcome = i.outcome.trim() ? outcomePhrase(i) : ''
  const pain = i.pain.trim() ? lowerFirst(stripEndPunct(i.pain)) : 'a problem I keep hearing about'
  const context = i.userContext.trim() ? asSentence(i.userContext) : ''
  const howQuestion = outcome ? `How do you usually ${outcome}?` : 'How do you usually deal with this?'

  return [
    {
      id: 'email',
      channel: 'Cold email',
      subject: outcome ? `Student project: how do you ${outcome}?` : 'Quick question (not a sales pitch)',
      body: `Hi {{name}},

I’m {{your name}}, and I’m researching how ${user} deal with this: ${pain}.

I’m not selling anything. I’d love 10 minutes to hear how you handle it today. Three questions:
1. When was the last time this happened? What did you do?
2. What have you tried to fix it, and what was annoying about that?
3. If you could change one thing about it, what would it be?

Would {{day}} at {{time}} work for a short call, or should I send the questions here?

Thanks,
{{your name}}`,
    },
    {
      id: 'dm',
      channel: 'WhatsApp / LinkedIn DM',
      body: `Hey {{name}}! Quick one for a project I’m working on. ${howQuestion} I’m talking to ${user} to understand what’s annoying about it. No pitch, just 3 short questions. Okay if I send them?`,
    },
    {
      id: 'post',
      channel: 'Community post (college group, Reddit, Discord)',
      subject: outcome ? capitalize(`How do you ${outcome}?`) : 'How do you deal with this?',
      body: `${context ? context + ' ' : ''}I’m a student researching this problem: ${pain}.

• How do you handle it today?
• What have you tried that didn’t work?
• What would make it noticeably better?

Not promoting anything. I’ll share a summary of what I learn with everyone who replies.`,
    },
  ]
}

// ---------------------------------------------------------------------------
// Survey

export interface SurveyQuestion {
  q: string
  type: 'single' | 'open' | 'scale' | 'email'
  options?: string[]
  why: string
}

export function surveyQuestions(i: Ideation): SurveyQuestion[] {
  const user = stripEndPunct(i.targetUser)
  const product = i.productName.trim() || 'this product'
  const pain = i.pain.trim() ? lowerFirst(stripEndPunct(i.pain)) : 'this problem'
  return [
    {
      q: user ? `Which best describes you: ${lowerFirst(user)}?` : 'Which best describes you (role, year, situation)?',
      type: user ? 'single' : 'open',
      options: user ? ['Yes, exactly', 'Partly', 'No'] : undefined,
      why: 'Screens out people who aren’t your user, so their answers don’t skew the results.',
    },
    {
      q: `When was the last time this happened to you: ${pain}?`,
      type: 'single',
      options: ['This week', 'This month', 'Earlier this year', 'Never'],
      why: 'Past behaviour beats future promises. Recent pain is real pain.',
    },
    {
      q: 'How often does it happen?',
      type: 'single',
      options: ['Daily', 'Weekly', 'Monthly', 'Rarely'],
      why: 'Frequency predicts whether a product becomes a habit.',
    },
    { q: 'How do you deal with it today?', type: 'open', why: 'Reveals the real competitor: the current workaround.' },
    { q: 'What is the most frustrating part of that?', type: 'open', why: 'Gives you the exact words to use on your landing page.' },
    {
      q: 'Have you tried any app or service to fix it? Which one, and why did you stop?',
      type: 'open',
      why: 'Shows what has already failed and why.',
    },
    {
      q: 'How painful is it, from 1 (mild) to 5 (I’d pay to fix it today)?',
      type: 'scale',
      options: ['1', '2', '3', '4', '5'],
      why: 'Separates nice-to-have from must-have.',
    },
    {
      q: `If ${product} worked exactly as described, how would you feel if you could no longer use it?`,
      type: 'single',
      options: ['Very disappointed', 'Somewhat disappointed', 'Not disappointed'],
      why: 'Sean Ellis test. Ask it after people try a prototype: 40%+ “very disappointed” suggests product–market fit.',
    },
    {
      q: 'Want to try an early version or join a 10-minute call? Leave your email.',
      type: 'email',
      why: 'A commitment, not a compliment. The share who leave an email is a signal on its own.',
    },
  ]
}

export function surveyAsText(qs: SurveyQuestion[]): string {
  return qs
    .map((s, n) => {
      const opts = s.options ? '\n' + s.options.map((o) => `   ( ) ${o}`).join('\n') : s.type === 'email' ? '\n   ____________' : '\n   ____________'
      return `${n + 1}. ${s.q}${opts}`
    })
    .join('\n\n')
}

// ---------------------------------------------------------------------------
// Signal interpretation

export type Band = 'strong' | 'promising' | 'weak' | 'none'

export interface Metric {
  key: 'landing' | 'reply' | 'calls' | 'ellis' | 'preorders'
  label: string
  display: string
  /** 0–100 for rate metrics; null when there is no data */
  percent: number | null
  band: Band
  benchmark: string
}

export interface SignalReport {
  metrics: Metric[]
  score: number
  hasData: boolean
  verdict: { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }
  warnings: string[]
  actions: string[]
}

function rateBand(value: number, strong: number, promising: number): Band {
  return value >= strong ? 'strong' : value >= promising ? 'promising' : 'weak'
}

const BAND_POINTS: Record<Exclude<Band, 'none'>, number> = { strong: 1, promising: 0.6, weak: 0.15 }

export function interpretSignals(s: Signals): SignalReport {
  const metrics: Metric[] = []

  const landing = s.visitors > 0 ? pct(s.signups, s.visitors) : null
  metrics.push({
    key: 'landing',
    label: 'Landing page sign-up rate',
    percent: landing,
    display: landing === null ? 'No data' : `${landing.toFixed(1)}% (${s.signups}/${s.visitors})`,
    band: landing === null ? 'none' : rateBand(landing, 15, 5),
    benchmark: 'Rule of thumb for a targeted waitlist page: 5–15% is promising, 15%+ is strong.',
  })

  const reply = s.outreachSent > 0 ? pct(s.replies, s.outreachSent) : null
  metrics.push({
    key: 'reply',
    label: 'Outreach reply rate',
    percent: reply,
    display: reply === null ? 'No data' : `${reply.toFixed(1)}% (${s.replies}/${s.outreachSent})`,
    band: reply === null ? 'none' : rateBand(reply, 25, 10),
    benchmark: 'Personal, problem-first messages to the right users: 10–25% is promising, 25%+ is strong.',
  })

  const calls = s.replies > 0 ? pct(s.calls, s.replies) : null
  metrics.push({
    key: 'calls',
    label: 'Replies that became calls',
    percent: calls,
    display: calls === null ? 'No data' : `${calls.toFixed(1)}% (${s.calls}/${s.replies})`,
    band: calls === null ? 'none' : rateBand(calls, 40, 20),
    benchmark: 'Agreeing to give up 10 minutes is intent. 20%+ is promising, 40%+ is strong.',
  })

  const ellis = s.surveyResponses > 0 ? pct(s.veryDisappointed, s.surveyResponses) : null
  metrics.push({
    key: 'ellis',
    label: '“Very disappointed” (Sean Ellis test)',
    percent: ellis,
    display: ellis === null ? 'No data' : `${ellis.toFixed(1)}% (${s.veryDisappointed}/${s.surveyResponses})`,
    band: ellis === null ? 'none' : rateBand(ellis, 40, 25),
    benchmark: 'Sean Ellis benchmark: 40%+ “very disappointed” suggests product–market fit.',
  })

  const anyFunnel = s.visitors + s.outreachSent + s.surveyResponses > 0
  metrics.push({
    key: 'preorders',
    label: 'Pre-orders or payments',
    percent: null,
    display: !anyFunnel && s.preorders === 0 ? 'No data' : `${s.preorders}`,
    band: !anyFunnel && s.preorders === 0 ? 'none' : s.preorders >= 5 ? 'strong' : s.preorders >= 1 ? 'promising' : 'weak',
    benchmark: 'Money (or real effort) is the clearest signal. Even 1–5 pre-orders beat 100 compliments.',
  })

  const weights: Record<Metric['key'], number> = { landing: 20, reply: 15, calls: 15, ellis: 25, preorders: 25 }
  let total = 0
  let got = 0
  for (const m of metrics) {
    if (m.band === 'none') continue
    total += weights[m.key]
    got += weights[m.key] * BAND_POINTS[m.band]
  }
  const hasData = total > 0
  const score = hasData ? Math.round((got / total) * 100) : 0

  const verdict: SignalReport['verdict'] = !hasData
    ? { label: 'No signal yet: go talk to users', tone: 'neutral' }
    : score >= 70
      ? { label: 'Strong signal: scope the MVP', tone: 'good' }
      : score >= 45
        ? { label: 'Mixed signal: keep testing', tone: 'warn' }
        : { label: 'Weak signal: rethink the user or the pain', tone: 'bad' }

  const warnings: string[] = []
  if (s.signups > s.visitors) warnings.push('Sign-ups can’t exceed visitors. Check the numbers.')
  if (s.replies > s.outreachSent) warnings.push('Replies can’t exceed messages sent. Check the numbers.')
  if (s.calls > s.replies) warnings.push('Calls can’t exceed replies. Check the numbers.')
  if (s.veryDisappointed > s.surveyResponses) warnings.push('“Very disappointed” can’t exceed total responses.')
  if (s.visitors > 0 && s.visitors < 100) warnings.push(`Only ${s.visitors} visitors. Wait for 100+ before trusting the conversion rate.`)
  if (s.surveyResponses > 0 && s.surveyResponses < 30)
    warnings.push(`${s.surveyResponses} survey responses is a small sample. Aim for 30+ before trusting the 40% test.`)

  const band = (k: Metric['key']) => metrics.find((m) => m.key === k)!.band
  const actions: string[] = []
  if (!hasData) {
    actions.push('Send the outreach kit to 20 people who match your user and log the replies below.')
    actions.push('Publish the landing page and send 100 targeted visitors to it.')
  } else {
    if (band('landing') === 'weak')
      actions.push('Rewrite the headline in the user’s own words about the pain, then send 100 more targeted visitors.')
    if (band('reply') === 'weak')
      actions.push('Make outreach about their problem, not your idea, and personalise the first line.')
    if (band('ellis') === 'weak' || band('ellis') === 'promising')
      actions.push('Study the users who answered “very disappointed” and narrow your target user to people like them.')
    if (band('preorders') === 'weak' || band('preorders') === 'none')
      actions.push('Ask your most eager users to pre-pay or commit time. Interest is cheap; commitment is signal.')
    if (score >= 70) actions.push('Signal is strong enough. Move to Scoping and cut v1 down to one core flow.')
  }

  return { metrics, score, hasData, verdict, warnings, actions }
}

// ---------------------------------------------------------------------------
// Reading early signals: polite interest vs genuine intent

export type ResponseClass = 'intent' | 'friction' | 'polite' | 'unclear'

const INTENT_TERMS = [
  'when can i',
  'when can we',
  'where can i',
  'where do i',
  'can i try',
  'can i use',
  'can i join',
  'sign me up',
  'take my money',
  "i'd pay",
  'i would pay',
  'i will pay',
  "i'll pay",
  'would pay',
  'how much',
  'pre-order',
  'preorder',
  'early access',
  'beta',
  'please build',
  'build it',
  'i need this',
  'need this',
  'i want this',
  'can my',
  'can you add',
  'count me in',
  "i'm in",
  'every day',
  'every week',
  'twice a week',
  'daily',
  'subscribe',
  'waitlist',
  'send me the link',
]

const FRICTION_TERMS = [
  'not sure',
  "won't",
  "wouldn't",
  "don't need",
  'do not need',
  'no need',
  'too expensive',
  'expensive',
  'already use',
  'already have',
  'already pay',
  'doubt',
  'worried',
  'concern',
  'concerned',
  'what if',
  'how will you',
  'not convinced',
  'no one would',
  'nobody would',
  'no one will',
  'nobody will',
  "doesn't work",
  "won't work",
  'not for me',
  'not really',
  'risky',
  'privacy',
  'scam',
]

const POLITE_TERMS = [
  'sounds cool',
  'sounds good',
  'sounds great',
  'nice idea',
  'great idea',
  'good idea',
  'cool idea',
  'interesting',
  'good luck',
  'all the best',
  'best of luck',
  'let me know',
  'keep me posted',
  'love it',
  'awesome',
  'nice',
  'cool',
  'great',
  'amazing',
  'wow',
]

const MONEY = /[₹$€£]\s?\d|\b(rs|inr)\.?\s?\d|\d+\s?(rs|rupees|bucks|dollars)\b/i

export interface ClassifiedResponse {
  text: string
  cls: ResponseClass
  matched: string[]
}

export function classifyResponse(text: string): ClassifiedResponse {
  const intent = findTerms(text, INTENT_TERMS)
  if (MONEY.test(text)) intent.push('mentions a price')
  const friction = findTerms(text, FRICTION_TERMS)
  const polite = findTerms(text, POLITE_TERMS)
  // Negative feedback outweighs positive: it reveals real friction.
  if (friction.length) return { text, cls: 'friction', matched: friction }
  if (intent.length) return { text, cls: 'intent', matched: intent }
  if (polite.length) return { text, cls: 'polite', matched: polite }
  return { text, cls: 'unclear', matched: [] }
}

export interface ResponseSummary {
  items: ClassifiedResponse[]
  counts: Record<ResponseClass, number>
  insights: string[]
}

export function summarizeResponses(raw: string): ResponseSummary {
  const items = lines(raw).map(classifyResponse)
  const counts: Record<ResponseClass, number> = { intent: 0, friction: 0, polite: 0, unclear: 0 }
  for (const it of items) counts[it.cls]++
  const insights: string[] = []
  const n = items.length
  if (n) {
    insights.push(`${counts.intent} of ${n} replies show genuine intent (${Math.round(pct(counts.intent, n))}%).`)
    if (counts.polite > counts.intent)
      insights.push('Most replies are polite interest. Compliments are not data, so ask for a commitment: a call, a pre-order or an intro.')
    if (counts.friction)
      insights.push(
        `Weight the ${counts.friction} friction point${counts.friction > 1 ? 's' : ''} heavily. They are risks to test before building.`,
      )
    if (counts.intent >= 3) insights.push('Follow up with the high-intent people first. They are your first users.')
  }
  return { items, counts, insights }
}

export const SIGNAL_PRINCIPLES = [
  'Distinguish between polite interest and genuine intent to pay or use.',
  'Look for unsolicited follow-ups. Real demand pulls; it doesn’t need pushing.',
  'Track drop-off points in landing pages or surveys as data, not failure.',
  'Weight negative feedback more heavily than positive. It reveals real friction.',
  'Avoid over-indexing on one enthusiastic user. Look for patterns, not outliers.',
]

// ---------------------------------------------------------------------------
// Co-founder pushbacks for the Validation stage

export function validationChallenges(v: { signals: Signals; responses: string }, i: Ideation): Challenge[] {
  const out: Challenge[] = []
  if (!i.productName.trim() || !i.outcome.trim() || !i.approach.trim()) {
    out.push({
      id: 'oneliner-first',
      level: 'tip',
      title: 'Finish the one-liner first',
      body: 'The landing page and outreach kit are written from it. Complete it in Ideation for sharper copy.',
    })
  }
  const report = interpretSignals(v.signals)
  if (!report.hasData) {
    out.push({
      id: 'no-signal',
      level: 'block',
      title: 'No signal yet',
      body: 'Send the outreach kit to 20 people who match your user, publish the landing page, then log the numbers under Signals.',
    })
  }
  for (const w of report.warnings) out.push({ id: `warn-${w}`, level: 'warn', title: 'Check your numbers', body: w })
  for (const m of report.metrics.filter((m) => m.band === 'weak')) {
    out.push({ id: `weak-${m.key}`, level: 'warn', title: `${m.label} is weak (${m.display})`, body: m.benchmark })
  }
  const replies = summarizeResponses(v.responses)
  if (!replies.items.length) {
    out.push({
      id: 'no-replies',
      level: 'tip',
      title: 'Paste the replies you get',
      body: 'One per line. The co-founder separates polite interest from genuine intent.',
    })
  } else {
    if (replies.counts.polite > replies.counts.intent) {
      out.push({
        id: 'mostly-polite',
        level: 'warn',
        title: 'Mostly polite interest',
        body: 'Compliments are not data. Ask for a commitment: a call, a pre-order or an intro.',
      })
    }
    for (const r of replies.items.filter((r) => r.cls === 'friction').slice(0, 3)) {
      out.push({ id: `friction-${r.text}`, level: 'warn', title: 'Friction to test', body: `“${r.text}” Test this risk before building.` })
    }
  }
  return out
}
