export const STAGE_KEYS = ['ideation', 'validation', 'scoping', 'building'] as const
export type StageKey = (typeof STAGE_KEYS)[number]

export type Frequency = '' | 'daily' | 'weekly' | 'monthly' | 'rarely'
export type Willingness = '' | 'yes' | 'maybe' | 'no'
export type YesNo = '' | 'yes' | 'no'
export type Effort = 'S' | 'M' | 'L'
export type Decision = 'keep' | 'later' | 'cut'

export interface Ideation {
  rawIdea: string
  productName: string
  /** Who exactly is the user? */
  targetUser: string
  /** When / where does the pain hit? */
  userContext: string
  /** What is the pain? */
  pain: string
  frequency: Frequency
  /** 1–5, 0 = not answered */
  severity: number
  /** How do they solve it today? */
  currentSolution: string
  /** Existing products or workarounds, one per line */
  alternatives: string
  differentiator: string
  whyNow: string
  willingnessToPay: Willingness
  /** One-liner: "[Product] helps [user] do [outcome] by [approach]" */
  outcome: string
  approach: string
}

export interface LandingOverrides {
  headline: string
  subheadline: string
  cta: string
}

export interface Signals {
  visitors: number
  signups: number
  outreachSent: number
  replies: number
  calls: number
  surveyResponses: number
  veryDisappointed: number
  preorders: number
}

export interface Validation {
  landing: LandingOverrides
  signals: Signals
  /** Pasted replies from outreach / surveys, one per line */
  responses: string
}

export interface Feature {
  id: string
  name: string
  /** Does this feature change whether someone pays (or switches)? */
  pays: YesNo
  /** Is it required for the one core flow? */
  core: YesNo
  effort: Effort
  /** Manual override of the co-founder's verdict */
  override?: Decision
}

export interface Scoping {
  features: Feature[]
  coreFlow: string[]
  outcome: string
  weeksTarget: number
  hoursPerWeek: number
}

export type FieldType = 'String' | 'Number' | 'Boolean' | 'Date'

export interface EntityField {
  id: string
  name: string
  type: FieldType
  required: boolean
}

export interface Building {
  entityName: string
  fields: EntityField[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'cofounder'
  text: string
  at: number
}

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  isDemo?: boolean
  ideation: Ideation
  validation: Validation
  scoping: Scoping
  building: Building
  /** Guided-interview transcript (rule engine). */
  chat: Partial<Record<StageKey, ChatMessage[]>>
  /** Conversations with Claude, one per stage. */
  aiChat: Partial<Record<StageKey, ChatMessage[]>>
}
