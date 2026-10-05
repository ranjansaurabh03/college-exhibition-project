import { Link, NavLink } from 'react-router'
import { SITE } from '../config'
import { GithubMark, cx } from './ui'

export function LogoMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f2747" />
          <stop offset="1" stopColor="#1b7a7e" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#logo-g)" />
      <path d="M16 46 L28 34 L36 40 L48 22" fill="none" stroke="#f6f1ea" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="22" r="5.5" fill="#c4a484" />
      <circle cx="16" cy="46" r="3.5" fill="#f6f1ea" />
    </svg>
  )
}

export function Logo({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
      <LogoMark />
      <span className={cx('font-display text-lg font-bold tracking-tight', tone === 'light' ? 'text-cream' : 'text-espresso')}>
        AI Co&#8209;Founder
      </span>
    </Link>
  )
}

const navItems = [
  { to: '/app', label: 'Workspace' },
  { to: '/report', label: 'Project report' },
]

export function SiteHeader({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const light = tone === 'light'
  return (
    <header className={cx('relative z-20', light ? 'text-cream' : 'border-b border-line bg-cream/90 backdrop-blur')}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo tone={tone} />
        <nav className="flex items-center gap-1 text-sm font-semibold">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx(
                  'rounded-lg px-3 py-2 transition-colors',
                  light
                    ? isActive
                      ? 'bg-white/15 text-white'
                      : 'text-cream/80 hover:bg-white/10 hover:text-white'
                    : isActive
                      ? 'bg-sand text-espresso'
                      : 'text-muted hover:bg-sand/60 hover:text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <a
            href={SITE.repoUrl}
            target="_blank"
            rel="noreferrer"
            className={cx(
              'hidden items-center gap-1.5 rounded-lg px-3 py-2 transition-colors sm:inline-flex',
              light ? 'text-cream/80 hover:bg-white/10 hover:text-white' : 'text-muted hover:bg-sand/60 hover:text-ink',
            )}
          >
            <GithubMark /> Code
          </a>
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <LogoMark className="size-7" />
          <div>
            <p className="font-semibold text-espresso">
              {SITE.name}: {SITE.tagline}
            </p>
            <p>
              {SITE.credits.event} · Built by {SITE.credits.builtBy.join(', ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/report" className="hover:text-ink">
            Project report
          </Link>
          <a href={SITE.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-ink">
            <GithubMark /> Source code
          </a>
        </div>
      </div>
    </footer>
  )
}
