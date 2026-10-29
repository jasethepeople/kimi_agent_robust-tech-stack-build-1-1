import { Routes, Route } from 'react-router'
import { Suspense, lazy } from 'react'
import Layout from './components/Layout'

const Home = lazy(() => import('./pages/Home'))
const Evolution = lazy(() => import('./pages/Evolution'))
const Workbench = lazy(() => import('./pages/Workbench'))
const Cognitive = lazy(() => import('./pages/Cognitive'))
const VizFluid = lazy(() => import('./pages/VizFluid'))
const VizDNA = lazy(() => import('./pages/VizDNA'))
const VizHollowing = lazy(() => import('./pages/VizHollowing'))
const VizQuantum = lazy(() => import('./pages/VizQuantum'))
const Visualizations = lazy(() => import('./pages/Visualizations'))

function PageLoader() {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-bg-deep">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
        <span className="font-mono text-sm text-text-muted">Loading...</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/evolution" element={<Evolution />} />
          <Route path="/workbench" element={<Workbench />} />
          <Route path="/cognitive" element={<Cognitive />} />
          <Route path="/viz/fluid" element={<VizFluid />} />
          <Route path="/viz/dna" element={<VizDNA />} />
          <Route path="/viz/hollowing" element={<VizHollowing />} />
          <Route path="/viz/quantum" element={<VizQuantum />} />
          <Route path="/visualizations" element={<Visualizations />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
