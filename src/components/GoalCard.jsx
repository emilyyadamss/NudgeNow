import { colorVar, unitFor, formatAmount, unitWord } from '../lib/model.js'
import { relativeDays } from '../lib/date.js'
import Sparkline from './Sparkline.jsx'

export default function GoalCard({ goal, stats, trend, tasks = [], onOpen, onLog, onComplete }) {
  const unit = unitFor(goal)
  const color = colorVar(goal.colorSlot)
  const pct = stats.target > 0 ? Math.round((stats.thisPeriod / stats.target) * 100) : null
  const openSteps = tasks.filter((t) => !t.done).length

  return (
    <div className="goal-card" style={{ '--goal-color': color }}>
      <button className="goal-card-top" onClick={() => onOpen(goal.id)} style={{ width: '100%' }}>
        <span className="goal-emoji" aria-hidden="true">{goal.emoji}</span>
        <span style={{ minWidth: 0, textAlign: 'left' }}>
          <span className="goal-card-name" style={{ display: 'block' }}>{goal.name}</span>
          <span className="goal-card-meta">
            {stats.daysSince == null ? 'Never logged' : `Logged ${relativeDays(stats.daysSince)}`}
            {stats.streak > 1 ? ` · ${stats.streak}-day streak` : ''}
            {openSteps > 0 ? ` · ${openSteps} ${openSteps === 1 ? 'step' : 'steps'} open` : ''}
          </span>
        </span>
        <span className="goal-card-val">
          <span className="n">{formatAmount(stats.thisPeriod, unit)}</span>
          <span className="u" style={{ display: 'block' }}>
            {unit.abbr || unitWord(stats.thisPeriod, unit)} this {goal.cadence}
          </span>
        </span>
      </button>

      {stats.target > 0 && (
        <div>
          <div className="meter-row">
            <span>{pct}% of {formatAmount(stats.target, unit)} {unit.abbr || unitWord(stats.target, unit)}</span>
            <b>{stats.onPace ? 'on pace' : `${formatAmount(Math.max(0, stats.target - stats.thisPeriod), unit)} to go`}</b>
          </div>
          <div className="meter">
            <i style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <Sparkline data={trend} color={color} />
        <div style={{ display: 'flex', gap: 6 }}>
          {onComplete && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onComplete(goal)}
              title={`Mark ${goal.name} complete`}
            >
              ✓ Finish
            </button>
          )}
          <button className="btn btn-sm" onClick={() => onLog(goal.id)}>+ Log</button>
        </div>
      </div>
    </div>
  )
}
