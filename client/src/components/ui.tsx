import type { ButtonHTMLAttributes, ComponentProps, HTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { twMerge } from 'tailwind-merge'

/** Joins class names; later Tailwind classes override earlier conflicting ones. */
export function cx(...parts: Array<string | false | null | undefined>) {
  return twMerge(...parts)
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'light' | 'glass' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variantClass: Record<Variant, string> = {
  primary: 'bg-cocoa text-cream hover:bg-espresso shadow-sm',
  secondary: 'bg-paper text-ink border border-line hover:border-tan hover:bg-white',
  ghost: 'text-muted hover:text-ink hover:bg-sand/60',
  dark: 'bg-night text-cream hover:bg-[#0b1d38] shadow-sm',
  light: 'bg-cream text-night hover:bg-white shadow-sm',
  glass: 'border border-white/20 bg-white/10 text-cream hover:bg-white/20',
  danger: 'bg-bad text-cream hover:bg-[#962a22] shadow-sm',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cx(
    'inline-flex items-center justify-center font-semibold transition-colors select-none whitespace-nowrap',
    'disabled:opacity-50 disabled:pointer-events-none',
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
  return <div className={cx('rounded-2xl border border-line bg-paper shadow-[0_1px_0_rgb(46_26_15/0.04)]', className)} {...props} />
}

type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'teal' | 'cocoa'

const toneClass: Record<Tone, string> = {
  neutral: 'bg-sand text-espresso',
  good: 'bg-good/12 text-espresso',
  warn: 'bg-warn/15 text-espresso',
  bad: 'bg-bad/12 text-espresso',
  teal: 'bg-teal/12 text-espresso',
  cocoa: 'bg-cocoa text-cream',
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
  return <p className={cx('text-xs font-semibold uppercase tracking-[0.18em] text-clay', className)}>{children}</p>
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
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-espresso">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

const inputBase =
  'w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20'

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
    <div id={id} role="group" aria-label={ariaLabel} tabIndex={-1} className="inline-flex flex-wrap gap-1 rounded-xl bg-sand/70 p-1 outline-none">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? ('' as T) : o.value)}
            className={cx(
              'h-8 rounded-lg px-3 text-sm font-semibold transition-colors',
              on ? 'bg-paper text-espresso shadow-sm ring-1 ring-tan' : 'text-muted hover:text-ink',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
