import { useState } from 'react'
import { Loader2, Clock } from 'lucide-react'
import Modal from '../common/Modal'
import { addRelationshipHistory } from '../../api/relationships'
import toast from 'react-hot-toast'

/**
 * Модальне вікно «Додати запис в еволюцію стосунків».
 *
 * Props:
 *   relationship  {object|null}  — поточний зв'язок (потрібен id + імена для заголовку)
 *   sourceLabel   {string}       — ім'я першого персонажа
 *   targetLabel   {string}       — ім'я другого персонажа
 *   isOpen        {bool}
 *   onClose       {fn}
 *   onAdded       {fn}           — колбек після успішного додавання
 */
export default function RelationshipHistoryModal({
  relationship,
  sourceLabel,
  targetLabel,
  isOpen,
  onClose,
  onAdded,
}) {
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState(false)

  const isEmpty = description.trim() === ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (isEmpty || !relationship) return

    setIsSubmitting(true)
    try {
      const payload = {
        relationship_id: relationship.id,
        description: description.trim(),
        ...(date ? { date } : {}),
      }
      const result = await addRelationshipHistory(payload)
      toast.success('Запис еволюції додано')
      onAdded?.(result)
      setDescription('')
      setDate('')
      setTouched(false)
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setDescription('')
    setDate('')
    setTouched(false)
    onClose()
  }

  if (!relationship) return null

  return (
    <Modal
      title="Додати запис в еволюцію"
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-lg"
    >
      {/* Контекст */}
      <div className="mb-4 flex items-center gap-2 rounded-md bg-ink-700 px-3 py-2">
        <Clock size={14} className="shrink-0 text-parchment-dim" />
        <span className="text-sm text-parchment-dim">
          {sourceLabel} <span className="text-amber-soft">↔</span> {targetLabel}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Опис події */}
        <label className="block text-sm text-parchment-dim">
          Опис події <span className="text-crimson-soft">*</span>
          <textarea
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Що сталось? Як змінились їхні стосунки…"
            className={`mt-1 w-full resize-none rounded-md border bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:outline-none ${
              touched && isEmpty ? 'border-crimson-soft' : 'border-ink-500 focus:border-amber-ink'
            }`}
          />
          {touched && isEmpty && (
            <span className="mt-1 text-xs text-crimson-soft">Опис не може бути порожнім</span>
          )}
        </label>

        {/* Дата (опційно) */}
        <label className="block text-sm text-parchment-dim">
          Дата / момент в оповіді (необов'язково)
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="Напр.: «Рік 342», «Після битви при Морській затоці»…"
            className="mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none"
          />
        </label>

        {/* Кнопки */}
        <div className="flex justify-end gap-2 border-t border-ink-500 pt-3">
          <button type="button" onClick={handleClose}
            className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700">
            Скасувати
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Додати запис
          </button>
        </div>
      </form>
    </Modal>
  )
}
