import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useRealtimeBoard(enabled: boolean) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof EventSource === 'undefined') return

    const source = new EventSource('/api/events')
    const refreshBoard = () => {
      qc.invalidateQueries({ queryKey: ['lanes'] })
    }

    source.addEventListener('board:changed', refreshBoard)

    return () => {
      source.removeEventListener('board:changed', refreshBoard)
      source.close()
    }
  }, [enabled, qc])
}
