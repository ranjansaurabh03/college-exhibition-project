import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { fetchStatus, type ServerStatus } from './api'

interface ServerState {
  status: ServerStatus | null
  checked: boolean
  check: () => Promise<void>
}

/** Capabilities of the connected API. `status` stays null on a static host with no API. */
export const useServer = create<ServerState>()((set, get) => ({
  status: null,
  checked: false,
  check: async () => {
    if (get().checked) return
    const status = await fetchStatus()
    set({ status, checked: true })
  },
}))

export interface SessionUser {
  id: string
  name: string
  email: string
}

interface AuthState {
  token: string | null
  user: SessionUser | null
  setSession: (token: string, user: SessionUser) => void
  logout: () => void
}

const storage = createJSONStorage(() => {
  try {
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

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'ai-cofounder:auth', storage },
  ),
)
