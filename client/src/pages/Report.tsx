import { ArrowRight, BookOpen, Check, Database, ExternalLink, FlaskConical, Laptop, MessagesSquare, Server, ShieldCheck, TriangleAlert, Wand2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { SiteFooter, SiteHeader } from '../components/Site'
import { ButtonLink, Card, Eyebrow, GithubMark, buttonClass, cx } from '../components/ui'
import { BarChart, StatTile } from '../components/viz'
import { API_ENABLED, SITE } from '../config'
import { useServer } from '../lib/server'
import { STAGES } from '../lib/stages'
import { prettyModel } from '../lib/useAiDraft'

interface BuildFile {
  file: string
  name: string
  kind: 'entry' | 'lazy' | 'shared' | 'css'
  initial: boolean
  bytes: number
  gzip: number
}
interface BuildStats {
  builtAt: string
  files: BuildFile[]
}
interface TestResults {
  numPassedTests: number
  numFailedTests: number
  numTotalTests: number
  numPendingTests: number
  startTime: number
  testResults: { name: string; status: string; assertionResults: { status: string }[] }[]
}

function useJson<T>(path: string): T | null | 'missing' {
  const [data, setData] = useState<T | null | 'missing'>(null)
  useEffect(() => {
    let alive = true
    fetch(path, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: T) => alive && setData(d))
      .catch(() => alive && setData('missing'))
    return () => {
      alive = false
    }
  }, [path])
  return data
}

const kb = (b: number) => b / 1024
// Chunks warmed after load (lib/prefetch.ts and the workspace's stage loaders).
const PREFETCHED = new Set(['Dashboard', 'Workspace', 'Ideation', 'Validation', 'Scoping', 'Building'])

const SECTIONS = [
  ['overview', 'Overview'],
  ['stages', 'The four stages'],
  ['architecture', 'Architecture'],
  ['engine', 'How the co-founder decides'],
  ['performance', 'Measured performance'],
  ['testing', 'Testing'],
  ['swot', 'SWOT'],
  ['limits', 'Limitations'],
  ['future', 'Future scope'],
  ['changes', 'Changes from the deck'],
] as const

