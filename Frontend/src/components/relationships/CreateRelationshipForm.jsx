import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

const RELATIONSHIP_TYPES = [
  'Родина', 'Романтика', 'Дружба', 'Ворожнеча',
  'Робота', 'Наставництво', 'Борг', 'Таємниця',
  'Союзник', 'Суперник',
]

export default function CreateRelationshipForm({ characters, initial, onSubmit, onCancel, isSubmitting }) {
  const isEdit = !!initial

  const [characterId, setCharacterId] = useState(initial?.character_id ?? '')
  const [targetId,    setTargetId]    = useState(initial?.target_id    ?? '')
  const [type,        setType]        = useState(initial?.relationship_type ?? '')
  const [strength,    setStrength]    = useState(initial?.strength ?? 0)
  const [description, setDescription] = useState(initial?.description ?? '')
  const [touched,     setTouched]     = useState(false)

  // При відкритті форми редагування — заповнюємо поля
  useEffect(() => {
    if (initial) {
      setCharacterId(initial.character_id ?? '')
      setTargetId(initial.target_id ?? '')
      setType(initial.relationship_type ?? '')
      setStrength(initial.strength ?? 0)
      setDescription(initial.description ?? '')
    }
  }, [initial])

  const isValid = characterId && targetId && type && characterId !== targetId

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!isValid) return
    onSubmit({
      character_id:      Number(characterId),
      target_id:         Number(targetId),
      relationship_type: type,
      strength:          Number(strength),
      description:       description.trim() || '',
    })
  }

  const inputCls = (hasError = false) =>
    `mt-1 w-full rounded-md border bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:outline-none ${
      hasError ? 'border-crimson-soft' : 'border-ink-500 focus:border-amber-ink'
    }`

  // Колір індикатора сили
  const strengthColor = strength > 0
    ? `hsl(${Math.round(120 * (strength / 100))}, 60%, 55%)`  // зелений градієнт
    : strength < 0
    ? `hsl(${Math.round(360 + 120 * (strength / 100))}, 60%, 55%)` // червоний градієнт
    : 'var(--parchment-dim)'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Персонаж A */}
      <label className="block text-sm text-parchment-dim">
        Персонаж A <span className="text-crimson-soft">*</span>
        <select
          value={characterId}
          onChange={(e) => setCharacterId(e.target.value)}
          disabled={isEdit}
          className={inputCls(touched && !characterId)}
        >
          <option value="">— оберіть персонажа —</option>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {touched && !characterId && <span className="text-xs text-crimson-soft">Оберіть персонажа</span>}
      </label>

      {/* Персонаж B */}
      <label className="block text-sm text-parchment-dim">
        Персонаж B <span className="text-crimson-soft">*</span>
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          disabled={isEdit}
          className={inputCls(touched && !targetId)}
        >
          <option value="">— оберіть персонажа —</option>
          {characters
            .filter((c) => String(c.id) !== String(characterId))
            .map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>
        {touched && !targetId && <span className="text-xs text-crimson-soft">Оберіть персонажа</span>}
        {touched && characterId && targetId && characterId === targetId && (
          <span className="text-xs text-crimson-soft">Персонажі мають бути різними</span>
        )}
      </label>

      {/* Тип зв'язку */}
      <label className="block text-sm text-parchment-dim">
        Тип зв'язку <span className="text-crimson-soft">*</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={inputCls(touched && !type)}
        >
          <option value="">— оберіть тип —</option>
          {RELATIONSHIP_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {touched && !type && <span className="text-xs text-crimson-soft">Оберіть тип</span>}
      </label>

      {/* Сила зв'язку */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-sm text-parchment-dim">
          <span>Сила зв'язку</span>
          <span className="font-mono text-sm font-medium" style={{ color: strengthColor }}>
            {strength > 0 ? `+${strength}` : strength}
          </span>
        </div>
        <input
          type="range" min={-100} max={100} step={1}
          value={strength}
          onChange={(e) => setStrength(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-600 accent-amber-ink"
        />
        <div className="flex justify-between text-xs text-parchment-dim/60">
          <span>−100 Ворог</span>
          <span>0 Нейтрал</span>
          <span>+100 Союзник</span>
        </div>
      </div>

      {/* Опис */}
      <label className="block text-sm text-parchment-dim">
        Опис зв'язку (необов'язково)
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Як вони познайомились, що їх пов'язує…"
          className={`${inputCls()} resize-none`}
        />
      </label>

      {/* Кнопки */}
      <div className="flex justify-end gap-2 border-t border-ink-500 pt-3">
        <button type="button" onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700">
          Скасувати
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? 'Зберегти зміни' : 'Створити зв\'язок'}
        </button>
      </div>
    </form>
  )
}
