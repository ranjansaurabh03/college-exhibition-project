import { Cpu } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from './ui'

/** States plainly what powers the co-founder on this deployment. */
export function EngineNote({ className }: { className?: string }) {
  return (
    <div className={cx('flex gap-3 rounded-2xl border border-line bg-sand/40 p-4 text-sm text-espresso', className)}>
      <Cpu className="mt-0.5 size-5 shrink-0 text-clay" aria-hidden="true" />
      <p>
        <strong>How the co-founder works here:</strong> a built-in rule engine that runs entirely in your browser. It
        detects vague users, scores pain and differentiation, interprets validation numbers, applies the pay test to
        features and generates real MERN code. Projects are saved in this browser only. The optional Node + MongoDB +
        Claude back end is described in the{' '}
        <Link to="/report" className="font-semibold underline underline-offset-2">
          project report
        </Link>
        .
      </p>
    </div>
  )
}
