import { useState } from 'react'
import { Plus, Edit3, Trash2, Check, X, Loader2, GitBranch } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBranch, updateBranch, deleteBranch } from '../../api/branches'
import Modal from '../common/Modal'

const inputCls =
  'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

function BranchRow({ branch, mainEvents, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState({
    name: branch.name,
    description: branch.description || '',
    branch_point_event_id: branch.branch_point_event_id ?? '',
  })

  const branchPointTitle = mainEvents.find((e) => e.id === branch.branch_point_event_id)?.title

  const handleSave = async () => {
    if (!draft.name.trim()) return
    setIsSaving(true)
    try {
      const updated = await updateBranch(branch.id, {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        branch_point_event_id: draft.branch_point_event_id !== '' ? Number(draft.branch_point_event_id) : null,
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
      await deleteBranch(branch.id)
      onDeleted(branch.id)
      toast.success(`Гілку «${branch.name}» видалено`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-amber-ink bg-ink-900 p-3">
        <input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          className={inputCls} placeholder="Назва гілки" />
        <textarea value={draft.description} rows={2}
          onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
          className={`${inputCls} resize-none`} placeholder="Опис: що було б, якби…" />
        <label className="block text-xs text-parchment-dim">
          Точка розгалуження (подія в основній лінії)
          <select value={draft.branch_point_event_id}
            onChange={(e) => setDraft((p) => ({ ...p, branch_point_event_id: e.target.value }))}
            className={inputCls}>
            <option value="">— без точки розгалуження —</option>
            {mainEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
        </label>
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
        <p className="text-sm font-medium text-parchment">{branch.name}</p>
        {branchPointTitle && (
          <p className="text-xs text-parchment-dim/70">Точка розгалуження: {branchPointTitle}</p>
        )}
        {branch.description && <p className="mt-1 text-xs text-parchment-dim">{branch.description}</p>}
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

// mainEvents: події основної лінії (без branch_id) — лише вони можуть бути точкою розгалуження
export default function BranchManager({ isOpen, onClose, projectId, branches, mainEvents, onChange }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [branchPointId, setBranchPointId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const created = await createBranch({
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || null,
        branch_point_event_id: branchPointId !== '' ? Number(branchPointId) : null,
      })
      onChange([...branches, created])
      setName(''); setDescription(''); setBranchPointId('')
      toast.success(`Гілку «${created.name}» створено`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaved = (updated) => {
    onChange(branches.map((b) => (b.id === updated.id ? updated : b)))
  }
  const handleDeleted = (id) => {
    onChange(branches.filter((b) => b.id !== id))
  }

  return (
    <Modal title="Гілки альтернативних таймлайнів" isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-parchment-dim">
          Гілка — це «що було б, якби…». Створіть гілку, оберіть точку розгалуження в основній лінії,
          а потім додавайте нові події й обирайте цю гілку у формі події, щоб вони належали саме їй.
        </p>

        <form onSubmit={handleCreate} className="flex flex-col gap-2 rounded-md border border-ink-500 bg-ink-900 p-3">
          <input value={name} onChange={(e) => setName(e.target.value)}
            className={inputCls} placeholder="Назва гілки, напр. «Якщо герой не загинув»" />
          <textarea value={description} rows={2} onChange={(e) => setDescription(e.target.value)}
            className={`${inputCls} resize-none`} placeholder="Опис розвилки (необов'язково)" />
          <label className="block text-xs text-parchment-dim">
            Точка розгалуження (подія в основній лінії)
            <select value={branchPointId} onChange={(e) => setBranchPointId(e.target.value)} className={inputCls}>
              <option value="">— без точки розгалуження —</option>
              {mainEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </label>
          <button type="submit" disabled={isSubmitting || !name.trim()}
            className="mt-1 flex items-center justify-center gap-2 self-end rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Додати гілку
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {branches.length === 0 ? (
            <p className="flex items-center gap-2 text-sm italic text-parchment-dim/60">
              <GitBranch size={14} /> Гілок ще немає
            </p>
          ) : (
            branches.map((branch) => (
              <BranchRow key={branch.id} branch={branch} mainEvents={mainEvents}
                onSaved={handleSaved} onDeleted={handleDeleted} />
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
