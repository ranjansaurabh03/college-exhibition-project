import { Check, Copy, MessagesSquare, Quote, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { InterviewDialog } from '../../components/InterviewDialog'
import { Button, Card, Field, Segmented, TextArea, TextInput } from '../../components/ui'
import { ScoreMeter, StatusLabel, toneForScore } from '../../components/viz'
import { copyText } from '../../lib/download'
import { INTERVIEW, isAnswered, lintOneLiner, oneLiner, scoreIdea } from '../../lib/engine/ideation'
import { useServer } from '../../lib/server'
import { useProjects } from '../../lib/store'
import type { Frequency, Ideation as IdeationData, Willingness } from '../../lib/types'
import { useAiDraft } from '../../lib/useAiDraft'
import type { StageProps } from '../Workspace'

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'rarely', label: 'Rarely' },
]
const SEVERITY = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))
const WILLINGNESS: { value: Willingness; label: string }[] = [
  { value: 'yes', label: 'Yes, they’d pay' },
  { value: 'maybe', label: 'Maybe, they’d switch' },
  { value: 'no', label: 'Probably not' },
]

export default function Ideation({ project }: StageProps) {
  const patch = useProjects((s) => s.patch)
  const [interviewOpen, setInterviewOpen] = useState(false)
  const i = project.ideation
  const set = (partial: Partial<IdeationData>) => patch(project.id, 'ideation', partial)
  const answered = INTERVIEW.filter((s) => isAnswered(i, s.field)).length
  const draft = useAiDraft(project, 'ideation')
  const checked = useServer((s) => s.checked)
  const [params, setParams] = useSearchParams()

  // Arriving from the idea box (?start=1): Gemini drafts the canvas, or the interview opens without AI.
  useEffect(() => {
    if (params.get('start') !== '1' || !checked) return
    setParams({}, { replace: true })
    if (draft.enabled) void draft.run({ renameIfNamed: project.name })
    else setInterviewOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, checked])

  return (
    <div className="space-y-6">
      {draft.running ? (
        <div className="card relative overflow-hidden p-5" role="status">
          <div className="shimmer absolute inset-0" aria-hidden="true" />
          <p className="relative flex items-center gap-2 font-semibold text-strong">
            <Sparkles className="size-4 animate-pulse text-accent" aria-hidden="true" /> Gemini is drafting your canvas from your idea…
          </p>
          <p className="relative mt-1 text-sm text-muted">It fills the empty fields only. You can edit or undo everything.</p>
        </div>
      ) : null}
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
            <MessagesSquare className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-strong">
              {answered === 0
                ? 'Start with a conversation, not a form'
                : answered < INTERVIEW.length
                  ? `Interview in progress: ${answered} of ${INTERVIEW.length} answered`
                  : 'Every question answered'}
            </p>
            <p className="text-sm text-muted">
              Your co-founder asks one question at a time and pushes back on vague answers. Everything fills the canvas
              below.
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setInterviewOpen(true)} className="shrink-0">
          {answered === 0 ? 'Interview me' : answered < INTERVIEW.length ? 'Continue interview' : 'Review interview'}
        </Button>
      </Card>

      <Scorecard data={i} />
      <OneLinerCard data={i} set={set} />

      <Card className="p-5 sm:p-6">
        <SectionHead n="A" title="Who is the user?" note="A vague audience leads to a vague product. Narrow it to one person." />
        <div className="mt-5 grid gap-5">
          <Field label="Raw idea" hint="It’s fine if this is vague. It’s a direction, not an idea yet." htmlFor="field-rawIdea">
            <TextArea id="field-rawIdea" value={i.rawIdea} onChange={(e) => set({ rawIdea: e.target.value })} rows={2} />
          </Field>
          <Field label="Who exactly is the user?" hint="Role + situation. e.g. “final-year students preparing for placement interviews”." htmlFor="field-targetUser">
            <TextInput id="field-targetUser" value={i.targetUser} onChange={(e) => set({ targetUser: e.target.value })} />
          </Field>
          <Field label="When and where does the problem hit?" htmlFor="field-userContext">
            <TextInput id="field-userContext" value={i.userContext} onChange={(e) => set({ userContext: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHead n="B" title="What is the pain?" note="Is it urgent? Is it frequent? Would users pay or change behaviour to fix it?" />
        <div className="mt-5 grid gap-5">
          <Field label="Describe the pain" hint="What goes wrong, and what does it cost them in time, money or stress?" htmlFor="field-pain">
            <TextArea id="field-pain" value={i.pain} onChange={(e) => set({ pain: e.target.value })} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="How often?">
              <Segmented id="field-frequency" ariaLabel="How often" value={i.frequency} options={FREQUENCIES} onChange={(v) => set({ frequency: v })} />
            </Field>
            <Field label="How bad? (1 = mild, 5 = they’d pay today)">
              <Segmented
                id="field-severity"
                ariaLabel="Severity"
                value={i.severity ? String(i.severity) : ''}
                options={SEVERITY}
                onChange={(v) => set({ severity: v ? Number(v) : 0 })}
              />
            </Field>
          </div>
          <Field label="How do they solve it today?" hint="The current workaround is your real competitor." htmlFor="field-currentSolution">
            <TextArea id="field-currentSolution" value={i.currentSolution} onChange={(e) => set({ currentSolution: e.target.value })} rows={2} />
          </Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHead n="C" title="Does this need to exist?" note="Challenge the assumption early so you don’t build the wrong thing." />
        <div className="mt-5 grid gap-5">
          <Field label="Existing alternatives" hint="One per line, with what’s missing." htmlFor="field-alternatives">
            <TextArea id="field-alternatives" value={i.alternatives} onChange={(e) => set({ alternatives: e.target.value })} rows={3} />
          </Field>
          <Field label="What can you do that they can’t?" hint="“Better UI” is not a reason to switch." htmlFor="field-differentiator">
            <TextArea id="field-differentiator" value={i.differentiator} onChange={(e) => set({ differentiator: e.target.value })} rows={2} />
          </Field>
          <Field label="Why now?" hint="What changed that makes this possible or urgent today?" htmlFor="field-whyNow">
            <TextInput id="field-whyNow" value={i.whyNow} onChange={(e) => set({ whyNow: e.target.value })} />
          </Field>
          <Field label="Would they pay or change behaviour?">
            <Segmented id="field-willingnessToPay" ariaLabel="Willingness to pay" value={i.willingnessToPay} options={WILLINGNESS} onChange={(v) => set({ willingnessToPay: v })} />
          </Field>
        </div>
      </Card>

      {interviewOpen ? <InterviewDialog project={project} onClose={() => setInterviewOpen(false)} /> : null}
    </div>
  )
}

function SectionHead({ n, title, note }: { n: string; title: string; note: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-subtle font-mono text-sm text-accent">{n}</span>
      <div>
        <h2 className="text-lg font-semibold text-strong">{title}</h2>
        <p className="text-sm text-muted">{note}</p>
      </div>
    </div>
  )
}

function Scorecard({ data }: { data: IdeationData }) {
  const s = scoreIdea(data)
  return (
    <Card className="p-5 sm:p-6">
      <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Idea scorecard</p>
          <p className="mt-1 text-5xl font-semibold text-strong">
            {s.overall}
            <span className="text-lg text-muted">/100</span>
          </p>
          <StatusLabel tone={toneForScore(s.overall)} className="mt-2 font-semibold">
            {s.verdict.label}
          </StatusLabel>
        </div>
        <div className="grid gap-4">
          <ScoreMeter label="User clarity" value={s.clarity} hint="Specific person, qualifiers and the moment the pain hits." />
          <ScoreMeter label="Pain" value={s.pain} hint="Frequency, severity and a real workaround." />
          <ScoreMeter label="Need & difference" value={s.need} hint="Alternatives, a real differentiator, why now, willingness to pay." />
        </div>
      </div>
    </Card>
  )
}

function OneLinerCard({ data, set }: { data: IdeationData; set: (p: Partial<IdeationData>) => void }) {
  const [copied, setCopied] = useState(false)
  const text = oneLiner(data)
  const lint = lintOneLiner(text, data)

  async function copy() {
    if (await copyText(text)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Sharpen the one-liner</p>
          <p className="mt-1 text-sm text-muted">“[Product] helps [user] do [outcome] by [unique approach].”</p>
        </div>
        <Button variant="secondary" size="sm" onClick={copy} disabled={text.includes('[')}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <blockquote className="mt-4 rounded-2xl bg-canvas px-5 py-4">
        <Quote className="mb-1 size-4 text-accent-soft" aria-hidden="true" />
        <p className="font-display text-lg font-semibold leading-snug text-strong sm:text-xl">{text}</p>
      </blockquote>
      <ul className="mt-3 space-y-1">
        {lint.map((l) => (
          <li key={l.message}>
            <StatusLabel tone={l.level === 'good' ? 'good' : l.level === 'block' ? 'bad' : l.level === 'warn' ? 'warn' : 'neutral'}>
              {l.message}
            </StatusLabel>
          </li>
        ))}
      </ul>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Product name" htmlFor="field-productName">
          <TextInput id="field-productName" value={data.productName} onChange={(e) => set({ productName: e.target.value })} placeholder="CanteenQ" />
        </Field>
        <Field label="Outcome (start with a verb)" htmlFor="field-outcome">
          <TextInput id="field-outcome" value={data.outcome} onChange={(e) => set({ outcome: e.target.value })} placeholder="grab lunch in the 20-minute break" />
        </Field>
        <Field label="Unique approach (“by …”)" htmlFor="field-approach">
          <TextInput id="field-approach" value={data.approach} onChange={(e) => set({ approach: e.target.value })} placeholder="letting them pre-order" />
        </Field>
      </div>
      <p className="mt-3 text-xs text-muted">The user part comes from “Who exactly is the user?” below.</p>
    </Card>
  )
}
