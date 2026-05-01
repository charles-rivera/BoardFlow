import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import type { Lane } from '@kanban/shared'
import { useLanes } from '../hooks/useLanes'
import { useMoveCard } from '../hooks/useCards'
import BoardHeader from './BoardHeader'
import LaneList from './LaneList'
import AddLaneButton from './AddLaneButton'

interface BoardPageProps { user: { id: string; email: string } }

export default function BoardPage({ user }: BoardPageProps) {
  const { data: lanes, isLoading } = useLanes()
  const moveCard = useMoveCard()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || !lanes) return
    const cardId = active.id as string
    const targetLaneId = over.id as string
    const targetLane = lanes.find((l: Lane) => l.id === targetLaneId)
    if (!targetLane) return
    const maxPos = targetLane.cards.reduce((m: number, c) => Math.max(m, c.position), 0)
    moveCard.mutate({ id: cardId, laneId: targetLaneId, position: maxPos + 1 })
  }

  if (isLoading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading board…</div>

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <BoardHeader user={user} />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full items-start">
            <LaneList lanes={lanes ?? []} />
            <AddLaneButton />
          </div>
        </div>
      </DndContext>
    </div>
  )
}
