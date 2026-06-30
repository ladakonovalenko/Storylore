import { X, Edit3, Trash2, Users, Shield, Map, Download } from 'lucide-react'
import InkStroke from '../layout/InkStroke'
import { downloadTextFile } from '../../utils/fileDownload'
import { buildArticleMarkdown } from '../../utils/wikiExport'
import LinkedText from '../common/LinkedText'

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

const TYPE_ICON = { character: Users, faction: Shield, location: Map }
const TYPE_LABEL = { character: 'Персонаж', faction: 'Фракція', location: 'Локація' }

export default function WikiArticleDetail({ article, characters, factions, locations, onClose, onEdit, onDelete }) {
  if (!article) return null
  const color = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS['Інше']

  const resolveName = (type, id) => {
    const list = type === 'character' ? characters : type === 'faction' ? factions : locations
    const item = list.find((i) => i.id === id)
    return item?.name || item?.title || `#${id}`
  }

  // НОВЕ: завантаження поточної статті як .md файлу
  const handleExport = () => {
    const md = buildArticleMarkdown(article, characters, factions, locations)
    const safeTitle = article.title.replace(/[\\/:*?"<>|]/g, '').trim() || 'стаття'
    downloadTextFile(`${safeTitle}.md`, md)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${color}26`, color }}>
            {article.category}
          </span>
          <h2 className="mt-2 font-display text-2xl font-medium text-parchment">{article.title}</h2>
          <InkStroke className="mt-1" width={80} color="var(--amber-ink)" />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={handleExport}
            className="rounded p-1.5 text-parchment-dim transition-colors hover:bg-ink-700 hover:text-amber-soft"
            aria-label="Завантажити як файл">
            <Download size={15} />
          </button>
          <button onClick={() => onEdit(article)}
            className="rounded p-1.5 text-parchment-dim transition-colors hover:bg-ink-700 hover:text-amber-soft"
            aria-label="Редагувати">
            <Edit3 size={15} />
          </button>
          <button onClick={() => onDelete(article)}
            className="rounded p-1.5 text-parchment-dim transition-colors hover:bg-crimson-dim/30 hover:text-crimson-soft"
            aria-label="Видалити">
            <Trash2 size={15} />
          </button>
          <button onClick={onClose}
            className="rounded p-1.5 text-parchment-dim transition-colors hover:bg-ink-700 hover:text-parchment"
            aria-label="Закрити">
            <X size={15} />
          </button>
        </div>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-parchment">
        {article.content ? <LinkedText text={article.content} /> : <span className="italic text-parchment-dim/60">Без тексту</span>}
      </p>

      {article.links?.length > 0 && (
        <div className="border-t border-ink-500 pt-4">
          <span className="text-xs font-medium uppercase tracking-widest text-parchment-dim/70">
            Пов'язані сутності
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {article.links.map((link) => {
              const Icon = TYPE_ICON[link.entity_type]
              return (
                <span key={link.id}
                  className="flex items-center gap-1.5 rounded-full bg-ink-700 px-3 py-1 text-xs text-parchment-dim">
                  <Icon size={12} />
                  {resolveName(link.entity_type, link.entity_id)}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
