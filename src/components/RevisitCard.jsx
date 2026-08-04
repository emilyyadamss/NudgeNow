import { colorVar, revisitLabel } from '../lib/model.js'
import { relativeDays } from '../lib/date.js'

/* A revisit goal has no target to chase, so the card answers a different
   question: how long until this needs touching again? */
export default function RevisitCard({ goal, stats, revisit, onOpen, onLog }) {
  const color = colorVar(goal.colorSlot)
  const due = revisit.due

  return (
    <div className={`goal-card revisit-card${due ? ' is-due' : ''}`} style={{ '--goal-color': color }}>
      <button className="goal-card-top" onClick={() => onOpen(goal.id)} style={{ width: '100%' }}>
        <span className="goal-emoji" aria-hidden="true">{goal.emoji}</span>
        <span style={{ minWidth: 0, textAlign: 'left' }}>
          <span className="goal-card-name" style={{ display: 'block' }}>{goal.name}</span>
          <span className="goal-card-meta">
            {stats.daysSince == null
              ? 'Not practised since finishing'
              : `Last practised ${relativeDays(stats.daysSince)}`}
          </span>
        </span>
        <span className="goal-card-val">
          <span className={`badge${due ? ' badge-due' : ''}`}>{due ? 'Due now' : `in ${revisit.dueIn}d`}</span>
        </span>
      </button>

      <div>
        <div className="meter-row">
          <span>{revisitLabel(revisit.every)}</span>
          <b>
            {due
              ? revisit.overdue > 0
                ? `${revisit.overdue} ${revisit.overdue === 1 ? 'day' : 'days'} overdue`
                : 'ready'
              : `${revisit.dueIn} ${revisit.dueIn === 1 ? 'day' : 'days'} to go`}
          </b>
        </div>
        <div className="meter meter-quiet">
          <i style={{ width: `${Math.round(revisit.pct * 100)}%` }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span className="hint">Kept warm, not chased</span>
        <button className="btn btn-sm" onClick={() => onLog(goal.id)}>
          {due ? 'Practise now' : '+ Log'}
        </button>
      </div>
    </div>
  )
}
