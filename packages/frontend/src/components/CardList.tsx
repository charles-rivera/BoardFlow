import { useLayoutEffect, useRef } from 'react'
import type { Card } from '@kanban/shared'
import { useUiSettings } from '../context/UiSettingsContext'
import CardComponent from './Card'

interface CardListProps { cards: Card[] }

const cardRects = new Map<string, DOMRect>()

export default function CardList({ cards }: CardListProps) {
  const { settings } = useUiSettings()
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
            {
              duration: settings.animationSpeed === 'off' ? 0 : settings.animationSpeed === 'fast' ? 220 : settings.animationSpeed === 'slow' ? 560 : 420,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
          )
        }
      }
      cardRects.set(card.id, nextRect)
    })
  }, [cards, settings.animationSpeed])

  return (
    <div className="min-h-[2rem] flex-1">
      {cards.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-subtle)]">
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
