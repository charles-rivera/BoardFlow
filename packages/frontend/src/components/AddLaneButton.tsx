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
        className="flex h-12 w-[var(--lane-width)] shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border-strong)] text-[var(--color-text-subtle)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        + Add lane
      </button>
    )
  }
  return (
    <div className="w-[var(--lane-width)] shrink-0 rounded-2xl bg-[var(--color-lane-bg)] p-[var(--lane-padding)] shadow-sm">
      <input
        autoFocus value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setAdding(false); setTitle('') } }}
        placeholder="Lane title…"
        className="mb-2 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-2 text-sm text-[var(--color-text)]"
      />
      <div className="flex gap-1">
        <button onClick={submit} className="flex-1 rounded-lg bg-[var(--color-accent)] py-2 text-sm text-white transition-opacity hover:opacity-90">Add</button>
        <button onClick={() => { setAdding(false); setTitle('') }} className="px-2 text-sm text-[var(--color-text-subtle)]">✕</button>
      </div>
    </div>
  )
}
