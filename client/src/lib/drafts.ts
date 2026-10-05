import { api } from './api'
import { uid } from './factory'
import type { Building, EntityField, Feature, Ideation, LandingOverrides, Project, Scoping, StageKey } from './types'

/** The project data the model sees: the canvases, not the chat transcripts. */
export function contextOf(p: Project) {
  return {
    name: p.name,
    ideation: p.ideation,
    validation: { ...p.validation, responses: p.validation.responses.slice(0, 3000) },
    scoping: p.scoping,
    building: p.building,
  }
}

export interface DraftResponse {
  draft: Record<string, unknown>
  model: string
}

export function requestDraft(stage: StageKey, project: Project, signal?: AbortSignal) {
  return api<DraftResponse>('/ai/draft', { method: 'POST', body: { stage, project: contextOf(project) }, signal })
}

const isEmpty = (v: unknown) =>
  v === undefined || v === null || v === 0 || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0)

export interface Merge {
  partial: Record<string, unknown>
  filled: string[]
}

/**
 * Applies an AI draft without overwriting the founder: only fields that are still empty are
 * filled. Returns the partial update for the stage and the names of the fields it filled.
 */
export function mergeDraft(stage: StageKey, project: Project, draft: Record<string, unknown>): Merge {
  const partial: Record<string, unknown> = {}
  const filled: string[] = []
  switch (stage) {
    case 'ideation': {
      const current = project.ideation as unknown as Record<string, unknown>
      for (const [key, value] of Object.entries(draft)) {
        if (!(key in current) || isEmpty(value) || !isEmpty(current[key])) continue
        partial[key] = value
        filled.push(key)
      }
      return { partial: partial as Partial<Ideation>, filled }
    }
    case 'validation': {
      const current = project.validation.landing
      const incoming = (draft.landing ?? {}) as Partial<LandingOverrides>
      const landing = { ...current }
      for (const key of ['headline', 'subheadline', 'cta'] as const) {
        if (isEmpty(current[key]) && !isEmpty(incoming[key])) {
          landing[key] = String(incoming[key])
          filled.push(key)
        }
      }
      return { partial: filled.length ? { landing } : {}, filled }
    }
    case 'scoping': {
      const current = project.scoping
      const features = draft.features as Omit<Feature, 'id'>[] | undefined
      if (!current.features.length && features?.length) {
        partial.features = features.map((f) => ({ ...f, id: uid('f_') }))
        filled.push('features')
      }
      if (!current.coreFlow.length && Array.isArray(draft.coreFlow) && draft.coreFlow.length) {
        partial.coreFlow = draft.coreFlow
        filled.push('coreFlow')
      }
      if (isEmpty(current.outcome) && !isEmpty(draft.outcome)) {
        partial.outcome = draft.outcome
        filled.push('outcome')
      }
      return { partial: partial as Partial<Scoping>, filled }
    }
    case 'building': {
      const current = project.building
      if (isEmpty(current.entityName) && !isEmpty(draft.entityName)) {
        partial.entityName = draft.entityName
        filled.push('entityName')
      }
      const fields = draft.fields as Omit<EntityField, 'id'>[] | undefined
      if (!current.fields.length && fields?.length) {
        partial.fields = fields.map((f) => ({ ...f, id: uid('b_') }))
        filled.push('fields')
      }
      return { partial: partial as Partial<Building>, filled }
    }
  }
}
