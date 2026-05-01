import { useState } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Card as CardType } from '@kanban/shared'
import { useUiSettings } from '../context/UiSettingsContext'
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
      className={`mb-2 select-none rounded-xl bg-[var(--color-card-bg)] p-[var(--card-padding)] shadow-sm ${
        isDragging ? 'shadow-lg ring-1 ring-[var(--color-accent)]' : 'hover:shadow-md'
      } ${isOver && !isDragging ? 'ring-2 ring-[var(--color-accent)]' : ''}`}
    >
      <p className="text-[length:var(--card-title-size)] font-medium leading-snug text-[var(--color-text)]">{card.title}</p>
      {descriptionPreview(card.description) && (
        <p className="mt-1 line-clamp-2 text-[length:var(--card-description-size)] text-[var(--color-text-subtle)]">{descriptionPreview(card.description)}</p>
      )}
    </div>
  )
}

export default function Card({ card }: CardProps) {
  const { settings } = useUiSettings()
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
            ? `opacity ${settings.animationSpeed === 'off' ? 0 : settings.animationSpeed === 'fast' ? 80 : settings.animationSpeed === 'slow' ? 160 : 120}ms ease`
            : `transform ${settings.animationSpeed === 'off' ? 0 : settings.animationSpeed === 'fast' ? 220 : settings.animationSpeed === 'slow' ? 560 : 420}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${settings.animationSpeed === 'off' ? 0 : settings.animationSpeed === 'fast' ? 120 : settings.animationSpeed === 'slow' ? 280 : 220}ms ease, box-shadow ${settings.animationSpeed === 'off' ? 0 : settings.animationSpeed === 'fast' ? 120 : settings.animationSpeed === 'slow' ? 280 : 220}ms ease`,
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
