import { useState } from 'react'
import { Plus, Edit3, Trash2, Check, X, Loader2, ArrowUp, ArrowDown, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  addCustomTemplateField, updateCustomTemplateField,
  deleteCustomTemplateField, reorderCustomTemplateFields,
} from '../../api/customTemplates'
import { SELECTABLE_FIELD_KEYS } from '../../utils/templateFields'
import Modal from '../common/Modal'

const inputCls =
  'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

function FieldRow({ field, isFirst, isLast, onSaved, onDeleted, onMove }) {
  const [editing, setEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState({
    label: field.label, type: field.type, required: field.required,
    placeholder: field.placeholder || '', hint: field.hint || '', example: field.example || '',
  })

  const handleSave = async () => {
    if (!draft.label.trim()) return
    setIsSaving(true)
    try {
      const updated = await updateCustomTemplateField(field.id, {
        label: draft.label.trim(),
        type: draft.type,
        required: draft.required,
        placeholder: draft.placeholder.trim() || null,
        hint: draft.hint.trim() || null,
        example: draft.example.trim() || null,
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
      await deleteCustomTemplateField(field.id)
      onDeleted(field.id)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-amber-ink bg-ink-900 p-3">
        <p className="text-xs text-parchment-dim/60">Поле моделі: <span className="font-mono">{field.key}</span></p>
        <input value={draft.label} onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))}
          className={inputCls} placeholder="Підпис поля" />
        <div className="grid grid-cols-2 gap-2">
          <select value={draft.type} onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))} className={inputCls}>
            <option value="textarea">Багаторядкове</option>
            <option value="text">Однорядкове</option>
          </select>
          <label className="mt-1 flex cursor-pointer items-center gap-2 text-sm text-parchment-dim">
            <input type="checkbox" checked={draft.required}
              onChange={(e) => setDraft((p) => ({ ...p, required: e.target.checked }))}
              className="accent-amber-ink" />
            Обов'язкове
          </label>
        </div>
        <input value={draft.placeholder} onChange={(e) => setDraft((p) => ({ ...p, placeholder: e.target.value }))}
          className={inputCls} placeholder="Плейсхолдер (необов'язково)" />
        <textarea value={draft.hint} rows={2} onChange={(e) => setDraft((p) => ({ ...p, hint: e.target.value }))}
          className={`${inputCls} resize-none`} placeholder="Підказка під полем (необов'язково)" />
        <textarea value={draft.example} rows={2} onChange={(e) => setDraft((p) => ({ ...p, example: e.target.value }))}
          className={`${inputCls} resize-none`} placeholder="Приклад заповнення (необов'язково)" />
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
          {field.required && <Star size={11} className="shrink-0 fill-amber-soft text-amber-soft" />}
          <span className="rounded-full bg-ink-700 px-1.5 py-0.5 text-[10px] text-parchment-dim">
            {field.type === 'textarea' ? 'багаторядкове' : 'однорядкове'}
          </span>
        </div>
        <p className="text-xs text-parchment-dim/60">Поле моделі: <span className="font-mono">{field.key}</span></p>
        {field.hint && <p className="mt-1 text-xs text-parchment-dim">{field.hint}</p>}
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

export default function CustomTemplateFieldsEditor({ isOpen, onClose, template, onChange }) {
  const [newKey, setNewKey] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  if (!template) return null
  const fields = template.fields ?? []

  const usedKeys = new Set(fields.map((f) => f.key))
  const availableKeys = SELECTABLE_FIELD_KEYS.filter((k) => !usedKeys.has(k.key))

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newKey) return
    const meta = SELECTABLE_FIELD_KEYS.find((k) => k.key === newKey)
    setIsAdding(true)
    try {
      const created = await addCustomTemplateField(template.id, {
        key: newKey,
        label: meta?.label ?? newKey,
        type: 'textarea',
        required: false,
      })
      onChange({ ...template, fields: [...fields, created] })
      setNewKey('')
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
      await reorderCustomTemplateFields(template.id, next.map((f) => f.id))
    } catch (err) {
      toast.error('Не вдалося зберегти новий порядок')
    }
  }

  return (
    <Modal title={`Поля шаблону «${template.template_name}»`} isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-parchment-dim">
          Кожне поле відповідає реальній колонці анкети персонажа — ви обираєте, які з них
          включити в цей шаблон, і даєте їм власні підписи й підказки.
        </p>

        {availableKeys.length > 0 ? (
          <form onSubmit={handleAdd} className="flex gap-2 rounded-md border border-ink-500 bg-ink-900 p-3">
            <select value={newKey} onChange={(e) => setNewKey(e.target.value)} className={`${inputCls} mt-0 flex-1`}>
              <option value="">— оберіть поле для додавання —</option>
              {availableKeys.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
            </select>
            <button type="submit" disabled={!newKey || isAdding}
              className="flex shrink-0 items-center gap-1.5 rounded-md bg-amber-ink px-3 py-2 text-xs font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
              {isAdding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Додати
            </button>
          </form>
        ) : (
          <p className="text-xs italic text-parchment-dim/60">Усі доступні поля вже додані до цього шаблону.</p>
        )}

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
