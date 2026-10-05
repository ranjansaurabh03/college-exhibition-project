import { Check, Copy, Download, ExternalLink, LayoutTemplate, ListChecks, Mail, RotateCcw, Signal } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button, Card, Field, TextArea, TextInput, cx } from '../../components/ui'
import { Meter, StatusIcon, StatusLabel, type StatusTone } from '../../components/viz'
import { copyText, downloadBlob, downloadText } from '../../lib/download'
import {
  interpretSignals,
  landingCopy,
  landingHtml,
  MOM_TEST_RULES,
  outreachKit,
  SIGNAL_PRINCIPLES,
  summarizeResponses,
  surveyAsText,
  surveyQuestions,
  type Band,
  type Metric,
  type ResponseClass,
} from '../../lib/engine/validation'
import { useProjects } from '../../lib/store'
import type { Signals } from '../../lib/types'
import type { StageProps } from '../Workspace'

type Tab = 'landing' | 'outreach' | 'survey' | 'signals'

const TABS: { key: Tab; label: string; icon: typeof Mail }[] = [
  { key: 'landing', label: 'Landing page', icon: LayoutTemplate },
  { key: 'outreach', label: 'Outreach', icon: Mail },
  { key: 'survey', label: 'Survey', icon: ListChecks },
  { key: 'signals', label: 'Signals', icon: Signal },
]

export default function Validation({ project }: StageProps) {
  const [tab, setTab] = useState<Tab>('landing')
  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Validation tools" className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-paper p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
              tab === t.key ? 'bg-cocoa text-cream' : 'text-muted hover:bg-sand/60 hover:text-ink',
            )}
          >
            <t.icon className="size-4" aria-hidden="true" /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'landing' && <LandingTab project={project} />}
      {tab === 'outreach' && <OutreachTab project={project} />}
      {tab === 'survey' && <SurveyTab project={project} />}
      {tab === 'signals' && <SignalsTab project={project} />}
    </div>
  )
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true)
          window.setTimeout(() => setDone(false), 1500)
        }
      }}
    >
      {done ? <Check className="size-4" /> : <Copy className="size-4" />} {done ? 'Copied' : label}
    </Button>
  )
}

// ---------------------------------------------------------------------------

