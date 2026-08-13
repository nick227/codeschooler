import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useSection, useTrack } from '@code-trainer/sdk'
import { AppShell } from '../../components/AppShell'
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState'
import { FilterBar } from '../../components/FilterBar'

type GuidanceFilter = 'all' | 'guided' | 'supported' | 'independent'

const GUIDANCE_OPTIONS = [
  { label: 'All',         value: 'all' },
  { label: 'Guided',      value: 'guided' },
  { label: 'Supported',   value: 'supported' },
  { label: 'Independent', value: 'independent' },
]

const ALLOWED_GUIDANCE = ['all', 'guided', 'supported', 'independent'] as const

export function LearnCatalogPage() {
  const { trackId = 'javascript-fundamentals', sectionId = 'getting-started' } = useParams()
  const track = useTrack(trackId)
  const section = useSection(sectionId)

  // URL-backed filter state — survives refresh, shareable as /learn/...?guidance=guided
  const [searchParams, setSearchParams] = useSearchParams()

  function setGuidance(value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === 'all') {
        next.delete('guidance')
      } else {
        next.set('guidance', value)
      }
      return next
    }, { replace: true })
  }

  // Determine which guidance values actually exist in this section
  const availableGuidance = useMemo(() => {
    if (!section.data) return new Set<string>()
    return new Set(section.data.lessons.flatMap((l) => l.challenges.map((c) => c.guidance)))
  }, [section.data])

  // Validate URL parameter against allowed list AND section's available guidance levels.
  // If the parameter is invalid or unsupported in this section, degrade cleanly to 'all'.
  const rawGuidance = searchParams.get('guidance') ?? 'all'
  const guidanceFilter = useMemo(() => {
    if (!ALLOWED_GUIDANCE.includes(rawGuidance as typeof ALLOWED_GUIDANCE[number])) {
      return 'all'
    }
    if (rawGuidance !== 'all' && availableGuidance.size > 0 && !availableGuidance.has(rawGuidance)) {
      return 'all'
    }
    return rawGuidance as GuidanceFilter
  }, [rawGuidance, availableGuidance])

  // A lesson is shown if any of its challenges match the guidance filter
  const filteredLessons = useMemo(() => {
    if (!section.data) return []
    if (guidanceFilter === 'all') return section.data.lessons
    return section.data.lessons.filter((lesson) =>
      lesson.challenges.some((c) => c.guidance === guidanceFilter)
    )
  }, [section.data, guidanceFilter])

  const activeOptions = GUIDANCE_OPTIONS.filter(
    (opt) => opt.value === 'all' || availableGuidance.has(opt.value)
  )

  const sectionIndex = useMemo(() => {
    if (!track.data?.sections) return 1
    const idx = track.data.sections.findIndex((s) => s.id === sectionId)
    return idx >= 0 ? idx + 1 : 1
  }, [track.data, sectionId])

  return (
    <AppShell>
      <div className="catalog-page">
        <header className="catalog-heading">
          <p className="eyebrow">Learn · Code</p>
          <h1>Learn</h1>
        </header>

        {/* Section Navigation Bar */}
        {track.data?.sections && track.data.sections.length > 1 && (
          <nav className="section-selector-bar" aria-label="Curriculum sections">
            <div className="section-chips">
              {track.data.sections.map((sec, idx) => {
                const isActive = sec.id === sectionId
                const linkGuidance = guidanceFilter !== 'all' ? `?guidance=${guidanceFilter}` : ''
                return (
                  <Link
                    key={sec.id}
                    to={`/learn/${trackId}/${sec.id}${linkGuidance}`}
                    className={`section-chip ${isActive ? 'is-active' : ''}`}
                    title={sec.title}
                  >
                    <span className="section-num">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="section-name">{sec.title}</span>
                  </Link>
                )
              })}
            </div>
          </nav>
        )}

        {track.isLoading || section.isLoading ? <LoadingState /> : null}
        {track.isError || section.isError ? (
          <ErrorState
            message="Check that the Code Trainer API is running, then try again."
            retry={() => { void track.refetch(); void section.refetch() }}
          />
        ) : null}

        {!section.isLoading && !section.isError && section.data ? (
          <section className="lesson-map" aria-labelledby="section-title">
            <div className="section-intro">
              <span className="section-index">Section {sectionIndex}</span>
              <h2 id="section-title">{section.data.title}</h2>
              <p>{section.data.description}</p>

              {/* Guidance filter */}
              <div className="mode-filters">
                <FilterBar
                  label="Filter by guidance level"
                  value={guidanceFilter}
                  onChange={setGuidance}
                  options={activeOptions}
                />
              </div>
            </div>

            {filteredLessons.length < section.data.lessons.length && (
              <p className="filter-result-count">
                Showing {filteredLessons.length} of {section.data.lessons.length} lessons
              </p>
            )}

            <ol className="lesson-list">
              {filteredLessons.map((lesson, index) => {
                // When filtered, link to the first challenge matching the guidance filter
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

        {!section.isLoading && !section.isError && !section.data
          ? <EmptyState>No lessons are published here yet.</EmptyState>
          : null}
      </div>
    </AppShell>
  )
}
