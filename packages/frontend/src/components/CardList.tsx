import { useLayoutEffect, useRef } from 'react'
import type { Card } from '@kanban/shared'
import CardComponent from './Card'

interface CardListProps { cards: Card[] }

const cardRects = new Map<string, DOMRect>()

export default function CardList({ cards }: CardListProps) {
  const itemRefs = useRef(new Map<string, HTMLDivElement>())

  useLayoutEffect(() => {
    cards.forEach((card) => {
      const node = itemRefs.current.get(card.id)
      if (!node) return

      const nextRect = node.getBoundingClientRect()
      const previousRect = cardRects.get(card.id)
      if (previousRect) {
        const deltaX = previousRect.left - nextRect.left
        const deltaY = previousRect.top - nextRect.top
        if (deltaX || deltaY) {
          node.animate(
            [
              { transform: `translate(${deltaX}px, ${deltaY}px)` },
              { transform: 'translate(0, 0)' },
            ],
            { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
          )
        }
      }
      cardRects.set(card.id, nextRect)
    })
  }, [cards])

  return (
    <div className="min-h-[2rem] flex-1">
      {cards.length === 0 && (
        <div className="text-center text-gray-300 text-xs py-4 border-2 border-dashed border-gray-200 rounded-lg">
          Drop cards here
        </div>
      )}
      {cards.map(card => (
        <div
          key={card.id}
          ref={(node) => {
            if (node) itemRefs.current.set(card.id, node)
            else itemRefs.current.delete(card.id)
          }}
        >
          <CardComponent card={card} />
        </div>
      ))}
    </div>
  )
}
