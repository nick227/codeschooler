import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ModeCatalogPage } from './ModeCatalogPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockCatalogData = {
  mode: 'interview',
  title: 'Interview',
  description: 'Master canonical interview patterns.',
  items: [
    { id: 'prob-1', title: 'Two Sum', summary: 'Hash map approach', difficulty: 'easy', pattern: 'hash-maps', challengeId: 'c1' },
    { id: 'prob-2', title: '3Sum', summary: 'Two pointers approach', difficulty: 'medium', pattern: 'two-pointers', challengeId: 'c2' },
    { id: 'prob-3', title: 'Trapping Rain Water', summary: 'Hard two pointers', difficulty: 'hard', pattern: 'two-pointers', challengeId: 'c3' },
  ],
}

describe('ModeCatalogPage filters', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockCatalogData }),
    }))
  })

  afterEach(() => {
    cleanup()
  })

  function renderWithQuery(initialEntry = '/interview') {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/interview" element={<ModeCatalogPage mode="interview" />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  it('filters by ?difficulty=hard correctly', async () => {
    renderWithQuery('/interview?difficulty=hard')

    expect(await screen.findByText('Trapping Rain Water')).toBeInTheDocument()
    expect(screen.queryByText('Two Sum')).not.toBeInTheDocument()
    expect(screen.queryByText('3Sum')).not.toBeInTheDocument()
  })

  it('degrades cleanly on unknown ?pattern=invalid', async () => {
    renderWithQuery('/interview?pattern=invalid-pattern-slug')

    expect(await screen.findByText('Two Sum')).toBeInTheDocument()
    expect(screen.getByText('3Sum')).toBeInTheDocument()
    expect(screen.getByText('Trapping Rain Water')).toBeInTheDocument()
  })

  it('allows selecting pattern filter', async () => {
    renderWithQuery('/interview?pattern=hash-maps')

    expect(await screen.findByText('Two Sum')).toBeInTheDocument()
    expect(screen.queryByText('3Sum')).not.toBeInTheDocument()

    // Click the clear '×' button on active pattern chip
    const clearBtn = screen.getByRole('button', { name: /clear pattern filter/i })
    fireEvent.click(clearBtn)

    await waitFor(() => {
      expect(screen.getByText('3Sum')).toBeInTheDocument()
    })
  })
})
