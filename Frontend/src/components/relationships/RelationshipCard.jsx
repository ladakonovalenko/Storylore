import { Edit3, Trash2, ArrowRight } from 'lucide-react'

// Типи → колір бейджа
const TYPE_COLORS = {
  'Родина':       'text-amber-soft    bg-amber-ink/15',
  'Романтика':    'text-rose-400      bg-rose-400/15',
  'Дружба':       'text-moss-soft     bg-moss-dim/20',
  'Ворожнеча':    'text-crimson-soft  bg-crimson-dim/20',
  'Робота':       'text-sky-400       bg-sky-400/15',
  'Наставництво': 'text-violet-400    bg-violet-400/15',
  'Борг':         'text-orange-400    bg-orange-400/15',
  'Таємниця':     'text-parchment-dim bg-ink-500/40',
  'Союзник':      'text-teal-400      bg-teal-400/15',
  'Суперник':     'text-yellow-400    bg-yellow-400/15',
}

// Візуальна шкала сили зв'язку (-100…+100)
function StrengthBar({ value }) {
  const abs     = Math.abs(value)
  const isPos   = value >= 0
  const isEmpty = value === 0

  // Колір залежить від знаку
  const barColor = isEmpty
    ? 'bg-ink-500'
    : isPos
    ? 'bg-moss-soft'
    : 'bg-crimson-soft'

  const label = isEmpty
    ? 'Нейтральний'
    : isPos
    ? `+${value} — позитивний`
    : `${value} — негативний`

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-xs text-parchment-dim/70">
        <span>Сила зв'язку</span>
        <span className={`font-mono font-medium ${
          isEmpty ? 'text-parchment-dim' : isPos ? 'text-moss-soft' : 'text-crimson-soft'
        }`}>
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
      {/* Шкала: ліва половина = негатив, права = позитив, центр = 0 */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-ink-600">
        {isEmpty ? (
          <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-ink-400" />
        ) : isPos ? (
          <div
            className={`absolute top-0 h-full rounded-full ${barColor}`}
            style={{ left: '50%', width: `${abs / 2}%` }}
          />
        ) : (
          <div
            className={`absolute top-0 h-full rounded-full ${barColor}`}
            style={{ right: '50%', width: `${abs / 2}%` }}
          />
        )}
        {/* Центральна мітка */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-ink-400/60" />
      </div>
      <p className="mt-0.5 text-xs text-parchment-dim/50">{label}</p>
    </div>
  )
}

export default function RelationshipCard({ relationship: rel, onEdit, onDelete }) {
  const charName   = rel.character?.name ?? `#${rel.character_id}`
  const targetName = rel.target?.name    ?? `#${rel.target_id}`
  const typeCls    = TYPE_COLORS[rel.relationship_type] ?? 'text-parchment-dim bg-ink-500/40'

  return (
    <div className="group flex flex-col rounded-lg border border-ink-500 bg-ink-800 px-5 py-4 transition-colors hover:border-ink-300">

      {/* Шапка: тип + кнопки */}
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeCls}`}>
          {rel.relationship_type}
        </span>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(rel)}
            className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft"
            aria-label="Редагувати"
          >
            <Edit3 size={13} />
          </button>
          <button
            onClick={() => onDelete(rel)}
            className="rounded p-1.5 text-parchment-dim hover:bg-crimson-dim/30 hover:text-crimson-soft"
            aria-label="Видалити"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Персонажі */}
      <div className="mt-3 flex items-center gap-2">
        <span className="truncate font-display text-base font-medium text-parchment">
          {charName}
        </span>
        <ArrowRight size={14} className="shrink-0 text-parchment-dim/50" />
        <span className="truncate font-display text-base font-medium text-parchment">
          {targetName}
        </span>
      </div>

      {/* Ролі (якщо є) */}
      {(rel.character?.role || rel.target?.role) && (
        <div className="mt-0.5 flex items-center gap-2 text-xs text-parchment-dim/60">
          <span className="truncate">{rel.character?.role ?? ''}</span>
          <span className="shrink-0">→</span>
          <span className="truncate">{rel.target?.role ?? ''}</span>
        </div>
      )}

      {/* Шкала сили */}
      <StrengthBar value={rel.strength ?? 0} />

      {/* Опис */}
      {rel.description && (
        <p className="mt-3 line-clamp-3 border-t border-ink-600 pt-3 text-sm text-parchment-dim">
          {rel.description}
        </p>
      )}
    </div>
  )
}
