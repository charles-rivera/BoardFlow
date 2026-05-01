import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Lane } from '@kanban/shared'

const mockLanes: Lane[] = [
  {
    id: 'lane-1', user_id: 'u1', title: 'To Do', position: 1,
    created_at: '2024-01-01T00:00:00Z',
    cards: [{
      id: 'card-1', lane_id: 'lane-1', user_id: 'u1', title: 'Task A',
      description: '', position: 1,
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
    }],
  },
  {
    id: 'lane-2', user_id: 'u1', title: 'Done', position: 2,
    created_at: '2024-01-01T00:00:00Z', cards: [],
  },
]

vi.mock('../api/client', () => ({
  api: {
    lanes: { getAll: vi.fn() },
    cards: { update: vi.fn(), create: vi.fn(), delete: vi.fn() },
  },
}))

describe('useMoveCard', () => {
  let qc: QueryClient

  beforeEach(async () => {
    vi.clearAllMocks()
    qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    qc.setQueryData(['lanes'], mockLanes)
  })

  it('applies optimistic update immediately then rolls back on API error', async () => {
    const { api } = await import('../api/client')

    // Use a deferred promise so we can observe the optimistic state before the error fires
    let rejectUpdate!: (reason: unknown) => void
    const deferred = new Promise<never>((_resolve, reject) => { rejectUpdate = reject })
    vi.mocked(api.cards.update).mockReturnValue(deferred)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )
    const { useMoveCard } = await import('../hooks/useCards')
    const { result } = renderHook(() => useMoveCard(), { wrapper })

    // Fire mutation — onMutate runs synchronously setting optimistic data
    act(() => {
      result.current.mutate({ id: 'card-1', laneId: 'lane-2', position: 1 })
    })

    // Wait until the optimistic update is visible (onMutate is async due to cancelQueries)
    await waitFor(() => {
      const lanes = qc.getQueryData<Lane[]>(['lanes'])
      expect(lanes?.find(l => l.id === 'lane-2')?.cards).toHaveLength(1)
    })

    const optimistic = qc.getQueryData<Lane[]>(['lanes'])
    expect(optimistic?.find(l => l.id === 'lane-2')?.cards).toHaveLength(1)
    expect(optimistic?.find(l => l.id === 'lane-1')?.cards).toHaveLength(0)

    // Now reject the API call to trigger onError rollback
    await act(async () => {
      rejectUpdate(new Error('Network error'))
      await deferred.catch(() => {})
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const rolledBack = qc.getQueryData<Lane[]>(['lanes'])
    expect(rolledBack?.find(l => l.id === 'lane-1')?.cards).toHaveLength(1)
    expect(rolledBack?.find(l => l.id === 'lane-2')?.cards).toHaveLength(0)
  })
})
