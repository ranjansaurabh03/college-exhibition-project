import { create } from 'zustand'

export interface Toast {
  id: number
  message: string
  tone: 'default' | 'success' | 'error' | 'ai'
  action?: { label: string; run: () => void }
}

let next = 1

export const useToasts = create<{ toasts: Toast[]; dismiss: (id: number) => void }>()((set, get) => ({
  toasts: [],
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

/** Shows a short message at the bottom of the screen, optionally with one action such as Undo. */
export function toast(message: string, options: { tone?: Toast['tone']; action?: Toast['action']; duration?: number } = {}) {
  const id = next++
  const item: Toast = { id, message, tone: options.tone ?? 'default', action: options.action }
  useToasts.setState({ toasts: [...useToasts.getState().toasts.slice(-2), item] })
  window.setTimeout(() => useToasts.getState().dismiss(id), options.duration ?? (options.action ? 8000 : 4000))
  return id
}
