import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { Card } from '@kanban/shared'
import { useUpdateCard, useDeleteCard } from '../hooks/useCards'
import RichTextEditor from './RichTextEditor'

interface CardModalProps { card: Card; open: boolean; onClose: () => void }

export default function CardModal({ card, open, onClose }: CardModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()

  useEffect(() => { setTitle(card.title); setDescription(card.description) }, [card.id])

  if (!open) return null

  const save = () => {
    if (!title.trim()) return
    if (title.trim() !== card.title || description !== card.description) {
      updateCard.mutate({ id: card.id, title: title.trim(), description })
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Card</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <label className="block text-sm font-medium mb-1">Description</label>
          <RichTextEditor value={description} onChange={setDescription} ariaLabel="Card description" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
          >
            Save
          </button>
          <button
            onClick={() => { deleteCard.mutate(card.id); onClose() }}
            className="p-2 text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
            aria-label="Delete card"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
