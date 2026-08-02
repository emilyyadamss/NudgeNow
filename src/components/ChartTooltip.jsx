import { useLayoutEffect, useRef, useState } from 'react'

/* Floating tooltip pinned inside its chart container. Tooltips only ever
   enhance — every value here is also reachable in the table view. */
export default function ChartTooltip({ x, y, children, containerWidth }) {
  const ref = useRef(null)
  const [shift, setShift] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !containerWidth) return
    const w = el.offsetWidth
    const left = x - w / 2
    const right = x + w / 2
    if (left < 4) setShift(4 - left)
    else if (right > containerWidth - 4) setShift(containerWidth - 4 - right)
    else setShift(0)
  }, [x, containerWidth, children])

  return (
    <div
      ref={ref}
      className="tooltip"
      style={{ left: x + shift, top: y - 10 }}
      role="status"
    >
      {children}
    </div>
  )
}
