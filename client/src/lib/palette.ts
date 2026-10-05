import { create } from 'zustand'

export const usePalette = create<{ open: boolean; setOpen: (open: boolean) => void }>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))

export const openPalette = () => usePalette.getState().setOpen(true)

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
export const PALETTE_SHORTCUT = isMac ? '⌘K' : 'Ctrl K'
