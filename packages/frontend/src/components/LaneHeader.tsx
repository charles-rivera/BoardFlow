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
    <div className="flex items-center gap-1 mb-2 px-1">
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
          className="flex-1 border rounded-lg px-2 py-0.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex-1 text-left font-semibold text-sm text-gray-700 hover:text-gray-900 truncate"
        >
          {lane.title}
          <span className="ml-1 text-xs text-gray-400 font-normal">({lane.cards.length})</span>
        </button>
      )}
      <button
        onClick={onDelete}
        className="shrink-0 text-gray-300 hover:text-red-500 transition-colors p-0.5"
        aria-label="Delete lane"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
