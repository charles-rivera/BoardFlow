import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Trash2 } from 'lucide-react'
import type { Card } from '@kanban/shared'
import { useUpdateCard, useDeleteCard } from '../hooks/useCards'
import { useUiSettings, type AnimationSpeed } from '../context/UiSettingsContext'
import RichTextEditor from './RichTextEditor'

interface CardModalProps { card: Card; open: boolean; onClose: () => void }

const durationMap: Record<AnimationSpeed, string> = {
  off: '0ms',
  fast: '120ms',
  normal: '200ms',
  slow: '350ms',
}

export default function CardModal({ card, open, onClose }: CardModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()
  const { settings } = useUiSettings()
  const duration = durationMap[settings.animationSpeed]

  useEffect(() => { setTitle(card.title); setDescription(card.description) }, [card.id, card.title, card.description])

  const save = () => {
    if (!title.trim()) return
    if (title.trim() !== card.title || description !== card.description) {
      updateCard.mutate({ id: card.id, title: title.trim(), description })
    }
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="modal-overlay fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          style={{ '--modal-duration': duration } as React.CSSProperties}
        />
        <Dialog.Content
          className="modal-content fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl flex-col gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel-bg)] p-6 text-[var(--color-text)] shadow-2xl overflow-hidden"
          style={{ '--modal-duration': duration } as React.CSSProperties}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Edit Card</h2>
            <Dialog.Close asChild>
              <button className="text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-text)]"><X size={18} /></button>
            </Dialog.Close>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] transition-[border-color,box-shadow] focus:border-[var(--color-accent)] focus:outline-none focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <label className="block text-sm font-medium mb-1">Description</label>
            <RichTextEditor value={description} onChange={setDescription} ariaLabel="Card description" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="flex-1 rounded-lg bg-[var(--color-accent)] py-2 font-medium text-white transition-opacity hover:opacity-90"
            >
              Save
            </button>
            <button
              onClick={() => { deleteCard.mutate(card.id); onClose() }}
              className="rounded-lg border border-red-200 p-2 text-red-500 transition-colors hover:bg-red-50"
              aria-label="Delete card"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
