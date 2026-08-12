import { Link } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { localDraftRepository } from '../workspace/persistence/LocalDraftRepository'
import { useCurrentUser, useProgressSummary } from '@code-trainer/sdk'

export interface AwardItem {
  id: string
  title: string
  description: string
  icon: string
  xpBonus: number
  unlocked: boolean
  requirement: string
}

export function ProfilePage() {
  const currentUser = useCurrentUser()
  const serverProgress = useProgressSummary()
  const localProgress = localDraftRepository.getProgressSummary()

  const progress = currentUser.data && serverProgress.data ? serverProgress.data : localProgress
  const level = currentUser.data && serverProgress.data ? serverProgress.data.level : Math.floor(progress.totalXp / 100) + 1
  const currentLevelXp = progress.totalXp % 100
  const xpToNextLevel = 100 - currentLevelXp

  const displayName = currentUser.data?.displayName ?? 'Learner'
  const initial = displayName.charAt(0).toUpperCase()
  const isRegistered = Boolean(currentUser.data)

  const awards: AwardItem[] = [
    {
      id: 'first-code',
      title: 'First Code',
      description: 'Wrote and checked your first working program.',
      icon: '✨',
      xpBonus: 25,
      unlocked: progress.completedChallengeCount >= 1 || progress.totalXp > 0,
      requirement: 'Complete 1 challenge',
    },
    {
      id: 'syntax-master',
      title: 'Syntax Master',
      description: 'Executed 3 or more challenges with clean syntax.',
      icon: '⚡',
      xpBonus: 50,
      unlocked: progress.completedChallengeCount >= 3,
      requirement: 'Complete 3 challenges',
    },
    {
      id: 'build-streak',
      title: 'Build Streak',
      description: 'Earned 100+ total XP from completed lessons.',
      icon: '🚀',
      xpBonus: 75,
      unlocked: progress.totalXp >= 100,
      requirement: 'Reach 100 total XP',
    },
    {
      id: 'bullseye',
      title: 'Bullseye',
      description: 'Solved challenges cleanly on the first pass.',
      icon: '🎯',
      xpBonus: 50,
      unlocked: progress.completedChallengeCount >= 2,
      requirement: 'Complete 2 challenges first pass',
    },
    {
      id: 'concept-conqueror',
      title: 'Concept Conqueror',
      description: 'Completed 5+ JavaScript learning challenges.',
      icon: '🧠',
      xpBonus: 100,
      unlocked: progress.completedChallengeCount >= 5,
      requirement: 'Complete 5 challenges',
    },
    {
      id: 'code-scholar',
      title: 'Code Scholar',
      description: 'Earned 200+ total XP across curriculum tracks.',
      icon: '🏆',
      xpBonus: 150,
      unlocked: progress.totalXp >= 200,
      requirement: 'Reach 200 total XP',
    },
  ]

  const unlockedCount = awards.filter((a) => a.unlocked).length

  return (
    <AppShell>
      <div className="profile-page">
        {/* Profile Hero Header */}
        <header className="profile-hero">
          <div className="profile-avatar-container">
            <div className="profile-avatar-large">{initial}</div>
            <span className="profile-level-badge">Lvl {level}</span>
          </div>
          <div className="profile-hero-meta">
            <div className="profile-name-row">
              <h1>{displayName}</h1>
              <span className={`status-badge ${isRegistered ? 'status-registered' : 'status-guest'}`}>
                {isRegistered ? 'Verified Account' : 'Guest Learner'}
              </span>
            </div>
            <p className="profile-subtitle">
              {isRegistered
                ? `Account: ${currentUser.data?.email}`
                : 'Progress saved on this device. Sign in anytime to sync across devices.'}
            </p>
          </div>
          <div className="profile-hero-actions">
            <Link to="/learn" className="primary-button">
              Continue Learning <span aria-hidden="true">→</span>
            </Link>
          </div>
        </header>

        {/* Progress & XP Overview */}
        <section className="profile-section" aria-label="Progress summary">
          <h2 className="section-title">Learning Stats</h2>
          <div className="profile-stats-grid">
            <div className="profile-stat-card">
              <span className="stat-label">Level</span>
              <span className="stat-value">{level}</span>
              <span className="stat-detail">{xpToNextLevel} XP to Level {level + 1}</span>
            </div>
            <div className="profile-stat-card">
              <span className="stat-label">Total XP</span>
              <span className="stat-value">{progress.totalXp}</span>
              <span className="stat-detail">Earned from completions</span>
            </div>
            <div className="profile-stat-card">
              <span className="stat-label">Challenges Completed</span>
              <span className="stat-value">{progress.completedChallengeCount}</span>
              <span className="stat-detail">{isRegistered ? 'Server verified' : 'Saved locally'}</span>
            </div>
            <div className="profile-stat-card">
              <span className="stat-label">Awards Unlocked</span>
              <span className="stat-value">{unlockedCount} / {awards.length}</span>
              <span className="stat-detail">Milestones achieved</span>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="xp-progress-wrapper">
            <div className="xp-progress-header">
              <span>Level {level} Progress</span>
              <span>{currentLevelXp} / 100 XP</span>
            </div>
            <div className="xp-progress-bar-track">
              <div className="xp-progress-bar-fill" style={{ width: `${Math.min(100, Math.max(0, currentLevelXp))}%` }} />
            </div>
          </div>
        </section>

        {/* Awards & Achievements Section */}
        <section className="profile-section" aria-label="Awards and achievements">
          <div className="section-header">
            <div>
              <h2 className="section-title">Awards & Milestones</h2>
              <p className="section-desc">Unlock badges as you complete challenges and build real JavaScript programs.</p>
            </div>
            <span className="award-count-chip">{unlockedCount} of {awards.length} unlocked</span>
          </div>

          <div className="awards-grid">
            {awards.map((award) => (
              <div key={award.id} className={`award-card ${award.unlocked ? 'is-unlocked' : 'is-locked'}`}>
                <div className="award-icon">{award.icon}</div>
                <div className="award-info">
                  <div className="award-title-row">
                    <h3>{award.title}</h3>
                    <span className="award-xp">+{award.xpBonus} XP</span>
                  </div>
                  <p>{award.description}</p>
                  <span className="award-status-label">
                    {award.unlocked ? '✓ Unlocked' : `🔒 ${award.requirement}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Skills Overview */}
        <section className="profile-section" aria-label="Skills breakdown">
          <h2 className="section-title">JavaScript Skills</h2>
          <div className="skills-pill-grid">
            <span className={`skill-tag ${progress.completedChallengeCount >= 1 ? 'active' : ''}`}>Variables & Declarations</span>
            <span className={`skill-tag ${progress.completedChallengeCount >= 2 ? 'active' : ''}`}>Functions & Scope</span>
            <span className={`skill-tag ${progress.completedChallengeCount >= 3 ? 'active' : ''}`}>Control Flow & Conditionals</span>
            <span className={`skill-tag ${progress.completedChallengeCount >= 4 ? 'active' : ''}`}>Program Trace Execution</span>
            <span className={`skill-tag ${progress.completedChallengeCount >= 5 ? 'active' : ''}`}>DOM & Event Handling</span>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
