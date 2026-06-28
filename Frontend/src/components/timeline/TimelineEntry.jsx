import { Sparkles, Sword, Heart, Skull, Compass, Crown } from 'lucide-react'
import { getEventTitle, getEventDateLabel } from '../../utils/eventHelpers'

const TYPE_ICON_MAP = {
  birth: Sparkles,
  death: Skull,
  battle: Sword,
  marriage: Heart,
  journey: Compass,
  coronation: Crown,
}

export default function TimelineEntry({ event, isLast }) {
  const Icon = TYPE_ICON_MAP[event.event_type] || Sparkles
  const dateLabel = getEventDateLabel(event)

  return (
    <div className="relative flex gap-4 pb-8">
      {!isLast && (
        <span className="absolute left-[15px] top-8 h-full w-px bg-ink-500" aria-hidden="true" />
      )}

      <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-ink bg-ink-800">
        <Icon size={14} className="text-amber-soft" strokeWidth={1.75} />
      </div>

      <div className="flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-2">
          <h4 className="font-display text-lg font-medium text-parchment">
            {getEventTitle(event)}
          </h4>
          {dateLabel && (
            <span className="font-mono text-xs text-parchment-dim">{dateLabel}</span>
          )}
        </div>
        {event.description && (
          <p className="mt-1 text-sm text-parchment-dim">{event.description}</p>
        )}
      </div>
    </div>
  )
}
