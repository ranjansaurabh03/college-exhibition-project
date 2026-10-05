import { Eraser, SendHorizontal, Sparkles, Square } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { streamChat, type ChatTurn } from '../lib/api'
import { uid } from '../lib/factory'
import { stageMeta } from '../lib/stages'
import { useProjects } from '../lib/store'
import type { ChatMessage, Project, StageKey } from '../lib/types'
import { Markdown } from './Markdown'
import { Button, cx } from './ui'

const PROMPTS: Record<StageKey, string[]> = {
  ideation: ['What is the weakest part of my idea?', 'Is my target user specific enough?', 'Rewrite my one-liner three ways'],
  validation: ['Read my signals: should I keep going?', 'Who exactly should I contact first?', 'What would a misleading signal look like here?'],
  scoping: ['What else should I cut from v1?', 'Is my core flow too long?', 'What can I fake manually for v1?'],
  building: ['Review my data model', 'What should I build on day one?', 'Write the Mongoose schema for my core object'],
}

const MAX_TURNS = 20
const MAX_CHARS = 4000

function message(role: ChatMessage['role'], text: string): ChatMessage {
  return { id: uid('m_'), role, text, at: Date.now() }
}

/** The API wants alternating turns that start and end with the founder, each ≤ 4000 characters. */
function toTurns(history: ChatMessage[]): ChatTurn[] {
  const turns = history.slice(-MAX_TURNS).map<ChatTurn>((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.text.slice(0, MAX_CHARS),
  }))
  while (turns.length && turns[0].role !== 'user') turns.shift()
  return turns
}

/** The project data Claude sees: the canvases, not the chat transcripts. */
function contextOf(p: Project) {
  return {
    name: p.name,
    ideation: p.ideation,
    validation: { ...p.validation, responses: p.validation.responses.slice(0, 3000) },
    scoping: p.scoping,
    building: p.building,
  }
}

export function ChatPanel({ project, stage, model }: { project: Project; stage: StageKey; model: string | null }) {
  const setAiChat = useProjects((s) => s.setAiChat)
  const messages = project.aiChat[stage] ?? []
  const [draft, setDraft] = useState('')
  const [streaming, setStreaming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => abortRef.current?.abort(), [])
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages.length, streaming])

  async function send(text: string) {
    const question = text.trim()
    if (!question || streaming !== null) return
    const history = [...messages, message('user', question)]
    setAiChat(project.id, stage, history)
    setDraft('')
    setError(null)
    setStreaming('')
    const controller = new AbortController()
    abortRef.current = controller
    let reply = ''
    try {
      await streamChat({
        stage,
        project: contextOf(project),
        messages: toTurns(history),
        signal: controller.signal,
        onText: (chunk) => {
          reply += chunk
          setStreaming(reply)
        },
      })
      setAiChat(project.id, stage, [...history, message('cofounder', reply || 'I don’t have anything to add.')])
    } catch (err) {
      if (controller.signal.aborted) {
        if (reply) setAiChat(project.id, stage, [...history, message('cofounder', `${reply} …`)])
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    } finally {
      setStreaming(null)
      abortRef.current = null
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    void send(draft)
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-good/60" />
            <span className="relative inline-flex size-2 rounded-full bg-good" />
          </span>
          Live · {model ?? 'Claude'}
        </p>
        {messages.length ? (
          <button
            type="button"
            onClick={() => setAiChat(project.id, stage, [])}
            disabled={streaming !== null}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink disabled:opacity-40"
          >
            <Eraser className="size-3.5" /> Clear
          </button>
        ) : null}
      </div>

      <div ref={listRef} className="max-h-[46vh] min-h-40 space-y-3 overflow-y-auto px-4 py-4 text-sm leading-relaxed" aria-live="polite">
        {messages.length === 0 && streaming === null ? (
          <div>
            <p className="text-ink/80">
              Ask anything about <strong className="text-espresso">{stageMeta(stage).title}</strong>. Claude sees this project’s canvases and
              answers as your co-founder.
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {PROMPTS[stage].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => void send(p)}
                  className="flex items-center gap-2 rounded-xl border border-line bg-white/70 px-3 py-2 text-left text-[13px] font-semibold text-espresso hover:border-tan"
                >
                  <Sparkles className="size-3.5 shrink-0 text-clay" aria-hidden="true" /> {p}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m) => (
          <Bubble key={m.id} mine={m.role === 'user'} text={m.text} />
        ))}
        {streaming !== null ? <Bubble mine={false} text={streaming} pending /> : null}
        {error ? <p className="rounded-xl bg-bad/10 px-3 py-2 text-[13px] text-espresso">{error}</p> : null}
      </div>

      <form onSubmit={submit} className="border-t border-line px-3 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send(draft)
              }
            }}
            rows={2}
            maxLength={MAX_CHARS}
            placeholder="Ask your co-founder…"
            aria-label="Message to your co-founder"
            className="min-h-10 flex-1 resize-none rounded-xl border border-line bg-white px-3 py-2 text-sm placeholder:text-muted/70 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
          />
          {streaming !== null ? (
            <Button variant="secondary" onClick={() => abortRef.current?.abort()} aria-label="Stop the reply" className="h-10 px-3">
              <Square className="size-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={!draft.trim()} aria-label="Send" className="h-10 px-3">
              <SendHorizontal className="size-4" />
            </Button>
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-muted">Claude can make mistakes. Check important facts.</p>
      </form>
    </div>
  )
}

function Bubble({ mine, text, pending }: { mine: boolean; text: string; pending?: boolean }) {
  return (
    <div className={cx('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'max-w-[92%] rounded-2xl px-3.5 py-2.5',
          mine ? 'whitespace-pre-wrap rounded-br-md bg-cocoa text-cream' : 'rounded-bl-md border border-line bg-white/80 text-ink',
        )}
      >
        {mine ? (
          text
        ) : text ? (
          <>
            <Markdown text={text} />
            {pending ? <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-clay align-middle" aria-hidden="true" /> : null}
          </>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted" aria-label="Thinking">
            <span className="size-1.5 animate-bounce rounded-full bg-tan [animation-delay:-0.2s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-tan [animation-delay:-0.1s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-tan" />
          </span>
        )}
      </div>
    </div>
  )
}
