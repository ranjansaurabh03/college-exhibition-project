export function words(s: string): string[] {
  return s.trim().split(/\s+/).filter(Boolean)
}

export function wordCount(s: string): number {
  return words(s).length
}

export function lines(s: string): string[] {
  return s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}

export function capitalize(s: string): string {
  const t = s.trim()
  return t ? t[0].toUpperCase() + t.slice(1) : t
}

/** Lower-cases the first letter unless the word looks like an acronym or proper noun run ("UPSC"). */
export function lowerFirst(s: string): string {
  const t = s.trim()
  if (t.length < 2) return t.toLowerCase()
  if (t[1] === t[1].toUpperCase() && /[A-Z]/.test(t[1])) return t
  return t[0].toLowerCase() + t.slice(1)
}

export function stripEndPunct(s: string): string {
  return s.trim().replace(/[\s.!?;,:]+$/u, '')
}

export function asSentence(s: string): string {
  const t = stripEndPunct(s)
  return t ? capitalize(t) + '.' : ''
}

export function clamp(n: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, n))
}

export function pct(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0
}

/** Escapes text for safe inclusion in generated HTML. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** Finds whole-word / whole-phrase matches of any term in text (case-insensitive). */
export function findTerms(text: string, terms: readonly string[]): string[] {
  const hay = ` ${text
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/[^\p{L}\p{N}₹$%'\s-]/gu, ' ')
    .replace(/\s+/g, ' ')} `
  return terms.filter((t) => hay.includes(` ${t} `))
}
