import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { demoProject, DEMO_ID } from './demo'
import { newProject, normalizeProject, uid } from './factory'
import type { ChatMessage, Project, StageKey } from './types'

type StageData = Pick<Project, StageKey>

interface ProjectsState {
  projects: Project[]
  createProject: (name: string) => string
  loadDemo: () => string
  removeProject: (id: string) => void
  renameProject: (id: string, name: string) => void
  patch: <K extends StageKey>(id: string, key: K, partial: Partial<StageData[K]>) => void
  setChat: (id: string, stage: StageKey, messages: ChatMessage[]) => void
  importProject: (data: unknown) => string
}

function touch(p: Project): Project {
  return { ...p, updatedAt: Date.now() }
}

// localStorage can throw (private mode, blocked storage); fall back to memory.
const safeStorage = createJSONStorage(() => {
  try {
    const probe = '__ai_cofounder_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    const mem = new Map<string, string>()
    return {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    }
  }
})

export const useProjects = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],

      createProject: (name) => {
        const p = newProject(name)
        set({ projects: [p, ...get().projects] })
        return p.id
      },

      loadDemo: () => {
        const demo = demoProject()
        set({ projects: [demo, ...get().projects.filter((p) => p.id !== DEMO_ID)] })
        return demo.id
      },

      removeProject: (id) => set({ projects: get().projects.filter((p) => p.id !== id) }),

      renameProject: (id, name) =>
        set({ projects: get().projects.map((p) => (p.id === id ? touch({ ...p, name: name.trim() || p.name }) : p)) }),

      patch: (id, key, partial) =>
        set({
          projects: get().projects.map((p) => (p.id === id ? touch({ ...p, [key]: { ...p[key], ...partial } }) : p)),
        }),

      setChat: (id, stage, messages) =>
        set({
          projects: get().projects.map((p) => (p.id === id ? touch({ ...p, chat: { ...p.chat, [stage]: messages } }) : p)),
        }),

      importProject: (data) => {
        if (!data || typeof data !== 'object' || !('ideation' in data)) {
          throw new Error('This file is not an AI Co-Founder project export.')
        }
        const incoming = normalizeProject({ ...(data as Project), id: uid('p_'), isDemo: false })
        set({ projects: [touch(incoming), ...get().projects] })
        return incoming.id
      },
    }),
    {
      name: 'ai-cofounder:v1',
      version: 1,
      storage: safeStorage,
      partialize: (s) => ({ projects: s.projects }),
      merge: (persisted, current) => {
        const saved = (persisted as { projects?: Project[] } | undefined)?.projects ?? []
        return { ...current, projects: saved.map((p) => normalizeProject(p)) }
      },
    },
  ),
)

export function useProject(id: string | undefined): Project | undefined {
  return useProjects((s) => s.projects.find((p) => p.id === id))
}
