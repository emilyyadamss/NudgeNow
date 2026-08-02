/* Small chart helpers shared by every viz. */

import { useEffect, useRef, useState } from 'react'

/** Width of an element, tracked live. Charts render responsively off this. */
export function useMeasure() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

/** Axis ticks on clean round numbers (0 / 5 / 10, 0 / 1,000 / 2,000). */
export function niceTicks(max, count = 4) {
  if (!isFinite(max) || max <= 0) return { ticks: [0, 1], top: 1 }
  const rough = max / count
  const mag = Math.pow(10, Math.floor(Math.log10(rough)))
  const norm = rough / mag
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag
  const top = Math.ceil(max / step) * step
  const ticks = []
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Number(v.toFixed(10)))
  return { ticks, top }
}

export function formatTick(v) {
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a >= 1_000_000) return `${Number((v / 1_000_000).toFixed(1))}M`
  if (a >= 1_000) return `${Number((v / 1_000).toFixed(1))}k`
  if (a < 1) return String(Number(v.toFixed(2)))
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

/** Column with a 4px rounded cap and a square foot on the baseline. */
export function columnPath(x, y, w, h, r = 4) {
  if (h <= 0.5) return ''
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
}

/** Horizontal bar with a rounded data-end (right) and square foot (left). */
export function barPath(x, y, w, h, r = 4) {
  if (w <= 0.5) return ''
  const rr = Math.min(r, h / 2, w)
  return `M${x},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h - rr} Q${x + w},${y + h} ${x + w - rr},${y + h} L${x},${y + h} Z`
}

export function linePath(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
}

export function areaPath(points, baseline) {
  if (points.length === 0) return ''
  const first = points[0]
  const last = points[points.length - 1]
  return `${linePath(points)} L${last.x},${baseline} L${first.x},${baseline} Z`
}
