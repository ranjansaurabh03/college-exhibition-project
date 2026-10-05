import { ArrowLeft, Pencil } from 'lucide-react'
import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import { Link, Navigate, NavLink, useParams } from 'react-router'
import { CoFounderPanel } from '../components/CoFounderPanel'
import { LogoMark } from '../components/Site'
import { ButtonLink, cx } from '../components/ui'
import { stageProgress } from '../lib/progress'
import { isStageKey, stageMeta, STAGES } from '../lib/stages'
import { useProject, useProjects } from '../lib/store'
import type { Project, StageKey } from '../lib/types'

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
  const meta = stageMeta(stage)

  return (
    <div className="min-h-screen">
      <WorkspaceHeader project={project} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-8">
        <main className="min-w-0">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Stage {meta.n} of 4</p>
            <h1 className="mt-1 text-2xl font-bold text-espresso sm:text-3xl">
              {meta.title}: <span className="text-clay">{meta.question}</span>
            </h1>
          </div>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-sand/60" />}>
            <View project={project} />
          </Suspense>
        </main>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <CoFounderPanel project={project} stage={stage} />
        </aside>
      </div>
    </div>
  )
}

function WorkspaceHeader({ project }: { project: Project }) {
  const progress = stageProgress(project)
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-3">
          <Link to="/" aria-label="AI Co-Founder home">
            <LogoMark className="size-7" />
          </Link>
          <Link to="/app" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> All ideas
          </Link>
          <span className="text-line">/</span>
          <ProjectName project={project} />
        </div>
        <nav aria-label="Stages" className="-mb-px flex gap-1 overflow-x-auto">
          {STAGES.map((s) => (
            <NavLink
              key={s.key}
              to={`/app/p/${project.id}/${s.key}`}
              className={({ isActive }) =>
                cx(
                  'flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors',
                  isActive ? 'border-cocoa text-espresso' : 'border-transparent text-muted hover:text-ink',
                )
              }
            >
              <span className="grid size-6 place-items-center rounded-full bg-sand text-xs text-espresso">{s.n}</span>
              {s.title}
              <span className="text-xs font-semibold text-muted">{progress[s.key]}%</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
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
        className="group inline-flex min-w-0 items-center gap-1.5 rounded-lg px-1.5 py-1 text-sm font-bold text-espresso hover:bg-sand/60"
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
      className="h-8 min-w-0 flex-1 rounded-lg border border-teal bg-white px-2 text-sm font-bold text-espresso outline-none sm:max-w-sm"
    />
  )
}

function MissingProject() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="font-display text-2xl font-bold text-espresso">Project not found</p>
        <p className="mt-2 text-muted">It may have been deleted, or it was created in a different browser.</p>
        <ButtonLink to="/app" className="mt-6">
          Back to your ideas
        </ButtonLink>
      </div>
    </div>
  )
}
