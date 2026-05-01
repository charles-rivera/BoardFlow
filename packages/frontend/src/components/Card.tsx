import type { Card as CardType } from '@kanban/shared'

interface CardProps { card: CardType }

export default function Card({ card }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
      <p className="text-sm font-medium">{card.title}</p>
    </div>
  )
}
