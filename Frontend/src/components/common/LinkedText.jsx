import { useNavigate } from 'react-router-dom'
import { useEntityRegistry } from '../../context/EntityRegistryContext'

// Парсить [[Назва]] у тексті: якщо персонаж/локація/фракція/стаття з такою назвою
// існує в проєкті — рендерить клікабельне посилання, інакше — звичайний приглушений
// текст із дужками (щоб було видно, що посилання ще не "знайшло пару").
export default function LinkedText({ text, className = '' }) {
  const { resolveLink } = useEntityRegistry()
  const navigate = useNavigate()

  if (!text) return null

  const parts = text.split(/(\[\[[^[\]]+\]\])/g)

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const match = part.match(/^\[\[([^[\]]+)\]\]$/)
        if (!match) return <span key={i}>{part}</span>

        const name = match[1]
        const resolved = resolveLink(name)

        if (!resolved) {
          return (
            <span key={i} className="text-parchment-dim/50" title="Сутність із такою назвою не знайдена в проєкті">
              [[{name}]]
            </span>
          )
        }

        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`${resolved.path}?focus=${resolved.id}`)
            }}
            className="text-amber-soft underline decoration-dotted underline-offset-2 hover:text-amber-ink"
            title={`Перейти до: ${resolved.label}`}
          >
            {resolved.label}
          </button>
        )
      })}
    </span>
  )
}
