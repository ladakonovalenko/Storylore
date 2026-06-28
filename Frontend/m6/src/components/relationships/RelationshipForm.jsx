import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

// Поширені типи зв'язків — можна розширити
const RELATIONSHIP_TYPES = [
  { value: 'friend',       label: 'Друг' },
  { value: 'enemy',        label: 'Ворог' },
  { value: 'lover',        label: 'Коханий/а' },
  { value: 'family',       label: 'Родич' },
  { value: 'mentor',       label: 'Наставник' },
  { value: 'rival',        label: 'Суперник' },
  { value: 'ally',         label: 'Союзник' },
  { value: 'knows_secret', label: 'Знає секрет' },
  { value: 'secret',       label: 'Таємний зв\'язок' },
  { value: 'neutral',      label: 'Нейтральний' },
  { value: 'other',        label: 'Інший' },
]

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Активний' },
  { value: 'broken',   label: 'Розірваний' },
  { value: 'hidden',   label: 'Прихований' },
  { value: 'evolving', label: 'Розвивається' },
]

/**
 * Форма створення / редагування зв'язку між персонажами.
 *
 * Props:
 *   initial      {object}  — початкові значення (при редагуванні)
 *   characters   {array}   — список всіх персонажів для select
 *   onSubmit     {fn}
 *   onCancel     {fn}
 *   isSubmitting {bool}
 */
export default function RelationshipForm({
  initial = {},
  characters = [],
  onSubmit,
  onCancel,
  isSubmitting,
}) {
  const [values, setValues] = useState({
    source_character_id: '',
    target_character_id: '',
    type: 'friend',
    strength: 0,
    status: 'active',
    description: '',
    ...initial,
  })
  const [touched, setTouched] = useState(false)

  const set = (key, val) => setValues((p) => ({ ...p, [key]: val }))

  const errors = {
    source: !values.source_character_id,
    target: !values.target_character_id,
    same: values.source_character_id &&
          values.target_character_id &&
          String(values.source_character_id) === String(values.target_character_id),
  }
  const hasErrors = errors.source || errors.target || errors.same

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (hasErrors) return

    onSubmit({
      ...values,
      source_character_id: Number(values.source_character_id),
      target_character_id: Number(values.target_character_id),
      strength: Number(values.strength),
    })
  }

  const inputCls = (hasErr = false) =>
    `mt-1 w-full rounded-md border bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:outline-none ${
      hasErr ? 'border-crimson-soft' : 'border-ink-500 focus:border-amber-ink'
    }`

  const charOptions = characters.map((c) => (
    <option key={c.id} value={c.id}>{c.name || `#${c.id}`}</option>
  ))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* ── Персонажі ── */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm text-parchment-dim">
          Від кого <span className="text-crimson-soft">*</span>
          <select
            value={values.source_character_id}
            onChange={(e) => set('source_character_id', e.target.value)}
            className={inputCls(touched && errors.source)}
          >
            <option value="">— оберіть —</option>
            {charOptions}
          </select>
          {touched && errors.source && (
            <span className="text-xs text-crimson-soft">Обов'язкове поле</span>
          )}
        </label>

        <label className="block text-sm text-parchment-dim">
          До кого <span className="text-crimson-soft">*</span>
          <select
            value={values.target_character_id}
            onChange={(e) => set('target_character_id', e.target.value)}
            className={inputCls(touched && (errors.target || errors.same))}
          >
            <option value="">— оберіть —</option>
            {charOptions}
          </select>
          {touched && errors.same && (
            <span className="text-xs text-crimson-soft">Персонажі мають відрізнятися</span>
          )}
          {touched && errors.target && !errors.same && (
            <span className="text-xs text-crimson-soft">Обов'язкове поле</span>
          )}
        </label>
      </div>

      {/* ── Тип + Статус ── */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm text-parchment-dim">
          Тип зв'язку
          <select
            value={values.type}
            onChange={(e) => set('type', e.target.value)}
            className={inputCls()}
          >
            {RELATIONSHIP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-parchment-dim">
          Статус
          <select
            value={values.status}
            onChange={(e) => set('status', e.target.value)}
            className={inputCls()}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* ── Сила (strength) ── */}
      <label className="block text-sm text-parchment-dim">
        <div className="flex items-center justify-between">
          <span>Сила зв'язку</span>
          <span className={`text-sm font-semibold ${
            Number(values.strength) > 0 ? 'text-moss-soft' :
            Number(values.strength) < 0 ? 'text-crimson-soft' :
            'text-parchment-dim'
          }`}>
            {values.strength > 0 ? `+${values.strength}` : values.strength}
          </span>
        </div>
        <input
          type="range" min="-10" max="10" step="1"
          value={values.strength}
          onChange={(e) => set('strength', e.target.value)}
          className="mt-2 w-full accent-amber-ink"
        />
        <div className="mt-1 flex justify-between text-xs text-parchment-dim/60">
          <span>−10 ворожий</span>
          <span>0 нейтральний</span>
          <span>+10 союзний</span>
        </div>
      </label>

      {/* ── Опис ── */}
      <label className="block text-sm text-parchment-dim">
        Опис зв'язку
        <textarea
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          placeholder="Як вони познайомились, що їх пов'язує…"
          className={`${inputCls()} resize-none`}
        />
      </label>

      {/* ── Кнопки ── */}
      <div className="flex justify-end gap-2 border-t border-ink-500 pt-3">
        <button type="button" onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700">
          Скасувати
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {initial.id ? 'Зберегти зміни' : 'Створити зв\'язок'}
        </button>
      </div>
    </form>
  )
}