export default function Report() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <header className="mx-auto w-full max-w-6xl px-4 pb-6 pt-12 sm:px-6 sm:pt-16">
        <Eyebrow className="fade-up">Project report · {SITE.credits.event}</Eyebrow>
        <h1 className="fade-up mt-4 max-w-3xl text-balance text-[40px] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-6xl">
          AI Co-Founder: from <span className="font-serif font-normal italic tracking-normal text-gradient">idea</span> to{' '}
          <span className="font-serif font-normal italic tracking-normal text-gradient">MVP</span>
        </h1>
        <p className="fade-up mt-5 max-w-2xl text-[17px] leading-relaxed text-muted">
          A technical partner for the 0-to-1 journey. Google Gemini drafts every stage and answers questions, a transparent
          rule engine pushes back on anything vague, and the last stage writes real, runnable starter code.
        </p>
        <div className="fade-up mt-7 flex flex-wrap gap-3">
          <ButtonLink to="/app" size="lg">
            Open the live app <ArrowRight className="size-4" />
          </ButtonLink>
          <a href={SITE.repoUrl} target="_blank" rel="noreferrer" className={buttonClass('secondary', 'lg')}>
            <GithubMark /> Source code
          </a>
        </div>
        <LiveStatus />
        <p className="mt-5 text-sm text-muted">Built by {SITE.credits.builtBy.join(', ')}</p>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Report sections" className="hidden lg:block">
          <ol className="sticky top-24 space-y-0.5 text-sm">
            {SECTIONS.map(([id, label], i) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex w-full gap-2 rounded-lg px-2 py-1.5 text-left text-muted transition-colors hover:bg-subtle hover:text-strong"
                >
                  <span className="font-mono text-[11px] leading-5 text-accent/80">{String(i + 1).padStart(2, '0')}</span> {label}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main className="min-w-0 space-y-14">
          <Overview />
          <StagesSection />
          <ArchitectureSection />
          <EngineSection />
          <PerformanceSection />
          <TestingSection />
          <SwotSection />
          <LimitsSection />
          <FutureSection />
          <ChangesSection />
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}

/** What the deployed site is running right now, read from the API itself. */
function LiveStatus() {
  const status = useServer((s) => s.status)
  const checked = useServer((s) => s.checked)
  if (!API_ENABLED) return null
  const items: [string, boolean, string][] = status
    ? [
        ['API', true, 'online'],
        ['AI', status.ai.enabled, status.ai.enabled ? prettyModel(status.ai.model ?? 'gemini') : 'off'],
        ['Cloud sync', status.db.enabled, status.db.enabled ? 'MongoDB' : 'not connected'],
      ]
    : [['API', false, checked ? 'unreachable' : 'checking…']]
  return (
    <ul aria-label="Live status" className="fade-up mt-8 flex flex-wrap gap-2 text-xs">
      {items.map(([k, ok, v]) => (
        <li key={k} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1.5 backdrop-blur">
          <span className={cx('size-1.5 rounded-full', ok ? 'bg-good' : 'bg-muted')} aria-hidden="true" />
          <span className="font-semibold text-strong">{k}</span>
          <span className="text-muted">{v}</span>
        </li>
      ))}
    </ul>
  )
}

function Section({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <Eyebrow>Section {String(n).padStart(2, '0')}</Eyebrow>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-strong sm:text-[32px]">{title}</h2>
      <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-body">{children}</div>
    </section>
  )
}

function Overview() {
  return (
    <Section id="overview" n={1} title="Background and overview">
      <p>
        <strong>The problem.</strong> Single-purpose tools solve one problem at a time: just code, just design or just
        planning. First-time founders, students especially, don’t fail for lack of code; they fail by building something
        nobody asked for, or by never shipping because the scope keeps growing.
      </p>
      <p>
        <strong>The idea.</strong> An AI co-founder is not a tool you prompt but a persistent technical partner across the
        whole 0-to-1 journey. It asks the right question at each stage instead of waiting to be told what to do, from raw
        idea to shipped MVP.
      </p>
      <p>
        <strong>What was built.</strong> A working web app that takes an idea through the four stages: Ideation,
        Validation, Scoping and Building. The founder types the idea once; Google Gemini drafts the canvas for each stage
        and answers questions in a chat that knows the project, while a rule engine checks every answer. Every stage
        produces concrete outputs, ending with a generated, runnable MERN starter for the founder’s MVP. A demo project
        (CanteenQ, a campus canteen pre-ordering app) walks through all four.
      </p>
    </Section>
  )
}

const STAGE_DETAIL: Record<string, { asks: string; produces: string; logic: string }> = {
  ideation: {
    asks: 'Who exactly is the user? What is the pain, how often, how bad? How is it solved today? Does it need to exist?',
    produces: 'Guided interview, idea scorecard (clarity, pain, need), one-liner with lint checks',
    logic: 'lib/engine/ideation.ts',
  },
  validation: {
    asks: 'Would strangers sign up? Do they reply? Is it polite interest or genuine intent? Will anyone pay?',
    produces: 'Landing page (downloadable HTML), outreach kit, survey, signal report, reply classifier',
    logic: 'lib/engine/validation.ts',
  },
  scoping: {
    asks: 'Does this feature change whether someone pays? Is it in the one core flow? Can v1 ship in 3 weeks?',
    produces: 'Keep / later / cut board, timeline vs target, smallest shippable unit, MVP boundary',
    logic: 'lib/engine/scoping.ts',
  },
  building: {
    asks: 'What is the one core object and its fields? Which routes and pages are needed?',
    produces: 'Architecture map, generated MERN starter (19 files) as a .zip, 3-week build plan',
    logic: 'lib/engine/codegen.ts',
  },
}

function StagesSection() {
  return (
    <Section id="stages" n={2} title="The four stages">
      <p>
        Each stage asks the right questions, cuts unnecessary work and keeps momentum toward a real product in users’ hands.
        On every stage, <strong>Draft with AI</strong> asks Gemini to fill the empty fields, and the rule engine then checks
        the result like anything the founder typed.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-subtle/60 text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Stage</th>
              <th className="px-4 py-3 font-semibold">The co-founder asks</th>
              <th className="px-4 py-3 font-semibold">It produces</th>
              <th className="px-4 py-3 font-semibold">Logic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {STAGES.map((s) => (
              <tr key={s.key}>
                <td className="px-4 py-3 font-semibold text-strong">
                  {s.n}. {s.title}
                </td>
                <td className="px-4 py-3">{STAGE_DETAIL[s.key].asks}</td>
                <td className="px-4 py-3">{STAGE_DETAIL[s.key].produces}</td>
                <td className="px-4 py-3 font-mono text-xs text-accent">{STAGE_DETAIL[s.key].logic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

function ArchitectureSection() {
  const tiers = [
    {
      icon: Laptop,
      title: 'React single-page app',
      tag: 'Static files on Vercel’s CDN',
      items: ['React 19 + TypeScript, built with Vite 8', 'Tailwind CSS 4, React Router 8 (hash routes)', 'Zustand store, persisted to localStorage', 'Rule engine as pure functions, in the browser', 'Code-split: each stage is its own chunk'],
    },
    {
      icon: Server,
      title: 'Node.js + Express 5 API',
      tag: 'Vercel serverless function at /api',
      items: ['Google Gemini through the @google/genai SDK', '/api/ai/chat streams replies over SSE', '/api/ai/draft returns schema-checked JSON', 'Fallback model, per-IP limit, daily AI budget', 'REST: /api/auth, /api/projects (JWT, bcrypt)'],
    },
    {
      icon: Database,
      title: 'MongoDB',
      tag: 'Atlas free tier · optional',
      items: ['Mongoose schemas: User, Project, Usage', 'Stage data stored as flexible sub-documents', 'Index on { userId: 1, clientUpdatedAt: -1 }', 'Last-write-wins sync between devices'],
    },
  ]
  return (
    <Section id="architecture" n={3} title="System architecture">
      <p>
        The live site is one Vercel project. The React app is served as static files from the CDN, and the Express API
        runs as a serverless function on the same domain, so there is no second host and no CORS. The Gemini key lives
        only on the server; the browser never sees it. The rule engine still runs in the browser, so every stage keeps
        working if the AI is down or its daily budget is used up. Cloud sync switches on when the server is given a
        MongoDB connection string; until then projects stay in the browser.
      </p>
      <div className="flex flex-col gap-3 lg:flex-row">
        {tiers.map((t) => (
          <Card key={t.title} className="flex-1 p-5">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-subtle text-accent">
                <t.icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold leading-tight text-strong">{t.title}</p>
                <p className="text-xs text-muted">{t.tag}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {t.items.map((it) => (
                <li key={it} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-good" aria-hidden="true" /> {it}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <ol className="grid gap-2 text-sm sm:grid-cols-2">
        {[
          ['Ask', 'The chat panel posts the question plus this stage’s canvas to /api/ai/chat.'],
          ['Check', 'Express validates the turns and the project context, and takes one unit of the daily budget.'],
          ['Stream', 'Gemini streams tokens; the server re-sends them as Server-Sent Events as they arrive.'],
          ['Draft', '/api/ai/draft asks for JSON against a schema; the server clips it, the browser fills only empty fields.'],
        ].map(([k, v], i) => (
          <li key={k} className="flex gap-3 rounded-xl border border-line bg-surface/60 p-3">
            <span className="font-mono text-xs leading-5 text-accent">{String(i + 1).padStart(2, '0')}</span>
            <span>
              <strong className="text-strong">{k}.</strong> {v}
            </span>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function EngineSection() {
  const ai = [
    {
      icon: Wand2,
      title: 'Structured drafts',
      body: 'Each stage has a JSON schema. Gemini returns structured output, the server clips lengths and checks enums, and the browser fills only the fields that are still empty, with an Undo.',
    },
    {
      icon: MessagesSquare,
      title: 'Grounded chat',
      body: 'Every question is sent with the current stage’s canvas, so answers are about the founder’s own idea. The system prompt tells Gemini to push back, stay specific and never invent statistics.',
    },
  ]
  const rules = [
    {
      title: 'Vague-user detection',
      body: 'Flags audience words (“students”, “people”, “small businesses”…) when the description is 2 words, or up to 4 words with no qualifier such as “who”, “with” or “during”.',
    },
    {
      title: 'Idea scorecard',
      body: 'Clarity = words (max 8 × 6) + qualifier 20 + concrete marker 10 + context 20, capped at 30 if vague. Pain = frequency (daily 35 … rarely 4) + severity × 9 + evidence. Overall = 35% clarity + 35% pain + 30% need.',
    },
    {
      title: 'One-liner lint',
      body: '“[Product] helps [user] do [outcome] by [approach]” is checked for blanks, length (over 32 words), buzzwords (“revolutionary”, “seamless”, “AI-powered”…) and a vague user.',
    },
    {
      title: 'Signal report',
      body: 'Five metrics, each banded against a benchmark: sign-up rate (5% / 15%), reply rate (10% / 25%), calls (20% / 40%), Sean Ellis “very disappointed” (25% / 40%) and pre-orders. Commitment signals carry the most weight.',
    },
    {
      title: 'Reply classifier',
      body: 'Each reply is matched against phrase lists for genuine intent (“when can I”, “I’d pay”, a price), friction (“not sure”, “too expensive”) and polite interest (“sounds cool”). Friction wins ties: negative feedback outweighs positive.',
    },
    {
      title: 'The pay test',
      body: 'In the core flow → keep. Not in the flow but drives payment → later. Neither → cut. v1 hours = Σ effort (S 8 h, M 20 h, L 40 h) + 25% buffer, compared with team hours × target weeks.',
    },
    {
      title: 'Code generation',
      body: 'Field names are sanitised to valid identifiers (reserved names dropped), then templates emit a Mongoose model, an allow-listed CRUD router, JWT auth and React pages. The output is verified end to end against MongoDB.',
    },
  ]
  return (
    <Section id="engine" n={4} title="How the co-founder decides">
      <p>
        The co-founder has two halves. <strong>Gemini writes</strong>: it drafts the canvases and answers questions.{' '}
        <strong>Rules judge</strong>: every score, warning and benchmark is a rule that runs in the browser, so each
        judgement can be traced, tested and explained, and none of them is made up.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {ai.map((r) => (
          <Card key={r.title} className="relative overflow-hidden p-4">
            <div className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-ai opacity-15 blur-2xl" aria-hidden="true" />
            <p className="relative flex items-center gap-2 font-semibold text-strong">
              <r.icon className="size-4 text-accent" aria-hidden="true" /> {r.title}
            </p>
            <p className="relative mt-1 text-sm text-body">{r.body}</p>
          </Card>
        ))}
      </div>
      <p className="pt-2 font-semibold text-strong">The rules</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {rules.map((r) => (
          <Card key={r.title} className="p-4">
            <p className="font-semibold text-strong">{r.title}</p>
            <p className="mt-1 text-sm text-body">{r.body}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

function PerformanceSection() {
  const stats = useJson<BuildStats>('./build-stats.json')
  if (stats === null) return <Section id="performance" n={5} title="Measured performance"><p className="text-muted">Loading build statistics…</p></Section>
  if (stats === 'missing') {
    return (
      <Section id="performance" n={5} title="Measured performance">
        <p className="text-muted">Build statistics are generated by the production build (npm run build) and aren’t available in development mode.</p>
      </Section>
    )
  }
  const initial = stats.files.filter((f) => f.initial)
  const initialGzip = initial.reduce((s, f) => s + f.gzip, 0)
  const totalGzip = stats.files.reduce((s, f) => s + f.gzip, 0)
  const lazy = stats.files.filter((f) => f.kind === 'lazy')
  const largestLazy = [...lazy].sort((a, b) => b.gzip - a.gzip)[0]
  const label = (f: BuildFile) => (f.kind === 'entry' ? 'App shell (entry)' : f.name === 'jszip.min' ? 'jszip (zip export)' : f.name)
  const when = (f: BuildFile) =>
    f.initial
      ? 'Needed for the first paint'
      : f.name === 'jszip.min'
        ? 'Loaded only when you download a .zip'
        : PREFETCHED.has(f.name)
          ? 'Prefetched right after the page loads'
          : f.kind === 'lazy'
            ? 'Loaded when you open it'
            : 'Shared, loaded with the pages that use it'
  const note = (f: BuildFile) => `${when(f)} · ${kb(f.bytes).toFixed(1)} KB before compression`
  return (
    <Section id="performance" n={5} title="Measured performance">
      <p>
        These numbers are measured from the production build that is currently deployed (built{' '}
        {new Date(stats.builtAt).toLocaleString()}), not estimated. The build writes every chunk’s size to{' '}
        <code className="font-mono text-sm">build-stats.json</code>, and this page reads it.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Needed for first paint (gzip)" value={`${kb(initialGzip).toFixed(1)} KB`} sub={`${initial.length} files: app shell, shared UI and CSS`} />
        <StatTile label="Whole app (gzip)" value={`${kb(totalGzip).toFixed(1)} KB`} sub={`${stats.files.length} JS and CSS files`} />
        <StatTile
          label="Largest on-demand chunk"
          value={largestLazy ? `${kb(largestLazy.gzip).toFixed(1)} KB` : '—'}
          sub={largestLazy ? `${label(largestLazy)} · ${when(largestLazy).toLowerCase()}` : undefined}
        />
      </div>
      <Card className="p-5">
        <BarChart
          title="Size of each chunk after gzip"
          unit="KB"
          data={stats.files.slice(0, 12).map((f) => ({ label: label(f), value: kb(f.gzip), note: note(f) }))}
        />
      </Card>
      <p className="text-sm text-muted">
        Code splitting is real: the first paint needs only the app shell, shared UI and CSS, well under the 200 KB gzip
        budget from the original plan. The dashboard, the workspace and each stage (Ideation, Validation, Scoping,
        Building) are separate chunks, prefetched right after the page loads so switching stages never waits on the
        network. The zip library loads only when you download the generated code.
      </p>
    </Section>
  )
}

function TestingSection() {
  const results = useJson<TestResults>('./test-results.json')
  const files =
    results && results !== 'missing'
      ? results.testResults.map((t) => ({
          name: t.name.split(/[\\/]/).pop()!,
          passed: t.assertionResults.filter((a) => a.status === 'passed').length,
        }))
      : []
  return (
    <Section id="testing" n={6} title="Testing and verification">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Unit tests passing"
          value={results && results !== 'missing' ? `${results.numPassedTests} / ${results.numPassedTests + results.numFailedTests}` : '—'}
          sub={results && results !== 'missing' ? `Run in CI before this deploy · ${new Date(results.startTime).toLocaleDateString()}` : 'Published by the CI build'}
        />
        <StatTile label="Generated API checks" value="24 / 24" sub="Starter run against MongoDB, re-checked by CI" />
        <StatTile label="Deploys gated on tests" value="Every build" sub="Vercel runs the tests before it builds" />
      </div>
      {files.length ? (
        <Card className="p-5">
          <p className="text-sm font-semibold text-strong">Unit tests by engine module (Vitest)</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {files.map((f) => (
              <li key={f.name} className="flex items-center justify-between rounded-xl border border-line bg-field px-3 py-2 text-sm">
                <span className="font-mono text-xs">{f.name}</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-strong">
                  <Check className="size-4 text-good" aria-hidden="true" /> {f.passed} passed
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <p>
        <strong>The API has its own suite</strong> (Vitest, Supertest and an in-memory MongoDB): registration and login,
        rejected tokens, project CRUD restricted to the owner, sync conflicts, input validation, the streamed chat format,
        AI drafts, error handling, the fallback model, the daily AI cap, and the exact request the real Gemini SDK sends.
      </p>
      <p>
        <strong>Generated code is executed, not just generated.</strong> The CanteenQ starter was emitted, installed and
        run against an in-memory MongoDB: registration, login, wrong password, missing token, CRUD, validation errors,
        invalid IDs and isolation between two users all behave correctly (24 of 24 checks). Its React client builds with
        Vite.
      </p>
    </Section>
  )
}

function Swot({ title, q }: { title: string; q: Record<'S' | 'W' | 'O' | 'T', string> }) {
  const meta = [
    ['S', 'Strengths', 'internal · helpful'],
    ['W', 'Weaknesses', 'internal · harmful'],
    ['O', 'Opportunities', 'external · helpful'],
    ['T', 'Threats', 'external · harmful'],
  ] as const
  return (
    <Card className="p-5">
      <p className="font-semibold text-strong">{title}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {meta.map(([k, label, sub]) => (
          <div key={k} className="rounded-xl border border-line bg-field p-4">
            <p className="flex items-baseline gap-2">
              <span className="font-serif text-3xl italic leading-none text-gradient">{k}</span>
              <span className="font-semibold text-strong">{label}</span>
              <span className="text-xs text-muted">{sub}</span>
            </p>
            <p className="mt-1.5 text-sm text-body">{q[k]}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function SwotSection() {
  return (
    <Section id="swot" n={7} title="SWOT analysis">
      <p>
        The deck’s two technology SWOTs, with Opportunities and Threats put back in the right quadrants (they were swapped
        on both slides), plus a SWOT for the product itself.
      </p>
      <Swot
        title="Product: AI Co-Founder"
        q={{
          S: 'Covers the whole 0-to-1 journey, not one step. AI drafts plus explainable rule checks, no sign-up, and real artefacts: landing page, survey and runnable code.',
          W: 'AI drafts can be confidently wrong and need the founder’s judgement. The rule checks are keyword-driven and English-only. Without MongoDB, projects live in one browser.',
          O: 'Letting Gemini read real survey answers and replies; college incubators and E-cells running idea-validation programmes; hackathon teams.',
          T: 'General-purpose AI assistants and app builders adding similar guided flows; founders preferring tools that just write code over tools that question the idea.',
        }}
      />
      <Swot
        title="Frontend: React"
        q={{
          S: 'Component-based architecture enables reuse and rapid iteration. A rich ecosystem, fast rendering and hooks for state make dynamic MVP interfaces quick to build.',
          W: 'Steep learning curve for modern tooling. Bundle bloat, over-engineering early and complex shared state can slow MVP velocity and add technical debt.',
          O: 'Low-code UI builders and AI-assisted component generation speed up prototyping. Progressive web apps and mobile-first design reach users without native development.',
          T: 'Rapid framework churn risks obsolescence. Browser compatibility, accessibility gaps and vulnerabilities in third-party dependencies can undermine trust at launch.',
        }}
      />
      <Swot
        title="Backend: MongoDB"
        q={{
          S: 'Flexible document storage suits rapid MVP iteration. JSON-like BSON matches JavaScript and Node.js, and built-in sharding allows horizontal scaling.',
          W: 'Weak schema enforcement can lead to inconsistent data. Multi-document transactions add overhead, and joins make relational modelling clumsier than SQL.',
          O: 'Growing demand for real-time apps and unstructured data. Atlas offers managed and serverless deployment, cutting DevOps work and time to market.',
          T: 'Competing services (Firebase, DynamoDB) offer tighter cloud integration. Misusing a flexible schema creates data that is hard to maintain as the product grows.',
        }}
      />
    </Section>
  )
}

function LimitsSection() {
  const items = [
    'Gemini’s drafts are starting points, not research: they are plausible hypotheses that the rule checks and the founder’s own interviews still have to confirm.',
    'The AI runs on a free-tier key with a daily request budget. If the budget runs out, AI features pause until the next day; the rule engine keeps working.',
    'Benchmarks (5–15% sign-up rate, 25% reply rate) are rules of thumb for early-stage tests, not universal truths. The Sean Ellis 40% threshold is the only widely cited one.',
    'Text classification is keyword-based and English-only, so sarcasm or mixed replies can be misread.',
    'Projects are stored in the browser (export and import as JSON moves them). Cloud sync needs a MongoDB connection string on the server; the code and tests for it are in place.',
  ]
  return (
    <Section id="limits" n={8} title="Limitations (stated honestly)">
      <ul className="space-y-2">
        {items.map((t) => (
          <li key={t} className="flex gap-2.5">
            <TriangleAlert className="mt-1 size-4 shrink-0 text-warn" aria-hidden="true" /> <span>{t}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function FutureSection() {
  const items: [typeof Database, string, string][] = [
    [MessagesSquare, 'AI that reads real evidence', 'Send survey answers and outreach replies to Gemini to summarise objections, while the rule engine keeps scoring the numbers.'],
    [Database, 'Cloud projects and teams', 'MongoDB Atlas + JWT accounts so co-founders can work on the same idea from any device.'],
    [FlaskConical, 'Live validation data', 'Collect landing-page sign-ups and survey answers directly instead of typing the numbers in.'],
    [ShieldCheck, 'One-click GitHub repo', 'Push the generated starter straight to a new GitHub repository with CI already set up.'],
    [BookOpen, 'Hindi and regional languages', 'Localised interview questions and classifier phrase lists.'],
  ]
  return (
    <Section id="future" n={9} title="Future scope">
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(([Icon, t, b]) => (
          <Card key={t} className="flex gap-3 p-4">
            <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <p className="font-semibold text-strong">{t}</p>
              <p className="mt-0.5 text-sm text-body">{b}</p>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  )
}

function ChangesSection() {
  const rows = [
    ['SWOT slides (both)', 'Opportunities and Threats were in each other’s quadrants', 'Moved back; the content is unchanged'],
    ['Frontend / Backend Performance', 'Donut charts showed Canva placeholders (“Item 1 47.6%”…)', 'Replaced by the measured chunk sizes above'],
    ['Performance claims', '“40% faster TTI”, “4.7 interactions per visit”, “500+ req/s” were never measured', 'Only measured numbers are reported'],
    ['Frontend Stack', '“React & Vue”, “Redux or Vuex”', 'One stack: React with Zustand (smaller, built-in persistence)'],
    ['Architecture', '“REST or GraphQL”', 'REST, which is simpler for an MVP and matches the generated code'],
    ['Stage headings', '“Stage 1”, “Validation Stage”, “Stage 3”, “Building the MVP”', 'Consistent: Stage 1–4'],
    ['Real-time UI', '“Collaborative panels update via WebSocket”', 'Not built; the app is single-user, so it isn’t claimed'],
  ]
  return (
    <Section id="changes" n={10} title="What changed from the original deck">
      <p>To keep the presentation and the product consistent, these corrections were made while building:</p>
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-subtle/60 text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Where</th>
              <th className="px-4 py-3 font-semibold">Before</th>
              <th className="px-4 py-3 font-semibold">Now</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {rows.map(([w, b, n]) => (
              <tr key={w}>
                <td className="px-4 py-3 font-semibold text-strong">{w}</td>
                <td className="px-4 py-3 text-muted">{b}</td>
                <td className={cx('px-4 py-3')}>{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">
        References: Sean Ellis, product–market fit survey (“very disappointed” 40% benchmark); Rob Fitzpatrick, <em>The Mom
        Test</em> (customer interview rules); MongoDB and React documentation.{' '}
        <a className="inline-flex items-center gap-1 font-semibold text-link underline" href={SITE.repoUrl} target="_blank" rel="noreferrer">
          Repository <ExternalLink className="size-3.5" />
        </a>
      </p>
    </Section>
  )
}
