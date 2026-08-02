/* 12-period micro-column trend for a goal card. The current period sits at
   full strength, earlier ones recede — so "where am I now" reads instantly. */
export default function Sparkline({ data, color, width = 96, height = 30 }) {
  const max = Math.max(...data.map((d) => d.total), 0)
  const n = data.length || 1
  const band = width / n
  const bw = Math.max(2, Math.min(6, band - 2))

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ flex: 'none' }}>
      {data.map((d, i) => {
        const h = max > 0 ? Math.max(d.total > 0 ? 2 : 0, (d.total / max) * height) : 0
        return (
          <rect
            key={d.start}
            x={i * band + (band - bw) / 2}
            y={height - h}
            width={bw}
            height={h}
            rx={1.5}
            fill={color}
            opacity={i === n - 1 ? 1 : 0.32}
          />
        )
      })}
      <line x1={0} x2={width} y1={height - 0.5} y2={height - 0.5} stroke="var(--grid)" strokeWidth={1} />
    </svg>
  )
}
