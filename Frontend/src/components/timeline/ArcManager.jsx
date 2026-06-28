import { useState } from 'react'
import { Plus, Edit3, Trash2, Check, X, Loader2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { createArc, updateArc, deleteArc, setArcCharacters } from '../../api/arcs'
import Modal from '../common/Modal'

const inputCls =
  'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

const STATUS_OPTIONS = ['Запланована', 'Активна', 'Завершена']

function CharacterRoleEditor({ characters, value, onChange }) {
  // value: [{ character_id, role }]
  const isSelected = (id) => value.some((v) => v.character_id === id)
  const roleFor = (id) => value.find((v) => v.character_id === id)?.role ?? 'Учасник'

  const toggle = (id) => {
    if (isSelected(id)) {
      onChange(value.filter((v) => v.character_id !== id))
    } else {
      onChange([...value, { character_id: id, role: 'Учасник' }])
    }
  }
  const setRole = (id, role) => {
    onChange(value.map((v) => (v.character_id === id ? { ...v, role } : v)))
  }

  if (characters.length === 0) {
    return <p className="text-xs italic text-parchment-dim/60">У проєкті ще немає персонажів</p>
  }

  return (
    <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-md border border-ink-500 bg-ink-900 p-2">
      {characters.map((c) => (
        <div key={c.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-ink-700">
          <input type="checkbox" checked={isSelected(c.id)} onChange={() => toggle(c.id)} className="accent-amber-ink" />
          <span className="flex-1 truncate text-sm text-parchment">{c.name}</span>
          {isSelected(c.id) && (
            <input
              value={roleFor(c.id)}
              onChange={(e) => setRole(c.id, e.target.value)}
              placeholder="роль"
              className="w-28 rounded border border-ink-500 bg-ink-800 px-2 py-0.5 text-xs text-parchment focus:border-amber-ink focus:outline-none"
            />
          )}
        </div>
      ))}
    </div>
  )
}

function ArcRow({ arc, characters, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState({
    title: arc.title, description: arc.description || '', goal: arc.goal || '',
    genre: arc.genre || '', status: arc.status || 'Запланована',
    roles: (arc.character_roles || []).map((r) => ({ character_id: r.character_id, role: r.role })),
  })

  const handleSave = async () => {
    if (!draft.title.trim()) return
    setIsSaving(true)
    try {
      const updated = await updateArc(arc.id, {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        goal: draft.goal.trim() || null,
        genre: draft.genre.trim() || null,
        status: draft.status,
      })
      const withRoles = await setArcCharacters(arc.id, draft.roles)
      onSaved({ ...updated, character_roles: withRoles.character_roles })
      setEditing(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteArc(arc.id)
      onDeleted(arc.id)
      toast.success(`Арку «${arc.title}» видалено`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-amber-ink bg-ink-900 p-3">
        <input value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
          className={inputCls} placeholder="Назва арки" />
        <textarea value={draft.description} rows={2}
          onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
          className={`${inputCls} resize-none`} placeholder="Опис" />
        <textarea value={draft.goal} rows={2}
          onChange={(e) => setDraft((p) => ({ ...p, goal: e.target.value }))}
          className={`${inputCls} resize-none`} placeholder="Мета арки" />
        <div className="grid grid-cols-2 gap-2">
          <input value={draft.genre} onChange={(e) => setDraft((p) => ({ ...p, genre: e.target.value }))}
            className={inputCls} placeholder="Жанр/напруга" />
          <select value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
            className={inputCls}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <label className="mt-1 block text-xs text-parchment-dim">
          Персонажі та їхні ролі в арці
          <div className="mt-1">
            <CharacterRoleEditor characters={characters} value={draft.roles}
              onChange={(roles) => setDraft((p) => ({ ...p, roles }))} />
          </div>
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setEditing(false)}
            className="flex items-center gap-1 rounded px-3 py-1.5 text-xs text-parchment-dim hover:bg-ink-700">
            <X size={12} /> Скасувати
          </button>
          <button onClick={handleSave} disabled={isSaving || !draft.title.trim()}
            className="flex items-center gap-1 rounded bg-amber-ink px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Зберегти
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-start justify-between gap-2 rounded-md border border-ink-500 bg-ink-800 p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-parchment">{arc.title}</p>
          <span className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-parchment-dim">{arc.status}</span>
        </div>
        {arc.goal && <p className="mt-1 text-xs text-parchment-dim">Мета: {arc.goal}</p>}
        {arc.character_roles?.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-parchment-dim/70">
            <Users size={11} />
            {arc.character_roles.map((r) => `${r.character?.name ?? '?'} (${r.role})`).join(', ')}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={() => setEditing(true)}
          className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft" aria-label="Редагувати">
          <Edit3 size={13} />
        </button>
        <button onClick={handleDelete}
          className="rounded p-1.5 text-parchment-dim hover:bg-crimson-dim/30 hover:text-crimson-soft" aria-label="Видалити">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default function ArcManager({ isOpen, onClose, projectId, arcs, characters, onChange }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setIsSubmitting(true)
    try {
      const created = await createArc({
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || null,
        goal: goal.trim() || null,
      })
      onChange([...arcs, created])
      setTitle(''); setDescription(''); setGoal('')
      toast.success(`Арку «${created.title}» створено`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaved = (updated) => {
    onChange(arcs.map((a) => (a.id === updated.id ? updated : a)))
  }
  const handleDeleted = (id) => {
    onChange(arcs.filter((a) => a.id !== id))
  }

  return (
    <Modal title="Арки сюжету" isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div className="flex flex-col gap-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-2 rounded-md border border-ink-500 bg-ink-900 p-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className={inputCls} placeholder="Назва нової арки" />
          <textarea value={description} rows={2} onChange={(e) => setDescription(e.target.value)}
            className={`${inputCls} resize-none`} placeholder="Опис (необов'язково)" />
          <textarea value={goal} rows={2} onChange={(e) => setGoal(e.target.value)}
            className={`${inputCls} resize-none`} placeholder="Мета арки (необов'язково)" />
          <button type="submit" disabled={isSubmitting || !title.trim()}
            className="mt-1 flex items-center justify-center gap-2 self-end rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Додати арку
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {arcs.length === 0 ? (
            <p className="text-sm italic text-parchment-dim/60">Арок ще немає</p>
          ) : (
            arcs.map((arc) => (
              <ArcRow key={arc.id} arc={arc} characters={characters} onSaved={handleSaved} onDeleted={handleDeleted} />
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
