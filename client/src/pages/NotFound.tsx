import { SiteFooter, SiteHeader } from '../components/Site'
import { ButtonLink } from '../components/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="font-display text-7xl font-extrabold text-sand">404</p>
        <h1 className="mt-4 text-2xl font-bold text-espresso">This page doesn’t exist yet.</h1>
        <p className="mt-2 text-muted">Even co-founders take wrong turns. Head back and keep building.</p>
        <ButtonLink to="/" className="mt-8">
          Back to home
        </ButtonLink>
      </main>
      <SiteFooter />
    </div>
  )
}
