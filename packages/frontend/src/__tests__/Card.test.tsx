import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Card from '../components/Card'
import type { Card as CardType } from '@kanban/shared'

const card: CardType = {
  id: 'c1', lane_id: 'l1', user_id: 'u1',
  title: 'Test Card', description: 'Some description',
  position: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
}

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('Card', () => {
  it('renders card title', () => {
    wrap(<Card card={card} />)
    expect(screen.getByText('Test Card')).toBeInTheDocument()
  })

  it('opens modal on click showing title and description', async () => {
    wrap(<Card card={card} />)
    await userEvent.click(screen.getByText('Test Card'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Card description' })).toHaveTextContent('Some description')
  })

  it('closes modal on backdrop click', async () => {
    wrap(<Card card={card} />)
    await userEvent.click(screen.getByText('Test Card'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('dialog'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
