import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSection, useTracks } from '@code-trainer/sdk'
import { AppShell } from '../../components/AppShell'
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState'
import { FilterBar } from '../../components/FilterBar'

type GuidanceFilter = 'all' | 'guided' | 'supported' | 'independent'

const GUIDANCE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Guided', value: 'guided' },
  { label: 'Supported', value: 'supported' },
  { label: 'Independent', value: 'independent' },
]

export function LearnCatalogPage() {
  const { trackId = 'javascript-fundamentals', sectionId = 'getting-started' } = useParams()
  const tracks = useTracks()
  const section = useSection(sectionId)
  const [guidanceFilter, setGuidanceFilter] = useState<GuidanceFilter>('all')

  // A lesson is shown if any of its challenges match the guidance filter.
  // When filtered, only the matching challenge (first one found) is linked.
  const filteredLessons = useMemo(() => {
    if (!section.data) return []
    if (guidanceFilter === 'all') return section.data.lessons

    return section.data.lessons.filter((lesson) =>
      lesson.challenges.some((c) => c.guidance === guidanceFilter)
    )
  }, [section.data, guidanceFilter])

  // Determine which guidance values actually exist in this section
  const availableGuidance = useMemo(() => {
    if (!section.data) return new Set<string>()
    return new Set(section.data.lessons.flatMap((l) => l.challenges.map((c) => c.guidance)))
  }, [section.data])

  // Only show filter options that have content in this section
  const activeOptions = GUIDANCE_OPTIONS.filter(
    (opt) => opt.value === 'all' || availableGuidance.has(opt.value)
  )

  return (
    <AppShell>
      <div className="catalog-page">
        <header className="catalog-heading">
          <p className="eyebrow">Learn · Code</p>
          <h1>Learn</h1>
        </header>

        {tracks.isLoading || section.isLoading ? <LoadingState /> : null}
        {tracks.isError || section.isError ? (
          <ErrorState message="Check that the Code Trainer API is running, then try again." retry={() => { void tracks.refetch(); void section.refetch() }} />
        ) : null}

        {!section.isLoading && !section.isError && section.data ? (
          <section className="lesson-map" aria-labelledby="section-title">
            <div className="section-intro">
              <span className="section-index">Section 1</span>
              <h2 id="section-title">{section.data.title}</h2>
              <p>{section.data.description}</p>

              {/* Guidance filter — only shown when multiple types exist */}
              {activeOptions.length > 2 && (
                <div className="mode-filters">
                  <FilterBar
                    label="Filter by guidance level"
                    value={guidanceFilter}
                    onChange={(v) => setGuidanceFilter(v as GuidanceFilter)}
                    options={activeOptions}
                  />
                </div>
              )}
            </div>

            {filteredLessons.length < section.data.lessons.length && (
              <p className="filter-result-count">
                Showing {filteredLessons.length} of {section.data.lessons.length} lessons
              </p>
            )}

            <ol className="lesson-list">
              {filteredLessons.map((lesson, index) => {
                // When filtered, link to the first challenge matching the filter
                const targetChallenge = guidanceFilter === 'all'
                  ? lesson.challenges[0]
                  : lesson.challenges.find((c) => c.guidance === guidanceFilter) ?? lesson.challenges[0]

                return (
                  <li key={lesson.id}>
                    <Link to={`/learn/${trackId}/${sectionId}/${targetChallenge?.id}`}>
                      <span className="lesson-number">{String(index + 1).padStart(2, '0')}</span>
                      <span className="lesson-copy">
                        <strong>{lesson.title}</strong>
                        <small>{lesson.summary}</small>
                      </span>
                      <span className="lesson-arrow" aria-hidden="true">→</span>
                    </Link>
                  </li>
                )
              })}
            </ol>

            {filteredLessons.length === 0 && (
              <p className="filter-empty">No lessons match the current filter.</p>
            )}
          </section>
        ) : null}

        {!section.isLoading && !section.isError && !section.data ? <EmptyState>No lessons are published here yet.</EmptyState> : null}
      </div>
    </AppShell>
  )
}
