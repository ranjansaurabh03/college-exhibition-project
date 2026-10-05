/** Runs `load` shortly after the page has finished loading, so it never competes with the first paint. */
export function prefetchAfterLoad(load: () => void) {
  const run = () => window.setTimeout(load, 300)
  if (document.readyState === 'complete') run()
  else window.addEventListener('load', run, { once: true })
}

const quiet = (p: Promise<unknown>) => void p.catch(() => {})

/** The workspace and its first stage: what opens after a founder types an idea. */
export function prefetchWorkspace() {
  quiet(import('../pages/Workspace'))
  quiet(import('../pages/stages/Ideation'))
}

export function prefetchDashboard() {
  quiet(import('../pages/Dashboard'))
}
