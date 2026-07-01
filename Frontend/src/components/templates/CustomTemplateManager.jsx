import { useState } from 'react'
import { Plus, Edit3, Trash2, Check, X, Loader2, Settings2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createCustomTemplate, updateCustomTemplate, deleteCustomTemplate } from '../../api/customTemplates'
import Modal from '../common/Modal'
import CustomTemplateFieldsEditor from './CustomTemplateFieldsEditor'

const inputCls =
  'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

const ROLE_OPTIONS = [
  'Протагоніст', 'Антагоніст', 'Наставник', 'Любовний інтерес',
  'Другорядний персонаж', 'Союзник', 'Суперник', 'Нейтральний',
]

function TemplateRow({ template, onSaved, onDeleted, onEditFields }) {
  const [editing, setEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState({
    template_name: template.template_name, description: template.description || '',
    role: template.role, rank: template.rank,
  })

  const handleSave = async () => {
    if (!draft.template_name.trim()) return
    setIsSaving(true)
    try {
      const updated = await updateCustomTemplate(template.id, {
        template_name: draft.template_name.trim(),
        description: draft.description.trim() || null,
        role: draft.role,
        rank: draft.rank,
      })
      onSaved({ ...updated, fields: template.fields })
      setEditing(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteCustomTemplate(template.id)
      onDeleted(template.id)
      toast.success(`Шаблон «${template.template_name}» видалено`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-amber-ink bg-ink-900 p-3">
        <input value={draft.template_name} onChange={(e) => setDraft((p) => ({ ...p, template_name: e.target.value }))}
          className={inputCls} placeholder="Назва шаблону" />
        <textarea value={draft.description} rows={2}
          onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
          className={`${inputCls} resize-none`} placeholder="Опис (необов'язково)" />
        <div className="grid grid-cols-2 gap-2">
          <select value={draft.role} onChange={(e) => setDraft((p) => ({ ...p, role: e.target.value }))} className={inputCls}>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={draft.rank} onChange={(e) => setDraft((p) => ({ ...p, rank: e.target.value }))} className={inputCls}>
            <option value="Головний">Головний</option>
            <option value="Другорядний">Другорядний</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setEditing(false)}
            className="flex items-center gap-1 rounded px-3 py-1.5 text-xs text-parchment-dim hover:bg-ink-700">
            <X size={12} /> Скасувати
          </button>
          <button onClick={handleSave} disabled={isSaving || !draft.template_name.trim()}
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
          <p className="text-sm font-medium text-parchment">{template.template_name}</p>
          <span className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-parchment-dim">
            {(template.fields ?? []).length} {(template.fields ?? []).length === 1 ? 'поле' : 'полів'}
          </span>
        </div>
        {template.description && <p className="mt-1 text-xs text-parchment-dim">{template.description}</p>}
        <p className="mt-1 text-xs text-parchment-dim/60">{template.role} · {template.rank}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={onEditFields}
          className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft" aria-label="Керувати полями" title="Керувати полями">
          <Settings2 size={13} />
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

export default function CustomTemplateManager({ isOpen, onClose, projectId, templates, onChange }) {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldsEditorTemplate, setFieldsEditorTemplate] = useState(null)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const created = await createCustomTemplate({
        project_id: projectId,
        template_name: name.trim(),
      })
      onChange([...templates, { ...created, fields: [] }])
      setName('')
      toast.success(`Шаблон «${created.template_name}» створено`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaved = (updated) => {
    onChange(templates.map((t) => (t.id === updated.id ? updated : t)))
    if (fieldsEditorTemplate?.id === updated.id) setFieldsEditorTemplate(updated)
  }
  const handleDeleted = (id) => {
    onChange(templates.filter((t) => t.id !== id))
  }

  return (
    <>
      <Modal title="Власні шаблони персонажів" isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-parchment-dim">
            Створіть власну анкету, обравши, які поля вона міститиме, та давши їм власні підписи
            й підказки. Після створення натисніть на іконку шестерні, щоб додати поля.
          </p>

          <form onSubmit={handleCreate} className="flex gap-2 rounded-md border border-ink-500 bg-ink-900 p-3">
            <input value={name} onChange={(e) => setName(e.target.value)}
              className={`${inputCls} mt-0 flex-1`} placeholder="Назва нового шаблону, напр. «Купець»" />
            <button type="submit" disabled={isSubmitting || !name.trim()}
              className="flex shrink-0 items-center gap-1.5 rounded-md bg-amber-ink px-3 py-2 text-xs font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
              {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Створити
            </button>
          </form>

          <div className="flex flex-col gap-2">
            {templates.length === 0 ? (
              <p className="text-sm italic text-parchment-dim/60">Власних шаблонів ще немає</p>
            ) : (
              templates.map((template) => (
                <TemplateRow
                  key={template.id} template={template}
                  onSaved={handleSaved} onDeleted={handleDeleted}
                  onEditFields={() => setFieldsEditorTemplate(template)}
                />
              ))
            )}
          </div>
        </div>
      </Modal>

      <CustomTemplateFieldsEditor
        isOpen={!!fieldsEditorTemplate}
        onClose={() => setFieldsEditorTemplate(null)}
        template={fieldsEditorTemplate}
        onChange={(updated) => { setFieldsEditorTemplate(updated); handleSaved(updated) }}
      />
    </>
  )
}
