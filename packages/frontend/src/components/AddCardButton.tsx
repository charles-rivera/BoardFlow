import { useState } from 'react'

interface AddCardButtonProps { onAdd: (title: string) => void }

export default function AddCardButton({ onAdd }: AddCardButtonProps) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')

  const submit = () => {
    const t = title.trim()
    if (!t) return
    onAdd(t); setTitle(''); setAdding(false)
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="w-full text-left text-xs text-gray-400 hover:text-gray-600 py-1 px-2 rounded hover:bg-gray-200 transition-colors"
      >
        + Add a card
      </button>
    )
  }
  return (
    <div className="mt-1">
      <input
        autoFocus value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setAdding(false); setTitle('') } }}
        placeholder="Card title…"
        className="w-full border rounded-lg px-2 py-1 text-xs mb-1"
      />
      <div className="flex gap-1">
        <button onClick={submit} className="flex-1 bg-blue-600 text-white text-xs rounded-lg py-1">Add</button>
        <button onClick={() => { setAdding(false); setTitle('') }} className="text-xs text-gray-400 px-1">✕</button>
      </div>
    </div>
  )
}
