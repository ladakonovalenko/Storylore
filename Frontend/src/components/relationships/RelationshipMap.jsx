import { useEffect, useRef, useState, useCallback } from 'react'
import { ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react'

const TYPE_COLORS = {
  'Родина':       '#EF9F27',
  'Романтика':    '#D4537E',
  'Дружба':       '#1D9E75',
  'Ворожнеча':    '#E24B4A',
  'Робота':       '#378ADD',
  'Наставництво': '#7F77DD',
  'Борг':         '#D85A30',
  'Таємниця':     '#888780',
  'Союзник':      '#5DCAA5',
  'Суперник':     '#EF9F27',
}

// ВИПРАВЛЕНО: нейтральний колір (коли тип зв'язку невідомий чи strength === 0)
// тепер CSS-змінна теми замість захардкодженого сірого — контрастує коректно
// і в темній, і в світлій темі, а не лише в темній, як було раніше.
const DEFAULT_COLOR = 'var(--parchment-dim)'
const CLICK_THRESHOLD = 5 // px — менше цього вважаємо кліком, а не перетягуванням

function layoutNodes(characters) {
  const cx = 400
  const cy = 300
  const r  = Math.min(220, 60 + characters.length * 30)
  return characters.map((c, i) => {
    const angle = (2 * Math.PI * i) / characters.length - Math.PI / 2
    return {
      id: c.id,
      name: c.name,
      role: c.role,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  })
}

function strengthToWidth(s) {
  const abs = Math.abs(s ?? 0)
  return 1.5 + (abs / 100) * 5 // ВИПРАВЛЕНО: мінімум 1.5 замість 1
}
function strengthToColor(s, type) {
  if (s === 0) return DEFAULT_COLOR
  return TYPE_COLORS[type] ?? DEFAULT_COLOR
}
function strengthToOpacity(s) {
  const abs = Math.abs(s ?? 0)
  // ВИПРАВЛЕНО: мінімальна прозорість піднята з 0.3 до 0.55 — навіть найслабші
  // зв'язки лишаються чіткими на світлому фоні
  return 0.55 + (abs / 100) * 0.45
}

export default function RelationshipMap({ relationships, characters }) {
  const svgRef   = useRef(null)
  const [nodes, setNodes]   = useState([])
  const [zoom, setZoom]     = useState(1)
  const [pan, setPan]       = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(null)
  const [hovered, setHovered]   = useState(null)
  const [focusedId, setFocusedId] = useState(null)

  useEffect(() => {
    if (!characters?.length) return
    setNodes(layoutNodes(characters))
  }, [characters])

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))

  const onNodeMouseDown = useCallback((e, id) => {
    e.stopPropagation()
    setDragging({ type: 'node', id, startX: e.clientX, startY: e.clientY, moved: false })
  }, [])

  const onSvgMouseDown = useCallback((e) => {
    if (e.target === svgRef.current || e.target.tagName === 'svg') {
      setDragging({ type: 'pan', startX: e.clientX, startY: e.clientY, origX: pan.x, origY: pan.y, moved: false })
    }
  }, [pan])

  const onMouseMove = useCallback((e) => {
    if (!dragging) return
    const movedNow = Math.abs(e.clientX - dragging.startX) > CLICK_THRESHOLD ||
                      Math.abs(e.clientY - dragging.startY) > CLICK_THRESHOLD

    if (dragging.type === 'node') {
      const dx = (e.clientX - dragging.startX) / zoom
      const dy = (e.clientY - dragging.startY) / zoom
      setNodes((prev) => prev.map((n) =>
        n.id === dragging.id ? { ...n, x: n.x + dx, y: n.y + dy } : n
      ))
      setDragging((d) => ({ ...d, startX: e.clientX, startY: e.clientY, moved: d.moved || movedNow }))
    } else if (dragging.type === 'pan') {
      setPan({
        x: dragging.origX + e.clientX - dragging.startX,
        y: dragging.origY + e.clientY - dragging.startY,
      })
      setDragging((d) => ({ ...d, moved: d.moved || movedNow }))
    }
  }, [dragging, zoom])

  const onMouseUp = useCallback(() => {
    if (dragging?.type === 'node' && !dragging.moved) {
      setFocusedId((prev) => (prev === dragging.id ? null : dragging.id))
    } else if (dragging?.type === 'pan' && !dragging.moved) {
      setFocusedId(null)
    }
    setDragging(null)
  }, [dragging])

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

  const edgeMidpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

  const visibleRelationships = focusedId
    ? relationships.filter((r) => r.character_id === focusedId || r.target_id === focusedId)
    : relationships

  const visibleNodeIds = focusedId
    ? new Set([
        focusedId,
        ...visibleRelationships.flatMap((r) => [r.character_id, r.target_id]),
      ])
    : null

  const visibleNodes = focusedId
    ? nodes.filter((n) => visibleNodeIds.has(n.id))
    : nodes

  const focusedNode = focusedId ? nodeMap[focusedId] : null
  const usedTypes = [...new Set(visibleRelationships.map((r) => r.relationship_type))]

  if (!characters?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-ink-500 py-20 text-center">
        <p className="text-sm text-parchment-dim">Немає персонажів для відображення</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Панель керування */}
      <div className="flex items-center justify-between">
        {focusedNode ? (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-ink/15 px-3 py-1 text-xs font-medium text-amber-soft">
              Зв'язки: {focusedNode.name}
            </span>
            <button
              onClick={() => setFocusedId(null)}
              className="flex items-center gap-1 rounded-full border border-ink-500 px-2.5 py-1 text-xs text-parchment-dim hover:border-amber-ink hover:text-amber-soft"
            >
              <X size={11} /> Показати всі
            </button>
          </div>
        ) : (
          <p className="text-xs text-parchment-dim/60">
            Клік на персонажі — лише його зв'язки · перетягування — перемістити · прокручування — масштаб
          </p>
        )}
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

      {/* SVG полотно */}
      <div className="overflow-hidden rounded-lg border border-ink-500 bg-ink-900"
           style={{ height: 520 }}>
        <svg
          ref={svgRef}
          width="100%" height="100%"
          style={{ cursor: dragging?.type === 'pan' ? 'grabbing' : 'grab', userSelect: 'none' }}
          onMouseDown={onSvgMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <defs>
            <marker id="map-arrow" viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </marker>
          </defs>

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

            {/* ── Лінії зв'язків (лише видимі) ── */}
            {visibleRelationships.map((rel) => {
              const a = nodeMap[rel.character_id]
              const b = nodeMap[rel.target_id]
              if (!a || !b) return null

              const color   = strengthToColor(rel.strength, rel.relationship_type)
              const width   = strengthToWidth(rel.strength)
              const opacity = strengthToOpacity(rel.strength)
              const mid     = edgeMidpoint(a, b)
              const isHov   = hovered === rel.id

              const dx = b.x - a.x
              const dy = b.y - a.y
              const dist = Math.sqrt(dx * dx + dy * dy) || 1
              const R = 22
              const x1 = a.x + (dx / dist) * R
              const y1 = a.y + (dy / dist) * R
              const x2 = b.x - (dx / dist) * R
              const y2 = b.y - (dy / dist) * R

              const dash = (rel.strength ?? 0) < 0 ? '6 4' : 'none'

              return (
                <g key={rel.id}
                   onMouseEnter={() => setHovered(rel.id)}
                   onMouseLeave={() => setHovered(null)}
                   style={{ cursor: 'default' }}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="transparent" strokeWidth={20} />
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={color}
                    strokeWidth={isHov ? width + 2 : width}
                    strokeOpacity={isHov ? 1 : opacity}
                    strokeDasharray={dash}
                    markerEnd="url(#map-arrow)"
                  />
                  {isHov && (
                    <g>
                      {/* ВИПРАВЛЕНО: фон тултипа тепер темою (--ink-800) замість
                          захардкодженого #1a1a2e, який у світлій темі виглядав чужорідно */}
                      <rect
                        x={mid.x - 50} y={mid.y - 11}
                        width={100} height={22} rx={4}
                        fill="var(--ink-800)" stroke={color} strokeWidth={0.5} strokeOpacity={0.8}
                      />
                      <text x={mid.x} y={mid.y + 1}
                        textAnchor="middle" dominantBaseline="central"
                        fontSize={11} fill={color} fontFamily="sans-serif">
                        {rel.relationship_type} · {rel.strength > 0 ? '+' : ''}{rel.strength}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}

            {/* ── Вузли персонажів (лише видимі) ── */}
            {visibleNodes.map((node) => {
              const isFocused = node.id === focusedId
              return (
                <g key={node.id}
                   style={{ cursor: dragging?.id === node.id ? 'grabbing' : 'grab' }}
                   onMouseDown={(e) => onNodeMouseDown(e, node.id)}>
                  {/* ВИПРАВЛЕНО: усі кольори вузлів нижче тепер CSS-змінні теми
                      замість захардкоджених темних hex-кольорів — раніше вузли
                      лишались темно-фіолетовими навіть у світлій темі */}
                  <circle cx={node.x} cy={node.y} r={24}
                    fill="var(--ink-900)" opacity={0.5} />
                  <circle cx={node.x} cy={node.y} r={22}
                    fill="var(--ink-700)"
                    stroke={isFocused ? 'var(--amber-ink)' : 'var(--ink-300)'}
                    strokeWidth={isFocused ? 2.5 : 1} />
                  <text x={node.x} y={node.y}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={13} fontWeight={500}
                    fill="var(--parchment)" fontFamily="sans-serif">
                    {node.name.slice(0, 2).toUpperCase()}
                  </text>
                  <text x={node.x} y={node.y + 32}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={11} fill="var(--parchment-dim)" fontFamily="sans-serif">
                    {node.name.length > 14 ? node.name.slice(0, 13) + '…' : node.name}
                  </text>
                  {node.role && (
                    <text x={node.x} y={node.y + 45}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={10} fill="var(--parchment-dim)" fillOpacity={0.7} fontFamily="sans-serif">
                      {node.role.length > 16 ? node.role.slice(0, 15) + '…' : node.role}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {/* Легенда */}
      {usedTypes.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {usedTypes.map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: TYPE_COLORS[t] ?? DEFAULT_COLOR }} />
              <span className="text-xs text-parchment-dim">{t}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded-full border-t border-dashed" style={{ borderColor: 'var(--parchment-dim)' }} />
            <span className="text-xs text-parchment-dim/60">пунктир = негативний</span>
          </div>
        </div>
      )}
    </div>
  )
}
