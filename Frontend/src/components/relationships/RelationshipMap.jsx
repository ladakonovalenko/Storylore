import { useEffect, useRef, useState, useCallback } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

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

const DEFAULT_COLOR = '#888780'

// Початкове розташування вузлів по колу
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

// Сила → товщина лінії (1–6px)
function strengthToWidth(s) {
  const abs = Math.abs(s ?? 0)
  return 1 + (abs / 100) * 5
}

// Сила → колір лінії
function strengthToColor(s, type) {
  if (s === 0) return '#888780'
  const base = TYPE_COLORS[type] ?? DEFAULT_COLOR
  return base
}

// Сила → opacity
function strengthToOpacity(s) {
  const abs = Math.abs(s ?? 0)
  return 0.3 + (abs / 100) * 0.7
}

export default function RelationshipMap({ relationships, characters }) {
  const svgRef   = useRef(null)
  const [nodes, setNodes]   = useState([])
  const [zoom, setZoom]     = useState(1)
  const [pan, setPan]       = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(null) // { type: 'node'|'pan', id?, startX, startY, origX, origY }
  const [hovered, setHovered]   = useState(null) // rel id

  // Ініціалізація вузлів
  useEffect(() => {
    if (!characters?.length) return
    setNodes(layoutNodes(characters))
  }, [characters])

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))

  // ── Drag вузла ───────────────────────────────────────────────────────────
  const onNodeMouseDown = useCallback((e, id) => {
    e.stopPropagation()
    setDragging({ type: 'node', id, startX: e.clientX, startY: e.clientY })
  }, [])

  // ── Drag полотна ─────────────────────────────────────────────────────────
  const onSvgMouseDown = useCallback((e) => {
    if (e.target === svgRef.current || e.target.tagName === 'svg') {
      setDragging({ type: 'pan', startX: e.clientX, startY: e.clientY, origX: pan.x, origY: pan.y })
    }
  }, [pan])

  const onMouseMove = useCallback((e) => {
    if (!dragging) return
    if (dragging.type === 'node') {
      const dx = (e.clientX - dragging.startX) / zoom
      const dy = (e.clientY - dragging.startY) / zoom
      setNodes((prev) => prev.map((n) =>
        n.id === dragging.id ? { ...n, x: n.x + dx, y: n.y + dy } : n
      ))
      setDragging((d) => ({ ...d, startX: e.clientX, startY: e.clientY }))
    } else if (dragging.type === 'pan') {
      setPan({
        x: dragging.origX + e.clientX - dragging.startX,
        y: dragging.origY + e.clientY - dragging.startY,
      })
    }
  }, [dragging, zoom])

  const onMouseUp = useCallback(() => setDragging(null), [])

  // ── Zoom колесо ──────────────────────────────────────────────────────────
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

  // ── Мітка на лінії (середина) ────────────────────────────────────────────
  const edgeMidpoint = (a, b) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  })

  // ── Унікальні типи для легенди ───────────────────────────────────────────
  const usedTypes = [...new Set(relationships.map((r) => r.relationship_type))]

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
        <p className="text-xs text-parchment-dim/60">
          Перетягуйте вузли · прокручуйте для масштабу · тягніть фон для переміщення
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
                stroke-width="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </marker>
          </defs>

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

            {/* ── Лінії зв'язків ── */}
            {relationships.map((rel) => {
              const a = nodeMap[rel.character_id]
              const b = nodeMap[rel.target_id]
              if (!a || !b) return null

              const color   = strengthToColor(rel.strength, rel.relationship_type)
              const width   = strengthToWidth(rel.strength)
              const opacity = strengthToOpacity(rel.strength)
              const mid     = edgeMidpoint(a, b)
              const isHov   = hovered === rel.id

              // Вектор від a до b, зупиняємо лінію за 22px від центру вузла
              const dx = b.x - a.x
              const dy = b.y - a.y
              const dist = Math.sqrt(dx * dx + dy * dy) || 1
              const R = 22
              const x1 = a.x + (dx / dist) * R
              const y1 = a.y + (dy / dist) * R
              const x2 = b.x - (dx / dist) * R
              const y2 = b.y - (dy / dist) * R

              // Пунктир для негативних зв'язків
              const dash = (rel.strength ?? 0) < 0 ? '6 4' : 'none'

              return (
                <g key={rel.id}
                   onMouseEnter={() => setHovered(rel.id)}
                   onMouseLeave={() => setHovered(null)}
                   style={{ cursor: 'default' }}>
                  {/* Невидима широка зона для ховера */}
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="transparent" strokeWidth={20} />
                  {/* Видима лінія */}
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={color}
                    strokeWidth={isHov ? width + 1.5 : width}
                    strokeOpacity={isHov ? 1 : opacity}
                    strokeDasharray={dash}
                    markerEnd="url(#map-arrow)"
                  />
                  {/* Мітка на лінії */}
                  {isHov && (
                    <g>
                      <rect
                        x={mid.x - 50} y={mid.y - 11}
                        width={100} height={22} rx={4}
                        fill="#1a1a2e" stroke={color} strokeWidth={0.5} strokeOpacity={0.8}
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

            {/* ── Вузли персонажів ── */}
            {nodes.map((node) => (
              <g key={node.id}
                 style={{ cursor: dragging?.id === node.id ? 'grabbing' : 'grab' }}
                 onMouseDown={(e) => onNodeMouseDown(e, node.id)}>
                {/* Тінь */}
                <circle cx={node.x} cy={node.y} r={24}
                  fill="#0a0a14" opacity={0.5} />
                {/* Коло */}
                <circle cx={node.x} cy={node.y} r={22}
                  fill="#1e1e3a" stroke="#5a5a8a" strokeWidth={1} />
                {/* Ініціали */}
                <text x={node.x} y={node.y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={13} fontWeight={500}
                  fill="#c8c6d0" fontFamily="sans-serif">
                  {node.name.slice(0, 2).toUpperCase()}
                </text>
                {/* Ім'я під вузлом */}
                <text x={node.x} y={node.y + 32}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={11} fill="#9a98a8" fontFamily="sans-serif">
                  {node.name.length > 14 ? node.name.slice(0, 13) + '…' : node.name}
                </text>
                {/* Роль під іменем */}
                {node.role && (
                  <text x={node.x} y={node.y + 45}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={10} fill="#6a6880" fontFamily="sans-serif">
                    {node.role.length > 16 ? node.role.slice(0, 15) + '…' : node.role}
                  </text>
                )}
              </g>
            ))}
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
            <span className="h-0.5 w-5 rounded-full border-t border-dashed" style={{ borderColor: '#888780' }} />
            <span className="text-xs text-parchment-dim/60">пунктир = негативний</span>
          </div>
        </div>
      )}
    </div>
  )
}
