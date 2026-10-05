import { Cloud, CloudAlert, CloudCheck, LoaderCircle, LogOut, X } from 'lucide-react'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { api } from '../lib/api'
import { useAuth, useServer, type SessionUser } from '../lib/server'
import { startSync, stopSync, useSync } from '../lib/sync'
import { Button, Card, Field, TextInput, cx } from './ui'

/** Dashboard card: sign in to keep projects in MongoDB and open them on any device. */
export function CloudCard({ className }: { className?: string }) {
  const dbEnabled = useServer((s) => s.status?.db.enabled ?? false)
  const user = useAuth((s) => s.user)
  const [dialog, setDialog] = useState<'login' | 'register' | null>(null)
  if (!dbEnabled) return null

  return (
    <Card className={cx('flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex gap-3">
        <Cloud className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
        {user ? (
          <div>
            <p className="font-semibold text-strong">
              Signed in as {user.name} <span className="font-normal text-muted">({user.email})</span>
            </p>
            <SyncStatus className="mt-0.5" />
          </div>
        ) : (
          <div>
            <p className="font-semibold text-strong">Save your ideas to the cloud</p>
            <p className="text-sm text-muted">Create an account to keep projects in MongoDB and open them on any device.</p>
          </div>
        )}
      </div>
      {user ? (
        <Button
          variant="ghost"
          onClick={() => {
            stopSync()
            useAuth.getState().logout()
          }}
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setDialog('login')}>
            Sign in
          </Button>
          <Button onClick={() => setDialog('register')}>Create account</Button>
        </div>
      )}
      {dialog ? <AuthDialog mode={dialog} onMode={setDialog} onClose={() => setDialog(null)} /> : null}
    </Card>
  )
}

export function SyncStatus({ className }: { className?: string }) {
  const { state, error } = useSync()
  const user = useAuth((s) => s.user)
  if (!user) return null
  const view =
    state === 'syncing'
      ? { icon: <LoaderCircle className="size-3.5 animate-spin" />, text: 'Saving to the cloud…' }
      : state === 'error'
        ? { icon: <CloudAlert className="size-3.5 text-bad" />, text: error ?? 'Sync failed' }
        : state === 'synced'
          ? { icon: <CloudCheck className="size-3.5 text-good" />, text: 'Saved to the cloud' }
          : { icon: <Cloud className="size-3.5" />, text: 'Cloud sync paused' }
  return (
    <p className={cx('flex items-center gap-1.5 text-xs text-muted', className)} role="status">
      {view.icon} {view.text}
    </p>
  )
}

function AuthDialog({
  mode,
  onMode,
  onClose,
}: {
  mode: 'login' | 'register'
  onMode: (m: 'login' | 'register') => void
  onClose: () => void
}) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const body = mode === 'register' ? form : { email: form.email, password: form.password }
      const { token, user } = await api<{ token: string; user: SessionUser }>(`/auth/${mode}`, { method: 'POST', body })
      // ServerBootstrap starts cloud sync when the session token changes.
      useAuth.getState().setSession(token, user)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-canvas/70 p-4 backdrop-blur-md" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="fade-up w-full max-w-sm rounded-3xl border border-line-strong bg-surface p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="auth-title" className="text-xl font-semibold text-strong">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1 text-sm text-muted">Your projects are stored in MongoDB and sync across devices.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:text-body" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={submit} className="mt-5 grid gap-4">
          {mode === 'register' ? (
            <Field label="Name" htmlFor="auth-name">
              <TextInput id="auth-name" autoComplete="name" required value={form.name} onChange={set('name')} />
            </Field>
          ) : null}
          <Field label="Email" htmlFor="auth-email">
            <TextInput id="auth-email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Password" htmlFor="auth-password" hint={mode === 'register' ? 'At least 8 characters.' : undefined}>
            <TextInput
              id="auth-password"
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={8}
              required
              value={form.password}
              onChange={set('password')}
            />
          </Field>
          {error ? <p className="rounded-xl bg-bad/10 px-3 py-2 text-sm text-strong">{error}</p> : null}
          <Button type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : null} {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
          <button type="button" className="text-sm font-semibold text-link" onClick={() => onMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'New here? Create an account' : 'Have an account? Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

/** Checks what the API can do once, and resumes cloud sync for a signed-in user. */
export function ServerBootstrap() {
  const check = useServer((s) => s.check)
  const dbEnabled = useServer((s) => s.status?.db.enabled ?? false)
  const token = useAuth((s) => s.token)
  useEffect(() => {
    void check()
  }, [check])
  useEffect(() => {
    if (dbEnabled && token) void startSync(token)
    return () => stopSync()
  }, [dbEnabled, token])
  return null
}
