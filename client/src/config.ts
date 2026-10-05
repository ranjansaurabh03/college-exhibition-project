// Project-level settings shown across the site. Edit the credits before the exhibition.
export const SITE = {
  name: 'AI Co-Founder',
  tagline: 'From Idea to MVP',
  subtitle: 'Your technical partner for building products',
  repoUrl: 'https://github.com/ranjansaurabh03/college-exhibition-project',
  credits: {
    builtBy: ['Saurabh Ranjan'],
    event: 'College Project Exhibition 2026',
  },
} as const

// Optional backend (Node + Express + MongoDB + Claude). When unset, the app runs
// fully in the browser with the built-in rule-based co-founder engine.
export const API_URL: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
