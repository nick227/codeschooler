import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoadingState } from '../components/AsyncState'

const HomePage = lazy(() => import('../features/home/HomePage').then((module) => ({ default: module.HomePage })))
const LearnCatalogPage = lazy(() => import('../features/learn/LearnCatalogPage').then((module) => ({ default: module.LearnCatalogPage })))
const ChallengeWorkspacePage = lazy(() => import('../features/workspace/ChallengeWorkspacePage').then((module) => ({ default: module.ChallengeWorkspacePage })))
const ProfilePage = lazy(() => import('../features/profile/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const ModeCatalogPage = lazy(() => import('../features/modes/ModeCatalogPage').then((module) => ({ default: module.ModeCatalogPage })))
const ModeChallengePage = lazy(() => import('../features/modes/ModeCatalogPage').then((module) => ({ default: module.ModeChallengePage })))
const KnowledgeQuizPage = lazy(() => import('../features/knowledge/KnowledgeQuizPage').then((module) => ({ default: module.KnowledgeQuizPage })))
const AdminContentListPage = lazy(() => import('../features/admin/AdminContentListPage').then((module) => ({ default: module.AdminContentListPage })))
const AdminContentEditorPage = lazy(() => import('../features/admin/AdminContentEditorPage').then((module) => ({ default: module.AdminContentEditorPage })))


export function App() {
  return (
    <Suspense fallback={<div className="workspace-loading"><LoadingState /></div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<Navigate to="/admin/content" replace />} />
        <Route path="/admin/content" element={<AdminContentListPage />} />
        <Route path="/admin/content/generate" element={<AdminContentListPage />} />
        <Route path="/admin/content/:id" element={<AdminContentEditorPage />} />
        <Route path="/admin/taxonomy" element={<AdminContentListPage />} />

        <Route path="/learn" element={<LearnCatalogPage />} />

        <Route path="/learn/:trackId/:sectionId" element={<LearnCatalogPage />} />
        <Route path="/learn/:trackId/:sectionId/:challengeId" element={<ChallengeWorkspacePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/progress" element={<Navigate to="/profile" replace />} />
        <Route path="/projects" element={<ModeCatalogPage mode="project" />} />
        <Route path="/projects/:challengeId" element={<ModeChallengePage mode="project" />} />
        <Route path="/interview" element={<ModeCatalogPage mode="interview" />} />
        <Route path="/interview/:challengeId" element={<ModeChallengePage mode="interview" />} />
        <Route path="/knowledge" element={<ModeCatalogPage mode="knowledge" />} />
        <Route path="/knowledge/quiz/:quizId" element={<KnowledgeQuizPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
