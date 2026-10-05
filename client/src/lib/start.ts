import { useProjects } from './store'

/** A short project name from the first words of the idea. Replaced by the AI's product name if one is drafted. */
export function nameFromIdea(idea: string): string {
  const words = idea.trim().replace(/\s+/g, ' ').split(' ')
  const short = words.slice(0, 6).join(' ')
  return (words.length > 6 ? `${short}…` : short) || 'Untitled idea'
}

/**
 * Frictionless start: one sentence becomes a project. Returns the URL to open; `?start=1` tells the
 * Ideation stage to draft the canvas with AI (or open the interview when no AI is available).
 */
export function startFromIdea(idea: string): string {
  const store = useProjects.getState()
  const id = store.createProject(nameFromIdea(idea))
  store.patch(id, 'ideation', { rawIdea: idea.trim() })
  return `/app/p/${id}/ideation?start=1`
}

export const EXAMPLE_IDEAS = [
  'An app for hostel students to pre-order canteen lunch between labs',
  'A queue tracker for shared hostel washing machines',
  'A marketplace for seniors to sell their old notes and lab manuals',
  'A lost-and-found board for our campus',
]
