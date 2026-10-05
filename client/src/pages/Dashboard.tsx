import { ArrowRight, Download, FilePlus2, Lightbulb, Sparkles, Trash2, Upload } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { CloudCard } from '../components/Cloud'
import { EngineNote } from '../components/EngineNote'
import { IdeaComposer } from '../components/IdeaComposer'
import { SiteFooter, SiteHeader } from '../components/Site'
import { Button, ButtonLink, Eyebrow, Pill, SpotlightCard, cx } from '../components/ui'
import { Meter } from '../components/viz'
import { oneLiner } from '../lib/engine/ideation'
import { downloadText } from '../lib/download'
import { overallProgress, stageProgress, timeAgo } from '../lib/progress'
import { STAGES } from '../lib/stages'
import { useProjects } from '../lib/store'
import type { Project } from '../lib/types'

export default function Dashboard() {
  const projects = useProjects((s) => s.projects)
  const createProject = useProjects((s) => s.createProject)
  const loadDemo = useProjects((s) => s.loadDemo)
  const importProject = useProjects((s) => s.importProject)
  const navigate = useNavigate()
  const [importError, setImportError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function openDemo() {
    navigate(`/app/p/${loadDemo()}/ideation`)
  }

  function startBlank() {
    navigate(`/app/p/${createProject('Untitled idea')}/ideation`)
  }

  async function onImport(file: File | undefined) {
    if (!file) return
    setImportError('')
    try {
      const id = importProject(JSON.parse(await file.text()))
      navigate(`/app/p/${id}/ideation`)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not read that file.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-end">
          <div className="fade-up">
            <Eyebrow>Workspace</Eyebrow>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Your <span className="font-serif font-normal italic tracking-normal text-gradient">ideas</span>
            </h1>
            <p className="mt-3 max-w-md text-muted">
              Every idea moves through four stages. Start messy; your co-founder pushes back until it’s sharp.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="glass" size="sm" onClick={openDemo}>
                <Sparkles className="size-3.5" /> {projects.some((p) => p.isDemo) ? 'Reset demo project' : 'Load demo project'}
              </Button>
              <Button variant="glass" size="sm" onClick={startBlank}>
                <FilePlus2 className="size-3.5" /> Blank canvas
              </Button>
              <Button variant="glass" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="size-3.5" /> Import
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => onImport(e.target.files?.[0])}
              />
            </div>
            {importError ? <p className="mt-3 text-sm text-bad">{importError}</p> : null}
          </div>
          <IdeaComposer className="fade-up" align="start" />
        </div>

        <CloudCard className="mt-10" />

        {projects.length === 0 ? (
          <EmptyState onDemo={openDemo} />
        ) : (
          <>
            <div className="mt-12 flex items-baseline justify-between gap-3 border-b border-line pb-3">
              <h2 className="text-sm font-semibold text-strong">Recent ideas</h2>
              <span className="font-mono text-xs text-muted">{projects.length}</span>
            </div>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </ul>
          </>
        )}

        <EngineNote className="mt-12" />
      </main>
      <SiteFooter />
    </div>
  )
}

function ProjectCard({ project: p }: { project: Project }) {
  const removeProject = useProjects((s) => s.removeProject)
  const [confirming, setConfirming] = useState(false)
  const progress = stageProgress(p)
  const overall = overallProgress(p)
  const line = oneLiner(p.ideation)
  const summary = line.includes('[') ? p.ideation.rawIdea || 'No idea written yet. Open it to start.' : line
  const nextStage = STAGES.find((s) => progress[s.key] < 100) ?? STAGES[3]

  function exportJson() {
    const safe = p.name.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'project'
    downloadText(`${safe}.ai-cofounder.json`, JSON.stringify(p, null, 2), 'application/json')
  }

  return (
    <li>
      <SpotlightCard className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-strong">
                <Link to={`/app/p/${p.id}/${nextStage.key}`} className="hover:underline hover:underline-offset-4">
                  {p.name}
                </Link>
              </h3>
              {p.isDemo ? <Pill tone="ai">Demo</Pill> : null}
            </div>
            <p className="mt-0.5 text-xs text-muted">Updated {timeAgo(p.updatedAt)}</p>
          </div>
          <OverallRing value={overall} />
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-body">{summary}</p>
        <ol className="mt-5 grid grid-cols-4 gap-2">
          {STAGES.map((s) => (
            <li key={s.key}>
              <Link to={`/app/p/${p.id}/${s.key}`} className="group block">
                <span className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-muted transition-colors group-hover:text-strong">
                  <s.icon className="size-3" aria-hidden="true" /> {s.title}
                </span>
                <Meter value={progress[s.key]} tone={progress[s.key] >= 100 ? 'good' : 'neutral'} label={`${s.title} ${progress[s.key]}% complete`} />
              </Link>
            </li>
          ))}
        </ol>
        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <ButtonLink to={`/app/p/${p.id}/${nextStage.key}`} size="sm">
              Continue: {nextStage.title} <ArrowRight className="size-3.5" />
            </ButtonLink>
            <Button variant="ghost" size="sm" onClick={exportJson} title="Download this project as JSON">
              <Download className="size-3.5" /> Export
            </Button>
            <div className="ml-auto">
              {confirming ? (
                <span className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => removeProject(p.id)}>
                    Delete
                  </Button>
                </span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirming(true)}
                  aria-label={`Delete ${p.name}`}
                  className={cx('text-muted hover:text-bad')}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </SpotlightCard>
    </li>
  )
}

/** Overall completion as a small gradient ring. */
function OverallRing({ value }: { value: number }) {
  const id = `ring${useId().replace(/[^\w-]/g, '')}`
  const r = 17
  const c = 2 * Math.PI * r
  return (
    <span className="relative grid size-11 shrink-0 place-items-center" title={`${value}% complete overall`}>
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7c5cff" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3" className="stroke-subtle" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          stroke={`url(#${id})`}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="font-mono text-[11px] font-semibold text-strong">{value}%</span>
    </span>
  )
}

function EmptyState({ onDemo }: { onDemo: () => void }) {
  return (
    <div className="mt-12 rounded-3xl border border-dashed border-line-strong bg-surface/40 px-6 py-14 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-ai text-white shadow-[0_12px_32px_-12px_rgb(124_92_255/0.8)]">
        <Lightbulb className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-5 text-xl font-semibold text-strong">No ideas yet</p>
      <p className="mx-auto mt-2 max-w-md text-muted">
        Type one in the box above, or open the demo project to see all four stages filled in for a real campus problem.
      </p>
      <Button variant="secondary" className="mt-6" onClick={onDemo}>
        <Sparkles className="size-4" /> Open the demo project
      </Button>
    </div>
  )
}
