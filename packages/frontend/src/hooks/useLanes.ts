import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function useLanes() {
  return useQuery({
    queryKey: ['lanes'],
    queryFn: () => api.lanes.getAll().then(r => r.lanes),
  })
}

export function useCreateLane() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => api.lanes.create(title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lanes'] }),
  })
}

export function useRenameLane() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.lanes.update(id, { title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lanes'] }),
  })
}

export function useDeleteLane() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.lanes.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lanes'] }),
  })
}

export function useReorderLane() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, position }: { id: string; position: number }) =>
      api.lanes.update(id, { position }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lanes'] }),
  })
}
