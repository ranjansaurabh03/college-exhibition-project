import type { Building, Ideation, Project, Scoping, Validation } from './types'

export function uid(prefix = ''): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14)
  return prefix + rand
}

export function emptyIdeation(): Ideation {
  return {
    rawIdea: '',
    productName: '',
    targetUser: '',
    userContext: '',
    pain: '',
    frequency: '',
    severity: 0,
    currentSolution: '',
    alternatives: '',
    differentiator: '',
    whyNow: '',
    willingnessToPay: '',
    outcome: '',
    approach: '',
  }
}

export function emptyValidation(): Validation {
  return {
    landing: { headline: '', subheadline: '', cta: '' },
    signals: {
      visitors: 0,
      signups: 0,
      outreachSent: 0,
      replies: 0,
      calls: 0,
      surveyResponses: 0,
      veryDisappointed: 0,
      preorders: 0,
    },
    responses: '',
  }
}

export function emptyScoping(): Scoping {
  return { features: [], coreFlow: [], outcome: '', weeksTarget: 3, hoursPerWeek: 20 }
}

export function emptyBuilding(): Building {
  return { entityName: '', fields: [] }
}

export function newProject(name: string): Project {
  const now = Date.now()
  return {
    id: uid('p_'),
    name: name.trim() || 'Untitled idea',
    createdAt: now,
    updatedAt: now,
    ideation: emptyIdeation(),
    validation: emptyValidation(),
    scoping: emptyScoping(),
    building: emptyBuilding(),
    chat: {},
  }
}

/** Fills in any fields missing from older saved projects. */
export function normalizeProject(p: Partial<Project> & { id: string }): Project {
  const base = newProject(p.name ?? 'Untitled idea')
  return {
    ...base,
    ...p,
    ideation: { ...base.ideation, ...p.ideation },
    validation: {
      ...base.validation,
      ...p.validation,
      landing: { ...base.validation.landing, ...p.validation?.landing },
      signals: { ...base.validation.signals, ...p.validation?.signals },
    },
    scoping: { ...base.scoping, ...p.scoping },
    building: { ...base.building, ...p.building },
    chat: { ...p.chat },
  }
}
