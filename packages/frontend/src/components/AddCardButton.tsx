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
        className="w-full rounded-lg px-2 py-1 text-left text-xs text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-muted)]"
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
        className="mb-1 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)] transition-[border-color,box-shadow] focus:border-[var(--color-accent)] focus:outline-none focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
      />
      <div className="flex gap-1">
        <button onClick={submit} className="flex-1 rounded-lg bg-[var(--color-accent)] py-1 text-xs text-white transition-opacity hover:opacity-90">Add</button>
        <button onClick={() => { setAdding(false); setTitle('') }} className="px-1 text-xs text-[var(--color-text-subtle)]">✕</button>
      </div>
    </div>
  )
}
