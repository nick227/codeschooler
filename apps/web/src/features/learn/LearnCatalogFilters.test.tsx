import { render, screen, waitFor, within, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { LearnCatalogPage } from './LearnCatalogPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockTrack = {
  id: 'javascript-fundamentals',
  title: 'JavaScript Fundamentals',
  sections: [
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'variables-and-functions', title: 'Variables and Functions' },
  ],
}

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

const mockSectionVariables = {
  id: 'variables-and-functions',
  title: 'Variables and Functions',
  description: 'Store and reuse values',
  lessons: [
    {
      id: 'l3',
      title: 'Declare a Variable',
      summary: 'Use let',
      challenges: [{ id: 'c3', title: 'Declare a Variable', guidance: 'independent' }],
    },
  ],
}

vi.mock('@code-trainer/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@code-trainer/sdk')>()
  return {
    ...actual,
    useTracks: () => ({ isLoading: false, isError: false, data: [] }),
    useTrack: () => ({ isLoading: false, isError: false, data: mockTrack, refetch: vi.fn() }),
    useSection: (sectionId: string) => {
      const data = sectionId === 'variables-and-functions' ? mockSectionVariables : mockSectionGettingStarted
      return { isLoading: false, isError: false, data, refetch: vi.fn() }
    },
  }
})

describe('LearnCatalogPage', () => {
  afterEach(() => {
    cleanup()
  })

  function renderWithClient(ui: React.ReactNode) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
  }

  it('lists lessons for the active section in the main column', async () => {
    renderWithClient(
      <MemoryRouter initialEntries={['/learn/javascript-fundamentals/getting-started']}>
        <Routes>
          <Route path="/learn/:trackId/:sectionId" element={<LearnCatalogPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Say Hello')).toBeInTheDocument()
    })
    expect(screen.getByText('Variables')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /guided/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /supported/i })).not.toBeInTheDocument()
  })

  it('shows topic links in the left column and switches sections', async () => {
    renderWithClient(
      <MemoryRouter initialEntries={['/learn/javascript-fundamentals/variables-and-functions']}>
        <Routes>
          <Route path="/learn/:trackId/:sectionId" element={<LearnCatalogPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Declare a Variable')).toBeInTheDocument()
    })
    const topicNav = screen.getByRole('navigation', { name: 'Learn topics' })
    expect(topicNav).toBeInTheDocument()
    expect(within(topicNav).getByRole('link', { name: /Getting Started/i })).toBeInTheDocument()
    expect(screen.queryByText('Say Hello')).not.toBeInTheDocument()
  })
})
