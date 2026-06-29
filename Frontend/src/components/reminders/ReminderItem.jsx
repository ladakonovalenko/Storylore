import { useState } from 'react'
import { Trash2, Check, X } from 'lucide-react'

export default function ReminderItem({ reminder, onToggle, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(reminder.text)

  const commit = () => {
    if (draft.trim() && draft.trim() !== reminder.text) {
      onSave(draft.trim())
    }
    setEditing(false)
  }
  const cancel = () => { setDraft(reminder.text); setEditing(false) }

  return (
    <div className="group flex items-start gap-3 rounded-md border border-ink-500 bg-ink-800 px-4 py-3">
      <button
        onClick={() => onToggle(!reminder.is_done)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          reminder.is_done
            ? 'border-amber-ink bg-amber-ink text-ink-900'
            : 'border-ink-300 hover:border-amber-ink'
        }`}
        aria-label={reminder.is_done ? 'Позначити невиконаним' : 'Позначити виконаним'}
      >
        {reminder.is_done && <Check size={13} />}
      </button>

      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <input
            autoFocus value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
            className="flex-1 rounded border border-amber-ink bg-ink-900 px-2 py-1 text-sm text-parchment focus:outline-none"
          />
          <button onClick={commit} className="rounded p-1 text-amber-soft hover:bg-ink-700">
            <Check size={14} />
          </button>
          <button onClick={cancel} className="rounded p-1 text-parchment-dim hover:bg-ink-700">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <p
            onClick={() => setEditing(true)}
            className={`flex-1 cursor-text text-sm ${
              reminder.is_done ? 'text-parchment-dim/50 line-through' : 'text-parchment'
            }`}
            title="Клацніть, щоб редагувати"
          >
            {reminder.text}
          </p>
          <button
            onClick={() => onDelete(reminder)}
            className="shrink-0 rounded p-1 text-parchment-dim opacity-0 transition-opacity hover:bg-crimson-dim/30 hover:text-crimson-soft group-hover:opacity-100"
            aria-label="Видалити"
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
    </div>
  )
}
