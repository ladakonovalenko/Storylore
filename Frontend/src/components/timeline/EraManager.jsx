import { useState } from 'react'
import { Plus, Edit3, Trash2, Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createEra, updateEra, deleteEra } from '../../api/eras'
import Modal from '../common/Modal'
import ConfirmDialog from '../common/ConfirmDialog'

const inputCls =
  'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

function EraRow({ era, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState({
    name: era.name, description: era.description || '',
    start_year: era.start_year ?? '', end_year: era.end_year ?? '',
  })

  const handleSave = async () => {
    if (!draft.name.trim()) return
    setIsSaving(true)
    try {
      const updated = await updateEra(era.id, {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        start_year: draft.start_year !== '' ? Number(draft.start_year) : null,
        end_year: draft.end_year !== '' ? Number(draft.end_year) : null,
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
      await deleteEra(era.id)
      onDeleted(era.id)
      toast.success(`Еру «${era.name}» видалено`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-amber-ink bg-ink-900 p-3">
        <input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          className={inputCls} placeholder="Назва ери" />
        <textarea value={draft.description} rows={2}
          onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
          className={`${inputCls} resize-none`} placeholder="Опис (необов'язково)" />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" value={draft.start_year}
            onChange={(e) => setDraft((p) => ({ ...p, start_year: e.target.value }))}
            className={inputCls} placeholder="Рік початку" />
          <input type="number" value={draft.end_year}
            onChange={(e) => setDraft((p) => ({ ...p, end_year: e.target.value }))}
            className={inputCls} placeholder="Рік кінця" />
        </div>
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
      <div className="min-w-0">
        <p className="text-sm font-medium text-parchment">{era.name}</p>
        {(era.start_year != null || era.end_year != null) && (
          <p className="text-xs text-parchment-dim/70">
            {era.start_year ?? '…'} — {era.end_year ?? '…'}
          </p>
        )}
        {era.description && <p className="mt-1 text-xs text-parchment-dim">{era.description}</p>}
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

export default function EraManager({ isOpen, onClose, projectId, eras, onChange }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startYear, setStartYear] = useState('')
  const [endYear, setEndYear] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const created = await createEra({
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || null,
        order_index: eras.length,
        start_year: startYear !== '' ? Number(startYear) : null,
        end_year: endYear !== '' ? Number(endYear) : null,
      })
      onChange([...eras, created])
      setName(''); setDescription(''); setStartYear(''); setEndYear('')
      toast.success(`Еру «${created.name}» створено`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaved = (updated) => {
    onChange(eras.map((e) => (e.id === updated.id ? updated : e)))
  }
  const handleDeleted = (id) => {
    onChange(eras.filter((e) => e.id !== id))
  }

  return (
    <Modal title="Ери проєкту" isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex flex-col gap-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-2 rounded-md border border-ink-500 bg-ink-900 p-3">
          <input value={name} onChange={(e) => setName(e.target.value)}
            className={inputCls} placeholder="Назва нової ери, напр. «Епоха Драконів»" />
          <textarea value={description} rows={2} onChange={(e) => setDescription(e.target.value)}
            className={`${inputCls} resize-none`} placeholder="Опис (необов'язково)" />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={startYear} onChange={(e) => setStartYear(e.target.value)}
              className={inputCls} placeholder="Рік початку" />
            <input type="number" value={endYear} onChange={(e) => setEndYear(e.target.value)}
              className={inputCls} placeholder="Рік кінця" />
          </div>
          <button type="submit" disabled={isSubmitting || !name.trim()}
            className="mt-1 flex items-center justify-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60 self-end">
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Додати еру
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {eras.length === 0 ? (
            <p className="text-sm italic text-parchment-dim/60">Ер ще немає</p>
          ) : (
            eras.map((era) => (
              <EraRow key={era.id} era={era} onSaved={handleSaved} onDeleted={handleDeleted} />
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
