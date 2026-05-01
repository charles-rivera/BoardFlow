import { useState } from 'react'
import { useCreateLane } from '../hooks/useLanes'

export default function AddLaneButton() {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const createLane = useCreateLane()

  const submit = () => {
    const t = title.trim()
    if (!t) return
    createLane.mutate(t)
    setTitle(''); setAdding(false)
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="shrink-0 w-64 h-12 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
      >
        + Add lane
      </button>
    )
  }
  return (
    <div className="shrink-0 w-64 bg-gray-100 rounded-xl p-3">
      <input
        autoFocus value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setAdding(false); setTitle('') } }}
        placeholder="Lane title…"
        className="w-full border rounded-lg px-2 py-1 text-sm mb-2"
      />
      <div className="flex gap-1">
        <button onClick={submit} className="flex-1 bg-blue-600 text-white text-sm rounded-lg py-1">Add</button>
        <button onClick={() => { setAdding(false); setTitle('') }} className="px-2 text-sm text-gray-400">✕</button>
      </div>
    </div>
  )
}
