import { ArrowRight, Bot, CircleCheck, Lightbulb, ListChecks, MessagesSquare } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { buildingChallenges } from '../lib/engine/building'
import { ideationChallenges, type Challenge } from '../lib/engine/ideation'
import { scopingChallenges } from '../lib/engine/scoping'
import { validationChallenges } from '../lib/engine/validation'
import { useServer } from '../lib/server'
import { STAGES } from '../lib/stages'
import type { Project, StageKey } from '../lib/types'
import { ChatPanel } from './ChatPanel'
import { Card, cx } from './ui'
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

  return (
    <Card className="flex flex-col overflow-hidden lg:max-h-[calc(100vh-3rem)]">
      <div className="hero-gradient px-5 py-4 text-cream">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-white/12">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display font-bold leading-tight">Your co-founder</p>
            <p className="text-xs text-cream/70">
              {ai?.enabled ? 'Claude chat + rule checks' : 'Built-in rule engine · runs in your browser'}
            </p>
          </div>
        </div>
        {ai?.enabled ? (
          <div role="tablist" aria-label="Co-founder" className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-white/10 p-1 text-sm font-semibold">
            <TabButton active={tab === 'chat'} onClick={() => setTab('chat')}>
              <MessagesSquare className="size-4" aria-hidden="true" /> Ask Claude
            </TabButton>
            <TabButton active={tab === 'checks'} onClick={() => setTab('checks')}>
              <ListChecks className="size-4" aria-hidden="true" /> Checks
              {challenges.length ? <span className="rounded-full bg-white/20 px-1.5 text-xs">{challenges.length}</span> : null}
            </TabButton>
          </div>
        ) : (
          <p className="mt-3 text-sm text-cream/85">{summary(challenges.length, blocking)}</p>
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
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{LEVEL_LABEL[c.level]}</p>
                    <p className="text-sm font-semibold text-espresso">{c.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink/80">{c.body}</p>
                    {c.field ? (
                      <button
                        type="button"
                        onClick={() => focusField(c.field!)}
                        className="mt-1.5 text-xs font-semibold text-teal underline-offset-2 hover:underline"
                      >
                        Answer this →
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
            {challenges.length === 0 ? (
              <li className="flex gap-2.5 px-5 py-4 text-sm text-espresso">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-good" aria-hidden="true" />
                This stage is in good shape.
              </li>
            ) : null}
          </ul>
        </>
      )}

      <NextStage project={project} stage={stage} blocking={blocking} />
    </Card>
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
      className={cx('flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors', active ? 'bg-cream text-night' : 'text-cream/85 hover:bg-white/10')}
    >
      {children}
    </button>
  )
}

function NextStage({ project, stage, blocking }: { project: Project; stage: StageKey; blocking: number }) {
  const idx = STAGES.findIndex((s) => s.key === stage)
  const next = STAGES[idx + 1]
  return (
    <div className="border-t border-line bg-cream/60 px-5 py-4">
      {next ? (
        <Link
          to={`/app/p/${project.id}/${next.key}`}
          className={cx(
            'flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
            blocking ? 'border border-line bg-paper text-espresso hover:border-tan' : 'bg-cocoa text-cream hover:bg-espresso',
          )}
        >
          <span>
            Next: Stage {next.n} · {next.title}
            {blocking ? <span className="block text-xs font-normal text-muted">You can move on, but I’d fix the checks first.</span> : null}
          </span>
          <ArrowRight className="size-4 shrink-0" />
        </Link>
      ) : (
        <p className="flex gap-2 text-sm text-espresso">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-clay" aria-hidden="true" />
          Last stage. Download the starter, then ship v1 to your first ten users.
        </p>
      )}
    </div>
  )
}
