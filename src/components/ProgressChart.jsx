import { useMemo, useState } from 'react'
import { formatPeriod, formatShort, formatLong, addDays, todayKey } from '../lib/date.js'
import { formatAmount, unitWord } from '../lib/model.js'
import { periodTotals, cumulativeSeries } from '../lib/stats.js'
import {
  useMeasure, niceTicks, formatTick, columnPath, linePath, areaPath,
} from '../lib/chart.js'
import ChartTooltip from './ChartTooltip.jsx'

const PAD = { top: 16, right: 18, bottom: 26, left: 40 }
const HEIGHT = 190
const MAX_BAR = 24

/* ------------------------------------------------------------------ columns */

function PeriodColumns({ data, color, unit, target, cadence, width }) {
  const [hover, setHover] = useState(null)
  const plotW = Math.max(60, width - PAD.left - PAD.right)
  const plotH = HEIGHT - PAD.top - PAD.bottom

  const max = Math.max(target || 0, ...data.map((d) => d.total), 0)
  const { ticks, top } = niceTicks(max || 1, 3)
  const y = (v) => PAD.top + plotH - (v / top) * plotH

  const band = plotW / Math.max(1, data.length)
  const barW = Math.min(MAX_BAR, band * 0.62)

  // Label only the last column — a number on every bar goes unread.
  const lastIdx = data.length - 1

  return (
    <>
      <svg
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`${cadence === 'month' ? 'Monthly' : 'Weekly'} totals`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'axis-line' : 'grid-line'} x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} />
            <text className="axis-text" x={PAD.left - 8} y={y(t) + 3.5} textAnchor="end">{formatTick(t)}</text>
          </g>
        ))}

        {target > 0 && target <= top && (
          <>
            <line className="target-line" x1={PAD.left} x2={PAD.left + plotW} y1={y(target)} y2={y(target)} strokeDasharray="0" />
            <text className="chart-label-muted" x={PAD.left + plotW} y={y(target) - 5} textAnchor="end">
              target {formatTick(target)}
            </text>
          </>
        )}

        {data.map((d, i) => {
          const bx = PAD.left + i * band + (band - barW) / 2
          const bh = Math.max(0, (d.total / top) * plotH)
          const isLast = i === lastIdx
          return (
            <g key={d.start}>
              {/* generous hit area — the whole band, not just the bar */}
              <rect
                x={PAD.left + i * band}
                y={PAD.top}
                width={band}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover({ ...d, x: bx + barW / 2, y: y(d.total) })}
              />
              <path
                d={columnPath(bx, y(d.total), barW, bh)}
                fill={color}
                opacity={hover && hover.start !== d.start ? 0.42 : 1}
                style={{ transition: 'opacity 140ms ease' }}
                pointerEvents="none"
              />
              {isLast && d.total > 0 && (
                <text className="chart-label" x={bx + barW / 2} y={y(d.total) - 7} textAnchor="middle">
                  {formatTick(d.total)}
                </text>
              )}
            </g>
          )
        })}

        {data.map((d, i) => {
          const every = Math.max(1, Math.ceil(data.length / 6))
          if (i % every !== 0 && i !== lastIdx) return null
          return (
            <text
              key={`x${d.start}`}
              className="axis-text"
              x={PAD.left + i * band + band / 2}
              y={HEIGHT - 8}
              textAnchor="middle"
            >
              {cadence === 'month' ? formatPeriod(d.start, 'month').slice(0, 3) : formatShort(d.start)}
            </text>
          )
        })}
      </svg>

      {hover && (
        <ChartTooltip x={hover.x} y={hover.y} containerWidth={width}>
          <div className="tt-date">{formatPeriod(hover.start, cadence)}</div>
          <div className="tt-row">
            <span className="tt-key"><span className="swatch" style={{ background: color }} />Logged</span>
            <span className="tt-val">{formatAmount(hover.total, unit)} {unit.abbr || unitWord(hover.total, unit)}</span>
          </div>
          {target > 0 && (
            <div className="tt-row">
              <span className="tt-key">of target</span>
              <span className="tt-val">{Math.round((hover.total / target) * 100)}%</span>
            </div>
          )}
        </ChartTooltip>
      )}
    </>
  )
}

/* --------------------------------------------------------------- cumulative */

