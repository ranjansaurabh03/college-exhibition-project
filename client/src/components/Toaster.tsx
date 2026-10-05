import { CircleAlert, CircleCheck, Sparkles, X } from 'lucide-react'
import { useToasts } from '../lib/toast'
import { cx } from './ui'

export function Toaster() {
  const { toasts, dismiss } = useToasts()
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end sm:px-0"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="fade-up pointer-events-auto flex w-full max-w-md items-center sm:w-[400px] gap-3 rounded-2xl border border-line-strong bg-elevated/95 py-2.5 pl-4 pr-2 text-sm text-strong shadow-[0_20px_50px_-20px_rgb(0_0_0/0.7)] backdrop-blur"
        >
          {t.tone === 'success' ? (
            <CircleCheck className="size-4 shrink-0 text-good" aria-hidden="true" />
          ) : t.tone === 'error' ? (
            <CircleAlert className="size-4 shrink-0 text-bad" aria-hidden="true" />
          ) : t.tone === 'ai' ? (
            <Sparkles className="size-4 shrink-0 text-accent" aria-hidden="true" />
          ) : null}
          <p className="min-w-0 flex-1">{t.message}</p>
          {t.action ? (
            <button
              type="button"
              onClick={() => {
                t.action!.run()
                dismiss(t.id)
              }}
              className={cx('rounded-lg px-2.5 py-1 text-[13px] font-semibold text-accent hover:bg-subtle')}
            >
              {t.action.label}
            </button>
          ) : null}
          <button type="button" onClick={() => dismiss(t.id)} className="rounded-lg p-1 text-muted hover:text-strong" aria-label="Dismiss">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
