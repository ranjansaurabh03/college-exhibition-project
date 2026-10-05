import { ArrowRight, Check, Download, FlaskConical, Hammer, Lightbulb, Scissors, Sparkles, Wand2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { IdeaComposer } from '../components/IdeaComposer'
import { SiteFooter, SiteHeader } from '../components/Site'
import { Button, ButtonLink, Eyebrow, SpotlightCard, cx } from '../components/ui'
import { useServer } from '../lib/server'
import { useProjects } from '../lib/store'

export default function Landing() {
  const navigate = useNavigate()
  const loadDemo = useProjects((s) => s.loadDemo)
  const status = useServer((s) => s.status)
  const openDemo = () => navigate(`/app/p/${loadDemo()}/ideation`)

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
          <p className="fade-up inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-xs font-medium text-body backdrop-blur">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-good opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-good" />
            </span>
            {status?.ai.enabled ? 'Live with Google Gemini · No sign-up' : 'Runs in your browser · No sign-up'}
          </p>
          <h1 className="fade-up mt-6 text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-7xl">
            Your AI <span className="whitespace-nowrap">co-founder,</span>
            <br />
            from <span className="font-serif font-normal italic tracking-normal text-gradient">idea</span> to{' '}
            <span className="font-serif font-normal italic tracking-normal text-gradient">MVP</span>.
          </h1>
          <p className="fade-up mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-muted">
            Type your idea once. It drafts the canvas, pushes back on anything vague, helps you test real demand, cuts
            the scope to three weeks and then writes the starter code.
          </p>
          <IdeaComposer className="fade-up mx-auto mt-10 max-w-2xl" />
          <button type="button" onClick={openDemo} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-strong">
            or explore a finished example <ArrowRight className="size-3.5" />
          </button>
        </section>

        {/* Product preview */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6" aria-label="Product preview">
          <AppPreview />
        </section>

        {/* Bento */}
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>One co-founder · four stages</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              It asks the right question <span className="font-serif font-normal italic text-gradient">at every step</span>.
            </h2>
            <p className="mt-4 text-muted">Single-purpose tools solve one problem at a time. This one stays with you from a vague feeling to shipped code.</p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-6">
            <Bento className="md:col-span-4" n={1} icon={Lightbulb} title="Ideation" text="From a vague feeling to a sharp one-liner. It flags audiences that aren’t users and scores the pain.">
              <div className="mt-5 space-y-2 text-[13px]">
                <Bubble mine>I want to build something for students.</Bubble>
                <Bubble>“Students” is an audience, not a user. Which students feel this pain most often?</Bubble>
                <Bubble mine>First-year hostel students with back-to-back labs.</Bubble>
              </div>
            </Bento>
            <Bento className="md:col-span-2" n={2} icon={FlaskConical} title="Validation" text="Landing page, outreach and survey. Then it separates polite interest from real intent.">
              <div className="mt-5 space-y-2.5">
                {[
                  ['Sign-ups', 85, 'Strong'],
                  ['Replies', 45, 'Promising'],
                  ['Pre-orders', 90, 'Strong'],
                ].map(([label, v, band]) => (
                  <div key={label as string}>
                    <div className="mb-1 flex justify-between text-[11px] text-muted">
                      <span>{label}</span>
                      <span>{band}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-subtle">
                      <div className="h-full rounded-full bg-ai" style={{ width: `${v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Bento>
            <Bento className="md:col-span-2" n={3} icon={Scissors} title="Scoping" text="“Does this change whether someone pays?” Everything else waits for v2.">
              <ul className="mt-5 space-y-1.5 text-[13px]">
                {[
                  ['Pre-order with UPI', true],
                  ['Pickup token', true],
                  ['Dark mode', false],
                  ['AI meal recommendations', false],
                ].map(([f, keep]) => (
                  <li key={f as string} className="flex items-center gap-2">
                    <span className={cx('grid size-4 place-items-center rounded-full', keep ? 'bg-good/20 text-good' : 'bg-bad/15 text-bad')}>
                      {keep ? <Check className="size-3" /> : <span className="h-px w-2 bg-current" />}
                    </span>
                    <span className={keep ? 'text-strong' : 'text-muted line-through decoration-muted/60'}>{f}</span>
                  </li>
                ))}
              </ul>
            </Bento>
            <Bento className="md:col-span-4" n={4} icon={Hammer} title="Building" text="Real code, not advice: a Mongoose model, Express routes, JWT auth and React pages for your MVP, ready to download.">
              <pre className="mt-5 overflow-hidden rounded-xl border border-line bg-field p-4 font-mono text-[12px] leading-relaxed text-body [font-variant-ligatures:none]">
                <span className="text-accent">const</span> orderSchema = <span className="text-accent">new</span> mongoose.Schema({'{'}
                {'\n'}  items: {'{'} type: String, required: <span className="text-link">true</span> {'}'},
                {'\n'}  pickupTime: {'{'} type: Date, required: <span className="text-link">true</span> {'}'},
                {'\n'}{'}'})
              </pre>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Download className="size-3.5" /> 19 files · runs against MongoDB · checked in CI
              </p>
            </Bento>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-line bg-surface/40">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
            {[
              { icon: Sparkles, title: 'Describe it once', text: 'One sentence is enough. No forms, no sign-up.' },
              { icon: Wand2, title: 'Get challenged', text: 'AI drafts every stage; the co-founder pushes back where it’s weak.' },
              { icon: Download, title: 'Leave with a plan and code', text: 'A tested one-liner, a 3-week scope and a runnable MERN starter.' },
            ].map((s, i) => (
              <div key={s.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface font-mono text-sm text-accent">0{i + 1}</span>
                <div>
                  <p className="flex items-center gap-2 font-semibold text-strong">
                    <s.icon className="size-4 text-accent" aria-hidden="true" /> {s.title}
                  </p>
                  <p className="mt-1 text-sm text-muted">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Start your journey.
            <br />
            <span className="font-serif font-normal italic text-gradient">Build your MVP today.</span>
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Start with your idea <ArrowRight className="size-4" />
            </Button>
            <ButtonLink to="/report" size="lg" variant="secondary">
              Read the project report
            </ButtonLink>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function Bento({
  n,
  icon: Icon,
  title,
  text,
  className,
  children,
}: {
  n: number
  icon: typeof Lightbulb
  title: string
  text: string
  className?: string
  children: ReactNode
}) {
  return (
    <SpotlightCard className={cx('overflow-hidden p-6', className)}>
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl border border-line bg-subtle text-accent">
          <Icon className="size-5" />
        </span>
        <span className="font-mono text-xs text-muted">Stage 0{n}</span>
      </div>
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">{text}</p>
      {children}
    </SpotlightCard>
  )
}

function Bubble({ mine, children }: { mine?: boolean; children: ReactNode }) {
  return (
    <div className={cx('flex', mine ? 'justify-end' : 'justify-start')}>
      <p
        className={cx(
          'max-w-[85%] rounded-2xl px-3.5 py-2',
          mine ? 'rounded-br-md bg-primary text-on-primary' : 'rounded-bl-md border border-line bg-subtle text-body',
        )}
      >
        {children}
      </p>
    </div>
  )
}

/** A stylised, static preview of the workspace (pure HTML, so it stays crisp in both themes). */
function AppPreview() {
  return (
    <div className="relative">
      <div className="absolute inset-x-10 -top-6 h-40 rounded-full bg-ai opacity-20 blur-3xl" aria-hidden="true" />
      <div className="card relative overflow-hidden rounded-3xl">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="size-2.5 rounded-full bg-bad/70" />
          <span className="size-2.5 rounded-full bg-warn/70" />
          <span className="size-2.5 rounded-full bg-good/70" />
          <span className="ml-3 rounded-md bg-subtle px-2 py-0.5 font-mono text-[11px] text-muted">ai-cofounder.app / CanteenQ / ideation</span>
        </div>
        <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {['Ideation', 'Validation', 'Scoping', 'Building'].map((s, i) => (
                <span key={s} className={cx('rounded-full px-3 py-1 text-xs font-semibold', i === 0 ? 'bg-primary text-on-primary' : 'border border-line text-muted')}>
                  {i + 1} · {s}
                </span>
              ))}
            </div>
            <div className="rounded-2xl border border-line bg-field p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Idea scorecard</p>
              <div className="mt-2 flex items-end gap-3">
                <p className="text-4xl font-semibold text-strong">92</p>
                <p className="mb-1 text-sm text-good">Sharp enough to validate</p>
              </div>
              <div className="mt-3 space-y-2">
                {[92, 91, 92].map((v, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-good/15">
                    <div className="h-full rounded-full bg-good" style={{ width: `${v}%` }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-field p-4 text-sm text-strong">
              CanteenQ helps first-year hostel students with back-to-back lab sessions grab lunch in the 20-minute break by
              letting them pre-order and skip the queue.
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-subtle/60 p-4 text-[13px]">
            <p className="flex items-center gap-2 text-xs font-semibold text-muted">
              <Sparkles className="size-3.5 text-accent" /> Ask AI
            </p>
            <div className="mt-3 space-y-2">
              <Bubble mine>What’s my riskiest assumption?</Bubble>
              <Bubble>Whether canteen staff will honour pickup tokens at rush hour. Test it with one stall for a week.</Bubble>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
