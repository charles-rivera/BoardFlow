import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LaneHeader from '../components/LaneHeader'
import type { Lane } from '@kanban/shared'

const lane: Lane = {
  id: 'l1', user_id: 'u1', title: 'To Do', position: 1,
  created_at: new Date().toISOString(), cards: [],
}

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('LaneHeader', () => {
  it('displays lane title', () => {
    wrap(<LaneHeader lane={lane} onRename={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('To Do')).toBeInTheDocument()
  })

  it('enters edit mode on title click', async () => {
    wrap(<LaneHeader lane={lane} onRename={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByText('To Do'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('To Do')
  })

  it('calls onRename and exits edit mode on blur with new title', async () => {
    const onRename = vi.fn()
    wrap(<LaneHeader lane={lane} onRename={onRename} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByText('To Do'))
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, 'In Progress')
    await userEvent.tab()
    expect(onRename).toHaveBeenCalledWith('In Progress')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('cancels edit and restores title on Escape', async () => {
    const onRename = vi.fn()
    wrap(<LaneHeader lane={lane} onRename={onRename} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByText('To Do'))
    await userEvent.clear(screen.getByRole('textbox'))
    await userEvent.type(screen.getByRole('textbox'), 'Changed')
    await userEvent.keyboard('{Escape}')
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByText('To Do')).toBeInTheDocument()
  })
})
