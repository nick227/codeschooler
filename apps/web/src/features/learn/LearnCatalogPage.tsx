import { Link, useParams } from 'react-router-dom'
import { useSection, useTracks } from '@code-trainer/sdk'
import { AppShell } from '../../components/AppShell'
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState'

export function LearnCatalogPage() {
  const { trackId = 'javascript-fundamentals', sectionId = 'getting-started' } = useParams()
  const tracks = useTracks()
  const section = useSection(sectionId)

  return (
    <AppShell>
      <div className="catalog-page">
        <header className="catalog-heading">
          <p className="eyebrow">Learn · JavaScript</p>
          <h1>Small programs. Clear progress.</h1>
          <p>Start with one line and build toward programs you can explain.</p>
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
            </div>
            <ol className="lesson-list">
              {section.data.lessons.map((lesson, index) => (
                <li key={lesson.id}>
                  <Link to={`/learn/${trackId}/${sectionId}/${lesson.challenges[0]?.id}`}>
                    <span className="lesson-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="lesson-copy"><strong>{lesson.title}</strong><small>{lesson.summary}</small></span>
                    <span className="lesson-arrow" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        {!section.isLoading && !section.isError && !section.data ? <EmptyState>No lessons are published here yet.</EmptyState> : null}
      </div>
    </AppShell>
  )
}
