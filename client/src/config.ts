// Project-level settings shown across the site. Edit the credits before the exhibition.
export const SITE = {
  name: 'AI Co-Founder',
  tagline: 'From Idea to MVP',
  subtitle: 'Your technical partner for building products',
  repoUrl: 'https://github.com/ranjansaurabh03/college-exhibition-project',
  credits: {
    builtBy: ['Parth Gujar', 'Krish Kumar', 'Aadarsh Kumar', 'Shubh Tiwari', 'Saurabh Ranjan'],
    event: 'College Project Exhibition 2026',
  },
} as const

// Optional back end (Node + Express + MongoDB + Gemini), chosen at build time:
//   VITE_API_URL=same-origin            → the API is served from this site's /api (Vercel)
//   VITE_API_URL=https://example.com    → a separately hosted API (needs CORS)
//   unset                               → no API: the rule-based co-founder runs in the browser
const rawApi = String(import.meta.env.VITE_API_URL ?? '').trim()
export const API_ENABLED = rawApi !== ''
export const API_URL = rawApi === 'same-origin' ? '' : rawApi.replace(/\/$/, '')
