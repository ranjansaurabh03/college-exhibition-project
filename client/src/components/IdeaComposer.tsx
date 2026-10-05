import { ArrowUp, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useServer } from '../lib/server'
import { EXAMPLE_IDEAS, startFromIdea } from '../lib/start'
import { cx } from './ui'

const CHIPS = ['Canteen pre-orders', 'Laundry queue', 'Notes marketplace', 'Campus lost & found']
const MIN = 8

/** One box to start: type an idea, press Enter, and the co-founder takes it from there. */
export function IdeaComposer({ autoFocus = false, align = 'center', className }: { autoFocus?: boolean; align?: 'center' | 'start'; className?: string }) {
  const navigate = useNavigate()
  const ai = useServer((s) => s.status?.ai.enabled ?? false)
  const [idea, setIdea] = useState('')
  const [example, setExample] = useState(0)

  useEffect(() => {
    if (idea) return
    const t = window.setInterval(() => setExample((i) => (i + 1) % EXAMPLE_IDEAS.length), 3500)
    return () => window.clearInterval(t)
  }, [idea])

  function start(text: string) {
    if (text.trim().length < MIN) return
    navigate(startFromIdea(text))
  }

  return (
    <div className={className}>
      <div className="glow-ring">
        <form
          className="relative rounded-[calc(1.5rem-1px)] bg-surface p-2 text-left"
          onSubmit={(e) => {
            e.preventDefault()
            start(idea)
          }}
        >
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                start(idea)
              }
            }}
            autoFocus={autoFocus}
            rows={2}
            maxLength={400}
            aria-label="Describe your startup idea"
            placeholder={`Describe your idea… e.g. “${EXAMPLE_IDEAS[example]}”`}
            className="block min-h-[5.5rem] w-full resize-none bg-transparent px-3 pt-2.5 text-[16px] leading-relaxed text-strong placeholder:text-muted/60 focus:outline-none sm:min-h-0"
          />
          <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-2">
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
              {ai ? 'Gemini drafts your whole canvas in seconds' : 'Your co-founder interviews you, one question at a time'}
            </p>
            <button
              type="submit"
              disabled={idea.trim().length < MIN}
              aria-label="Start with this idea"
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-30"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </form>
      </div>
      <div className={cx('mt-4 flex flex-wrap gap-2', align === 'center' ? 'justify-center' : 'justify-start')}>
        <span className="py-1.5 text-xs text-muted">Try:</span>
        {CHIPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => start(EXAMPLE_IDEAS[i])}
            className={cx(
              'rounded-full border border-line bg-surface/60 px-3 py-1.5 text-xs font-semibold text-body backdrop-blur transition-colors hover:border-accent/50 hover:text-strong',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
