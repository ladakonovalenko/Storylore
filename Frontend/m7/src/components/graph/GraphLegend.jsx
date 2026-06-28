import { GRAPH_MODES } from '../../utils/graphHelpers'

const LEGEND_ALL = [
  { color: '#7F9C87', label: 'Союзний зв\'язок (strength > 0)',  thickness: 3 },
  { color: '#C16B65', label: 'Ворожий зв\'язок (strength < 0)',  thickness: 3 },
  { color: '#3A3F54', label: 'Нейтральний (strength = 0)',        thickness: 1.5 },
]
const LEGEND_CONFLICTS = [
  { color: '#C16B65', label: 'Конфлікт / ворожість',  thickness: 3 },
]
const LEGEND_SECRETS = [
  { color: '#C98A3E', label: 'Таємний зв\'язок',       thickness: 2, dashed: true, arrow: true },
]
const LEGEND_NODES = [
  { borderColor: '#5E7A66', label: 'Живий персонаж' },
  { borderColor: '#9A4A45', label: 'Загиблий персонаж' },
  { borderColor: '#565C77', label: 'Невідомий статус' },
]

function LineIcon({ color, thickness, dashed, arrow }) {
  const dashArray = dashed ? '8 4' : undefined
  return (
    <svg width={44} height={14} className="shrink-0">
      <line
        x1={2} y1={7} x2={arrow ? 36 : 42} y2={7}
        stroke={color} strokeWidth={thickness}
        strokeDasharray={dashArray}
        strokeLinecap="round"
      />
      {arrow && (
        <polygon points="36,4 44,7 36,10" fill={color} />
      )}
    </svg>
  )
}

function NodeIcon({ borderColor }) {
  return (
    <svg width={20} height={20} className="shrink-0">
      <circle cx={10} cy={10} r={8} fill="#1F2230" stroke={borderColor} strokeWidth={2.5} />
    </svg>
  )
}

export default function GraphLegend({ mode }) {
  const edgeItems =
    mode === GRAPH_MODES.CONFLICTS ? LEGEND_CONFLICTS :
    mode === GRAPH_MODES.SECRETS   ? LEGEND_SECRETS :
    LEGEND_ALL

  const thicknessNote = mode === GRAPH_MODES.ALL

  return (
    <div className="rounded-lg border border-ink-500 bg-ink-800 px-4 py-3 text-xs text-parchment-dim">
      <p className="mb-2 font-medium uppercase tracking-wider text-parchment-dim/70">Легенда</p>

      {/* Ребра */}
      <div className="flex flex-col gap-1.5 mb-3">
        {edgeItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <LineIcon
              color={item.color}
              thickness={item.thickness}
              dashed={item.dashed}
              arrow={item.arrow}
            />
            <span>{item.label}</span>
          </div>
        ))}
        {thicknessNote && (
          <p className="mt-1 text-parchment-dim/60 leading-snug">
            Товщина лінії — абсолютне значення сили зв'язку (1–10)
          </p>
        )}
      </div>

      {/* Вузли */}
      <p className="mb-1.5 font-medium uppercase tracking-wider text-parchment-dim/70">Вузли</p>
      <div className="flex flex-col gap-1.5">
        {LEGEND_NODES.map((n) => (
          <div key={n.label} className="flex items-center gap-2">
            <NodeIcon borderColor={n.borderColor} />
            <span>{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
