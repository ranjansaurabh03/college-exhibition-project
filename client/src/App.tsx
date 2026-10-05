import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import { ServerBootstrap } from './components/Cloud'
import { CommandPalette } from './components/CommandPalette'
import { Toaster } from './components/Toaster'
import Landing from './pages/Landing'

// Code-split: each area (and each stage inside the workspace) is its own chunk.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Workspace = lazy(() => import('./pages/Workspace'))
const Report = lazy(() => import('./pages/Report'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <HashRouter>
      <div className="app-backdrop" aria-hidden="true" />
      <div className="app-noise" aria-hidden="true" />
      <ServerBootstrap />
      <CommandPalette />
      <Toaster />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/p/:projectId/:stage?" element={<Workspace />} />
          <Route path="/report" element={<Report />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

function PageLoader() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="size-8 animate-spin rounded-full border-2 border-line border-t-accent" aria-label="Loading" />
    </div>
  )
}
