import { AiError } from './gemini.js'

// Every AI draft is re-validated here before it reaches the browser: known keys only,
// enums enforced, lengths capped. The client then fills only fields the founder left empty.

const clip = (v, max) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '')
const oneOf = (v, options) => (options.includes(v) ? v : '')
const list = (v) => (Array.isArray(v) ? v : [])

export function sanitizeDraft(stage, raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new AiError('Gemini returned an unexpected draft. Try again.')
  switch (stage) {
    case 'ideation':
      return {
        productName: clip(raw.productName, 40),
        targetUser: clip(raw.targetUser, 160),
        userContext: clip(raw.userContext, 240),
        pain: clip(raw.pain, 400),
        frequency: oneOf(raw.frequency, ['daily', 'weekly', 'monthly', 'rarely']),
        severity: Number.isInteger(raw.severity) ? Math.min(5, Math.max(1, raw.severity)) : 0,
        currentSolution: clip(raw.currentSolution, 300),
        alternatives: list(raw.alternatives)
          .map((a) => clip(a, 160))
          .filter(Boolean)
          .slice(0, 4)
          .join('\n'),
        differentiator: clip(raw.differentiator, 300),
        whyNow: clip(raw.whyNow, 240),
        willingnessToPay: oneOf(raw.willingnessToPay, ['yes', 'maybe', 'no']),
        outcome: clip(raw.outcome, 120),
        approach: clip(raw.approach, 160),
      }
    case 'validation':
      return { landing: { headline: clip(raw.headline, 90), subheadline: clip(raw.subheadline, 220), cta: clip(raw.cta, 40) } }
    case 'scoping':
      return {
        features: list(raw.features)
          .slice(0, 12)
          .map((f) => ({
            name: clip(f?.name, 60),
            pays: oneOf(f?.pays, ['yes', 'no']),
            core: oneOf(f?.core, ['yes', 'no']),
            effort: oneOf(f?.effort, ['S', 'M', 'L']) || 'M',
          }))
          .filter((f) => f.name),
        coreFlow: list(raw.coreFlow)
          .map((s) => clip(s, 90))
          .filter(Boolean)
          .slice(0, 7),
        outcome: clip(raw.outcome, 160),
      }
    case 'building':
      return {
        entityName: clip(raw.entityName, 40).replace(/[^A-Za-z0-9]/g, ''),
        fields: list(raw.fields)
          .slice(0, 10)
          .map((f) => ({
            name: clip(f?.name, 40).replace(/[^A-Za-z0-9_]/g, ''),
            type: oneOf(f?.type, ['String', 'Number', 'Boolean', 'Date']) || 'String',
            required: Boolean(f?.required),
          }))
          .filter((f) => f.name),
      }
    default:
      throw new AiError('Unknown stage.', 400)
  }
}
