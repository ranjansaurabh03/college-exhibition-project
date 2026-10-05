import { ArrowLeft, LoaderCircle, MessagesSquare, Pencil, Wand2, X } from 'lucide-react'
import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import { Link, Navigate, NavLink, useParams, useSearchParams } from 'react-router'
import { SyncStatus } from '../components/Cloud'
import { ASK_AI_EVENT } from '../components/CommandPalette'
import { CoFounderPanel } from '../components/CoFounderPanel'
import { LogoMark, PaletteButton, ThemeToggle } from '../components/Site'
import { Button, ButtonLink, cx } from '../components/ui'
import { stageProgress } from '../lib/progress'
import { useServer } from '../lib/server'
import { isStageKey, stageMeta, STAGES } from '../lib/stages'
import { useProject, useProjects } from '../lib/store'
import type { Project, StageKey } from '../lib/types'
import { useAiDraft } from '../lib/useAiDraft'

export interface StageProps {
  project: Project
}

// Code-split per stage: each stage view is its own chunk.
const STAGE_VIEWS: Record<StageKey, ComponentType<StageProps>> = {
  ideation: lazy(() => import('./stages/Ideation')),
  validation: lazy(() => import('./stages/Validation')),
  scoping: lazy(() => import('./stages/Scoping')),
  building: lazy(() => import('./stages/Building')),
}

export default function Workspace() {
  const { projectId, stage } = useParams()
  const project = useProject(projectId)

  useEffect(() => {
    if (project) document.title = `${project.name} · AI Co-Founder`
    return () => {
      document.title = 'AI Co-Founder — From Idea to MVP'
    }
  }, [project])

  if (!project) return <MissingProject />
  if (!isStageKey(stage)) return <Navigate to={`/app/p/${project.id}/ideation`} replace />

  const View = STAGE_VIEWS[stage]

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <WorkspaceHeader project={project} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-8">
        <main className="min-w-0">
          <StageHeader key={stage} project={project} stage={stage} />
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-subtle" />}>
            <View project={project} />
          </Suspense>
        </main>
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <CoFounderPanel project={project} stage={stage} />
        </aside>
      </div>
      <MobileCoFounder project={project} stage={stage} />
    </div>
  )
}

function StageHeader({ project, stage }: { project: Project; stage: StageKey }) {
  const meta = stageMeta(stage)
  const draft = useAiDraft(project, stage)
  const checked = useServer((s) => s.checked)
  const [params, setParams] = useSearchParams()

  // ?draft=1 (from the command palette) drafts this stage once the server status is known.
  useEffect(() => {
    if (params.get('draft') !== '1' || !checked) return
    setParams({}, { replace: true })
    if (draft.enabled) void draft.run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, checked])

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Stage {meta.n} of 4</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-[32px]">
          {meta.title}
          <span className="font-serif font-normal italic text-muted"> · {meta.question}</span>
        </h1>
      </div>
      {draft.enabled ? (
        <Button variant="ai" onClick={() => void draft.run()} disabled={draft.running} className="shrink-0">
          {draft.running ? <LoaderCircle className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          {draft.running ? 'Drafting…' : 'Draft with AI'}
        </Button>
      ) : null}
    </div>
  )
}

