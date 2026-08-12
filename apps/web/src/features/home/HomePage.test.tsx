import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('puts the first coding action ahead of account creation', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('See what your code means as you write it.')
    expect(screen.getByRole('link', { name: /start coding/i })).toHaveAttribute('href', '/learn/javascript-fundamentals/getting-started/js-create-variable-004')
    expect(screen.getByText(/no account needed/i)).toBeVisible()
  })
})
