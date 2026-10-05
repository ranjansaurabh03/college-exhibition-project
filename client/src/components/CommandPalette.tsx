import { ArrowRight, BookOpen, FolderOpen, Home, LayoutGrid, MessagesSquare, Moon, Search, Sparkles, Wand2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { usePalette } from '../lib/palette'
import { useServer } from '../lib/server'
import { STAGES, isStageKey } from '../lib/stages'
import { startFromIdea } from '../lib/start'
import { useProjects } from '../lib/store'
import { useTheme } from '../lib/theme'
import { Kbd, cx } from './ui'

interface Command {
  id: string
  group: string
  label: string
  hint?: string
  icon: ComponentType<{ className?: string }>
  run: () => void
}

/** Asks the open co-founder panel to focus its chat box. */
export const ASK_AI_EVENT = 'cofounder:ask'

export function CommandPalette() {
  const { open, setOpen } = usePalette()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const projects = useProjects((s) => s.projects)
  const loadDemo = useProjects((s) => s.loadDemo)
  const toggleTheme = useTheme((s) => s.toggle)
  const aiEnabled = useServer((s) => s.status?.ai.enabled ?? false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!usePalette.getState().open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      window.setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  const match = pathname.match(/^\/app\/p\/([^/]+)(?:\/([a-z]+))?/)
  const projectId = match?.[1]
  const stage = isStageKey(match?.[2]) ? match?.[2] : undefined

  const commands = useMemo<Command[]>(() => {
    const go = (to: string) => () => navigate(to)
    const list: Command[] = []
    if (projectId) {
      for (const s of STAGES) {
        list.push({ id: `stage-${s.key}`, group: 'This project', label: `Stage ${s.n} · ${s.title}`, hint: s.question, icon: s.icon, run: go(`/app/p/${projectId}/${s.key}`) })
      }
      if (aiEnabled && stage) {
        list.push({ id: 'draft', group: 'This project', label: 'Draft this stage with AI', hint: 'Fills only empty fields', icon: Wand2, run: go(`/app/p/${projectId}/${stage}?draft=1`) })
        list.push({ id: 'ask', group: 'This project', label: 'Ask the AI co-founder', icon: MessagesSquare, run: () => window.dispatchEvent(new Event(ASK_AI_EVENT)) })
      }
    }
    for (const p of projects.slice(0, 5)) {
      if (p.id !== projectId) list.push({ id: `open-${p.id}`, group: 'Recent ideas', label: p.name, icon: FolderOpen, run: go(`/app/p/${p.id}/ideation`) })
    }
    list.push(
      { id: 'demo', group: 'Actions', label: 'Open the demo project (CanteenQ)', icon: Sparkles, run: () => navigate(`/app/p/${loadDemo()}/ideation`) },
      { id: 'theme', group: 'Actions', label: 'Toggle light / dark theme', icon: Moon, run: toggleTheme },
      { id: 'home', group: 'Go to', label: 'Home', icon: Home, run: go('/') },
      { id: 'workspace', group: 'Go to', label: 'All ideas', icon: LayoutGrid, run: go('/app') },
      { id: 'report', group: 'Go to', label: 'Project report', icon: BookOpen, run: go('/report') },
    )
    return list
  }, [projectId, stage, projects, aiEnabled, navigate, loadDemo, toggleTheme])

  const q = query.trim().toLowerCase()
  const filtered = q ? commands.filter((c) => `${c.label} ${c.hint ?? ''} ${c.group}`.toLowerCase().includes(q)) : commands
  const items: Command[] =
    query.trim().length >= 8
      ? [{ id: 'start', group: 'Start', label: `Start a new idea: “${query.trim()}”`, icon: ArrowRight, run: () => navigate(startFromIdea(query)) }, ...filtered]
      : filtered

  useEffect(() => setActive(0), [query])
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  function run(cmd: Command | undefined) {
    if (!cmd) return
    setOpen(false)
    cmd.run()
  }

  let lastGroup = ''
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-canvas/70 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
        className="fade-up w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-elevated shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, items.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                run(items[active])
              } else if (e.key === 'Escape') {
                setOpen(false)
              }
            }}
            placeholder="Jump anywhere, or type a new idea…"
            aria-label="Search commands or type a new idea"
            className="h-14 flex-1 bg-transparent text-[15px] text-strong placeholder:text-muted/70 focus:outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul ref={listRef} className="max-h-[50vh] overflow-y-auto p-2" role="listbox" aria-label="Commands">
          {items.length === 0 ? <li className="px-3 py-6 text-center text-sm text-muted">No matches. Keep typing to start a new idea.</li> : null}
          {items.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : null
            lastGroup = c.group
            return (
              <li key={c.id} role="none">
                {header ? <p className="px-3 pb-1 pt-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{header}</p> : null}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => run(c)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                    i === active ? 'bg-subtle text-strong' : 'text-body',
                  )}
                >
                  <c.icon className={cx('size-4 shrink-0', i === active ? 'text-accent' : 'text-muted')} />
                  <span className="min-w-0 flex-1 truncate">{c.label}</span>
                  {c.hint ? <span className="hidden truncate text-xs text-muted sm:block">{c.hint}</span> : null}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="flex items-center gap-3 border-t border-line px-4 py-2 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> move
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Enter</Kbd> open
          </span>
        </div>
      </div>
    </div>
  )
}
