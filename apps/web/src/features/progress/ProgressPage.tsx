import { Link } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { localDraftRepository } from '../workspace/persistence/LocalDraftRepository'
import { useCurrentUser, useProgressSummary } from '@code-trainer/sdk'

export function ProgressPage() {
  const currentUser = useCurrentUser()
  const serverProgress = useProgressSummary()
  const localProgress = localDraftRepository.getProgressSummary()
  const progress = currentUser.data && serverProgress.data ? serverProgress.data : localProgress
  const level = currentUser.data && serverProgress.data ? serverProgress.data.level : Math.floor(progress.totalXp / 100) + 1

  return (
    <AppShell>
      <div className="progress-page">
        <header className="catalog-heading">
          <p className="eyebrow">Progress</p>
          <h1>Keep the next step clear.</h1>
          <p>{currentUser.data ? 'Your strongest evidence and newest drafts follow your account.' : 'Your work is saved on this device while you learn.'}</p>
        </header>
        <section className="recommendation-card">
          <div>
            <p className="eyebrow">Recommended next</p>
            <h2>Continue Getting Started</h2>
            <p>Build confidence by writing and checking another tiny JavaScript program.</p>
          </div>
          <Link className="primary-button" to="/learn">Choose a lesson <span aria-hidden="true">→</span></Link>
        </section>
        <section className="progress-stats" aria-label="Your progress summary">
          <article><small>Level</small><strong>{level}</strong><span>Learning at your pace</span></article>
          <article><small>XP</small><strong>{progress.totalXp}</strong><span>From meaningful completions</span></article>
          <article><small>Challenges</small><strong>{progress.completedChallengeCount}</strong><span>{currentUser.data ? 'Verified completions' : 'Completed on this device'}</span></article>
        </section>
        <nav className="progress-sections" aria-label="Progress details">
          <span>Skills</span><span>Tracks</span><span>Awards</span><span>Activity</span>
        </nav>
      </div>
    </AppShell>
  )
}
