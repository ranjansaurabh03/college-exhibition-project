import { ArrowRight, Bot, CircleCheck, Lightbulb, ListChecks, MessagesSquare } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { buildingChallenges } from '../lib/engine/building'
import { ideationChallenges, type Challenge } from '../lib/engine/ideation'
import { scopingChallenges } from '../lib/engine/scoping'
import { validationChallenges } from '../lib/engine/validation'
import { useServer } from '../lib/server'
import { STAGES } from '../lib/stages'
import type { Project, StageKey } from '../lib/types'
import { ChatPanel } from './ChatPanel'
import { ASK_AI_EVENT } from './CommandPalette'
import { cx } from './ui'
import { StatusIcon, type StatusTone } from './viz'

export function challengesFor(project: Project, stage: StageKey): Challenge[] {
  switch (stage) {
    case 'ideation':
      return ideationChallenges(project.ideation)
    case 'validation':
      return validationChallenges(project.validation, project.ideation)
    case 'scoping':
      return scopingChallenges(project.scoping, project.ideation)
    case 'building':
      return buildingChallenges(project)
  }
}

const LEVEL_TONE: Record<Challenge['level'], StatusTone> = { block: 'bad', warn: 'warn', tip: 'neutral' }
const LEVEL_LABEL: Record<Challenge['level'], string> = { block: 'Must fix', warn: 'Push back', tip: 'Suggestion' }
const LEVEL_ORDER: Record<Challenge['level'], number> = { block: 0, warn: 1, tip: 2 }

export function focusField(field: string) {
  const el = document.getElementById(`field-${field}`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  window.setTimeout(() => el.focus({ preventScroll: true }), 350)
}

export function CoFounderPanel({ project, stage }: { project: Project; stage: StageKey }) {
  const ai = useServer((s) => s.status?.ai)
  const [tab, setTab] = useState<'chat' | 'checks'>('chat')
  // Most important first; the engine's own order is kept within each level.
  const challenges = challengesFor(project, stage).sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level])
  const blocking = challenges.filter((c) => c.level === 'block').length
  const showChat = Boolean(ai?.enabled) && tab === 'chat'

  useEffect(() => {
    const onAsk = () => setTab('chat')
    window.addEventListener(ASK_AI_EVENT, onAsk)
    return () => window.removeEventListener(ASK_AI_EVENT, onAsk)
  }, [])

  return (
    <div className="card flex flex-col overflow-hidden lg:max-h-[calc(100vh-7.5rem)]">
      <div className="relative border-b border-line px-5 pb-4 pt-5">
        <div className="pointer-events-none absolute -top-16 right-0 h-32 w-48 rounded-full bg-ai opacity-25 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-ai text-white shadow-[0_8px_24px_-8px_rgb(124_92_255/0.8)]">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold leading-tight text-strong">Your co-founder</p>
            <p className="truncate text-xs text-muted">{ai?.enabled ? `Google Gemini + rule checks` : 'Rule engine · runs in your browser'}</p>
          </div>
        </div>
        {ai?.enabled ? (
          <div role="tablist" aria-label="Co-founder" className="relative mt-4 grid grid-cols-2 gap-1 rounded-xl border border-line bg-field p-1 text-[13px] font-semibold">
            <TabButton active={tab === 'chat'} onClick={() => setTab('chat')}>
              <MessagesSquare className="size-4" aria-hidden="true" /> Ask AI
            </TabButton>
            <TabButton active={tab === 'checks'} onClick={() => setTab('checks')}>
              <ListChecks className="size-4" aria-hidden="true" /> Checks
              {challenges.length ? <span className="rounded-full bg-subtle px-1.5 text-[11px] text-strong">{challenges.length}</span> : null}
            </TabButton>
          </div>
        ) : (
          <p className="relative mt-3 text-sm text-muted">{summary(challenges.length, blocking)}</p>
        )}
      </div>

      {showChat ? (
        <ChatPanel key={stage} project={project} stage={stage} model={ai?.model ?? null} />
      ) : (
        <>
          {ai?.enabled ? <p className="border-b border-line px-5 py-2.5 text-xs text-muted">{summary(challenges.length, blocking)}</p> : null}
          <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
            {challenges.map((c) => (
              <li key={c.id} className="px-5 py-3.5">
                <div className="flex gap-2.5">
                  <StatusIcon tone={LEVEL_TONE[c.level]} className="mt-0.5 size-4" />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{LEVEL_LABEL[c.level]}</p>
                    <p className="mt-0.5 text-sm font-semibold text-strong">{c.title}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-body">{c.body}</p>
                    {c.field ? (
                      <button type="button" onClick={() => focusField(c.field!)} className="mt-1.5 text-xs font-semibold text-link underline-offset-2 hover:underline">
                        Answer this →
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
            {challenges.length === 0 ? (
              <li className="flex gap-2.5 px-5 py-4 text-sm text-strong">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-good" aria-hidden="true" />
                This stage is in good shape.
              </li>
            ) : null}
          </ul>
        </>
      )}

      <NextStage project={project} stage={stage} blocking={blocking} />
    </div>
  )
}

function summary(count: number, blocking: number) {
  if (count === 0) return 'Nothing to push back on here. Good work.'
  if (blocking) return `${blocking} thing${blocking > 1 ? 's' : ''} to fix before moving on, plus ${count - blocking} to consider.`
  return `${count} thing${count > 1 ? 's' : ''} I’d push back on.`
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cx('flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 transition-all', active ? 'bg-primary text-on-primary shadow-sm' : 'text-muted hover:text-strong')}
    >
      {children}
    </button>
  )
}

function NextStage({ project, stage, blocking }: { project: Project; stage: StageKey; blocking: number }) {
  const idx = STAGES.findIndex((s) => s.key === stage)
  const next = STAGES[idx + 1]
  return (
    <div className="border-t border-line px-4 py-3">
      {next ? (
        <Link
          to={`/app/p/${project.id}/${next.key}`}
          className={cx(
            'group flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all',
            blocking ? 'border border-line text-strong hover:border-line-strong hover:bg-subtle' : 'bg-primary text-on-primary hover:opacity-90',
          )}
        >
          <span>
            Next: Stage {next.n} · {next.title}
            {blocking ? <span className="block text-xs font-normal text-muted">You can move on, but I’d fix the checks first.</span> : null}
          </span>
          <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <p className="flex gap-2 px-1 text-[13px] text-body">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          Last stage. Download the starter, then ship v1 to your first ten users.
        </p>
      )}
    </div>
  )
}
