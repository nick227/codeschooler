import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSection, useTrack } from '@code-trainer/sdk'
import { AppShell } from '../../components/AppShell'
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState'

export function LearnCatalogPage() {
  const { trackId = 'javascript-fundamentals', sectionId = 'getting-started' } = useParams()
  const track = useTrack(trackId)
  const section = useSection(sectionId)

  const sectionIndex = useMemo(() => {
    if (!track.data?.sections) return 1
    const idx = track.data.sections.findIndex((s) => s.id === sectionId)
    return idx >= 0 ? idx + 1 : 1
  }, [track.data, sectionId])

  const lessons = section.data?.lessons ?? []

  return (
    <AppShell>
      <div className="catalog-page">
        <header className="catalog-heading">
          <p className="eyebrow">Learn · Code</p>
          <h1>Learn</h1>
        </header>

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

              {track.data?.sections && track.data.sections.length > 1 ? (
                <nav className="catalog-section-nav" aria-label="Learn topics">
                  <p className="catalog-filter-label">Topics</p>
                  <ul>
                    {track.data.sections.map((sec, idx) => {
                      const isActive = sec.id === sectionId
                      return (
                        <li key={sec.id}>
                          <Link
                            to={`/learn/${trackId}/${sec.id}`}
                            className={`catalog-section-link${isActive ? ' is-active' : ''}`}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <span className="section-num">{String(idx + 1).padStart(2, '0')}</span>
                            <span className="section-name">{sec.title}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </nav>
              ) : null}
            </div>

            <div className="catalog-main">
              <ol className="lesson-list">
                {lessons.map((lesson, index) => (
                  <li key={lesson.id}>
                    <Link to={`/learn/${trackId}/${sectionId}/${lesson.challenges[0]?.id}`}>
                      <span className="lesson-number">{String(index + 1).padStart(2, '0')}</span>
                      <span className="lesson-copy">
                        <strong>{lesson.title}</strong>
                        <small>{lesson.summary}</small>
                      </span>
                      <span className="lesson-arrow" aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ol>

              {lessons.length === 0 ? (
                <p className="filter-empty">No lessons are published in this section yet.</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {!section.isLoading && !section.isError && !section.data
          ? <EmptyState>No lessons are published here yet.</EmptyState>
          : null}
      </div>
    </AppShell>
  )
}
