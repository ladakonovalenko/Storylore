import { BookOpen, Check, Edit3, Trash2 } from 'lucide-react'
import InkStroke from '../layout/InkStroke'

export default function ProjectCard({ project, isActive, onSelect, onEdit, onDelete }) {
  const title = project.title || project.name || 'Без назви'
  const description = project.description || project.summary

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-lg border transition-colors ${
        isActive
          ? 'border-amber-ink bg-ink-700'
          : 'border-ink-500 bg-ink-800 hover:border-ink-300'
      }`}
    >
      {/* НОВЕ: обкладинка проєкту, якщо задана */}
      {project.cover_url && (
        <img src={project.cover_url} alt="" className="h-32 w-full object-cover" loading="lazy" />
      )}

      <div className="flex flex-col px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-parchment-dim">
            <BookOpen size={16} strokeWidth={1.75} />
            {isActive && (
              <span className="flex items-center gap-1 rounded-full bg-amber-ink/15 px-2 py-0.5 text-xs font-medium text-amber-soft">
                <Check size={12} /> Активний
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.() }}
              className="rounded p-1.5 text-parchment-dim transition-colors hover:bg-ink-700 hover:text-amber-soft"
              aria-label="Редагувати проєкт"
              title="Редагувати"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.() }}
              className="rounded p-1.5 text-parchment-dim transition-colors hover:bg-crimson-dim/30 hover:text-crimson-soft"
              aria-label="Видалити проєкт"
              title="Видалити"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <h3 className="mt-3 font-display text-xl font-medium text-parchment">{title}</h3>
        <InkStroke className="mt-1" width={70} color={isActive ? 'var(--amber-ink)' : 'var(--ink-500)'} />

        {description ? (
          <p className="mt-3 line-clamp-3 text-sm text-parchment-dim">{description}</p>
        ) : (
          <p className="mt-3 text-sm italic text-parchment-dim/70">Без опису</p>
        )}

        <div className="mt-4 pt-2">
          {isActive ? (
            <span className="text-sm text-parchment-dim">Зараз ви тут працюєте</span>
          ) : (
            <button
              onClick={onSelect}
              className="rounded-md border border-ink-500 px-3 py-1.5 text-sm text-parchment hover:border-amber-ink hover:text-amber-soft"
            >
              Зробити активним
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
