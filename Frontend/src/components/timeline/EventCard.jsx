import { Edit3, Trash2, MapPin, Users, Calendar, History, BookOpen, GitBranch } from 'lucide-react'
import { formatYear } from '../../utils/yearLabel'

const IMPORTANCE_MAP = {
  'Основна':    { stars: '★★★', cls: 'text-amber-soft  bg-amber-ink/15' },
  'Другорядна': { stars: '★★☆', cls: 'text-moss-soft   bg-moss-dim/20' },
  'Фонова':     { stars: '★☆☆', cls: 'text-parchment-dim bg-ink-500/40' },
}

const TYPE_COLORS = {
  'Битва':          'text-crimson-soft  bg-crimson-dim/20',
  'Дипломатія':     'text-sky-400       bg-sky-400/15',
  'Відкриття':      'text-violet-400    bg-violet-400/15',
  'Особиста подія': 'text-parchment-dim bg-ink-500/40',
  'Катастрофа':     'text-orange-400    bg-orange-400/15',
  'Ритуал':         'text-teal-400      bg-teal-400/15',
  'Смерть':         'text-crimson-soft  bg-crimson-dim/20',
  'Зустріч':        'text-moss-soft     bg-moss-dim/20',
  'Зрада':          'text-amber-soft    bg-amber-ink/15',
}

// НОВЕ: eras/arcs/branches передаються списками для пошуку назви за id
export default function EventCard({ event, characters, eras = [], arcs = [], branches = [], onEdit, onDelete }) {
  const imp = IMPORTANCE_MAP[event.importance] ?? IMPORTANCE_MAP['Фонова']
  const typeCls = TYPE_COLORS[event.event_type] ?? 'text-parchment-dim bg-ink-500/40'

  const participants = characters?.filter((c) =>
    (event.participant_ids ?? []).includes(c.id)
  ) ?? []

  const tagsList = event.tags
    ? event.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  // ВИПРАВЛЕНО: рік форматується через formatYear — для від'ємних років
  // показує "500 до н.е." замість сирого "-500 р."
  const timeLabel = event.date_label || (event.year != null ? formatYear(event.year) : null)

  const era = eras.find((e) => e.id === event.era_id)
  const arc = arcs.find((a) => a.id === event.arc_id)
  // НОВЕ
  const branch = branches.find((b) => b.id === event.branch_id)

  return (
    <div className={`group flex flex-col rounded-lg border px-5 py-4 transition-colors hover:border-ink-300 ${
      branch ? 'border-dashed border-crimson-soft/50 bg-ink-800' : 'border-ink-500 bg-ink-800'
    }`}>

      {/* Шапка */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {event.event_type && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeCls}`}>
              {event.event_type}
            </span>
          )}
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${imp.cls}`}>
            {imp.stars}
          </span>
          {event.is_ongoing && (
            <span className="rounded-full bg-moss-dim/20 px-2.5 py-0.5 text-xs text-moss-soft">
              Триває
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={() => onEdit(event)}
            className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft"
            aria-label="Редагувати">
            <Edit3 size={13} />
          </button>
          <button onClick={() => onDelete(event)}
            className="rounded p-1.5 text-parchment-dim hover:bg-crimson-dim/30 hover:text-crimson-soft"
            aria-label="Видалити">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Заголовок + час */}
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-medium text-parchment">{event.title}</h3>
        {timeLabel && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-parchment-dim/60">
            <Calendar size={11} />
            {timeLabel}
          </span>
        )}
      </div>

      {/* Ера / арка / гілка */}
      {(era || arc || branch) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {era && (
            <span className="flex items-center gap-1 rounded-full bg-violet-400/15 px-2 py-0.5 text-xs text-violet-300">
              <History size={11} /> {era.name}
            </span>
          )}
          {arc && (
            <span className="flex items-center gap-1 rounded-full bg-sky-400/15 px-2 py-0.5 text-xs text-sky-300">
              <BookOpen size={11} /> {arc.title}
            </span>
          )}
          {/* НОВЕ */}
          {branch && (
            <span className="flex items-center gap-1 rounded-full bg-crimson-dim/20 px-2 py-0.5 text-xs text-crimson-soft">
              <GitBranch size={11} /> {branch.name}
            </span>
          )}
        </div>
      )}

      {/* Опис */}
      {event.description && (
        <p className="mt-2 line-clamp-3 text-sm text-parchment-dim">{event.description}</p>
      )}

      {/* Місце */}
      {event.location && (
        <div className="mt-2 flex items-center gap-1 text-xs text-parchment-dim/70">
          <MapPin size={11} />
          {event.location}
        </div>
      )}

      {/* Учасники */}
      {participants.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <Users size={11} className="shrink-0 text-parchment-dim/60" />
          <div className="flex flex-wrap gap-1">
            {participants.map((c) => (
              <span key={c.id}
                className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-parchment-dim">
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Теги */}
      {tagsList.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tagsList.map((t) => (
            <span key={t}
              className="rounded-full bg-ink-600 px-2 py-0.5 text-xs text-parchment-dim/70">
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
