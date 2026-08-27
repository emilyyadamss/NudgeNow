import { useMemo } from 'react'
import { colorVar, unitFor, formatAmount, unitWord, groupByCategory, categoryLabel } from '../lib/model.js'
import { goalStats } from '../lib/stats.js'
import { todayKey, formatShort, dayKeyOf } from '../lib/date.js'
import { GoalIcon } from '../lib/goalIcons.jsx'

/* Finished goals, kept whole. Nothing here is scored or nudged — the archive
   is a record, not a backlog. Anything in it can come back, either fully
   active or on a revisit interval. */
export default function ArchiveView({ goals, byGoal, settings, onOpen, onReactivate, onRevisit, onBack }) {
  const today = todayKey()
  const rows = useMemo(
    () => goals.map((goal) => ({ goal, stats: goalStats(goal, byGoal.get(goal.id), settings, today) })),
    [goals, byGoal, settings, today],
  )
  const groups = useMemo(() => groupByCategory(rows, (r) => r.goal), [rows])

  if (goals.length === 0) {
    return (
      <div className="empty">
        <h3>Nothing archived yet</h3>
        <p>
          When you finish a goal you can archive it here, or keep it in revisit so Compassed
          taps you every so often to practise it.
        </p>
        <button className="btn" onClick={onBack}>Back to today</button>
      </div>
    )
  }

  return (
    <div className="stack">
      {groups.map(([cat, items]) => (
        <div key={cat || '_none'}>
          {groups.length > 1 && (
            <div className="cat-head">
              <h3>{categoryLabel(cat)}</h3>
              <span className="count">{items.length}</span>
              <span className="rule" />
            </div>
          )}
          <div className="card">
            {items.map(({ goal, stats }) => {
              const unit = unitFor(goal)
              return (
                <div className="archive-row" key={goal.id} style={{ '--goal-color': colorVar(goal.colorSlot) }}>
                  <button className="archive-id" onClick={() => onOpen(goal.id)}>
                    <span className="goal-emoji" aria-hidden="true"><GoalIcon id={goal.emoji} /></span>
                    <span style={{ minWidth: 0, textAlign: 'left' }}>
                      <span className="goal-card-name" style={{ display: 'block' }}>{goal.name}</span>
                      <span className="goal-card-meta">
                        {formatAmount(stats.total, unit)} {unitWord(stats.total, unit)} over{' '}
                        {stats.activeDays} active {stats.activeDays === 1 ? 'day' : 'days'}
                        {goal.completedAt ? ` · finished ${formatShort(dayKeyOf(goal.completedAt))}` : ''}
                      </span>
                    </span>
                  </button>
                  <div className="archive-actions">
                    <button className="btn btn-sm" onClick={() => onRevisit(goal)}>Move to revisit</button>
                    <button className="btn btn-sm" onClick={() => onReactivate(goal.id)}>Reactivate</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
