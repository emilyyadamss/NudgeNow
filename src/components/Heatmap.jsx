import { useMemo, useRef, useState } from 'react'
import {
  todayKey, addDays, startOfWeek, fromKey, formatLong, monthLabel, DAY_NAMES,
} from '../lib/date.js'
import { formatAmount, unitWord } from '../lib/model.js'
import ChartTooltip from './ChartTooltip.jsx'

const CELL = 13
const GAP = 3
const STEP = CELL + GAP
const LEFT = 30
const TOP = 18

/* Sequential ramp: ONE hue, stepped by distance from the chart surface.
   Level 0 is the empty-day grid tone, never a hue. */
const MIX = [26, 48, 72, 100]
const rampStep = (color, level) =>
  level === 0 ? 'var(--grid)' : `color-mix(in oklab, ${color} ${MIX[level - 1]}%, var(--surface-1))`

/** Quantile thresholds over the non-zero values, so one huge day doesn't
    flatten everything else into level 1. */
function buildScale(values) {
  const nz = values.filter((v) => v > 0).sort((a, b) => a - b)
  if (nz.length === 0) return () => 0
  const q = (p) => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))]
  const t = [q(0.25), q(0.5), q(0.75)]
  return (v) => {
    if (v <= 0) return 0
    if (v <= t[0]) return 1
    if (v <= t[1]) return 2
    if (v <= t[2]) return 3
    return 4
  }
}

export default function Heatmap({
  days,
  color = 'var(--accent)',
  unit,
  weeks = 27,
  weekStart = 1,
  onSelectDay,
  label = 'Activity',
  summary,
}) {
  const wrapRef = useRef(null)
  const [hover, setHover] = useState(null)
  const today = todayKey()

  const { columns, scale, total, activeDays } = useMemo(() => {
    const lastColStart = startOfWeek(today, weekStart)
    const firstColStart = addDays(lastColStart, -(weeks - 1) * 7)
    const cols = []
    const values = []
    let sum = 0
    let active = 0

    for (let w = 0; w < weeks; w++) {
      const colStart = addDays(firstColStart, w * 7)
      const cells = []
      for (let d = 0; d < 7; d++) {
        const date = addDays(colStart, d)
        const future = date > today
        const amount = future ? 0 : days?.get(date) || 0
        if (!future) {
          values.push(amount)
          if (amount > 0) { sum += amount; active++ }
        }
        cells.push({ date, amount, future })
      }
      cols.push({ start: colStart, cells })
    }
    return { columns: cols, scale: buildScale(values), total: sum, activeDays: active }
  }, [days, weeks, weekStart, today])

  const width = LEFT + weeks * STEP
  const height = TOP + 7 * STEP

  // A month label sits on the first column whose week introduces a new month.
  const monthMarks = []
  let seen = null
  columns.forEach((col, i) => {
    const m = fromKey(addDays(col.start, 6)).getMonth()
    if (m !== seen) {
      if (i < weeks - 1) monthMarks.push({ x: LEFT + i * STEP, text: monthLabel(addDays(col.start, 6)) })
      seen = m
    }
  })

  const rect = wrapRef.current?.getBoundingClientRect()

  return (
    <div className="viz" ref={wrapRef}>
      <div className="heatmap-scroll">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width, maxWidth: 'none' }}
          role="img"
          aria-label={`${label} heatmap: ${formatAmount(total, unit)} ${unitWord(total, unit)} across ${activeDays} days in the last ${weeks} weeks.`}
        >
          {monthMarks.map((m) => (
            <text key={m.x} className="axis-text" x={m.x} y={11} textAnchor="start">{m.text}</text>
          ))}

          {[1, 3, 5].map((d) => (
            <text
              key={d}
              className="axis-text"
              x={LEFT - 7}
              y={TOP + d * STEP + CELL - 3}
              textAnchor="end"
            >
              {DAY_NAMES[(weekStart + d) % 7]}
            </text>
          ))}

          {columns.map((col, ci) =>
            col.cells.map((cell, di) => {
              if (cell.future) return null
              const level = scale(cell.amount)
              const isToday = cell.date === today
              return (
                <rect
                  key={cell.date}
                  className="heat-cell"
                  x={LEFT + ci * STEP}
                  y={TOP + di * STEP}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  fill={rampStep(color, level)}
                  stroke={isToday ? 'var(--text-secondary)' : 'none'}
                  strokeWidth={isToday ? 1 : 0}
                  onMouseEnter={() =>
                    setHover({
                      date: cell.date,
                      amount: cell.amount,
                      x: LEFT + ci * STEP + CELL / 2,
                      y: TOP + di * STEP,
                    })
                  }
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelectDay?.(cell.date)}
                  style={{ cursor: onSelectDay ? 'pointer' : 'default' }}
                />
              )
            }),
          )}
        </svg>
      </div>

      {hover && (
        <ChartTooltip x={hover.x} y={hover.y} containerWidth={rect?.width || width}>
          <div className="tt-date">{formatLong(hover.date)}</div>
          <div className="tt-row">
            <span className="tt-key">
              <span className="swatch" style={{ background: color }} />
              {label}
            </span>
            <span className="tt-val">
              {hover.amount > 0
                ? `${formatAmount(hover.amount, unit)}${unit.abbr ? unit.abbr : ` ${unitWord(hover.amount, unit)}`}`
                : '—'}
            </span>
          </div>
        </ChartTooltip>
      )}

      <div className="card-head" style={{ marginTop: 12, marginBottom: 0 }}>
        <span className="hint">
          {summary
            ? summary({ total, activeDays, weeks })
            : `${formatAmount(total, unit)} ${unitWord(total, unit)} over ${activeDays} active ${activeDays === 1 ? 'day' : 'days'}`}
        </span>
        <div className="heat-scale">
          Less
          <span className="steps">
            {[0, 1, 2, 3, 4].map((l) => (
              <i key={l} style={{ background: rampStep(color, l) }} />
            ))}
          </span>
          More
        </div>
      </div>
    </div>
  )
}
