import { FlaskConical, Hammer, Lightbulb, Scissors, type LucideIcon } from 'lucide-react'
import type { StageKey } from './types'

export interface StageMeta {
  key: StageKey
  n: number
  title: string
  icon: LucideIcon
  question: string
}

export const STAGES: StageMeta[] = [
  { key: 'ideation', n: 1, title: 'Ideation', icon: Lightbulb, question: 'Who is it for, and does it need to exist?' },
  { key: 'validation', n: 2, title: 'Validation', icon: FlaskConical, question: 'Do strangers actually want it?' },
  { key: 'scoping', n: 3, title: 'Scoping', icon: Scissors, question: 'What is the smallest thing worth shipping?' },
  { key: 'building', n: 4, title: 'Building', icon: Hammer, question: 'What does the code look like?' },
]

export function stageMeta(key: StageKey): StageMeta {
  return STAGES.find((s) => s.key === key)!
}

export function isStageKey(v: string | undefined): v is StageKey {
  return STAGES.some((s) => s.key === v)
}
