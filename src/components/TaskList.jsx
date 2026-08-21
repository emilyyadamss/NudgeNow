import { useState } from 'react'
import { unitFor, formatAmount, unitWord, withUnit } from '../lib/model.js'
import { taskSummary } from '../lib/stats.js'
import { formatShort, dayKeyOf } from '../lib/date.js'

/* The to-do list for one goal. Every item carries the amount it is worth, so
   ticking it off logs that amount against the goal — the list and the progress
   bar can never drift apart, because they are the same numbers.

   Items worth nothing (amount 0) are still allowed: some steps genuinely have
   no size, and pretending otherwise would inflate the goal. */
export default function TaskList({ goal, tasks = [], stats, color, readOnly, onAdd, onToggle, onDelete }) {
  const unit = unitFor(goal)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState(String(unit.step))
  const [showDone, setShowDone] = useState(false)

  const summary = taskSummary(tasks, stats)
  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)
  const shownDone = showDone ? done : done.slice(0, 3)

  const value = Math.max(0, Number(amount) || 0)
  const canAdd = title.trim().length > 0

  const submit = () => {
    if (!canAdd) return
    onAdd({ goalId: goal.id, title: title.trim(), amount: value })
    setTitle('')
    setAmount(String(unit.step))
  }

  return (
    <div className="card" style={{ '--goal-color': color }}>
      <div className="card-head">
        <div>
          <div className="card-title">Next steps</div>
          <div className="card-sub">
            {readOnly
              ? 'The steps this goal was built from'
              : `Tick one off and its ${unit.many} land on ${goal.name} today`}
          </div>
        </div>
        <span className="hint">
          {summary.total === 0 ? 'nothing planned' : `${summary.done} of ${summary.total} done`}
        </span>
      </div>

      {/* What the open list is worth, against what this period still needs.
          Without a target there is nothing to be a share of, so it just totals. */}
      {summary.open > 0 && summary.planned > 0 && (
        <div style={{ marginBottom: 4 }}>
          <div className="meter-row">
            <span>
              {summary.open} open {summary.open === 1 ? 'step' : 'steps'} · {withUnit(summary.planned, unit)} planned
            </span>
            <b>
              {stats.target <= 0
                ? 'no target set'
                : summary.remaining <= 0
                  ? 'target already met'
                  : summary.enough
                    ? `clears this ${goal.cadence}`
                    : `${Math.round(summary.covers * 100)}% of what's left`}
            </b>
          </div>
          <div className="meter meter-quiet">
            <i style={{ width: `${Math.round(summary.covers * 100)}%` }} />
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <p className="hint" style={{ margin: '2px 0 10px' }}>
          {readOnly
            ? 'No steps were listed for this goal.'
            : `Break ${goal.name} into the actual things you'll do. Each one carries the ${unit.many} it's worth, so finishing it moves the goal.`}
        </p>
      )}

      {open.map((t) => (
        <TaskRow key={t.id} task={t} unit={unit} readOnly={readOnly} onToggle={onToggle} onDelete={onDelete} />
      ))}

      {done.length > 0 && (
        <>
          <div className="task-divider">
            <span>Done</span>
            <span className="rule" />
            {done.length > 3 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDone((v) => !v)}>
                {showDone ? 'Show less' : `Show all ${done.length}`}
              </button>
            )}
          </div>
          {shownDone.map((t) => (
            <TaskRow key={t.id} task={t} unit={unit} readOnly={readOnly} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </>
      )}

      {!readOnly && (
        <div className="task-add">
          <input
            className="input"
            value={title}
            placeholder={`Add a step toward ${goal.name}…`}
            aria-label={`New step for ${goal.name}`}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          />
          <div className="task-amt-field">
            <input
              className="input"
              type="number"
              min="0"
              step={unit.step}
              value={amount}
              aria-label={`How many ${unit.many} this step is worth`}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
            />
            <span className="hint">{unit.abbr || unitWord(value, unit)}</span>
          </div>
          <button className="btn btn-primary" onClick={submit} disabled={!canAdd}>Add step</button>
        </div>
      )}

      {!readOnly && tasks.length > 0 && (
        <p className="hint" style={{ marginTop: 10 }}>
          Ticking a step logs it as an ordinary entry — untick it and the entry comes straight
          back off.
        </p>
      )}
    </div>
  )
}

function TaskRow({ task, unit, readOnly, onToggle, onDelete }) {
  const worth = Math.max(0, Number(task.amount) || 0)
  return (
    <div className={`task-row${task.done ? ' is-done' : ''}`}>
      <button
        className="task-check"
        role="checkbox"
        aria-checked={task.done}
        disabled={readOnly}
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? `Reopen ${task.title}` : `Finish ${task.title}`}
      >
        <span aria-hidden="true">✓</span>
      </button>
      <span className="task-title">{task.title}</span>
      <span className="task-amt">
        {worth > 0 ? `${formatAmount(worth, unit)} ${unit.abbr || unitWord(worth, unit)}` : '—'}
      </span>
      <span className="task-when">
        {task.done && dayKeyOf(task.completedAt) ? formatShort(dayKeyOf(task.completedAt)) : ''}
      </span>
      {!readOnly && (
        <button
          className="btn btn-ghost btn-sm task-del btn-danger"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete step ${task.title}`}
        >
          Delete
        </button>
      )}
    </div>
  )
}
