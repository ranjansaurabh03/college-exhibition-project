import {
  ArrowRight,
  Code2,
  Compass,
  FileCode2,
  FlaskConical,
  Gauge,
  Hammer,
  LayoutTemplate,
  Lightbulb,
  ListChecks,
  Mail,
  MessageSquare,
  Quote,
  Scissors,
  Signal,
  Target,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { SiteFooter, SiteHeader } from '../components/Site'
import { Button, ButtonLink, Card, Eyebrow } from '../components/ui'
import { SITE } from '../config'
import { useProjects } from '../lib/store'

const STAGES = [
  {
    n: 1,
    icon: Lightbulb,
    title: 'Ideation',
    lead: 'From a vague feeling to a sharp, testable one-liner.',
    asks: ['Who exactly is the user?', 'What is the pain, and how often does it hit?', 'Does this need to exist?'],
    gives: 'Idea scorecard · vagueness flags · one-liner',
  },
  {
    n: 2,
    icon: FlaskConical,
    title: 'Validation',
    lead: 'Get honest signal from strangers before writing code.',
    asks: ['Would someone sign up for this today?', 'Is that polite interest or real intent?', 'What would make them pay?'],
    gives: 'Landing page · outreach kit · survey · signal report',
  },
  {
    n: 3,
    icon: Scissors,
    title: 'Scoping',
    lead: 'Cut ruthlessly to the smallest shippable unit.',
    asks: ['Does this feature change whether someone pays?', 'What is the one core flow?', 'Can it ship in 3 weeks?'],
    gives: 'Keep / later / cut board · timeline · MVP boundary',
  },
  {
    n: 4,
    icon: Hammer,
    title: 'Building',
    lead: 'Real code, not just advice.',
    asks: ['What does the data model look like?', 'Which routes and pages are needed?', 'What ships in week one?'],
    gives: 'Architecture map · generated MERN starter (.zip)',
  },
]

const OUTPUTS = [
  { icon: Target, title: 'Sharp one-liner', body: '“[Product] helps [user] do [outcome] by [approach]” with lint checks for vague words and buzzwords.' },
  { icon: Gauge, title: 'Idea scorecard', body: 'Clarity, pain and differentiation scores with the specific questions still holding the idea back.' },
  { icon: LayoutTemplate, title: 'Landing page', body: 'A live preview built from your answers. Download it as a single HTML file and start collecting sign-ups.' },
  { icon: Mail, title: 'Outreach kit', body: 'Cold email, DM and community post written from the user’s pain, following Mom Test rules.' },
  { icon: ListChecks, title: 'User survey', body: 'Questions about past behaviour (not hypotheticals) plus the 40% “very disappointed” test.' },
  { icon: Signal, title: 'Signal report', body: 'Paste replies and numbers; the co-founder separates polite interest from genuine intent.' },
  { icon: Compass, title: 'MVP boundary', body: 'One user type, one core flow, one outcome, with a timeline checked against a 3-week target.' },
  { icon: FileCode2, title: 'MERN starter code', body: 'Mongoose model, Express REST routes, JWT auth and React pages generated for your MVP.' },
]

const STACK = ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'Zustand', 'Node.js + Express', 'MongoDB + Mongoose', 'Claude API']

