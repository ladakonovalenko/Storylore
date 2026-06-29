import { useState } from 'react'
import { Plus, Edit3, Trash2, Check, X, Loader2, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import { createDimension, updateDimension, deleteDimension } from '../../api/dimensions'
import Modal from '../common/Modal'

const inputCls =
  'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

function DimensionRow({ dimension, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState({
    name: dimension.name, description: dimension.description || '', color: dimension.color || '#7F77DD',
  })

  const handleSave = async () => {
    if (!draft.name.trim()) return
    setIsSaving(true)
    try {
      const updated = await updateDimension(dimension.id, {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        color: draft.color,
      })
      onSaved(updated)
      setEditing(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteDimension(dimension.id)
      onDeleted(dimension.id)
      toast.success(`Вимір «${dimension.name}» видалено`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-amber-ink bg-ink-900 p-3">
        <div className="flex gap-2">
          <input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            className={`${inputCls} mt-0 flex-1`} placeholder="Назва виміру" />
          <input type="color" value={draft.color}
            onChange={(e) => setDraft((p) => ({ ...p, color: e.target.value }))}
            className="mt-0 h-[38px] w-12 shrink-0 cursor-pointer rounded border border-ink-500 bg-ink-900" />
        </div>
        <textarea value={draft.description} rows={2}
          onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
          className={`${inputCls} resize-none`} placeholder="Опис (необов'язково)" />
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setEditing(false)}
            className="flex items-center gap-1 rounded px-3 py-1.5 text-xs text-parchment-dim hover:bg-ink-700">
            <X size={12} /> Скасувати
          </button>
          <button onClick={handleSave} disabled={isSaving || !draft.name.trim()}
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
      <div className="flex min-w-0 items-start gap-2">
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: dimension.color || '#7F77DD' }} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-parchment">{dimension.name}</p>
          {dimension.description && <p className="mt-1 text-xs text-parchment-dim">{dimension.description}</p>}
        </div>
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

export default function DimensionManager({ isOpen, onClose, projectId, dimensions, onChange }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#7F77DD')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const created = await createDimension({
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || null,
        color,
      })
      onChange([...dimensions, created])
      setName(''); setDescription(''); setColor('#7F77DD')
      toast.success(`Вимір «${created.name}» створено`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaved = (updated) => onChange(dimensions.map((d) => (d.id === updated.id ? updated : d)))
  const handleDeleted = (id) => onChange(dimensions.filter((d) => d.id !== id))

  return (
    <Modal title="Виміри / паралельні світи" isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-parchment-dim">
          Кожен вимір — окрема незалежна мапа. Локації, створені у вимірі, не показуються
          на мапі основного світу й не з'єднуються з ним.
        </p>

        <form onSubmit={handleCreate} className="flex flex-col gap-2 rounded-md border border-ink-500 bg-ink-900 p-3">
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)}
              className={`${inputCls} mt-0 flex-1`} placeholder="Назва виміру, напр. «Світ духів»" />
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="mt-0 h-[38px] w-12 shrink-0 cursor-pointer rounded border border-ink-500 bg-ink-900" />
          </div>
          <textarea value={description} rows={2} onChange={(e) => setDescription(e.target.value)}
            className={`${inputCls} resize-none`} placeholder="Опис (необов'язково)" />
          <button type="submit" disabled={isSubmitting || !name.trim()}
            className="mt-1 flex items-center justify-center gap-2 self-end rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Додати вимір
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {dimensions.length === 0 ? (
            <p className="flex items-center gap-2 text-sm italic text-parchment-dim/60">
              <Globe size={14} /> Вимірів ще немає
            </p>
          ) : (
            dimensions.map((d) => (
              <DimensionRow key={d.id} dimension={d} onSaved={handleSaved} onDeleted={handleDeleted} />
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
