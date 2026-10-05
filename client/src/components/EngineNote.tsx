import { Cpu } from 'lucide-react'
import { Link } from 'react-router'
import { useServer } from '../lib/server'
import { cx } from './ui'

/** States plainly what powers the co-founder on this deployment. */
export function EngineNote({ className }: { className?: string }) {
  const status = useServer((s) => s.status)
  const ai = status?.ai.enabled
  const db = status?.db.enabled
  return (
    <div className={cx('flex gap-3 rounded-2xl border border-line bg-sand/40 p-4 text-sm text-espresso', className)}>
      <Cpu className="mt-0.5 size-5 shrink-0 text-clay" aria-hidden="true" />
      <p>
        <strong>How the co-founder works here:</strong>{' '}
        {ai ? (
          <>
            live answers come from Google Gemini ({status?.ai.model}) through this app’s Node.js API, streamed as they are
            written. Alongside it, a rule engine in your browser runs the checks: vague users, pain and differentiation
            scores, validation benchmarks, the pay test and the generated MERN code.
          </>
        ) : (
          <>
            a built-in rule engine that runs entirely in your browser. It detects vague users, scores pain and
            differentiation, interprets validation numbers, applies the pay test to features and generates real MERN code.
          </>
        )}{' '}
        {db
          ? 'Sign in to save projects to MongoDB and open them on any device; otherwise they stay in this browser.'
          : 'Projects are saved in this browser.'}{' '}
        Details in the{' '}
        <Link to="/report" className="font-semibold underline underline-offset-2">
          project report
        </Link>
        .
      </p>
    </div>
  )
}
