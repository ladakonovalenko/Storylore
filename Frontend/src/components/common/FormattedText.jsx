import { useNavigate } from 'react-router-dom'
import { useEntityRegistry } from '../../context/EntityRegistryContext'

// Спрощений Markdown + [[Посилання]] в одному рендерері.
// Підтримує: **жирний**, *курсив*, рядки-списки "- пункт", [[Назва]].
// Логіка резолвінгу посилань ідентична LinkedText.jsx (той самий resolveLink),
// просто об'єднана з парсингом форматування в одному проході.
export default function FormattedText({ text, className = '' }) {
  const { resolveLink } = useEntityRegistry()
  const navigate = useNavigate()

  if (!text) return null

  const goToEntity = (resolved) => {
    // ВИПРАВЛЕНО: власні сторінки мають інший маршрут (/page/:id як параметр шляху,
    // а не ?focus=) — CustomPageDetail бере id з useParams, не з query
    if (resolved.noFocusParam) {
      navigate(resolved.path)
    } else {
      navigate(`${resolved.path}?focus=${resolved.id}`)
    }
  }

  const renderInline = (segment, keyPrefix) => {
    const tokenRegex = /(\[\[[^[\]]+\]\]|\*\*[^*]+\*\*|\*[^*]+\*)/g
    const parts = segment.split(tokenRegex).filter((p) => p !== '')

    return parts.map((part, i) => {
      const linkMatch = part.match(/^\[\[([^[\]]+)\]\]$/)
      if (linkMatch) {
        const name = linkMatch[1]
        const resolved = resolveLink(name)
        if (!resolved) {
          return (
            <span key={`${keyPrefix}-${i}`} className="text-parchment-dim/50" title="Сутність із такою назвою не знайдена в проєкті">
              [[{name}]]
            </span>
          )
        }
        return (
          <button
            key={`${keyPrefix}-${i}`}
            type="button"
            onClick={(e) => { e.stopPropagation(); goToEntity(resolved) }}
            className="text-amber-soft underline decoration-dotted underline-offset-2 hover:text-amber-ink"
            title={`Перейти до: ${resolved.label}`}
          >
            {resolved.label}
          </button>
        )
      }

      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/)
      if (boldMatch) {
        return <strong key={`${keyPrefix}-${i}`} className="font-semibold text-parchment">{boldMatch[1]}</strong>
      }

      const italicMatch = part.match(/^\*([^*]+)\*$/)
      if (italicMatch) {
        return <em key={`${keyPrefix}-${i}`} className="italic">{italicMatch[1]}</em>
      }

      return <span key={`${keyPrefix}-${i}`}>{part}</span>
    })
  }

  const lines = text.split('\n')
  const blocks = []
  let listBuffer = []

  const flushList = (key) => {
    if (listBuffer.length === 0) return
    blocks.push(
      <ul key={`list-${key}`} className="my-1 list-disc pl-5">
        {listBuffer.map((item, i) => <li key={i}>{renderInline(item, `li-${key}-${i}`)}</li>)}
      </ul>
    )
    listBuffer = []
  }

  lines.forEach((line, idx) => {
    const listMatch = line.match(/^\s*-\s+(.*)$/)
    if (listMatch) {
      listBuffer.push(listMatch[1])
      return
    }
    flushList(idx)
    if (line.trim() === '') {
      blocks.push(<div key={`gap-${idx}`} className="h-2" />)
    } else {
      blocks.push(<p key={`p-${idx}`} className="m-0 whitespace-pre-wrap">{renderInline(line, `p-${idx}`)}</p>)
    }
  })
  flushList('end')

  return <div className={className}>{blocks}</div>
}