export default function Landing() {
  const navigate = useNavigate()
  const loadDemo = useProjects((s) => s.loadDemo)

  function openDemo() {
    const id = loadDemo()
    navigate(`/app/p/${id}/ideation`)
  }

  return (
    <div className="min-h-screen">
      <section className="hero-gradient relative overflow-hidden text-cream">
        <CircuitDecor />
        <SiteHeader tone="light" />
        <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-28 lg:pt-16">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-mint">
              {SITE.subtitle}
            </p>
            <h1 className="font-display text-4xl font-extrabold uppercase leading-[1.02] tracking-tight sm:text-6xl">
              AI Co-Founder:
              <br />
              From Idea to MVP
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/80">
              Not a single-purpose tool you prompt. A technical partner that asks the right question at every stage, from a
              raw idea to a scoped MVP with generated starter code.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="light" size="lg" onClick={openDemo}>
                Try the demo project <ArrowRight className="size-4" />
              </Button>
              <ButtonLink to="/app" size="lg" variant="glass">
                Start your own idea
              </ButtonLink>
            </div>
            <p className="mt-5 text-sm text-cream/60">No sign-up. Your projects stay in this browser.</p>
          </div>
          <ConversationPreview />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Eyebrow>Why founders need an AI co-founder</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold text-espresso sm:text-4xl">Single-purpose tools solve one problem at a time.</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Founders get a code generator, a design tool and a planning template, and still nobody asks whether the
              idea is worth building. A co-founder stays with you across the whole 0-to-1 journey and pushes back
              before you waste weeks.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Just code', note: 'Writes features you may not need' },
              { label: 'Just design', note: 'Polishes screens nobody validated' },
              { label: 'Just planning', note: 'Plans without questioning the idea' },
            ].map((t) => (
              <Card key={t.label} className="p-5">
                <p className="font-display text-lg font-bold text-espresso">{t.label}</p>
                <p className="mt-1 text-sm text-muted">{t.note}</p>
              </Card>
            ))}
            <Card className="border-cocoa bg-cocoa p-5 text-cream sm:col-span-3">
              <p className="font-display text-lg font-bold">A co-founder</p>
              <p className="mt-1 text-sm text-cream/80">
                Asks who the user is, demands evidence of demand, cuts scope and then writes the code for what is left.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Eyebrow>The four stages</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold text-espresso sm:text-4xl">
            Each stage asks the right questions and cuts unnecessary work.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((s) => (
              <Card key={s.n} className="flex flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-sand text-cocoa">
                    <s.icon className="size-5" />
                  </span>
                  <span className="font-display text-4xl font-extrabold text-sand">0{s.n}</span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-espresso">
                  Stage {s.n}: {s.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted">{s.lead}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {s.asks.map((q) => (
                    <li key={q} className="flex gap-2">
                      <MessageSquare className="mt-0.5 size-4 shrink-0 text-tan" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-auto pt-5 text-xs font-semibold uppercase tracking-wider text-clay">{s.gives}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Eyebrow>What you walk away with</Eyebrow>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold text-espresso sm:text-4xl">Concrete outputs at every stage.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OUTPUTS.map((o) => (
            <div key={o.title} className="rounded-2xl border border-line bg-paper p-5">
              <o.icon className="size-5 text-teal" />
              <p className="mt-3 font-display font-bold text-espresso">{o.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{o.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-sand/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Eyebrow>Built with the stack it recommends</Eyebrow>
            <p className="mt-2 max-w-md text-sm text-muted">
              The app itself is the MERN architecture it teaches: a code-split React front end with an optional Node,
              Express and MongoDB API.
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {STACK.map((t) => (
              <li key={t} className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-semibold text-espresso">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="hero-gradient relative overflow-hidden rounded-3xl px-6 py-14 text-center text-cream sm:px-12">
          <CircuitDecor />
          <div className="relative z-10">
            <h2 className="font-display text-3xl font-extrabold sm:text-5xl">
              Start your journey.
              <br />
              Build your MVP today.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="light" size="lg" onClick={openDemo}>
                Walk through the demo <ArrowRight className="size-4" />
              </Button>
              <ButtonLink to="/report" size="lg" variant="glass">
                <Code2 className="size-4" /> Read the project report
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

function ConversationPreview() {
  return (
    <div className="relative">
      <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-md sm:p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-cream/50">From vague to sharp</p>
        <div className="space-y-3 text-sm leading-relaxed">
          <Bubble who="you">I want to build something for students.</Bubble>
          <Bubble who="cofounder">
            “Students” is an audience, not a user. Which students feel this pain most often, and when does it hit?
          </Bubble>
          <Bubble who="you">Hostel students who miss lunch between back-to-back labs.</Bubble>
          <Bubble who="cofounder">
            Now we’re talking. How are they solving it today, and why is that painful enough to switch?
          </Bubble>
        </div>
        <div className="mt-5 rounded-2xl bg-cream p-4 text-ink">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-clay">
            <Quote className="size-3.5" /> One-liner
          </p>
          <p className="mt-1.5 font-display text-[15px] font-semibold leading-snug text-espresso">
            CanteenQ helps first-year hostel students with back-to-back lab sessions grab lunch in the 20-minute break by
            letting them pre-order and skip the queue.
          </p>
        </div>
      </div>
    </div>
  )
}

function Bubble({ who, children }: { who: 'you' | 'cofounder'; children: ReactNode }) {
  const mine = who === 'you'
  return (
    <div className={mine ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          mine
            ? 'max-w-[85%] rounded-2xl rounded-br-md bg-tan px-4 py-2.5 text-espresso'
            : 'max-w-[85%] rounded-2xl rounded-bl-md bg-white/12 px-4 py-2.5 text-cream'
        }
      >
        {!mine && <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wider text-mint">Co-founder</span>}
        {children}
      </div>
    </div>
  )
}

function CircuitDecor() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute -right-20 bottom-0 h-[420px] w-[620px] opacity-30"
      viewBox="0 0 620 420"
      fill="none"
      stroke="#7fd1c7"
      strokeWidth="1.5"
    >
      <path d="M620 60 H470 L430 100 V260 L380 310 H250" />
      <path d="M620 120 H500 L470 150 V330 L430 370 H300" />
      <path d="M620 200 H540 L510 230 V420" />
      <path d="M560 420 V300 L600 260 H620" />
      <path d="M400 420 V360 L440 320 V180 L470 150" />
      <path d="M330 420 V380 L360 350 H420" />
      <circle cx="250" cy="310" r="5" />
      <circle cx="300" cy="370" r="5" />
      <circle cx="420" cy="350" r="4" />
      <circle cx="470" cy="60" r="4" />
      <circle cx="540" cy="200" r="4" />
    </svg>
  )
}
