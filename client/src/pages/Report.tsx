import { ArrowRight, BookOpen, Check, Cpu, Database, ExternalLink, FlaskConical, Laptop, Server, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { SiteFooter, SiteHeader } from '../components/Site'
import { ButtonLink, Card, Eyebrow, GithubMark, cx } from '../components/ui'
import { BarChart, StatTile } from '../components/viz'
import { SITE } from '../config'
import { STAGES } from '../lib/stages'

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
      <header className="hero-gradient text-cream">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint">Project report · {SITE.credits.event}</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            AI Co-Founder: from idea to MVP
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-cream/80">
            A technical partner for the 0-to-1 journey that asks the right questions at each stage, cuts unnecessary work and
            generates real starter code.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink to="/app" variant="light">
              Open the live app <ArrowRight className="size-4" />
            </ButtonLink>
            <a
              href={SITE.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold hover:bg-white/20"
            >
              <GithubMark /> Source code
            </a>
          </div>
          <p className="mt-6 text-sm text-cream/60">Built by {SITE.credits.builtBy.join(', ')}</p>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Report sections" className="hidden lg:block">
          <ol className="sticky top-6 space-y-1 text-sm">
            {SECTIONS.map(([id, label], i) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="w-full rounded-lg px-2 py-1 text-left text-muted hover:bg-sand/60 hover:text-ink"
                >
                  {i + 1}. {label}
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

function Section({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <Eyebrow>Section {n}</Eyebrow>
      <h2 className="mt-1 text-2xl font-bold text-espresso sm:text-3xl">{title}</h2>
      <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink/90">{children}</div>
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
        Validation, Scoping and Building. Every stage produces concrete outputs, ending with a generated, runnable MERN
        starter for the founder’s MVP. A demo project (CanteenQ, a campus canteen pre-ordering app) walks through all four.
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
      <p>Each stage asks the right questions, cuts unnecessary work and keeps momentum toward a real product in users’ hands.</p>
      <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-cream/70 text-xs text-muted">
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
                <td className="px-4 py-3 font-semibold text-espresso">
                  {s.n}. {s.title}
                </td>
                <td className="px-4 py-3">{STAGE_DETAIL[s.key].asks}</td>
                <td className="px-4 py-3">{STAGE_DETAIL[s.key].produces}</td>
                <td className="px-4 py-3 font-mono text-xs text-clay">{STAGE_DETAIL[s.key].logic}</td>
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
      tag: 'Live on GitHub Pages',
      items: ['React 19 + TypeScript, built with Vite 8', 'Tailwind CSS 4, React Router 8 (hash routes)', 'Zustand store, persisted to localStorage', 'Rule-based co-founder engine (pure functions)', 'Code-split: each stage is its own chunk'],
    },
    {
      icon: Server,
      title: 'Node.js + Express 5 API',
      tag: 'In /server · runs locally',
      items: ['REST: /api/auth, /api/projects', 'JWT auth, bcrypt password hashing', 'Claude API chat endpoint (streams over SSE)', 'Rate limiting on the AI route'],
    },
    {
      icon: Database,
      title: 'MongoDB',
      tag: 'Atlas free tier when hosted',
      items: ['Mongoose schemas: User, Project', 'Stage data stored as flexible sub-documents', 'Index on { userId: 1, updatedAt: -1 }'],
    },
  ]
  return (
    <Section id="architecture" n={3} title="System architecture">
      <p>
        The deployed site is a static React app: the co-founder engine runs in the browser, so the demo works for anyone,
        offline, with no sign-up and no API key. The repository also contains the Node, Express and MongoDB back end
        described in the deck, with tests. Hosting it adds accounts, cloud storage and Claude-powered chat.
      </p>
      <div className="flex flex-col gap-3 lg:flex-row">
        {tiers.map((t) => (
          <Card key={t.title} className="flex-1 p-5">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg bg-sand text-cocoa">
                <t.icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold leading-tight text-espresso">{t.title}</p>
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
      <p className="text-sm text-muted">
        Full-stack data flow when the API is hosted: React components call the REST API with fetch; Express routes validate
        input and read and write MongoDB through Mongoose models.
      </p>
    </Section>
  )
}

function EngineSection() {
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
        On the live site the co-founder is a transparent rule engine, not a language model. Every judgement can be traced to
        a rule, which makes it explainable and testable, and means it never invents facts. The rules:
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {rules.map((r) => (
          <Card key={r.title} className="p-4">
            <p className="font-semibold text-espresso">{r.title}</p>
            <p className="mt-1 text-sm text-ink/85">{r.body}</p>
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
  const note = (f: BuildFile) =>
    `${f.initial ? 'Loaded on first visit' : f.kind === 'lazy' ? 'Loaded on demand' : 'Shared, loaded when needed'} · ${kb(f.bytes).toFixed(1)} KB before compression`
  return (
    <Section id="performance" n={5} title="Measured performance">
      <p>
        These numbers are measured from the production build that is currently deployed (built{' '}
        {new Date(stats.builtAt).toLocaleString()}), not estimated. The build writes every chunk’s size to{' '}
        <code className="font-mono text-sm">build-stats.json</code>, and this page reads it.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="First-visit download (gzip)" value={`${kb(initialGzip).toFixed(1)} KB`} sub={`${initial.length} files: app shell, shared UI and CSS`} />
        <StatTile label="Whole app (gzip)" value={`${kb(totalGzip).toFixed(1)} KB`} sub={`${stats.files.length} JS and CSS files`} />
        <StatTile
          label="Largest on-demand chunk"
          value={largestLazy ? `${kb(largestLazy.gzip).toFixed(1)} KB` : '—'}
          sub={largestLazy ? `${label(largestLazy)}, only when you download a .zip` : undefined}
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
        Code splitting is real: each stage (Ideation, Validation, Scoping, Building) is a separate chunk loaded when you open
        it, and the zip library is loaded only when you download the generated code. Initial load stays well under the
        200 KB gzip budget from the original plan.
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
        <StatTile label="Generated API checks" value="24 / 24" sub="Starter run against a real MongoDB" />
        <StatTile label="Deploys gated on tests" value="Every push" sub="GitHub Actions: test → build → deploy" />
      </div>
      {files.length ? (
        <Card className="p-5">
          <p className="text-sm font-semibold text-espresso">Unit tests by engine module (Vitest)</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {files.map((f) => (
              <li key={f.name} className="flex items-center justify-between rounded-lg bg-cream px-3 py-2 text-sm">
                <span className="font-mono text-xs">{f.name}</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-espresso">
                  <Check className="size-4 text-good" aria-hidden="true" /> {f.passed} passed
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
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
      <p className="font-semibold text-espresso">{title}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {meta.map(([k, label, sub]) => (
          <div key={k} className="rounded-xl bg-cream p-4">
            <p className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-extrabold text-cocoa">{k}</span>
              <span className="font-semibold text-espresso">{label}</span>
              <span className="text-xs text-muted">{sub}</span>
            </p>
            <p className="mt-1.5 text-sm text-ink/85">{q[k]}</p>
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
          S: 'Covers the whole 0-to-1 journey, not one step. Explainable rules, works offline with no sign-up, and outputs real artefacts: landing page, survey and runnable code.',
          W: 'Rule-based language understanding is keyword-driven and English-only. Projects live in one browser until the back end is hosted.',
          O: 'Plugging in an LLM (the Claude endpoint is ready) for open-ended advice; college incubators and E-cells running idea-validation programmes; hackathon teams.',
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
    'The live demo’s co-founder is rule-based. It is transparent and never makes things up, but it cannot hold an open-ended conversation the way an LLM can.',
    'Benchmarks (5–15% sign-up rate, 25% reply rate) are rules of thumb for early-stage tests, not universal truths. The Sean Ellis 40% threshold is the only widely cited one.',
    'Text classification is keyword-based and English-only, so sarcasm or mixed replies can be misread.',
    'On the static site, projects are stored in the browser (export/import JSON moves them). Cloud storage needs the hosted back end.',
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
  const items: [typeof Cpu, string, string][] = [
    [Cpu, 'LLM co-founder chat', 'Host the API with a Claude key: the chat endpoint, prompts and streaming already exist in /server.'],
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
            <Icon className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden="true" />
            <div>
              <p className="font-semibold text-espresso">{t}</p>
              <p className="mt-0.5 text-sm text-ink/85">{b}</p>
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
      <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-cream/70 text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Where</th>
              <th className="px-4 py-3 font-semibold">Before</th>
              <th className="px-4 py-3 font-semibold">Now</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {rows.map(([w, b, n]) => (
              <tr key={w}>
                <td className="px-4 py-3 font-semibold text-espresso">{w}</td>
                <td className="px-4 py-3 text-ink/80">{b}</td>
                <td className={cx('px-4 py-3')}>{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">
        References: Sean Ellis, product–market fit survey (“very disappointed” 40% benchmark); Rob Fitzpatrick, <em>The Mom
        Test</em> (customer interview rules); MongoDB and React documentation.{' '}
        <a className="inline-flex items-center gap-1 font-semibold text-teal underline" href={SITE.repoUrl} target="_blank" rel="noreferrer">
          Repository <ExternalLink className="size-3.5" />
        </a>
      </p>
    </Section>
  )
}
