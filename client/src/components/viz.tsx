import { CircleAlert, CircleCheck, CircleDashed, TriangleAlert } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cx } from './ui'

export type StatusTone = 'good' | 'warn' | 'bad' | 'neutral'

const FILL: Record<StatusTone, string> = {
  good: 'bg-good',
  warn: 'bg-warn',
  bad: 'bg-bad',
  neutral: 'bg-muted',
}
// Meter track: a lighter step of the same hue as the fill.
const TRACK: Record<StatusTone, string> = {
  good: 'bg-good/15',
  warn: 'bg-warn/18',
  bad: 'bg-bad/15',
  neutral: 'bg-sand',
}
const ICON_COLOR: Record<StatusTone, string> = {
  good: 'text-good',
  warn: 'text-warn',
  bad: 'text-bad',
  neutral: 'text-muted',
}

export function toneForScore(v: number): StatusTone {
  return v >= 75 ? 'good' : v >= 50 ? 'warn' : 'bad'
}

export function StatusIcon({ tone, className = 'size-4' }: { tone: StatusTone; className?: string }) {
  const Icon = tone === 'good' ? CircleCheck : tone === 'warn' ? TriangleAlert : tone === 'bad' ? CircleAlert : CircleDashed
  return <Icon aria-hidden="true" className={cx(className, 'shrink-0', ICON_COLOR[tone])} />
}

/** Status is never colour alone: coloured icon + text label in ink. */
export function StatusLabel({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-start gap-1.5 text-sm text-espresso [&>svg]:mt-0.5', className)}>
      <StatusIcon tone={tone} />
      {children}
    </span>
  )
}

export function Meter({ value, tone, label }: { value: number; tone: StatusTone; label: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      className={cx('h-2 w-full overflow-hidden rounded-full', TRACK[tone])}
    >
      <div className={cx('h-full rounded-full transition-[width] duration-500', FILL[tone])} style={{ width: `${v}%` }} />
    </div>
  )
}

export function ScoreMeter({ label, value, hint }: { label: string; value: number; hint?: string }) {
  const tone = toneForScore(value)
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-espresso">{label}</span>
        <span className="text-sm font-semibold text-ink">{value}</span>
      </div>
      <Meter value={value} tone={tone} label={`${label}: ${value} out of 100`} />
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

export function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-paper px-4 py-3.5">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-espresso">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted">{sub}</p> : null}
    </div>
  )
}

export interface BarDatum {
  label: string
  value: number
  note?: string
}

/** Single-series horizontal bars: one colour, value at the tip, hover detail, table view. */
export function BarChart({
  title,
  data,
  unit,
  format = (v) => v.toFixed(1),
}: {
  title: string
  data: BarDatum[]
  unit: string
  format?: (v: number) => string
}) {
  const [active, setActive] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)
  const id = useId()
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <figure aria-labelledby={`${id}-t`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <figcaption id={`${id}-t`} className="text-sm font-semibold text-espresso">
          {title}
        </figcaption>
        <button
          type="button"
          onClick={() => setShowTable((s) => !s)}
          className="text-xs font-semibold text-muted underline-offset-2 hover:text-ink hover:underline"
          aria-expanded={showTable}
        >
          {showTable ? 'Show chart' : 'Show table'}
        </button>
      </div>
      {showTable ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="py-1.5 font-semibold">Item</th>
              <th className="py-1.5 text-right font-semibold">{unit}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {data.map((d) => (
              <tr key={d.label} className="border-b border-line/60">
                <td className="py-1.5">{d.label}</td>
                <td className="py-1.5 text-right">{format(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="space-y-1.5" onMouseLeave={() => setActive(null)}>
          {data.map((d, i) => (
            <li
              key={d.label}
              tabIndex={0}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className={cx(
                'grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 rounded-lg px-1 py-1 outline-none sm:grid-cols-[minmax(0,12rem)_1fr]',
                active === i && 'bg-sand/50',
              )}
            >
              <span className="truncate text-sm text-ink" title={d.label}>
                {d.label}
              </span>
              <span className="flex items-center gap-2">
                <span
                  className="h-3.5 rounded-r-[4px] bg-data"
                  style={{ width: `${Math.max((d.value / max) * 82, 1.5)}%` }}
                  aria-hidden="true"
                />
                <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-ink">
                  {format(d.value)} {unit}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {!showTable && active !== null && data[active].note ? (
        <p className="mt-2 rounded-lg bg-sand/60 px-3 py-2 text-xs text-espresso" role="status">
          <strong>{data[active].label}:</strong> {data[active].note}
        </p>
      ) : null}
    </figure>
  )
}
