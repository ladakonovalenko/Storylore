import { X, User, GitBranch } from 'lucide-react'

const STATUS_LABELS = {
  alive:    { label: 'Живий',    cls: 'text-moss-soft' },
  deceased: { label: 'Загиблий', cls: 'text-crimson-soft' },
  unknown:  { label: 'Невідомо', cls: 'text-parchment-dim' },
}

const TYPE_LABELS = {
  friend:       'Друг',
  enemy:        'Ворог',
  lover:        'Коханий/а',
  family:       'Родич',
  mentor:       'Наставник',
  rival:        'Суперник',
  ally:         'Союзник',
  knows_secret: 'Знає секрет',
  secret:       'Таємний зв\'язок',
  neutral:      'Нейтральний',
}

/**
 * Плаваюча панель з деталями вузла або ребра після кліку.
 *
 * Props:
 *   info   { type: 'node'|'edge', data: {...} } | null
 *   onClose fn
 */
export default function GraphTooltip({ info, onClose }) {
  if (!info) return null

  return (
    <div className="absolute bottom-4 left-4 z-10 w-64 rounded-lg border border-ink-500 bg-ink-800 px-4 py-3 shadow-xl">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-parchment-dim">
          {info.type === 'node'
            ? <User size={14} />
            : <GitBranch size={14} />}
          <span className="text-xs font-medium uppercase tracking-wider">
            {info.type === 'node' ? 'Персонаж' : 'Зв\'язок'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-parchment-dim hover:bg-ink-700 hover:text-parchment"
        >
          <X size={13} />
        </button>
      </div>

      {info.type === 'node' && (
        <div className="flex flex-col gap-1">
          <p className="font-display text-base font-medium text-parchment">
            {info.data.label}
          </p>
          {info.data.status && (() => {
            const s = STATUS_LABELS[info.data.status]
            return s
              ? <span className={`text-xs ${s.cls}`}>{s.label}</span>
              : null
          })()}
        </div>
      )}

      {info.type === 'edge' && (
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-parchment">
            {TYPE_LABELS[info.data.label] || info.data.label || '—'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-parchment-dim">Сила:</span>
            <span className={`text-xs font-semibold ${
              Number(info.data.strength) > 0 ? 'text-moss-soft' :
              Number(info.data.strength) < 0 ? 'text-crimson-soft' :
              'text-parchment-dim'
            }`}>
              {Number(info.data.strength) > 0
                ? `+${info.data.strength}`
                : info.data.strength}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
