import { useState, useRef } from 'react'
import { GripVertical, Trash2, Check, X, Pencil, Bold, Italic, List, ArrowUp, ArrowDown } from 'lucide-react'
import FormattedText from '../common/FormattedText'

export default function StructureBlockCard({
  block, isDragging, isDragOver, isFirst, isLast,
  onDragStart, onDragOver, onDragEnd, onDrop,
  onSaveTitle, onSaveContent, onDelete,
  onMoveUp, onMoveDown, // НОВЕ: тач-дружня альтернатива drag-and-drop
}) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(block.title)
  const [editingContent, setEditingContent] = useState(false)
  const [contentDraft, setContentDraft] = useState(block.content ?? '')
  const textareaRef = useRef(null)

  const startEditTitle = () => { setTitleDraft(block.title); setEditingTitle(true) }
  const cancelEditTitle = () => { setTitleDraft(block.title); setEditingTitle(false) }
  const commitTitle = () => {
    if (titleDraft.trim() && titleDraft !== block.title) onSaveTitle(titleDraft.trim())
    setEditingTitle(false)
  }

  const startEditContent = () => { setContentDraft(block.content ?? ''); setEditingContent(true) }
  const cancelEditContent = () => { setContentDraft(block.content ?? ''); setEditingContent(false) }
  const commitContent = () => {
    if (contentDraft !== (block.content ?? '')) onSaveContent(contentDraft)
    setEditingContent(false)
  }

  const wrapSelection = (marker) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = contentDraft.slice(start, end)
    const next = contentDraft.slice(0, start) + marker + selected + marker + contentDraft.slice(end)
    setContentDraft(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = start + marker.length
      ta.selectionEnd = start + marker.length + selected.length
    })
  }

  const insertListItem = () => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const before = contentDraft.slice(0, start)
    const after = contentDraft.slice(start)
    const needsNewline = before.length > 0 && !before.endsWith('\n')
    const insertion = (needsNewline ? '\n' : '') + '- '
    const next = before + insertion + after
    setContentDraft(next)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = (before + insertion).length
      ta.selectionStart = ta.selectionEnd = pos
    })
  }

  return (
    <div
      className={`group flex gap-3 rounded-lg border bg-ink-800 px-4 py-3 transition-all ${
        isDragging ? 'opacity-40' : ''
      } ${isDragOver ? 'border-amber-ink' : 'border-ink-500'}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Ручка перетягування — для миші (десктоп, ховається на мобільних).
          НОВЕ: стрілки вгору/вниз поруч — для тачскрінів, де нативний
          HTML5 drag-and-drop практично не працює */}
      <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
        <div
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="hidden cursor-grab text-parchment-dim/50 active:cursor-grabbing md:block"
          title="Перетягніть, щоб змінити порядок"
        >
          <GripVertical size={16} />
        </div>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="rounded p-1 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-parchment-dim"
            aria-label="Перемістити вгору"
            title="Перемістити вгору"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="rounded p-1 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-parchment-dim"
            aria-label="Перемістити вниз"
            title="Перемістити вниз"
          >
            <ArrowDown size={13} />
          </button>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {/* Заголовок блоку */}
        {editingTitle ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') cancelEditTitle() }}
              className="flex-1 rounded border border-amber-ink bg-ink-900 px-2 py-1 text-sm font-medium text-parchment focus:outline-none"
            />
            <button onClick={commitTitle} className="rounded p-1 text-amber-soft hover:bg-ink-700" aria-label="Зберегти назву">
              <Check size={13} />
            </button>
            <button onClick={cancelEditTitle} className="rounded p-1 text-parchment-dim hover:bg-ink-700" aria-label="Скасувати">
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="group/title flex items-center gap-1.5">
            <h3 className="select-text font-display text-base font-medium text-parchment">
              {block.title}
            </h3>
            <button
              onClick={startEditTitle}
              className="rounded p-1 text-parchment-dim opacity-0 transition-opacity hover:bg-ink-700 hover:text-amber-soft group-hover/title:opacity-100"
              aria-label="Редагувати назву"
              title="Редагувати назву"
            >
              <Pencil size={12} />
            </button>
          </div>
        )}

        {/* Текст блоку */}
        {editingContent ? (
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => wrapSelection('**')}
                className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft" title="Жирний (**текст**)">
                <Bold size={13} />
              </button>
              <button type="button" onClick={() => wrapSelection('*')}
                className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft" title="Курсив (*текст*)">
                <Italic size={13} />
              </button>
              <button type="button" onClick={insertListItem}
                className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft" title="Пункт списку">
                <List size={13} />
              </button>
              <span className="ml-2 hidden text-[10px] text-parchment-dim/50 sm:inline">
                Підтримує [[Назва]] для посилань на персонажів, локації тощо
              </span>
            </div>
            <textarea
              ref={textareaRef}
              autoFocus value={contentDraft} rows={5}
              onChange={(e) => setContentDraft(e.target.value)}
              className="w-full resize-none rounded-md border border-amber-ink bg-ink-900 px-3 py-2 text-sm text-parchment focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={cancelEditContent}
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
          <div className="group/content mt-2 flex items-start gap-1.5">
            <div className="min-w-0 flex-1 select-text text-sm text-parchment-dim [&_p]:my-0.5">
              {block.content
                ? <FormattedText text={block.content} />
                : <span className="italic text-parchment-dim/50">Порожній блок</span>}
            </div>
            <button
              onClick={startEditContent}
              className="mt-0.5 shrink-0 rounded p-1 text-parchment-dim opacity-0 transition-opacity hover:bg-ink-700 hover:text-amber-soft group-hover/content:opacity-100"
              aria-label="Редагувати текст"
              title="Редагувати текст"
            >
              <Pencil size={12} />
            </button>
          </div>
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
