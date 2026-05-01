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
      className={`flex w-[var(--lane-width)] shrink-0 flex-col rounded-2xl border bg-[var(--color-lane-bg)] p-[var(--lane-padding)] shadow-sm transition-colors ${
        isOver ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : 'border-[var(--color-border)]'
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
