import { Link } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { localDraftRepository } from '../workspace/persistence/LocalDraftRepository'

export function ProgressPage() {
  const progress = localDraftRepository.getProgressSummary()
  const level = Math.floor(progress.totalXp / 100) + 1

  return (
    <AppShell>
      <div className="progress-page">
        <header className="catalog-heading">
          <p className="eyebrow">Progress</p>
          <h1>Keep the next step clear.</h1>
          <p>Your work is saved on this device while you learn.</p>
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
          <article><small>Challenges</small><strong>{progress.completedChallengeCount}</strong><span>Completed on this device</span></article>
        </section>
        <nav className="progress-sections" aria-label="Progress details">
          <span>Skills</span><span>Tracks</span><span>Awards</span><span>Activity</span>
        </nav>
      </div>
    </AppShell>
  )
}