function WorkspaceHeader({ project }: { project: Project }) {
  const progress = stageProgress(project)
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/75 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-2">
          <Link to="/" aria-label="AI Co-Founder home" className="shrink-0">
            <LogoMark className="size-7" />
          </Link>
          <Link to="/app" className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-semibold text-muted hover:bg-subtle hover:text-strong">
            <ArrowLeft className="size-4" /> All ideas
          </Link>
          <span className="text-line-strong">/</span>
          <ProjectName project={project} />
          <div className="ml-auto flex items-center gap-1">
            <SyncStatus className="mr-2 hidden xl:flex" />
            <PaletteButton />
            <ThemeToggle />
          </div>
        </div>
        <nav aria-label="Stages" className="-mx-1 flex gap-1.5 overflow-x-auto pb-3">
          {STAGES.map((s) => (
            <NavLink
              key={s.key}
              to={`/app/p/${project.id}/${s.key}`}
              className={({ isActive }) =>
                cx(
                  'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-all',
                  isActive ? 'border-transparent bg-primary text-on-primary' : 'border-line bg-surface/60 text-muted hover:border-line-strong hover:text-strong',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <s.icon className="size-3.5" aria-hidden="true" />
                  {s.title}
                  <ProgressRing value={progress[s.key]} active={isActive} />
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

function ProgressRing({ value, active }: { value: number; active: boolean }) {
  const r = 6
  const c = 2 * Math.PI * r
  return (
    <span className="relative inline-flex items-center gap-1" title={`${value}% complete`}>
      <svg viewBox="0 0 16 16" className="size-4 -rotate-90" aria-hidden="true">
        <circle cx="8" cy="8" r={r} fill="none" strokeWidth="2" className={active ? 'stroke-on-primary/25' : 'stroke-line-strong'} />
        <circle
          cx="8"
          cy="8"
          r={r}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className={cx('transition-[stroke-dashoffset] duration-500', value >= 100 ? 'stroke-good' : active ? 'stroke-on-primary' : 'stroke-accent')}
        />
      </svg>
      <span className="sr-only">{value}% complete</span>
    </span>
  )
}

/** On phones the co-founder lives in a bottom sheet behind a floating button. */
function MobileCoFounder({ project, stage }: { project: Project; stage: StageKey }) {
  const [open, setOpen] = useState(false)
  const ai = useServer((s) => s.status?.ai.enabled ?? false)

  useEffect(() => {
    const onAsk = () => {
      if (window.matchMedia('(max-width: 1023px)').matches) setOpen(true)
    }
    window.addEventListener(ASK_AI_EVENT, onAsk)
    return () => window.removeEventListener(ASK_AI_EVENT, onAsk)
  }, [])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx(
          'fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-[0_12px_40px_-10px_rgb(124_92_255/0.8)]',
          'bg-ai active:scale-95',
        )}
      >
        <MessagesSquare className="size-4" /> {ai ? 'Ask AI' : 'Co-founder'}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-canvas/60 backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
          <div className="fade-up max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border-t border-line-strong bg-canvas p-3 pb-6" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Your co-founder">
            <div className="mb-2 flex justify-between px-1">
              <span className="mx-auto h-1 w-10 rounded-full bg-line-strong" aria-hidden="true" />
              <button type="button" onClick={() => setOpen(false)} className="absolute right-4 rounded-lg p-1.5 text-muted hover:text-strong" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <CoFounderPanel project={project} stage={stage} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ProjectName({ project }: { project: Project }) {
  const renameProject = useProjects((s) => s.renameProject)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(project.name)

  useEffect(() => setValue(project.name), [project.name])

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group inline-flex min-w-0 items-center gap-1.5 rounded-lg px-1.5 py-1 text-[13px] font-semibold text-strong hover:bg-subtle"
        title="Rename project"
      >
        <span className="truncate">{project.name}</span>
        <Pencil className="size-3.5 shrink-0 text-muted opacity-0 group-hover:opacity-100" aria-hidden="true" />
      </button>
    )
  }
  const commit = () => {
    renameProject(project.id, value)
    setEditing(false)
  }
  return (
    <input
      autoFocus
      aria-label="Project name"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') {
          setValue(project.name)
          setEditing(false)
        }
      }}
      className="h-8 min-w-0 flex-1 rounded-lg border border-accent bg-field px-2 text-[13px] font-semibold text-strong outline-none sm:max-w-sm"
    />
  )
}

function MissingProject() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-2xl font-semibold text-strong">Project not found</p>
        <p className="mt-2 text-muted">It may have been deleted, or it was created in a different browser.</p>
        <ButtonLink to="/app" className="mt-6">
          Back to your ideas
        </ButtonLink>
      </div>
    </div>
  )
}
