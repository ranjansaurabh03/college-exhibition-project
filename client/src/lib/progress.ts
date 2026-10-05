import { INTERVIEW, isAnswered } from './engine/ideation'
import { autoVerdict } from './engine/scoping'
import { lines } from './engine/text'
import { interpretSignals } from './engine/validation'
import type { Project, StageKey } from './types'

export function stageProgress(p: Project): Record<StageKey, number> {
  const answered = INTERVIEW.filter((s) => isAnswered(p.ideation, s.field)).length
  const ideation = Math.round((answered / INTERVIEW.length) * 100)

  const signals = interpretSignals(p.validation.signals)
  const replies = lines(p.validation.responses).length
  const validation = (signals.hasData ? 60 : 0) + Math.min(replies, 4) * 10

  const s = p.scoping
  const decided = s.features.length > 0 && s.features.every((f) => f.override || autoVerdict(f) !== 'undecided')
  const scoping = (s.features.length ? 30 : 0) + (decided ? 20 : 0) + (s.coreFlow.length ? 30 : 0) + (s.outcome.trim() ? 20 : 0)

  const building = (p.building.entityName.trim() ? 40 : 0) + (p.building.fields.length ? 60 : 0)

  return { ideation, validation, scoping, building }
}

export function overallProgress(p: Project): number {
  const s = stageProgress(p)
  return Math.round((s.ideation + s.validation + s.scoping + s.building) / 4)
}

export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000))
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  return d === 1 ? 'yesterday' : `${d} days ago`
}
