import type { ButtonHTMLAttributes, ComponentProps, HTMLAttributes, PointerEvent, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { twMerge } from 'tailwind-merge'

/** Joins class names; later Tailwind classes override earlier conflicting ones. */
export function cx(...parts: Array<string | false | null | undefined>) {
  return twMerge(...parts)
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'ai' | 'danger' | 'glass'
type Size = 'sm' | 'md' | 'lg'

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary shadow-[0_8px_24px_-12px_rgb(0_0_0/0.6)] hover:opacity-90',
  secondary: 'border border-line bg-surface text-strong hover:border-line-strong hover:bg-subtle',
  ghost: 'text-muted hover:bg-subtle hover:text-strong',
  ai: 'bg-ai text-white shadow-[0_10px_30px_-12px_rgb(124_92_255/0.7)] hover:brightness-110',
  danger: 'bg-bad text-white hover:brightness-110',
  glass: 'border border-line bg-surface/60 text-strong backdrop-blur hover:bg-subtle',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-2xl',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cx(
    'inline-flex items-center justify-center font-semibold transition-all duration-200 select-none whitespace-nowrap',
    'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
    variantClass[variant],
    sizeClass[size],
    extra,
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('card', className)} {...props} />
}

/** A card with a soft highlight that follows the pointer. */
export function SpotlightCard({ className, onPointerMove, ...props }: HTMLAttributes<HTMLDivElement>) {
  function move(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`)
    onPointerMove?.(e)
  }
  return <div className={cx('card spotlight', className)} onPointerMove={move} {...props} />
}

type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'link' | 'primary' | 'ai'

const toneClass: Record<Tone, string> = {
  neutral: 'bg-subtle text-strong',
  good: 'bg-good/15 text-strong',
  warn: 'bg-warn/18 text-strong',
  bad: 'bg-bad/15 text-strong',
  link: 'bg-link/12 text-strong',
  primary: 'bg-primary text-on-primary',
  ai: 'bg-accent/15 text-accent',
}

export function Pill({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', toneClass[tone], className)}
      {...props}
    />
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent', className)}>{children}</p>
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd className={cx('inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line bg-subtle px-1.5 font-mono text-[11px] text-muted', className)}>
      {children}
    </kbd>
  )
}

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-strong">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

const inputBase =
  'w-full rounded-xl border border-line bg-field px-3.5 text-sm text-strong placeholder:text-muted/70 transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15'

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cx(inputBase, 'h-10', className)} {...props} />
}

export function TextArea({ className, rows = 3, ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cx(inputBase, 'py-2.5 leading-relaxed', className)} {...props} />
}

export function GithubMark({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export function Segmented<T extends string>({
  id,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  id?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  ariaLabel: string
}) {
  return (
    <div id={id} role="group" aria-label={ariaLabel} tabIndex={-1} className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-field p-1 outline-none">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? ('' as T) : o.value)}
            className={cx(
              'h-8 rounded-lg px-3 text-[13px] font-semibold transition-all',
              on ? 'bg-primary text-on-primary shadow-sm' : 'text-muted hover:bg-subtle hover:text-strong',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
