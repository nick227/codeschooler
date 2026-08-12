import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoadingState } from '../components/AsyncState'

const HomePage = lazy(() => import('../features/home/HomePage').then((module) => ({ default: module.HomePage })))
const LearnCatalogPage = lazy(() => import('../features/learn/LearnCatalogPage').then((module) => ({ default: module.LearnCatalogPage })))
const ChallengeWorkspacePage = lazy(() => import('../features/workspace/ChallengeWorkspacePage').then((module) => ({ default: module.ChallengeWorkspacePage })))
const ProgressPage = lazy(() => import('../features/progress/ProgressPage').then((module) => ({ default: module.ProgressPage })))

export function App() {
  return (
    <Suspense fallback={<div className="workspace-loading"><LoadingState /></div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn" element={<LearnCatalogPage />} />
        <Route path="/learn/:trackId/:sectionId" element={<LearnCatalogPage />} />
        <Route path="/learn/:trackId/:sectionId/:challengeId" element={<ChallengeWorkspacePage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
