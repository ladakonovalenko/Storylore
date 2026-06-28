import { Shield } from 'lucide-react'
import InkStroke from '../layout/InkStroke'

export default function FactionCard({ faction }) {
  const name = faction.name || faction.title || 'Без назви'
  const description = faction.description || faction.summary || ''

  return (
    <div className="flex flex-col rounded-lg border border-ink-500 bg-ink-800 px-5 py-4">
      <div className="flex items-center gap-2 text-parchment-dim">
        <Shield size={15} strokeWidth={1.75} />
        {faction.type && (
          <span className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-parchment-dim">
            {faction.type}
          </span>
        )}
      </div>

      <h3 className="mt-3 font-display text-lg font-medium text-parchment">{name}</h3>
      <InkStroke className="mt-1" width={60} color="var(--ink-500)" />

      {description ? (
        <p className="mt-2 line-clamp-3 text-sm text-parchment-dim">{description}</p>
      ) : (
        <p className="mt-2 text-sm italic text-parchment-dim/60">Без опису</p>
      )}

      {/* Додаткові поля, якщо є */}
      {faction.alignment && (
        <p className="mt-3 text-xs text-parchment-dim">
          Мировлядання: <span className="text-parchment">{faction.alignment}</span>
        </p>
      )}
      {faction.leader && (
        <p className="mt-1 text-xs text-parchment-dim">
          Лідер: <span className="text-parchment">{faction.leader}</span>
        </p>
      )}
    </div>
  )
}
