import { Bot, RotateCcw, SendHorizontal, SkipForward, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { INTERVIEW, isAnswered, oneLiner, reactToAnswer, scoreIdea, type InterviewStep } from '../lib/engine/ideation'
import { uid } from '../lib/factory'
import { useProjects } from '../lib/store'
import type { ChatMessage, Ideation, Project } from '../lib/types'
import { Button, TextArea, TextInput, cx } from './ui'

const GREETING =
  'Hi! I’m your co-founder. I won’t write code yet. First I’ll ask the questions that decide whether this is worth building. Answer in your own words; I’ll push back if something is vague.'

function msg(role: ChatMessage['role'], text: string): ChatMessage {
  return { id: uid('m_'), role, text, at: Date.now() }
}

function displayAnswer(step: InterviewStep, value: string): string {
  return step.choices?.find((c) => c.value === value)?.label ?? value
}

export function InterviewDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const patch = useProjects((s) => s.patch)
  const setChat = useProjects((s) => s.setChat)
  const i = project.ideation
  const saved = project.chat.ideation

  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [attempt, setAttempt] = useState(0)
  const [round, setRound] = useState(0)
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  const step = useMemo(
    () => INTERVIEW.find((s) => !isAnswered(i, s.field) && !skipped.has(s.field)) ?? null,
    [i, skipped],
  )
  const position = step ? INTERVIEW.indexOf(step) + 1 : INTERVIEW.length

  // Start the conversation (or ask the next question) whenever the current step changes.
  const messages = saved?.length ? saved : [msg('cofounder', GREETING)]
  const lastAsked = useRef<string | null>(null)
  useEffect(() => {
    const key = `${round}:${step ? step.field : '__done__'}`
    if (lastAsked.current === key) return
    lastAsked.current = key
    const base = saved?.length ? saved : [msg('cofounder', GREETING)]
    const last = base[base.length - 1]
    let text: string
    if (step) text = step.question
    else {
      const s = scoreIdea(i)
      text = `That’s the full picture. Your one-liner: “${oneLiner(i)}” The idea scores ${s.overall}/100 (${s.verdict.label.toLowerCase()}). Close this to see the scorecard, then move on to Validation.`
    }
    if (last?.role === 'cofounder' && last.text === text) return
    setChat(project.id, 'ideation', [...base, msg('cofounder', text)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.field, round])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    inputRef.current?.focus()
  }, [step?.field, attempt])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function answer(value: string) {
    if (!step || !value.trim()) return
    const r = reactToAnswer(step.field, value, attempt)
    const next = [...messages, msg('user', displayAnswer(step, value.trim())), msg('cofounder', r.reply)]
    setChat(project.id, 'ideation', next)
    setDraft('')
    if (r.accept) {
      setAttempt(0)
      const update: Partial<Ideation> = step.field === 'severity' ? { severity: Number(value) } : { [step.field]: value.trim() }
      patch(project.id, 'ideation', update)
    } else {
      setAttempt((a) => a + 1)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    answer(draft)
  }

  function skip() {
    if (!step) return
    setSkipped(new Set(skipped).add(step.field))
    setAttempt(0)
    setDraft('')
  }

  function restart() {
    setSkipped(new Set())
    setAttempt(0)
    lastAsked.current = null
    setChat(project.id, 'ideation', [])
    setRound((r) => r + 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-canvas/70 p-0 backdrop-blur-md sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="interview-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="fade-up flex h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-line-strong bg-surface shadow-2xl sm:h-[85vh] sm:rounded-3xl"
      >
        <div className="relative flex items-center justify-between gap-3 overflow-hidden border-b border-line px-5 py-4">
          <div className="pointer-events-none absolute -left-10 -top-16 h-32 w-56 rounded-full bg-ai opacity-25 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-ai text-white shadow-[0_8px_24px_-8px_rgb(124_92_255/0.8)]">
              <Bot className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p id="interview-title" className="font-semibold leading-tight text-strong">
                From vague to sharp
              </p>
              <p className="text-xs text-muted">
                {step ? `Question ${position} of ${INTERVIEW.length}` : 'Every question answered'} · rule-based interview
              </p>
            </div>
          </div>
          <div className="relative flex items-center gap-1">
            <button type="button" onClick={restart} className="rounded-lg p-2 text-muted hover:bg-subtle hover:text-strong" title="Clear the conversation">
              <RotateCcw className="size-4" />
              <span className="sr-only">Clear the conversation</span>
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-subtle hover:text-strong" title="Close">
              <X className="size-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>

        <div className="h-1 bg-subtle">
          <div className="h-full bg-ai transition-[width] duration-500" style={{ width: `${(INTERVIEW.filter((s) => isAnswered(i, s.field)).length / INTERVIEW.length) * 100}%` }} />
        </div>

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-canvas/40 px-4 py-5 sm:px-6" aria-live="polite">
          {messages.map((m) => (
            <div key={m.id} className={cx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cx(
                  'max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  m.role === 'user' ? 'rounded-br-md bg-primary text-on-primary' : 'rounded-bl-md border border-line bg-field text-body',
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {step ? <p className="pl-1 text-xs text-muted">Why I’m asking: {step.why}</p> : null}
        </div>

        <div className="border-t border-line px-4 py-4 sm:px-6">
          {!step ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {skipped.size ? `You skipped ${skipped.size} question${skipped.size > 1 ? 's' : ''}. Answer them in the canvas any time.` : 'All questions answered.'}
              </p>
              <Button onClick={onClose}>See the scorecard</Button>
            </div>
          ) : step.kind === 'choice' ? (
            <div className="flex flex-wrap items-center gap-2">
              {step.choices!.map((c) => (
                <Button key={c.value} variant="secondary" onClick={() => answer(c.value)}>
                  {c.label}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={skip} className="ml-auto">
                <SkipForward className="size-4" /> Skip
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex items-end gap-2">
              {step.kind === 'long' ? (
                <TextArea
                  ref={inputRef}
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      answer(draft)
                    }
                  }}
                  placeholder={step.placeholder ?? 'Type your answer… (Enter to send, Shift+Enter for a new line)'}
                  aria-label={step.question}
                  className="flex-1"
                />
              ) : (
                <TextInput
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={step.placeholder ?? 'Type your answer…'}
                  aria-label={step.question}
                  className="flex-1"
                />
              )}
              <Button type="submit" disabled={!draft.trim()} aria-label="Send answer">
                <SendHorizontal className="size-4" />
              </Button>
              <Button variant="ghost" onClick={skip} title="Skip this question" aria-label="Skip this question">
                <SkipForward className="size-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
