import { useState, useRef, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import type { Lane } from '@kanban/shared'

interface LaneHeaderProps {
  lane: Lane
  onRename: (title: string) => void
  onDelete: () => void
}

export default function LaneHeader({ lane, onRename, onDelete }: LaneHeaderProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(lane.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const save = () => {
    const t = value.trim()
    if (t && t !== lane.title) onRename(t)
    else setValue(lane.title)
    setEditing(false)
  }

  const cancel = () => { setValue(lane.title); setEditing(false) }

  return (
    <div className="mb-2 flex items-center gap-1 px-1">
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
          className="flex-1 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-[length:var(--lane-title-size)] font-semibold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex-1 truncate text-left text-[length:var(--lane-title-size)] font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          {lane.title}
          <span className="ml-1 text-[length:var(--lane-count-size)] font-normal text-[var(--color-text-subtle)]">({lane.cards.length})</span>
        </button>
      )}
      <button
        onClick={onDelete}
        className="shrink-0 p-0.5 text-[var(--color-text-subtle)] transition-colors hover:text-red-500"
        aria-label="Delete lane"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
