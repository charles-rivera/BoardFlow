import type { Lane as LaneType } from '@kanban/shared'

interface LaneProps { lane: LaneType }

export default function Lane({ lane }: LaneProps) {
  return (
    <div className="flex flex-col bg-gray-100 rounded-xl w-64 shrink-0 p-3">
      <div className="font-semibold text-sm mb-2">{lane.title}</div>
      <div className="text-xs text-gray-400">{lane.cards.length} cards</div>
    </div>
  )
}
