import { Moon, Search, Sun } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { SITE } from '../config'
import { openPalette, PALETTE_SHORTCUT } from '../lib/palette'
import { useTheme } from '../lib/theme'
import { GithubMark, Kbd, cx } from './ui'

export function LogoMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#logo-g)" />
      <path d="M16 46 L28 34 L36 40 L48 22" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="22" r="5.5" fill="#fde68a" />
      <circle cx="16" cy="46" r="3.5" fill="#fff" />
    </svg>
  )
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
      <LogoMark className="size-7" />
      <span className="whitespace-nowrap font-display text-[14px] font-semibold tracking-tight text-strong sm:text-[15px]">AI Co&#8209;Founder</span>
    </Link>
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className={cx('grid size-9 place-items-center rounded-xl text-muted transition-colors hover:bg-subtle hover:text-strong', className)}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
    >
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}

export function PaletteButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openPalette}
      className={cx(
        'hidden h-9 items-center gap-2 rounded-xl border border-line bg-surface/60 pl-3 pr-1.5 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-strong md:inline-flex',
        className,
      )}
    >
      <Search className="size-3.5" /> Search or ask
      <Kbd>{PALETTE_SHORTCUT}</Kbd>
    </button>
  )
}

const navItems = [
  { to: '/app', label: 'Workspace' },
  { to: '/report', label: 'Report' },
]

/** Floating glass navigation bar. */
export function SiteHeader() {
  return (
    <header className="sticky top-3 z-40 px-3 sm:top-4 sm:px-6">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 rounded-2xl border border-line bg-surface/70 pl-4 pr-2 shadow-[0_10px_40px_-20px_rgb(0_0_0/0.6)] backdrop-blur-xl">
        <Logo />
        <nav className="flex items-center gap-0.5 text-[13px] font-semibold sm:gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx('rounded-xl px-2.5 py-2 transition-colors sm:px-3', isActive ? 'bg-subtle text-strong' : 'text-muted hover:text-strong')
              }
            >
              {item.label}
            </NavLink>
          ))}
          <a
            href={SITE.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-muted transition-colors hover:text-strong sm:inline-flex"
          >
            <GithubMark /> Code
          </a>
          <PaletteButton className="ml-1" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <LogoMark className="size-6" />
          <p>
            <span className="font-semibold text-strong">{SITE.name}</span> · {SITE.credits.event} · Built by {SITE.credits.builtBy.join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/report" className="hover:text-strong">
            Project report
          </Link>
          <a href={SITE.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-strong">
            <GithubMark /> Source
          </a>
        </div>
      </div>
    </footer>
  )
}
