import { SiteFooter, SiteHeader } from '../components/Site'

export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold text-espresso">Dashboard</h1>
        <p className="mt-2 text-muted">Being built — check back shortly.</p>
      </main>
      <SiteFooter />
    </div>
  )
}
