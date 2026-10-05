import { ArrowRight, Download, FolderOpen, Plus, Sparkles, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { EngineNote } from '../components/EngineNote'
import { SiteFooter, SiteHeader } from '../components/Site'
import { Button, Card, Eyebrow, Pill, TextInput, cx } from '../components/ui'
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
  const [name, setName] = useState('')
  const [importError, setImportError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function create(e: FormEvent) {
    e.preventDefault()
    const id = createProject(name)
    setName('')
    navigate(`/app/p/${id}/ideation`)
  }

  function openDemo() {
    navigate(`/app/p/${loadDemo()}/ideation`)
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow>Workspace</Eyebrow>
            <h1 className="mt-2 text-3xl font-bold text-espresso sm:text-4xl">Your ideas</h1>
            <p className="mt-2 max-w-xl text-muted">
              Every idea moves through four stages. Start messy; your co-founder will push back until it’s sharp.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={openDemo}>
              <Sparkles className="size-4" /> {projects.some((p) => p.isDemo) ? 'Reset demo project' : 'Load demo project'}
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Import
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => onImport(e.target.files?.[0])}
            />
          </div>
        </div>

        <Card className="mt-8 p-5">
          <form onSubmit={create} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label htmlFor="new-idea" className="text-sm font-semibold text-espresso sm:w-40">
              Start a new idea
            </label>
            <TextInput
              id="new-idea"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Working title, e.g. “Hostel laundry tracker”"
              className="flex-1"
            />
            <Button type="submit">
              <Plus className="size-4" /> Create
            </Button>
          </form>
          {importError ? <p className="mt-3 text-sm text-bad">{importError}</p> : null}
        </Card>

        {projects.length === 0 ? (
          <EmptyState onDemo={openDemo} />
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </ul>
        )}

        <EngineNote className="mt-10" />
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
  const summary = line.includes('[') ? p.ideation.rawIdea || 'No idea written yet. Open it to start the interview.' : line
  const nextStage = STAGES.find((s) => progress[s.key] < 100) ?? STAGES[3]

  function exportJson() {
    const safe = p.name.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'project'
    downloadText(`${safe}.ai-cofounder.json`, JSON.stringify(p, null, 2), 'application/json')
  }

  return (
    <li>
      <Card className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold text-espresso">{p.name}</h2>
              {p.isDemo ? <Pill tone="teal">Demo</Pill> : null}
            </div>
            <p className="mt-0.5 text-xs text-muted">Updated {timeAgo(p.updatedAt)}</p>
          </div>
          <span className="text-sm font-semibold text-espresso">{overall}%</span>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink/85">{summary}</p>
        <ol className="mt-4 grid grid-cols-4 gap-2">
          {STAGES.map((s) => (
            <li key={s.key}>
              <Link to={`/app/p/${p.id}/${s.key}`} className="group block">
                <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-muted group-hover:text-ink">
                  <s.icon className="size-3" aria-hidden="true" /> {s.title}
                </span>
                <Meter value={progress[s.key]} tone={progress[s.key] >= 100 ? 'good' : 'neutral'} label={`${s.title} ${progress[s.key]}% complete`} />
              </Link>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Link
            to={`/app/p/${p.id}/${nextStage.key}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-cocoa px-3.5 text-sm font-semibold text-cream hover:bg-espresso"
          >
            <FolderOpen className="size-4" /> Continue: {nextStage.title} <ArrowRight className="size-3.5" />
          </Link>
          <Button variant="ghost" size="sm" onClick={exportJson} title="Download this project as JSON">
            <Download className="size-4" /> Export
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
      </Card>
    </li>
  )
}

function EmptyState({ onDemo }: { onDemo: () => void }) {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-tan bg-paper/60 px-6 py-14 text-center">
      <p className="font-display text-2xl font-bold text-espresso">No ideas yet</p>
      <p className="mx-auto mt-2 max-w-md text-muted">
        Create one above, or load the demo project to see all four stages filled in for a real campus problem.
      </p>
      <Button className="mt-6" onClick={onDemo}>
        <Sparkles className="size-4" /> Load demo project
      </Button>
    </div>
  )
}
