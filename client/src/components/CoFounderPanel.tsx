import { ArrowRight, Bot, CircleCheck, Lightbulb } from 'lucide-react'
import { Link } from 'react-router'
import { buildingChallenges } from '../lib/engine/building'
import { ideationChallenges, type Challenge } from '../lib/engine/ideation'
import { scopingChallenges } from '../lib/engine/scoping'
import { validationChallenges } from '../lib/engine/validation'
import { STAGES } from '../lib/stages'
import type { Project, StageKey } from '../lib/types'
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

export function focusField(field: string) {
  const el = document.getElementById(`field-${field}`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  window.setTimeout(() => el.focus({ preventScroll: true }), 350)
}

const LEVEL_ORDER: Record<Challenge['level'], number> = { block: 0, warn: 1, tip: 2 }

export function CoFounderPanel({ project, stage }: { project: Project; stage: StageKey }) {
  // Most important first; the engine's own order is kept within each level.
  const challenges = challengesFor(project, stage).sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level])
  const blocking = challenges.filter((c) => c.level === 'block').length
  const idx = STAGES.findIndex((s) => s.key === stage)
  const next = STAGES[idx + 1]

  return (
    <Card className="overflow-hidden">
      <div className="hero-gradient px-5 py-4 text-cream">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-white/12">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display font-bold leading-tight">Your co-founder</p>
            <p className="text-xs text-cream/70">Built-in rule engine · runs in your browser</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-cream/85">
          {challenges.length === 0
            ? 'Nothing to push back on here. Good work.'
            : blocking
              ? `${blocking} thing${blocking > 1 ? 's' : ''} to fix before moving on, plus ${challenges.length - blocking} to consider.`
              : `${challenges.length} thing${challenges.length > 1 ? 's' : ''} I’d push back on.`}
        </p>
      </div>

      <ul className="divide-y divide-line">
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
              {blocking ? <span className="block text-xs font-normal text-muted">You can move on, but I’d fix the above first.</span> : null}
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
    </Card>
  )
}
