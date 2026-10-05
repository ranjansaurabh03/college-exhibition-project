import { create } from 'zustand'
import { api, ApiError } from './api'
import { normalizeProject } from './factory'
import { useAuth } from './server'
import { useProjects } from './store'
import type { Project } from './types'

export type SyncState = 'off' | 'syncing' | 'synced' | 'error'

export const useSync = create<{ state: SyncState; error: string | null; lastSyncedAt: number | null }>()(() => ({
  state: 'off',
  error: null,
  lastSyncedAt: null,
}))

// updatedAt of each project as last saved to (or loaded from) the cloud.
const savedVersion = new Map<string, number>()
let knownIds = new Set<string>()
let unsubscribe: (() => void) | null = null
let timer: number | undefined
let running: Promise<void> | null = null

const setState = (state: SyncState, error: string | null = null) =>
  useSync.setState({ state, error, ...(state === 'synced' ? { lastSyncedAt: Date.now() } : {}) })

function handleAuthError(err: unknown) {
  if (err instanceof ApiError && err.status === 401) {
    stopSync()
    useAuth.getState().logout()
    return 'Your session expired. Sign in again to keep syncing.'
  }
  return err instanceof Error ? err.message : 'Sync failed'
}

/** Pushes every project that changed since it was last saved, and deletes removed ones. */
async function pushChanges(token: string) {
  const { projects } = useProjects.getState()
  const ids = new Set(projects.map((p) => p.id))
  for (const id of knownIds) {
    if (!ids.has(id)) {
      await api(`/projects/${encodeURIComponent(id)}`, { method: 'DELETE', token }).catch((err) => {
        if (!(err instanceof ApiError && err.status === 404)) throw err
      })
      savedVersion.delete(id)
    }
  }
  knownIds = ids
  for (const p of projects) {
    if (savedVersion.get(p.id) === p.updatedAt) continue
    try {
      await api(`/projects/${encodeURIComponent(p.id)}`, { method: 'PUT', token, body: p })
      savedVersion.set(p.id, p.updatedAt)
    } catch (err) {
      // Another device saved a newer copy: take it.
      const newer = err instanceof ApiError && err.status === 409 ? (err.body as { project?: Project }).project : undefined
      if (!newer) throw err
      const fresh = normalizeProject(newer)
      savedVersion.set(fresh.id, fresh.updatedAt)
      useProjects.getState().replaceAll(useProjects.getState().projects.map((x) => (x.id === fresh.id ? fresh : x)))
    }
  }
}

function schedule(token: string) {
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    running = (running ?? Promise.resolve())
      .then(async () => {
        setState('syncing')
        await pushChanges(token)
        setState('synced')
      })
      .catch((err) => setState('error', handleAuthError(err)))
  }, 1200)
}

/** Loads the cloud copies, merges them with this browser's projects (newest wins), then keeps them in sync. */
export async function startSync(token: string) {
  stopSync()
  setState('syncing')
  try {
    const remote = (await api<Project[]>('/projects', { token })).map((p) => normalizeProject(p))
    const local = new Map(useProjects.getState().projects.map((p) => [p.id, p]))
    const merged: Project[] = []
    for (const r of remote) {
      const l = local.get(r.id)
      if (!l || r.updatedAt >= l.updatedAt) {
        merged.push(r)
        savedVersion.set(r.id, r.updatedAt)
      } else {
        merged.push(l)
      }
      local.delete(r.id)
    }
    merged.push(...local.values())
    merged.sort((a, b) => b.updatedAt - a.updatedAt)
    knownIds = new Set(remote.map((r) => r.id))
    useProjects.getState().replaceAll(merged)
    await pushChanges(token)
    setState('synced')
    unsubscribe = useProjects.subscribe(() => schedule(token))
  } catch (err) {
    setState('error', handleAuthError(err))
  }
}

export function stopSync() {
  unsubscribe?.()
  unsubscribe = null
  window.clearTimeout(timer)
  savedVersion.clear()
  knownIds = new Set()
  setState('off')
}