function LandingTab({ project }: StageProps) {
  const patch = useProjects((s) => s.patch)
  const o = project.validation.landing
  const copy = landingCopy(project.ideation, o)
  const generated = landingCopy(project.ideation, { headline: '', subheadline: '', cta: '' })
  const html = landingHtml(copy)
  const setLanding = (partial: Partial<typeof o>) => patch(project.id, 'validation', { landing: { ...o, ...partial } })
  const fileName = `${(project.ideation.productName || 'landing').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-landing.html`

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-espresso">Describe it before it exists</h2>
            <p className="text-sm text-muted">
              Generated from your one-liner. Edit the copy, download the page, and measure sign-ups to gauge real demand.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLanding({ headline: '', subheadline: '', cta: '' })}>
            <RotateCcw className="size-4" /> Reset to generated
          </Button>
        </div>
        <div className="mt-5 grid gap-4">
          <Field label="Headline" htmlFor="landing-headline">
            <TextInput id="landing-headline" value={o.headline} placeholder={generated.headline} onChange={(e) => setLanding({ headline: e.target.value })} />
          </Field>
          <Field label="Sub-headline" htmlFor="landing-sub">
            <TextArea id="landing-sub" rows={2} value={o.subheadline} placeholder={generated.subheadline} onChange={(e) => setLanding({ subheadline: e.target.value })} />
          </Field>
          <Field label="Call to action" htmlFor="landing-cta">
            <TextInput id="landing-cta" value={o.cta} placeholder={generated.cta} onChange={(e) => setLanding({ cta: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-cream/70 px-4 py-2.5">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-tan" />
            <span className="size-2.5 rounded-full bg-sand" />
            <span className="size-2.5 rounded-full bg-sand" />
            <span className="ml-2 text-xs text-muted">{fileName}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
                window.open(url, '_blank', 'noopener')
                window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
              }}
            >
              <ExternalLink className="size-4" /> Open
            </Button>
            <Button size="sm" onClick={() => downloadBlob(fileName, new Blob([html], { type: 'text/html;charset=utf-8' }))}>
              <Download className="size-4" /> Download HTML
            </Button>
          </div>
        </div>
        <iframe title="Landing page preview" srcDoc={html} sandbox="allow-scripts allow-forms" className="h-[520px] w-full bg-cream" />
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------

function OutreachTab({ project }: StageProps) {
  const kit = outreachKit(project.ideation)
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="text-lg font-bold text-espresso">A handful of honest replies from strangers beats feedback from friends</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {MOM_TEST_RULES.map((r) => (
            <li key={r} className="flex gap-2 text-sm text-ink/85">
              <Check className="mt-0.5 size-4 shrink-0 text-good" aria-hidden="true" /> {r}
            </li>
          ))}
        </ul>
      </Card>
      {kit.map((t) => {
        const full = t.subject ? `Subject: ${t.subject}\n\n${t.body}` : t.body
        return (
          <Card key={t.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">{t.channel}</p>
              <CopyButton text={full} />
            </div>
            {t.subject ? <p className="mt-3 font-semibold text-espresso">{t.subject}</p> : null}
            <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-cream px-4 py-3 font-sans text-sm leading-relaxed text-ink">{t.body}</pre>
          </Card>
        )
      })}
      <p className="text-xs text-muted">Replace the {'{{placeholders}}'} before sending. Log the replies under Signals.</p>
    </div>
  )
}

// ---------------------------------------------------------------------------

function SurveyTab({ project }: StageProps) {
  const qs = surveyQuestions(project.ideation)
  const text = surveyAsText(qs)
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-espresso">Survey: ask about the past, not the future</h2>
          <p className="text-sm text-muted">Paste into Google Forms. Honest signal from real people beats assumptions made in isolation.</p>
        </div>
        <div className="flex gap-2">
          <CopyButton text={text} label="Copy all" />
          <Button variant="secondary" size="sm" onClick={() => downloadText('survey.txt', text)}>
            <Download className="size-4" /> .txt
          </Button>
        </div>
      </div>
      <ol className="mt-5 space-y-4">
        {qs.map((q, n) => (
          <li key={q.q} className="rounded-xl border border-line bg-white/60 p-4">
            <div className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-sand text-sm font-bold text-cocoa">{n + 1}</span>
              <div className="min-w-0">
                <p className="font-semibold text-espresso">{q.q}</p>
                {q.options ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {q.options.map((o) => (
                      <span key={o} className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-xs text-ink">
                        {o}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted">{q.type === 'email' ? 'Email field' : 'Open answer'}</p>
                )}
                <p className="mt-2 text-xs text-muted">Why: {q.why}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}

// ---------------------------------------------------------------------------

const BAND_TONE: Record<Band, StatusTone> = { strong: 'good', promising: 'warn', weak: 'bad', none: 'neutral' }
const BAND_LABEL: Record<Band, string> = { strong: 'Strong', promising: 'Promising', weak: 'Weak', none: 'No data' }
// Meter scale per metric: twice the "strong" threshold, so strong sits at the midpoint or beyond.
const SCALE: Record<Metric['key'], number> = { landing: 30, reply: 50, calls: 80, ellis: 80, preorders: 10 }

const SIGNAL_FIELDS: { group: string; fields: { key: keyof Signals; label: string }[] }[] = [
  { group: 'Landing page', fields: [{ key: 'visitors', label: 'Visitors' }, { key: 'signups', label: 'Sign-ups' }] },
  {
    group: 'Outreach',
    fields: [
      { key: 'outreachSent', label: 'Messages sent' },
      { key: 'replies', label: 'Replies' },
      { key: 'calls', label: 'Calls booked' },
    ],
  },
  {
    group: 'Survey',
    fields: [
      { key: 'surveyResponses', label: 'Responses' },
      { key: 'veryDisappointed', label: '“Very disappointed”' },
    ],
  },
  { group: 'Commitment', fields: [{ key: 'preorders', label: 'Pre-orders / payments' }] },
]

const CLASS_META: Record<ResponseClass, { label: string; tone: StatusTone }> = {
  intent: { label: 'Genuine intent', tone: 'good' },
  friction: { label: 'Friction', tone: 'bad' },
  polite: { label: 'Polite interest', tone: 'warn' },
  unclear: { label: 'Unclear', tone: 'neutral' },
}

function SignalsTab({ project }: StageProps) {
  const patch = useProjects((s) => s.patch)
  const v = project.validation
  const report = interpretSignals(v.signals)
  const replies = summarizeResponses(v.responses)
  const setSignal = (key: keyof Signals, raw: string) => {
    const n = Math.max(0, Math.floor(Number(raw) || 0))
    patch(project.id, 'validation', { signals: { ...v.signals, [key]: n } })
  }
  const verdictTone: StatusTone = report.verdict.tone === 'neutral' ? 'neutral' : report.verdict.tone

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-bold text-espresso">Log what actually happened</h2>
        <p className="text-sm text-muted">Raw counts from your landing page, outreach and survey.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {SIGNAL_FIELDS.map((g) => (
            <fieldset key={g.group} className="rounded-xl border border-line p-4">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-clay">{g.group}</legend>
              <div className="grid grid-cols-2 gap-3">
                {g.fields.map((f) => (
                  <Field key={f.key} label={f.label} htmlFor={`sig-${f.key}`}>
                    <TextInput
                      id={`sig-${f.key}`}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={v.signals[f.key] || ''}
                      placeholder="0"
                      onChange={(e) => setSignal(f.key, e.target.value)}
                    />
                  </Field>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">Signal strength</p>
            <p className="mt-1 text-5xl font-semibold text-espresso">
              {report.hasData ? report.score : '–'}
              {report.hasData ? <span className="text-lg text-muted">/100</span> : null}
            </p>
            <StatusLabel tone={verdictTone} className="mt-2 font-semibold">
              {report.verdict.label}
            </StatusLabel>
            <p className="mt-3 text-xs text-muted">Commitments (pre-orders, survey fit) weigh more than clicks.</p>
          </div>
          <ul className="divide-y divide-line">
            {report.metrics.map((m) => (
              <li key={m.key} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-espresso">{m.label}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm text-ink">{m.display}</span>
                    <StatusLabel tone={BAND_TONE[m.band]} className="text-xs font-semibold">
                      {BAND_LABEL[m.band]}
                    </StatusLabel>
                  </span>
                </div>
                <div className="mt-1.5">
                  <Meter
                    value={m.key === 'preorders' ? (Number(m.display) || 0) * (100 / SCALE.preorders) : ((m.percent ?? 0) / SCALE[m.key]) * 100}
                    tone={BAND_TONE[m.band]}
                    label={`${m.label}: ${m.display}, ${BAND_LABEL[m.band]}`}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">{m.benchmark}</p>
              </li>
            ))}
          </ul>
        </div>
        {report.warnings.length || report.actions.length ? (
          <div className="mt-6 grid gap-4 border-t border-line pt-5 md:grid-cols-2">
            {report.warnings.length ? (
              <List title="Check these numbers" items={report.warnings} tone="warn" />
            ) : null}
            {report.actions.length ? <List title="What I’d do next" items={report.actions} tone="neutral" /> : null}
          </div>
        ) : null}
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-bold text-espresso">Reading early signals</h2>
        <p className="text-sm text-muted">
          Paste replies from outreach or open survey answers, one per line. Confirmation bias makes it easy to hear what
          you want to hear; this separates polite interest from genuine intent.
        </p>
        <TextArea
          className="mt-4"
          rows={5}
          aria-label="Replies, one per line"
          value={v.responses}
          placeholder={'When can I start using it?\nSounds cool, all the best!\nNot sure people would pay for this.'}
          onChange={(e) => patch(project.id, 'validation', { responses: e.target.value })}
        />
        {replies.items.length ? (
          <>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {(Object.keys(CLASS_META) as ResponseClass[]).map((k) => (
                <StatusLabel key={k} tone={CLASS_META[k].tone}>
                  {CLASS_META[k].label}: <strong>{replies.counts[k]}</strong>
                </StatusLabel>
              ))}
            </div>
            <ul className="mt-4 space-y-2">
              {replies.items.map((r, n) => (
                <li key={`${n}-${r.text}`} className="flex gap-3 rounded-xl border border-line bg-white/60 px-3.5 py-2.5">
                  <StatusIcon tone={CLASS_META[r.cls].tone} className="mt-0.5 size-4" />
                  <div className="min-w-0">
                    <p className="text-sm text-ink">{r.text}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {CLASS_META[r.cls].label}
                      {r.matched.length ? ` · matched: ${r.matched.slice(0, 3).join(', ')}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <List className="mt-4" title="What this tells you" items={replies.insights} tone="neutral" />
          </>
        ) : null}
        <div className="mt-6 rounded-xl bg-sand/50 p-4">
          <p className="text-sm font-semibold text-espresso">Principles for honest signal reading</p>
          <ul className="mt-2 space-y-1.5">
            {SIGNAL_PRINCIPLES.map((p) => (
              <li key={p} className="flex gap-2 text-sm text-ink/85">
                <Check className="mt-0.5 size-4 shrink-0 text-good" aria-hidden="true" /> {p}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  )
}

function List({ title, items, tone, className }: { title: string; items: string[]; tone: StatusTone; className?: string }): ReactNode {
  return (
    <div className={className}>
      <p className="text-sm font-semibold text-espresso">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((t) => (
          <li key={t}>
            <StatusLabel tone={tone}>{t}</StatusLabel>
          </li>
        ))}
      </ul>
    </div>
  )
}
