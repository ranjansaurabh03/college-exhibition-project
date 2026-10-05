import { ArrowDown, ArrowUp, Ban, CircleCheck, CircleDashed, Clock, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Button, Card, Field, Segmented, TextInput, cx } from '../../components/ui'
import { Meter, StatTile } from '../../components/viz'
import {
  BUFFER,
  COMMON_FEATURES,
  CORE_TEST,
  EFFORT_LABEL,
  grouped,
  PAY_TEST,
  STACK_BOUNDARY,
  timeline,
  verdict,
  verdictReason,
  type Verdict,
} from '../../lib/engine/scoping'
import { uid } from '../../lib/factory'
import { useProjects } from '../../lib/store'
import type { Decision, Effort, Feature, Scoping as ScopingData, YesNo } from '../../lib/types'
import type { StageProps } from '../Workspace'

const YES_NO: { value: YesNo; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]
const EFFORTS: { value: Effort; label: string }[] = [
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
]

const VERDICT_META: Record<Verdict, { label: string; icon: typeof Ban; color: string }> = {
  keep: { label: 'Keep in v1', icon: CircleCheck, color: 'text-good' },
  later: { label: 'Later (v2)', icon: Clock, color: 'text-warn' },
  cut: { label: 'Cut', icon: Ban, color: 'text-bad' },
  undecided: { label: 'Undecided', icon: CircleDashed, color: 'text-muted' },
}

function VerdictLabel({ v }: { v: Verdict }) {
  const m = VERDICT_META[v]
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-strong">
      <m.icon className={cx('size-4 shrink-0', m.color)} aria-hidden="true" /> {m.label}
    </span>
  )
}

export default function Scoping({ project }: StageProps) {
  const patch = useProjects((s) => s.patch)
  const s = project.scoping
  const set = (partial: Partial<ScopingData>) => patch(project.id, 'scoping', partial)
  const setFeature = (id: string, partial: Partial<Feature>) => set({ features: s.features.map((f) => (f.id === id ? { ...f, ...partial } : f)) })

  return (
    <div className="space-y-6">
      <FeatureTable features={s.features} onChange={(features) => set({ features })} setFeature={setFeature} />
      <Board features={s.features} />
      <TimelineCard scoping={s} set={set} />
      <ShippableUnit project={project} set={set} />
      <Boundary />
    </div>
  )
}

