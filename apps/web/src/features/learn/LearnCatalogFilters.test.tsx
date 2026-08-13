import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LearnCatalogPage } from './LearnCatalogPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockSectionGettingStarted = {
  id: 'getting-started',
  title: 'Getting Started',
  description: 'First steps in JS',
  lessons: [
    {
      id: 'l1',
      title: 'Say Hello',
      summary: 'Print text',
      challenges: [{ id: 'c1', title: 'Say Hello', guidance: 'guided' }],
    },
    {
      id: 'l2',
      title: 'Variables',
      summary: 'Store data',
      challenges: [{ id: 'c2', title: 'Variables', guidance: 'supported' }],
    },
  ],
}

const mockSectionAdvanced = {
  id: 'advanced-section',
  title: 'Advanced Section',
  description: 'Independent challenges only',
  lessons: [
    {
      id: 'l3',
      title: 'Complex Logic',
      summary: 'Build algorithms',
      challenges: [{ id: 'c3', title: 'Complex Logic', guidance: 'independent' }],
    },
  ],
}

vi.mock('@code-trainer/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@code-trainer/sdk')>()
  return {
    ...actual,
    useTracks: () => ({ isLoading: false, isError: false, data: [] }),
    useSection: (sectionId: string) => {
      const data = sectionId === 'advanced-section' ? mockSectionAdvanced : mockSectionGettingStarted
      return { isLoading: false, isError: false, data }
    },
  }
})

describe('LearnCatalogPage filters', () => {
  function renderWithClient(ui: React.ReactNode) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
  }

  it('filters by ?guidance=guided correctly within a section', async () => {
    renderWithClient(
      <MemoryRouter initialEntries={['/learn/javascript-fundamentals/getting-started?guidance=guided']}>
        <Routes>
          <Route path="/learn/:trackId/:sectionId" element={<LearnCatalogPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Say Hello')).toBeInTheDocument()
    })
    expect(screen.queryByText('Variables')).not.toBeInTheDocument()
  })

  it('degrades cleanly to all when switching sections to one without that guidance level', async () => {
    renderWithClient(
      <MemoryRouter initialEntries={['/learn/javascript-fundamentals/advanced-section?guidance=guided']}>
        <Routes>
          <Route path="/learn/:trackId/:sectionId" element={<LearnCatalogPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Complex Logic')).toBeInTheDocument()
    })
    expect(screen.getByText('Complex Logic')).toBeVisible()
  })
})
