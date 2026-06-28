import { useState } from 'react'
import { Plus, Trash2, Loader2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { createEventCausality, deleteEventCausality } from '../../api/eventCausalities'
import Modal from '../common/Modal'

const inputCls =
  'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

export default function CausalityManager({ isOpen, onClose, events, causalities, onChange }) {
  const [causeId, setCauseId] = useState('')
  const [effectId, setEffectId] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const findTitle = (id) => events.find((e) => e.id === id)?.title ?? '—'

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!causeId || !effectId || causeId === effectId) return
    setIsSubmitting(true)
    try {
      const created = await createEventCausality({
        cause_event_id: Number(causeId),
        effect_event_id: Number(effectId),
        description: description.trim() || null,
      })
      onChange([...causalities, created])
      setCauseId(''); setEffectId(''); setDescription('')
      toast.success('Зв\u2019язок створено')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteEventCausality(id)
      onChange(causalities.filter((c) => c.id !== id))
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Modal title="Причинно-наслідкові зв'язки" isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex flex-col gap-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-2 rounded-md border border-ink-500 bg-ink-900 p-3">
          <label className="block text-xs text-parchment-dim">
            Подія-причина
            <select value={causeId} onChange={(e) => setCauseId(e.target.value)} className={inputCls}>
              <option value="">— оберіть подію —</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </label>
          <label className="block text-xs text-parchment-dim">
            Подія-наслідок
            <select value={effectId} onChange={(e) => setEffectId(e.target.value)} className={inputCls}>
              <option value="">— оберіть подію —</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </label>
          <label className="block text-xs text-parchment-dim">
            Опис зв'язку (необов'язково)
            <textarea value={description} rows={2} onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} resize-none`} placeholder="Чому А призвело до Б…" />
          </label>
          <button type="submit" disabled={isSubmitting || !causeId || !effectId || causeId === effectId}
            className="mt-1 flex items-center justify-center gap-2 self-end rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Додати зв'язок
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {causalities.length === 0 ? (
            <p className="text-sm italic text-parchment-dim/60">Зв'язків ще немає</p>
          ) : (
            causalities.map((c) => (
              <div key={c.id} className="group flex items-start justify-between gap-2 rounded-md border border-ink-500 bg-ink-800 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm text-parchment">
                    <span className="truncate">{findTitle(c.cause_event_id)}</span>
                    <ArrowRight size={13} className="shrink-0 text-amber-soft" />
                    <span className="truncate">{findTitle(c.effect_event_id)}</span>
                  </div>
                  {c.description && <p className="mt-1 text-xs text-parchment-dim">{c.description}</p>}
                </div>
                <button onClick={() => handleDelete(c.id)}
                  className="shrink-0 rounded p-1.5 text-parchment-dim opacity-0 transition-opacity hover:bg-crimson-dim/30 hover:text-crimson-soft group-hover:opacity-100"
                  aria-label="Видалити">
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