function FeatureTable({
  features,
  onChange,
  setFeature,
}: {
  features: Feature[]
  onChange: (f: Feature[]) => void
  setFeature: (id: string, p: Partial<Feature>) => void
}) {
  const [name, setName] = useState('')

  function add(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onChange([...features, { id: uid('f_'), name: name.trim(), pays: '', core: '', effort: 'M' }])
    setName('')
  }

  function addCommon() {
    const have = new Set(features.map((f) => f.name.toLowerCase()))
    const extra = COMMON_FEATURES.filter((n) => !have.has(n.toLowerCase())).map<Feature>((n) => ({
      id: uid('f_'),
      name: n,
      pays: '',
      core: '',
      effort: 'M',
    }))
    onChange([...features, ...extra])
  }

  return (
    <Card className="p-5 sm:p-6" id="field-features">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-strong">Push back on scope</h2>
          <p className="text-sm text-muted">Founders naturally over-build. Every feature has to earn its place in v1.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={addCommon}>
          <Sparkles className="size-4" /> Add the usual wish-list
        </Button>
      </div>

      <form onSubmit={add} className="mt-4 flex gap-2">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a feature, e.g. “Push notifications”" aria-label="New feature name" />
        <Button type="submit" disabled={!name.trim()}>
          <Plus className="size-4" /> Add
        </Button>
      </form>

      {features.length ? (
        <>
          <div className="mt-5 hidden grid-cols-[minmax(0,1fr)_7rem_7rem_7.5rem_10.5rem_2rem] gap-3 border-b border-line pb-2 text-xs font-semibold text-muted lg:grid">
            <span>Feature</span>
            <span title={PAY_TEST}>Changes who pays?</span>
            <span title={CORE_TEST}>In the core flow?</span>
            <span>Effort</span>
            <span>Co-founder’s verdict</span>
            <span />
          </div>
          <ul className="divide-y divide-line">
            {features.map((f) => (
              <li key={f.id} className="grid gap-x-3 gap-y-2 py-3 lg:grid-cols-[minmax(0,1fr)_7rem_7rem_7.5rem_10.5rem_2rem] lg:items-center">
                <TextInput value={f.name} onChange={(e) => setFeature(f.id, { name: e.target.value })} aria-label="Feature name" className="h-9" />
                <LabeledCell label="Changes who pays?">
                  <Segmented ariaLabel={`${f.name}: ${PAY_TEST}`} value={f.pays} options={YES_NO} onChange={(v) => setFeature(f.id, { pays: v })} />
                </LabeledCell>
                <LabeledCell label="In the core flow?">
                  <Segmented ariaLabel={`${f.name}: ${CORE_TEST}`} value={f.core} options={YES_NO} onChange={(v) => setFeature(f.id, { core: v })} />
                </LabeledCell>
                <LabeledCell label="Effort">
                  <Segmented
                    ariaLabel={`${f.name}: effort`}
                    value={f.effort}
                    options={EFFORTS}
                    onChange={(v) => setFeature(f.id, { effort: (v || f.effort) as Effort })}
                  />
                </LabeledCell>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 lg:justify-between">
                    <VerdictLabel v={verdict(f)} />
                    <select
                      aria-label={`Override verdict for ${f.name}`}
                      value={f.override ?? ''}
                      onChange={(e) => setFeature(f.id, { override: (e.target.value || undefined) as Decision | undefined })}
                      className="h-7 rounded-lg border border-line bg-field px-1.5 text-xs text-muted"
                    >
                      <option value="">Auto</option>
                      <option value="keep">Keep</option>
                      <option value="later">Later</option>
                      <option value="cut">Cut</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(features.filter((x) => x.id !== f.id))}
                  className="justify-self-start rounded-lg p-1.5 text-muted hover:bg-bad/10 hover:text-bad lg:justify-self-center"
                  aria-label={`Remove ${f.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
                <p className="text-xs text-muted lg:col-span-6">{verdictReason(f)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Effort: {Object.values(EFFORT_LABEL).join(' · ')}. The co-founder keeps what the core flow needs, defers what
            drives payment, and cuts the rest.
          </p>
        </>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-accent-soft px-4 py-6 text-center text-sm text-muted">
          No features yet. Add yours, or start from the usual wish-list and watch most of it get cut.
        </p>
      )}
    </Card>
  )
}

function LabeledCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 lg:block">
      <span className="text-xs font-semibold text-muted lg:hidden">{label}</span>
      {children}
    </div>
  )
}

function Board({ features }: { features: Feature[] }) {
  const g = grouped(features)
  const cols: Verdict[] = ['keep', 'later', 'cut']
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cols.map((c) => (
        <Card key={c} className={cx('p-4', c === 'keep' && 'border-good/40')}>
          <div className="flex items-center justify-between">
            <VerdictLabel v={c} />
            <span className="text-sm font-semibold text-muted">{g[c].length}</span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {g[c].map((f) => (
              <li key={f.id} className={cx('rounded-lg bg-canvas px-3 py-1.5 text-sm text-body', c === 'cut' && 'text-muted line-through decoration-muted/50')}>
                {f.name}
              </li>
            ))}
            {g[c].length === 0 ? <li className="text-sm text-muted">Nothing here</li> : null}
          </ul>
        </Card>
      ))}
    </div>
  )
}

function TimelineCard({ scoping, set }: { scoping: ScopingData; set: (p: Partial<ScopingData>) => void }) {
  const t = timeline(scoping)
  const keep = grouped(scoping.features).keep.length
  const ratio = scoping.weeksTarget > 0 ? (t.weeks / scoping.weeksTarget) * 100 : 0
  return (
    <Card className="p-5 sm:p-6" id="field-timeline" tabIndex={-1}>
      <h2 className="text-lg font-bold text-strong">Can v1 ship in time?</h2>
      <p className="text-sm text-muted">Scope discipline is the difference between launching in 3 weeks and never launching at all.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatTile label="Features in v1" value={keep} />
        <StatTile label="Build hours" value={t.totalHours} sub={`${t.keepHours} h of features + ${Math.round(BUFFER * 100)}% for integration and testing`} />
        <StatTile label="Weeks needed" value={t.weeks.toFixed(1)} sub={`at ${scoping.hoursPerWeek} team hours per week`} />
      </div>
      <div className="mt-5">
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="font-semibold text-strong">
            {t.fits ? (ratio > 85 ? 'Fits, but it’s tight' : 'Fits the target') : 'Over the target'}: {t.weeks.toFixed(1)} of {scoping.weeksTarget} weeks
          </span>
        </div>
        <Meter value={Math.min(ratio, 100)} tone={t.fits ? (ratio > 85 ? 'warn' : 'good') : 'bad'} label={`${t.weeks.toFixed(1)} of ${scoping.weeksTarget} weeks used`} />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Team hours per week" hint="e.g. 2 people × 15 hours">
          <TextInput type="number" min={1} value={scoping.hoursPerWeek} onChange={(e) => set({ hoursPerWeek: Math.max(1, Number(e.target.value) || 1) })} />
        </Field>
        <Field label="Target (weeks)">
          <TextInput type="number" min={1} value={scoping.weeksTarget} onChange={(e) => set({ weeksTarget: Math.max(1, Number(e.target.value) || 1) })} />
        </Field>
      </div>
    </Card>
  )
}

function ShippableUnit({ project, set }: StageProps & { set: (p: Partial<ScopingData>) => void }) {
  const s = project.scoping
  const [step, setStep] = useState('')
  const flow = s.coreFlow
  const move = (i: number, d: -1 | 1) => {
    const next = [...flow]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    set({ coreFlow: next })
  }
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold text-strong">Smallest shippable unit</h2>
      <p className="text-sm text-muted">One user type, one core flow, one clear outcome. Complexity is the enemy of shipping fast.</p>

      <div className="mt-5 grid gap-5">
        <div>
          <p className="text-sm font-semibold text-strong">1 · One user type</p>
          <p className="mt-1 rounded-xl bg-canvas px-3.5 py-2.5 text-sm text-body">
            {project.ideation.targetUser.trim() || (
              <span className="text-muted">
                Not defined.{' '}
                <Link className="font-semibold text-link underline" to={`/app/p/${project.id}/ideation`}>
                  Define it in Ideation
                </Link>
              </span>
            )}
          </p>
        </div>

        <div id="field-coreFlow" tabIndex={-1} className="outline-none">
          <p className="text-sm font-semibold text-strong">2 · One core flow</p>
          <ol className="mt-2 space-y-1.5">
            {flow.map((st, i) => (
              <li key={`${i}-${st}`} className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-xs font-bold text-primary">{i + 1}</span>
                <TextInput
                  className="h-9"
                  value={st}
                  aria-label={`Step ${i + 1}`}
                  onChange={(e) => set({ coreFlow: flow.map((x, k) => (k === i ? e.target.value : x)) })}
                />
                <button type="button" className="rounded p-1 text-muted hover:text-body disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move step ${i + 1} up`}>
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-muted hover:text-body disabled:opacity-30"
                  disabled={i === flow.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Move step ${i + 1} down`}
                >
                  <ArrowDown className="size-4" />
                </button>
                <button type="button" className="rounded p-1 text-muted hover:text-bad" onClick={() => set({ coreFlow: flow.filter((_, k) => k !== i) })} aria-label={`Remove step ${i + 1}`}>
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ol>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!step.trim()) return
              set({ coreFlow: [...flow, step.trim()] })
              setStep('')
            }}
          >
            <TextInput value={step} onChange={(e) => setStep(e.target.value)} placeholder="Next step the user takes…" aria-label="New core flow step" className="h-9" />
            <Button type="submit" variant="secondary" size="sm" className="h-9" disabled={!step.trim()}>
              <Plus className="size-4" /> Step
            </Button>
          </form>
        </div>

        <Field label="3 · One clear outcome" hint="How will you know the core flow worked? Make it measurable." htmlFor="field-outcome">
          <TextInput id="field-outcome" value={s.outcome} onChange={(e) => set({ outcome: e.target.value })} placeholder="e.g. Lunch in hand within two minutes of reaching the canteen" />
        </Field>
      </div>
    </Card>
  )
}

function Boundary() {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold text-strong">Scope checklist: your MVP boundary</h2>
      <p className="text-sm text-muted">Auth, CRUD and one key workflow. That is the MVP. Everything else waits.</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {STACK_BOUNDARY.map((b) => (
          <div key={b.layer} className="rounded-xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-accent">{b.layer}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-strong">{b.choice}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
