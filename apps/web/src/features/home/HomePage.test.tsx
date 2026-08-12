import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createApiClient } from '@code-trainer/sdk'

describe('HomePage', () => {
  it('puts the first coding action ahead of account creation', () => {
    createApiClient({ baseUrl: 'http://localhost:3001' })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={queryClient}><MemoryRouter><HomePage /></MemoryRouter></QueryClientProvider>)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('See what your code means as you write it.')
    expect(screen.getByRole('link', { name: /start coding/i })).toHaveAttribute('href', '/learn/javascript-fundamentals/getting-started/js-create-variable-004')
    expect(screen.getByText(/no account needed/i)).toBeVisible()
  })
})
