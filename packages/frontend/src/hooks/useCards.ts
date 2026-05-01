import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Lane } from '@kanban/shared'
import { api } from '../api/client'

export function useMoveCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, laneId, position }: { id: string; laneId: string; position: number }) =>
      api.cards.update(id, { lane_id: laneId, position }),
    onMutate: async ({ id, laneId, position }) => {
      await qc.cancelQueries({ queryKey: ['lanes'] })
      const previousLanes = qc.getQueryData<Lane[]>(['lanes'])
      qc.setQueryData<Lane[]>(['lanes'], (old) => {
        if (!old) return old
        const card = old.flatMap(l => l.cards).find(c => c.id === id)
        if (!card) return old
        return old.map(lane => ({
          ...lane,
          cards: lane.id === laneId
            ? [...lane.cards.filter(c => c.id !== id), { ...card, lane_id: laneId, position }]
                .sort((a, b) => a.position - b.position)
            : lane.cards.filter(c => c.id !== id),
        }))
      })
      return { previousLanes }
    },
    onError: (_err, _vars, context) => {
      qc.setQueryData(['lanes'], context?.previousLanes)
      toast.error('Failed to move card — changes rolled back.')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['lanes'] }),
  })
}

export function useUpdateCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string }) =>
      api.cards.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lanes'] }),
  })
}

export function useCreateCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ laneId, title }: { laneId: string; title: string }) =>
      api.cards.create(laneId, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lanes'] }),
  })
}

export function useDeleteCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.cards.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lanes'] }),
  })
}
