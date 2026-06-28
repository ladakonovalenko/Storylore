// Універсальна SVG радар-діаграма (без зовнішніх бібліотек).
// data: [{ label: string, percent: number (0-100) }, ...]
export default function RadarChart({ data, size = 240 }) {
  if (!data?.length) return null

  const center = size / 2
  const maxR = size * 0.36
  const n = data.length
  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2 // перша вісь — згори

  const pointFor = (i, ratio) => {
    const angle = startAngle + i * angleStep
    return {
      x: center + maxR * ratio * Math.cos(angle),
      y: center + maxR * ratio * Math.sin(angle),
    }
  }

  // Кільця сітки на 25/50/75/100%
  const gridRings = [0.25, 0.5, 0.75, 1]

  // Полігон значень персонажа
  const valuePoints = data.map((d, i) => pointFor(i, Math.max(d.percent, 0) / 100))
  const valuePath = valuePoints.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size, margin: '0 auto' }}>
      {/* Кільця сітки */}
      {gridRings.map((ratio) => {
        const pts = data.map((_, i) => pointFor(i, ratio))
        return (
          <polygon
            key={ratio}
            points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#3A3F54"
            strokeWidth={1}
          />
        )
      })}

      {/* Осі */}
      {data.map((_, i) => {
        const p = pointFor(i, 1)
        return (
          <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#3A3F54" strokeWidth={1} />
        )
      })}

      {/* Полігон значень */}
      <polygon
        points={valuePath}
        fill="var(--amber-ink)"
        fillOpacity={0.22}
        stroke="var(--amber-ink)"
        strokeWidth={1.5}
      />
      {valuePoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--amber-ink)" />
      ))}

      {/* Підписи категорій + відсотки */}
      {data.map((d, i) => {
        const labelPoint = pointFor(i, 1.28)
        return (
          <text
            key={d.key ?? i}
            x={labelPoint.x} y={labelPoint.y}
            textAnchor="middle" dominantBaseline="central"
            fontSize={11} fontFamily="sans-serif"
            fill="#9a98a8"
          >
            {d.label} · {d.percent}%
          </text>
        )
      })}
    </svg>
  )
}
