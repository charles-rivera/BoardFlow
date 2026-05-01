import type { Lane } from '@kanban/shared'
import LaneComponent from './Lane'

interface LaneListProps { lanes: Lane[] }

export default function LaneList({ lanes }: LaneListProps) {
  return (
    <>
      {lanes.map(lane => <LaneComponent key={lane.id} lane={lane} />)}
    </>
  )
}
