import { useState } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Card as CardType } from '@kanban/shared'
import CardModal from './CardModal'
import { markdownToPlainText } from './RichTextEditor'

interface CardProps { card: CardType }

function descriptionPreview(description: string) {
  return markdownToPlainText(description)
}

export function CardSurface({
  card,
  isDragging = false,
  isOver = false,
  style,
}: {
  card: CardType
  isDragging?: boolean
  isOver?: boolean
  style?: React.CSSProperties
}) {
  return (
    <div
      style={style}
      className={`bg-white rounded-lg shadow-sm p-3 mb-2 select-none ${
        isDragging ? 'shadow-lg ring-1 ring-blue-200' : 'hover:shadow-md'
      } ${isOver && !isDragging ? 'ring-2 ring-blue-200' : ''}`}
    >
      <p className="text-sm font-medium text-gray-800 leading-snug">{card.title}</p>
      {descriptionPreview(card.description) && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{descriptionPreview(card.description)}</p>
      )}
    </div>
  )
}

export default function Card({ card }: CardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  })
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: `card-drop-${card.id}`,
    data: { type: 'card', laneId: card.lane_id, cardId: card.id },
  })

  const setNodeRef = (node: HTMLDivElement | null) => {
    setDraggableNodeRef(node)
    setDroppableNodeRef(node)
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          transform: isDragging ? undefined : CSS.Translate.toString(transform),
          opacity: isDragging ? 0 : 1,
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging
            ? 'opacity 120ms ease'
            : 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease, box-shadow 220ms ease',
        }}
        {...listeners}
        {...attributes}
        onClick={() => setModalOpen(true)}
      >
        <CardSurface card={card} isDragging={isDragging} isOver={isOver} />
      </div>
      <CardModal card={card} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
