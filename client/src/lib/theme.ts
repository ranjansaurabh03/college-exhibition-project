import { create } from 'zustand'

export type Theme = 'dark' | 'light'
const KEY = 'ai-cofounder:theme'

function initial(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f6f6f8' : '#07080c')
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Theme still applies for this visit.
  }
}

export const useTheme = create<{ theme: Theme; toggle: () => void }>()((set, get) => ({
  theme: initial(),
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    apply(next)
    set({ theme: next })
  },
}))
