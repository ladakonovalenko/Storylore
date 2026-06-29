import { BookText, Users, Shield, Map } from 'lucide-react'
import InkStroke from '../layout/InkStroke'

const CATEGORY_COLORS = {
  'Магічна система':       '#7F77DD',
  'Зброя та технології':   '#E24B4A',
  'Релігія та обряди':     '#EF9F27',
  'Флора і фауна':         '#1D9E75',
  'Раси та народи':        '#0EA5E9',
  'Космогонія':            '#8B5CF6',
  'Культура та традиції':  '#D4537E',
  'Історія та політика':   '#378ADD',
  'Термінологія':          '#F2B705',
  'Канва сюжету':          '#10B981',
  'Інше':                  '#888780',
}

export default function WikiArticleCard({ article, onSelect }) {
  const color = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS['Інше']
  const linkCounts = (article.links ?? []).reduce((acc, l) => {
    acc[l.entity_type] = (acc[l.entity_type] ?? 0) + 1
    return acc
  }, {})

  return (
    <div
      onClick={() => onSelect(article)}
      className="group flex cursor-pointer flex-col rounded-lg border border-ink-500 bg-ink-800 px-5 py-4 transition-colors hover:border-ink-300"
    >
      <div className="flex items-center gap-2">
        <BookText size={15} strokeWidth={1.75} className="text-parchment-dim" />
        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${color}26`, color }}>
          {article.category}
        </span>
      </div>

      <h3 className="mt-3 font-display text-lg font-medium text-parchment transition-colors group-hover:text-amber-soft">
        {article.title}
      </h3>
      <InkStroke className="mt-1" width={60} color="var(--ink-500)" />

      {article.content ? (
        <p className="mt-2 line-clamp-3 text-sm text-parchment-dim">{article.content}</p>
      ) : (
        <p className="mt-2 text-sm italic text-parchment-dim/60">Без тексту</p>
      )}

      {(linkCounts.character || linkCounts.faction || linkCounts.location) && (
        <div className="mt-3 flex items-center gap-3 border-t border-ink-500 pt-3 text-xs text-parchment-dim">
          {linkCounts.character && (
            <span className="flex items-center gap-1"><Users size={12} /> {linkCounts.character}</span>
          )}
          {linkCounts.faction && (
            <span className="flex items-center gap-1"><Shield size={12} /> {linkCounts.faction}</span>
          )}
          {linkCounts.location && (
            <span className="flex items-center gap-1"><Map size={12} /> {linkCounts.location}</span>
          )}
        </div>
      )}
    </div>
  )
}
