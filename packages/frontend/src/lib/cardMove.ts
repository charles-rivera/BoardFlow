import type { Lane } from '@kanban/shared'

export interface MoveCardInput {
  id: string
  laneId: string
  position: number
  targetIndex?: number
}

export function moveCardInLanes(lanes: Lane[], { id, laneId, position, targetIndex }: MoveCardInput): Lane[] {
  const card = lanes.flatMap(lane => lane.cards).find(candidate => candidate.id === id)
  if (!card) return lanes

  return lanes.map((lane) => {
    const cardsWithoutActive = lane.cards.filter(candidate => candidate.id !== id)

    if (lane.id !== laneId) {
      return { ...lane, cards: cardsWithoutActive }
    }

    const nextCard = { ...card, lane_id: laneId, position }
    if (targetIndex === undefined) {
      return {
        ...lane,
        cards: [...cardsWithoutActive, nextCard].sort((a, b) => a.position - b.position),
      }
    }

    const insertIndex = Math.max(0, Math.min(targetIndex, cardsWithoutActive.length))
    return {
      ...lane,
      cards: [
        ...cardsWithoutActive.slice(0, insertIndex),
        nextCard,
        ...cardsWithoutActive.slice(insertIndex),
      ],
    }
  })
}

export function getCardInsertPosition(cards: Array<{ id: string; position: number }>, targetIndex: number) {
  if (cards.length === 0) return 1
  if (targetIndex <= 0) return cards[0].position - 1
  if (targetIndex >= cards.length) return cards[cards.length - 1].position + 1
  return (cards[targetIndex - 1].position + cards[targetIndex].position) / 2
}
