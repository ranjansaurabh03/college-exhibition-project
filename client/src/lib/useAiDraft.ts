import { create } from 'zustand'
import { mergeDraft, requestDraft } from './drafts'
import { useServer } from './server'
import { useProjects } from './store'
import { toast } from './toast'
import type { Project, StageKey } from './types'

const LABEL: Record<StageKey, string> = {
  ideation: 'canvas field',
  validation: 'landing-page line',
  scoping: 'scope section',
  building: 'data-model section',
}

// Shared per project and stage, so every "Draft with AI" control (the header button, the idea-box start)
// shows the same Drafting… state and a second click can't start a duplicate draft.
const useDrafting = create<Record<string, boolean>>()(() => ({}))
const setDrafting = (key: string, on: boolean) => useDrafting.setState({ [key]: on })

/** "Draft with AI" for one stage: fills empty fields only, with an Undo in the toast. */
export function useAiDraft(project: Project, stage: StageKey) {
  const enabled = useServer((s) => s.status?.ai.enabled ?? false)
  const key = `${project.id}:${stage}`
  const running = useDrafting((s) => Boolean(s[key]))

  async function run({ renameIfNamed }: { renameIfNamed?: string } = {}) {
    if (useDrafting.getState()[key]) return
    setDrafting(key, true)
    try {
      const { draft, model } = await requestDraft(stage, project)
      const store = useProjects.getState()
      const latest = store.projects.find((p) => p.id === project.id)
      if (!latest) return
      const { partial, filled } = mergeDraft(stage, latest, draft)
      if (!filled.length) {
        toast('Nothing to fill: every field already has your answer.')
        return
      }
      const before = latest[stage]
      const nameBefore = latest.name
      store.patch(project.id, stage, partial as never)
      const productName = typeof partial.productName === 'string' ? partial.productName : ''
      const renamed = Boolean(renameIfNamed && productName && latest.name === renameIfNamed)
      if (renamed) store.renameProject(project.id, productName)
      const n = filled.length
      toast(`${prettyModel(model)} drafted ${n} ${LABEL[stage]}${n > 1 ? 's' : ''}. Edit anything you like.`, {
        tone: 'ai',
        action: {
          label: 'Undo',
          run: () => {
            useProjects.getState().patch(project.id, stage, before as never)
            if (renamed) useProjects.getState().renameProject(project.id, nameBefore)
          },
        },
      })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'The AI draft failed. Try again.', { tone: 'error' })
    } finally {
      setDrafting(key, false)
    }
  }

  return { enabled, running, run }
}

export function prettyModel(model: string) {
  return model.replace(/^gemini-/, 'Gemini ').replace(/-/g, ' ').replace(/\b(flash|lite|pro)\b/g, (w) => w[0].toUpperCase() + w.slice(1))
}
