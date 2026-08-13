import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { ErrorState, LoadingState } from '../../components/AsyncState'
import { FilterBar } from '../../components/FilterBar'
import { patternDisplayName, skillDisplayName } from '../../utils/skills'
import { ChallengeWorkspace } from '../workspace/ChallengeWorkspace'
import type { PublicChallenge } from '../workspace/workspace.types'

type Mode = 'project' | 'interview' | 'knowledge'

interface ModeItem {
  id: string
  title: string
  summary: string
  challengeId?: string
  difficulty?: 'beginner' | 'easy' | 'medium' | 'hard'
  pattern?: string
  skills?: string[]
  mode?: 'practice' | 'checkpoint' | 'interview-review'
  purpose?: 'knowledge' | 'concept-check'
}

interface ModeProjection {
  mode: Mode
  title: string
  items: ModeItem[]
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const ALLOWED_DIFFICULTIES = ['all', 'easy', 'medium', 'hard'] as const

/** Renders up to `max` skill chips; appends "+N more" when there are extras */
function SkillChips({ skills, max = 3 }: { skills: string[]; max?: number }) {
  if (!skills.length) return null
  const shown = skills.slice(0, max)
  const extra = skills.length - max
  return (
    <span className="item-meta-row">
      {shown.map((s) => (
        <span key={s} className="skill-chip">{skillDisplayName(s)}</span>
      ))}
      {extra > 0 && <span className="skill-chip skill-chip-more">+{extra}</span>}
    </span>
  )
}

export function ModeCatalogPage({ mode }: { mode: Mode }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const catalog = useQuery({
    queryKey: ['mode', mode],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/modes/${mode === 'project' ? 'projects' : mode}`)
      if (!response.ok) throw new Error('Mode catalog unavailable')
      return (await response.json() as { data: ModeProjection }).data
    },
  })

  const patterns = useMemo(() => {
    if (!catalog.data || mode !== 'interview') return []
    return Array.from(new Set(
      catalog.data.items.map((i) => i.pattern).filter(Boolean) as string[]
    )).sort()
  }, [catalog.data, mode])

  const rawDifficulty = searchParams.get('difficulty') ?? 'all'
  const difficultyFilter = ALLOWED_DIFFICULTIES.includes(rawDifficulty as typeof ALLOWED_DIFFICULTIES[number])
    ? rawDifficulty
    : 'all'

  const rawPattern = searchParams.get('pattern') ?? 'all'
  const patternFilter = useMemo(() => {
    if (rawPattern === 'all') return 'all'
    if (patterns.length > 0 && !patterns.includes(rawPattern)) return 'all'
    return rawPattern
  }, [rawPattern, patterns])

  function setFilter(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === 'all' || value === '') {
        next.delete(key)
      } else {
        next.set(key, value)
      }
      return next
    }, { replace: true })
  }

  const filteredItems = useMemo(() => {
    if (!catalog.data) return []
    return catalog.data.items.filter((item) => {
      if (mode === 'interview') {
        if (difficultyFilter !== 'all' && item.difficulty !== difficultyFilter) return false
        if (patternFilter !== 'all' && item.pattern !== patternFilter) return false
      }
      return true
    })
  }, [catalog.data, mode, difficultyFilter, patternFilter])

  if (catalog.isLoading) return <AppShell><div className="catalog-page"><LoadingState label={`Loading ${mode}…`} /></div></AppShell>
  if (!catalog.data) return <AppShell><div className="catalog-page"><ErrorState message={`The ${mode} catalog could not be loaded.`} retry={() => void catalog.refetch()} /></div></AppShell>

  const routeBase = mode === 'project' ? 'projects' : mode
  const isFiltered = filteredItems.length < catalog.data.items.length
  const introLabel = mode === 'project' ? 'Projects' : mode === 'interview' ? 'Interview' : 'Knowledge'

  return (
    <AppShell>
      <div className="catalog-page mode-catalog">
        <header className="catalog-heading">
          <p className="eyebrow">Learn · Code</p>
          <h1>{catalog.data.title}</h1>
        </header>

        <section className="lesson-map" aria-labelledby="section-title">
          <div className="section-intro">
            <span className="section-index">{introLabel}</span>
            <h2 id="section-title">{catalog.data.title}</h2>

            {mode === 'interview' ? (
              <div className="mode-filters">
                <FilterBar
                  label="Filter by difficulty"
                  value={difficultyFilter}
                  onChange={(v) => setFilter('difficulty', v === difficultyFilter ? 'all' : v)}
                  options={[
                    { label: 'Easy', value: 'easy' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'Hard', value: 'hard' },
                  ]}
                />
                <div className="pattern-select-row">
                  <label className="pattern-select-label" htmlFor="pattern-select">Pattern</label>
                  <select
                    id="pattern-select"
                    className="pattern-select"
                    value={patternFilter}
                    onChange={(e) => setFilter('pattern', e.target.value)}
                  >
                    <option value="all">All patterns</option>
                    {patterns.map((p) => (
                      <option key={p} value={p}>{patternDisplayName(p)}</option>
                    ))}
                  </select>
                  {patternFilter !== 'all' ? (
                    <span className="pattern-chip selected-pattern-chip">
                      {patternDisplayName(patternFilter)}
                      <button
                        type="button"
                        className="pattern-chip-clear"
                        aria-label="Clear pattern filter"
                        onClick={() => setFilter('pattern', 'all')}
                      >×</button>
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="catalog-main">
            {isFiltered ? (
              <p className="filter-result-count">
                Showing {filteredItems.length} of {catalog.data.items.length}
              </p>
            ) : null}

            <ol className="mode-item-list">
              {filteredItems.map((item, index) => {
                const target = mode === 'knowledge'
                  ? `/${routeBase}/quiz/${item.id}`
                  : `/${routeBase}/${item.challengeId ?? item.id}`

                return (
                  <li key={item.id}>
                    <Link to={target}>
                      <span className="lesson-number">{String(index + 1).padStart(2, '0')}</span>
                      <span className="lesson-copy">
                        <strong>{item.title}</strong>
                        <small>{item.summary}</small>
                        {mode === 'interview' && (item.difficulty || item.pattern) ? (
                          <span className="item-meta-row">
                            {item.difficulty ? (
                              <span className={`difficulty-chip difficulty-${item.difficulty}`}>
                                {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                              </span>
                            ) : null}
                            {item.pattern ? (
                              <span className="pattern-chip">{patternDisplayName(item.pattern)}</span>
                            ) : null}
                          </span>
                        ) : null}
                        {mode === 'project' && item.skills && item.skills.length > 0 ? (
                          <SkillChips skills={item.skills} max={3} />
                        ) : null}
                      </span>
                      <span className="lesson-arrow">→</span>
                    </Link>
                  </li>
                )
              })}
            </ol>

            {filteredItems.length === 0 ? (
              <p className="filter-empty">No items match the current filters.</p>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export function ModeChallengePage({ mode }: { mode: Exclude<Mode, 'knowledge'> }) {
  const { challengeId } = useParams()
  const routeBase = mode === 'project' ? 'projects' : mode
  const challenge = useQuery({
    queryKey: ['challenge', challengeId], enabled: Boolean(challengeId),
    queryFn: async () => {
      const response = await fetch(`${API_URL}/challenges/${challengeId}`)
      if (!response.ok) throw new Error('Challenge unavailable')
      return (await response.json() as { data: PublicChallenge }).data
    },
  })
  if (challenge.isLoading) return <div className="workspace-loading"><LoadingState label="Preparing your editor…" /></div>
  if (!challenge.data) return <div className="workspace-loading"><ErrorState message="This challenge could not be loaded." retry={() => void challenge.refetch()} /></div>
  return <ChallengeWorkspace challenge={challenge.data} trackId={mode} sectionId="" sectionTitle={mode === 'project' ? 'Return to Projects' : 'Return to Interview'} returnToOverride={`/${routeBase}`} />
}
