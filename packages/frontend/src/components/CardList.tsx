import type { Card } from '@kanban/shared'
import CardComponent from './Card'

interface CardListProps { cards: Card[] }

export default function CardList({ cards }: CardListProps) {
  return (
    <div className="min-h-[2rem] flex-1">
      {cards.length === 0 && (
        <div className="text-center text-gray-300 text-xs py-4 border-2 border-dashed border-gray-200 rounded-lg">
          Drop cards here
        </div>
      )}
      {cards.map(card => <CardComponent key={card.id} card={card} />)}
    </div>
  )
}
