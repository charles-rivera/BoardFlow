import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Card as CardType } from '@kanban/shared'
import CardModal from './CardModal'

interface CardProps { card: CardType }

export default function Card({ card }: CardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  })

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Translate.toString(transform),
          opacity: isDragging ? 0.4 : 1,
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: 'opacity 200ms ease, box-shadow 200ms ease',
        }}
        {...listeners}
        {...attributes}
        onClick={() => setModalOpen(true)}
        className="bg-white rounded-lg shadow-sm p-3 mb-2 hover:shadow-md select-none"
      >
        <p className="text-sm font-medium text-gray-800 leading-snug">{card.title}</p>
        {card.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{card.description}</p>
        )}
      </div>
      <CardModal card={card} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
