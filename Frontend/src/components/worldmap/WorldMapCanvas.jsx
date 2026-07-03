import { useRef, useState, useCallback, useEffect } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

export const LOCATION_TYPE_COLORS = {
  'Країна':     '#378ADD',
  'Острів':     '#1D9E75',
  'Континент':  '#7F77DD',
  'Місто':      '#EF9F27',
  'Інше':       '#888780',
}

export const LOCATION_REL_TYPE_COLORS = {
  'Союз':        '#1D9E75',
  'Війна':       '#E24B4A',
  'Торгівля':    '#378ADD',
  'Вассалітет':  '#7F77DD',
  'Суперництво': '#EF9F27',
  'Нейтралітет': '#888780',
  'Інше':        '#888780',
}

const DEFAULT_COLOR = '#888780'
const CLICK_THRESHOLD = 5
const NODE_R = 26

function strengthToWidth(s) {
  const abs = Math.abs(s ?? 0)
  return 1 + (abs / 100) * 5
}
function strengthToOpacity(s) {
  const abs = Math.abs(s ?? 0)
  return 0.35 + (abs / 100) * 0.65
}

export default function WorldMapCanvas({
  locations, relationships = [],
  onNodeClick, onNodeDragEnd, onEdgeClick,
  selectedId, linkSourceId,
}) {
  const svgRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(null)
  const [hoveredEdge, setHoveredEdge] = useState(null)

  const locMap = Object.fromEntries(locations.map((l) => [l.id, l]))

  // ВИПРАВЛЕНО: Pointer Events замість Mouse Events — один обробник працює
  // однаково для миші, пальця на тачскріні та стилуса. Раніше перетягування
  // локацій і панорамування карти взагалі не працювало на телефонах/планшетах.
  const onNodePointerDown = useCallback((e, loc) => {
    e.stopPropagation()
    e.target.setPointerCapture?.(e.pointerId)
    setDragging({
      type: 'node', id: loc.id,
      startX: e.clientX, startY: e.clientY,
      origX: loc.x, origY: loc.y,
      moved: false,
    })
  }, [])

  const onSvgPointerDown = useCallback((e) => {
    if (e.target === svgRef.current || e.target.tagName === 'svg') {
      svgRef.current?.setPointerCapture?.(e.pointerId)
      setDragging({ type: 'pan', startX: e.clientX, startY: e.clientY, origX: pan.x, origY: pan.y })
    }
  }, [pan])

  const onPointerMove = useCallback((e) => {
    if (!dragging) return
    if (dragging.type === 'node') {
      const dx = (e.clientX - dragging.startX) / zoom
      const dy = (e.clientY - dragging.startY) / zoom
      const moved = Math.abs(e.clientX - dragging.startX) > CLICK_THRESHOLD ||
                    Math.abs(e.clientY - dragging.startY) > CLICK_THRESHOLD
      setDragging((d) => ({ ...d, moved: d.moved || moved }))
      onNodeDragEnd?.(dragging.id, dragging.origX + dx, dragging.origY + dy, false)
    } else if (dragging.type === 'pan') {
      setPan({
        x: dragging.origX + e.clientX - dragging.startX,
        y: dragging.origY + e.clientY - dragging.startY,
      })
    }
  }, [dragging, zoom, onNodeDragEnd])

  const onPointerUp = useCallback(() => {
    if (dragging?.type === 'node') {
      const loc = locations.find((l) => l.id === dragging.id)
      if (dragging.moved && loc) {
        onNodeDragEnd?.(dragging.id, loc.x, loc.y, true)
      } else if (loc) {
        onNodeClick?.(loc)
      }
    }
    setDragging(null)
  }, [dragging, locations, onNodeDragEnd, onNodeClick])

  const onWheel = useCallback((e) => {
    e.preventDefault()
    setZoom((z) => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)))
  }, [])

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  const usedLocTypes = [...new Set(locations.map((l) => l.type).filter(Boolean))]
  const usedRelTypes = [...new Set(relationships.map((r) => r.relationship_type).filter(Boolean))]

  if (!locations?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-ink-500 py-20 text-center">
        <p className="text-sm text-parchment-dim">На мапі ще немає жодного об'єкта</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-parchment-dim/60">
          Клік/дотик — деталі · перетягування — перемістити · колесо/кнопки — масштаб
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.15))}
            className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-parchment"
            aria-label="Збільшити">
            <ZoomIn size={14} />
          </button>
          <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}
            className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-parchment"
            aria-label="Зменшити">
            <ZoomOut size={14} />
          </button>
          <button onClick={resetView}
            className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-parchment"
            aria-label="Скинути вигляд">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-ink-500 bg-ink-900" style={{ height: 560 }}>
        <svg
          ref={svgRef}
          width="100%" height="100%"
          // ВИПРАВЛЕНО: touchAction: 'none' — забороняє браузеру перехоплювати
          // скрол/масштаб сторінки над полотном, інакше на телефоні звичайний
          // скрол "з'їдав" би спробу перетягнути локацію чи саму карту
          style={{ cursor: dragging?.type === 'pan' ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none' }}
          onPointerDown={onSvgPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <defs>
            <marker id="worldmap-arrow" viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

            {/* ── Лінії зв'язків між локаціями ── */}
            {relationships.map((rel) => {
              const a = locMap[rel.location_id]
              const b = locMap[rel.target_id]
              if (!a || !b) return null

              const color = LOCATION_REL_TYPE_COLORS[rel.relationship_type] ?? DEFAULT_COLOR
              const width = strengthToWidth(rel.strength)
              const opacity = strengthToOpacity(rel.strength)
              const isHov = hoveredEdge === rel.id

              const dx = b.x - a.x
              const dy = b.y - a.y
              const dist = Math.sqrt(dx * dx + dy * dy) || 1
              const x1 = a.x + (dx / dist) * NODE_R
              const y1 = a.y + (dy / dist) * NODE_R
              const x2 = b.x - (dx / dist) * NODE_R
              const y2 = b.y - (dy / dist) * NODE_R
              const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }

              const dash = rel.relationship_type === 'Війна' ? '6 4' : 'none'

              return (
                <g key={rel.id}
                   onPointerEnter={() => setHoveredEdge(rel.id)}
                   onPointerLeave={() => setHoveredEdge(null)}
                   onClick={(e) => { e.stopPropagation(); onEdgeClick?.(rel) }}
                   style={{ cursor: 'pointer' }}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={20} />
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={color}
                    strokeWidth={isHov ? width + 1.5 : width}
                    strokeOpacity={isHov ? 1 : opacity}
                    strokeDasharray={dash}
                    markerEnd="url(#worldmap-arrow)"
                  />
                  {isHov && (
                    <g>
                      {/* ВИПРАВЛЕНО: фон тултипа тепер темою (--ink-800) замість
                          захардкодженого #1a1a2e, який у світлій темі виглядав чужорідно */}
                      <rect x={mid.x - 55} y={mid.y - 11} width={110} height={22} rx={4}
                        fill="var(--ink-800)" stroke={color} strokeWidth={0.5} strokeOpacity={0.8} />
                      <text x={mid.x} y={mid.y + 1}
                        textAnchor="middle" dominantBaseline="central"
                        fontSize={11} fill={color} fontFamily="sans-serif">
                        {rel.relationship_type}{rel.strength ? ` · ${rel.strength > 0 ? '+' : ''}${rel.strength}` : ''}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}

            {/* ── Вузли локацій ── */}
            {locations.map((loc) => {
              const color = loc.color || LOCATION_TYPE_COLORS[loc.type] || DEFAULT_COLOR
              const isSelected = selectedId === loc.id
              const isLinkSource = linkSourceId === loc.id
              return (
                <g key={loc.id}
                   style={{ cursor: dragging?.id === loc.id ? 'grabbing' : 'grab' }}
                   onPointerDown={(e) => onNodePointerDown(e, loc)}>
                  {/* НОВЕ: невидиме розширене коло-"мішень" — на тачскріні палець
                      неточний, тож ціль для дотику робимо ширшою за видимий вузол */}
                  <circle cx={loc.x} cy={loc.y} r={34} fill="transparent" />
                  <circle cx={loc.x} cy={loc.y} r={28} fill="var(--ink-900)" opacity={0.4} />
                  {/* ВИПРАВЛЕНО: кольори вузла тепер CSS-змінні теми замість
                      захардкоджених темних hex-кольорів (не адаптувались до світлої теми) */}
                  <circle cx={loc.x} cy={loc.y} r={NODE_R}
                    fill="var(--ink-700)"
                    stroke={isLinkSource ? '#EF9F27' : isSelected ? color : 'var(--ink-300)'}
                    strokeWidth={isLinkSource ? 3 : isSelected ? 2.5 : 1}
                    strokeDasharray={isLinkSource ? '4 3' : 'none'}
                  />
                  <circle cx={loc.x} cy={loc.y} r={6} fill={color} />
                  <text x={loc.x} y={loc.y + 42}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={12} fontWeight={500}
                    fill="var(--parchment)" fontFamily="sans-serif">
                    {loc.name.length > 16 ? loc.name.slice(0, 15) + '…' : loc.name}
                  </text>
                  {loc.type && (
                    <text x={loc.x} y={loc.y + 56}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={10} fill="var(--parchment-dim)" fontFamily="sans-serif">
                      {loc.type}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {(usedLocTypes.length > 0 || usedRelTypes.length > 0) && (
        <div className="flex flex-col gap-1.5">
          {usedLocTypes.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {usedLocTypes.map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LOCATION_TYPE_COLORS[t] ?? DEFAULT_COLOR }} />
                  <span className="text-xs text-parchment-dim">{t}</span>
                </div>
              ))}
            </div>
          )}
          {usedRelTypes.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {usedRelTypes.map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: LOCATION_REL_TYPE_COLORS[t] ?? DEFAULT_COLOR }} />
                  <span className="text-xs text-parchment-dim">{t}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
