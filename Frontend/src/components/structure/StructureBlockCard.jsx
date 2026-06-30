import { useState } from 'react'
import { GripVertical, Trash2, Check, X } from 'lucide-react'

export default function StructureBlockCard({
  block, isDragging, isDragOver,
  onDragStart, onDragOver, onDragEnd, onDrop,
  onSaveTitle, onSaveContent, onDelete,
}) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(block.title)
  const [editingContent, setEditingContent] = useState(false)
  const [contentDraft, setContentDraft] = useState(block.content ?? '')

  const commitTitle = () => {
    if (titleDraft.trim() && titleDraft !== block.title) onSaveTitle(titleDraft.trim())
    setEditingTitle(false)
  }
  const commitContent = () => {
    if (contentDraft !== (block.content ?? '')) onSaveContent(contentDraft)
    setEditingContent(false)
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={`group flex gap-3 rounded-lg border bg-ink-800 px-4 py-3 transition-all ${
        isDragging ? 'opacity-40' : ''
      } ${isDragOver ? 'border-amber-ink' : 'border-ink-500'}`}
    >
      {/* Ручка перетягування */}
      <div className="flex shrink-0 cursor-grab items-start pt-1 text-parchment-dim/50 active:cursor-grabbing">
        <GripVertical size={16} />
      </div>

      <div className="min-w-0 flex-1">
        {/* Заголовок блоку */}
        {editingTitle ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setTitleDraft(block.title); setEditingTitle(false) } }}
              className="flex-1 rounded border border-amber-ink bg-ink-900 px-2 py-1 text-sm font-medium text-parchment focus:outline-none"
            />
            <button onClick={commitTitle} className="rounded p-1 text-amber-soft hover:bg-ink-700"><Check size={13} /></button>
          </div>
        ) : (
          <h3
            onClick={() => { setTitleDraft(block.title); setEditingTitle(true) }}
            className="cursor-text font-display text-base font-medium text-parchment hover:text-amber-soft"
            title="Клацніть, щоб перейменувати"
          >
            {block.title}
          </h3>
        )}

        {/* Текст блоку */}
        {editingContent ? (
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              autoFocus value={contentDraft} rows={5}
              onChange={(e) => setContentDraft(e.target.value)}
              className="w-full resize-none rounded-md border border-amber-ink bg-ink-900 px-3 py-2 text-sm text-parchment focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setContentDraft(block.content ?? ''); setEditingContent(false) }}
                className="rounded px-3 py-1 text-xs text-parchment-dim hover:bg-ink-700">
                Скасувати
              </button>
              <button onClick={commitContent}
                className="flex items-center gap-1 rounded bg-amber-ink px-3 py-1 text-xs font-medium text-ink-900 hover:bg-amber-soft">
                <Check size={12} /> Зберегти
              </button>
            </div>
          </div>
        ) : (
          <p
            onClick={() => { setContentDraft(block.content ?? ''); setEditingContent(true) }}
            className="mt-2 cursor-text whitespace-pre-wrap text-sm text-parchment-dim hover:text-parchment"
            title="Клацніть, щоб редагувати"
          >
            {block.content || <span className="italic text-parchment-dim/50">Порожній блок — клацніть, щоб написати…</span>}
          </p>
        )}
      </div>

      <button
        onClick={onDelete}
        className="shrink-0 rounded p-1.5 text-parchment-dim opacity-0 transition-opacity hover:bg-crimson-dim/30 hover:text-crimson-soft group-hover:opacity-100"
        aria-label="Видалити блок"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
