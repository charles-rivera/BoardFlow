import { useDroppable } from '@dnd-kit/core'
import type { Lane as LaneType } from '@kanban/shared'
import { useRenameLane, useDeleteLane } from '../hooks/useLanes'
import { useCreateCard } from '../hooks/useCards'
import LaneHeader from './LaneHeader'
import CardList from './CardList'
import AddCardButton from './AddCardButton'

interface LaneProps { lane: LaneType }

export default function Lane({ lane }: LaneProps) {
  const renameLane = useRenameLane()
  const deleteLane = useDeleteLane()
  const createCard = useCreateCard()
  const { setNodeRef, isOver } = useDroppable({
    id: lane.id,
    data: { type: 'lane', laneId: lane.id },
  })

  return (
    <div
      className={`flex flex-col w-64 shrink-0 rounded-xl border bg-gray-50 p-3 shadow-sm transition-colors ${
        isOver ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <LaneHeader
        lane={lane}
        onRename={(title) => renameLane.mutate({ id: lane.id, title })}
        onDelete={() => deleteLane.mutate(lane.id)}
      />
      <div ref={setNodeRef} className="flex-1 flex flex-col gap-2">
        <CardList cards={lane.cards} />
      </div>
      <AddCardButton onAdd={(title) => createCard.mutate({ laneId: lane.id, title })} />
    </div>
  )
}