function CumulativeLine({ data, color, unit, width }) {
  const [hover, setHover] = useState(null)
  const plotW = Math.max(60, width - PAD.left - PAD.right)
  const plotH = HEIGHT - PAD.top - PAD.bottom

  const max = Math.max(...data.map((d) => d.value), 1)
  const { ticks, top } = niceTicks(max, 3)
  const x = (i) => PAD.left + (i / Math.max(1, data.length - 1)) * plotW
  const y = (v) => PAD.top + plotH - (v / top) * plotH

  const points = data.map((d, i) => ({ x: x(i), y: y(d.value), ...d }))
  const last = points[points.length - 1]

  const onMove = (e) => {
    const box = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * width
    const i = Math.round(((px - PAD.left) / plotW) * (data.length - 1))
    const clamped = Math.max(0, Math.min(data.length - 1, i))
    setHover(points[clamped])
  }

  return (
    <>
      <svg
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label="Cumulative total over time"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'axis-line' : 'grid-line'} x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} />
            <text className="axis-text" x={PAD.left - 8} y={y(t) + 3.5} textAnchor="end">{formatTick(t)}</text>
          </g>
        ))}

        <path d={areaPath(points, y(0))} fill={color} opacity={0.1} />
        <path d={linePath(points)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {hover && (
          <>
            <line className="axis-line" x1={hover.x} x2={hover.x} y1={PAD.top} y2={PAD.top + plotH} />
            <circle cx={hover.x} cy={hover.y} r={4} fill={color} stroke="var(--surface-1)" strokeWidth={2} />
          </>
        )}

        {last && !hover && (
          <>
            <circle cx={last.x} cy={last.y} r={4} fill={color} stroke="var(--surface-1)" strokeWidth={2} />
            <text className="chart-label" x={last.x - 8} y={last.y - 8} textAnchor="end">
              {formatTick(last.value)}
            </text>
          </>
        )}

        {[0, Math.floor(data.length / 2), data.length - 1].map((i, k) =>
          data[i] ? (
            <text
              key={k}
              className="axis-text"
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor={k === 0 ? 'start' : k === 2 ? 'end' : 'middle'}
            >
              {formatShort(data[i].date)}
            </text>
          ) : null,
        )}
      </svg>

      {hover && (
        <ChartTooltip x={hover.x} y={hover.y} containerWidth={width}>
          <div className="tt-date">{formatLong(hover.date)}</div>
          <div className="tt-row">
            <span className="tt-key"><span className="swatch" style={{ background: color }} />Total so far</span>
            <span className="tt-val">{formatAmount(hover.value, unit)} {unit.abbr || unitWord(hover.value, unit)}</span>
          </div>
        </ChartTooltip>
      )}
    </>
  )
}

/* -------------------------------------------------------------------- shell */

const RANGES = [
  { id: 90, label: '3M' },
  { id: 180, label: '6M' },
  { id: 365, label: '1Y' },
]

export default function ProgressChart({ goal, days, unit, color, settings, showTable }) {
  const [mode, setMode] = useState('period')
  const [range, setRange] = useState(180)
  const [ref, width] = useMeasure()

  const today = todayKey()
  const from = addDays(today, -(range - 1))

  const periods = useMemo(
    () => periodTotals(days, from, today, goal.cadence, settings.weekStart),
    [days, from, today, goal.cadence, settings.weekStart],
  )
  const cumulative = useMemo(() => cumulativeSeries(days, from, today), [days, from, today])

  const rows = mode === 'period'
    ? periods.map((p) => ({ k: formatPeriod(p.start, goal.cadence), v: p.total }))
    : cumulative.filter((_, i, a) => i % Math.ceil(a.length / 24) === 0 || i === a.length - 1)
        .map((p) => ({ k: formatShort(p.date), v: p.value }))

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Progress</div>
          <div className="card-sub">
            {mode === 'period'
              ? `${goal.cadence === 'month' ? 'Monthly' : 'Weekly'} ${unit.many} logged against your target`
              : `Every ${unit.one} you've logged, added up`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="seg">
            <button aria-pressed={mode === 'period'} onClick={() => setMode('period')}>By {goal.cadence}</button>
            <button aria-pressed={mode === 'cumulative'} onClick={() => setMode('cumulative')}>Cumulative</button>
          </div>
          <div className="seg">
            {RANGES.map((r) => (
              <button key={r.id} aria-pressed={range === r.id} onClick={() => setRange(r.id)}>{r.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="viz" ref={ref}>
        {width > 0 && (
          mode === 'period'
            ? <PeriodColumns data={periods} color={color} unit={unit} target={Number(goal.target) || 0} cadence={goal.cadence} width={width} />
            : <CumulativeLine data={cumulative} color={color} unit={unit} width={width} />
        )}
      </div>

      {showTable && (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{mode === 'period' ? 'Period' : 'Date'}</th>
                <th>{mode === 'period' ? `Logged (${unit.many})` : `Cumulative (${unit.many})`}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.k}>
                  <td>{r.k}</td>
                  <td className="num">{formatAmount(r.v, unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
