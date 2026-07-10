import { useState } from 'react'
import { Plus, Edit3, Trash2, Check, X, Loader2, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  addFactionTemplateField, updateFactionTemplateField,
  deleteFactionTemplateField, reorderFactionTemplateFields,
} from '../../api/factionTemplates'
import Modal from '../common/Modal'

const inputCls =
  'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

function FieldRow({ field, isFirst, isLast, onSaved, onDeleted, onMove }) {
  const [editing, setEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState({
    label: field.label, field_type: field.field_type, placeholder: field.placeholder || '',
  })

  const handleSave = async () => {
    if (!draft.label.trim()) return
    setIsSaving(true)
    try {
      const updated = await updateFactionTemplateField(field.id, {
        label: draft.label.trim(),
        field_type: draft.field_type,
        placeholder: draft.placeholder.trim() || null,
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
      await deleteFactionTemplateField(field.id)
      onDeleted(field.id)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-amber-ink bg-ink-900 p-3">
        <input value={draft.label} onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))}
          className={inputCls} placeholder="Назва поля, напр. «Магічна система»" />
        <select value={draft.field_type} onChange={(e) => setDraft((p) => ({ ...p, field_type: e.target.value }))} className={inputCls}>
          <option value="textarea">Багаторядкове</option>
          <option value="text">Однорядкове</option>
        </select>
        <input value={draft.placeholder} onChange={(e) => setDraft((p) => ({ ...p, placeholder: e.target.value }))}
          className={inputCls} placeholder="Плейсхолдер (необов'язково)" />
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setEditing(false)}
            className="flex items-center gap-1 rounded px-3 py-1.5 text-xs text-parchment-dim hover:bg-ink-700">
            <X size={12} /> Скасувати
          </button>
          <button onClick={handleSave} disabled={isSaving || !draft.label.trim()}
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
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-parchment">{field.label}</p>
          <span className="rounded-full bg-ink-700 px-1.5 py-0.5 text-[10px] text-parchment-dim">
            {field.field_type === 'textarea' ? 'багаторядкове' : 'однорядкове'}
          </span>
        </div>
        {field.placeholder && <p className="mt-1 text-xs text-parchment-dim/60">{field.placeholder}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={() => onMove(-1)} disabled={isFirst}
          className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft disabled:opacity-30" aria-label="Вгору">
          <ArrowUp size={13} />
        </button>
        <button onClick={() => onMove(1)} disabled={isLast}
          className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft disabled:opacity-30" aria-label="Вниз">
          <ArrowDown size={13} />
        </button>
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

export default function FactionTemplateFieldsEditor({ isOpen, onClose, template, onChange }) {
  const [newLabel, setNewLabel] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  if (!template) return null
  const fields = template.fields ?? []

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newLabel.trim()) return
    setIsAdding(true)
    try {
      const created = await addFactionTemplateField(template.id, {
        label: newLabel.trim(),
        field_type: 'textarea',
      })
      onChange({ ...template, fields: [...fields, created] })
      setNewLabel('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleSaved = (updated) => {
    onChange({ ...template, fields: fields.map((f) => (f.id === updated.id ? updated : f)) })
  }
  const handleDeleted = (id) => {
    onChange({ ...template, fields: fields.filter((f) => f.id !== id) })
  }

  const handleMove = async (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= fields.length) return
    const next = [...fields]
    ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
    onChange({ ...template, fields: next })
    try {
      await reorderFactionTemplateFields(template.id, next.map((f) => f.id))
    } catch (err) {
      toast.error('Не вдалося зберегти новий порядок')
    }
  }

  return (
    <Modal title={`Поля шаблону «${template.template_name}»`} isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-parchment-dim">
          На відміну від персонажів, тут можна вигадати абсолютно нове поле з довільною назвою —
          наприклад «Магічна система», «Політичний устрій» чи «Легенди клану».
        </p>

        <form onSubmit={handleAdd} className="flex gap-2 rounded-md border border-ink-500 bg-ink-900 p-3">
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
            className={`${inputCls} mt-0 flex-1`} placeholder="Назва нового поля…" />
          <button type="submit" disabled={!newLabel.trim() || isAdding}
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-amber-ink px-3 py-2 text-xs font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
            {isAdding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Додати
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {fields.length === 0 ? (
            <p className="text-sm italic text-parchment-dim/60">Поля ще не додані.</p>
          ) : (
            fields.map((field, index) => (
              <FieldRow
                key={field.id} field={field}
                isFirst={index === 0} isLast={index === fields.length - 1}
                onSaved={handleSaved} onDeleted={handleDeleted}
                onMove={(direction) => handleMove(index, direction)}
              />
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
