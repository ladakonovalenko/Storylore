import { Trash2, User, ChevronRight } from 'lucide-react'
import { calcProgress } from '../../utils/progressHelpers'
import ProgressBar from './ProgressBar'

const STATUS_MAP = {
  'Живий':    { label: 'Живий',    cls: 'text-moss-soft bg-moss-dim/20' },
  'Загиблий': { label: 'Загиблий', cls: 'text-crimson-soft bg-crimson-dim/20' },
  'Невідомо': { label: 'Невідомо', cls: 'text-parchment-dim bg-ink-500/40' },
}

export default function CharacterCard({ character, templateDetail, onSelect, onDelete }) {
  const { percent } = calcProgress(character, templateDetail)
  const status = STATUS_MAP[character.status] ?? STATUS_MAP['Невідомо']
  const snippet = character.description || character.biography || character.appearance || ''

  return (
    <div className="group flex flex-col rounded-lg border border-ink-500 bg-ink-800 px-5 py-4 transition-colors hover:border-ink-300">
      {/* Шапка */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {/* НОВЕ: аватар персонажа замість іконки, якщо є зображення */}
          {character.image_url ? (
            <img
              src={character.image_url} alt=""
              className="h-7 w-7 shrink-0 rounded-full border border-ink-500 object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <User size={15} strokeWidth={1.75} className="shrink-0 text-parchment-dim" />
          )}
          <h3
            className="cursor-pointer truncate font-display text-lg font-medium text-parchment transition-colors hover:text-amber-soft"
            onClick={() => onSelect(character)}
          >
            {character.name || 'Без імені'}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.cls}`}>
            {status.label}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(character) }}
            className="ml-1 rounded p-1 text-parchment-dim opacity-0 transition-all hover:bg-crimson-dim/30 hover:text-crimson-soft group-hover:opacity-100"
            aria-label="Видалити"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {character.role && (
        <span className="mt-2 w-fit rounded-full bg-ink-700 px-2 py-0.5 text-xs text-parchment-dim">
          {character.role}
        </span>
      )}

      {(() => {
        const tagsList = Array.isArray(character.tags)
          ? character.tags
          : (character.tags ? character.tags.split(',').map((t) => t.trim()).filter(Boolean) : [])
        return tagsList.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {tagsList.map((tag) => (
              <span key={tag} className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-parchment-dim">
                {tag}
              </span>
            ))}
          </div>
        ) : null
      })()}

      {snippet && (
        <p className="mt-2 line-clamp-2 text-sm text-parchment-dim">{snippet}</p>
      )}

      <div className="mt-auto pt-3">
        <ProgressBar percent={percent} compact />
      </div>

      <button
        onClick={() => onSelect(character)}
        className="mt-3 flex items-center gap-1 text-xs text-parchment-dim transition-colors hover:text-amber-soft"
      >
        Відкрити деталі <ChevronRight size={13} />
      </button>
    </div>
  )
}
