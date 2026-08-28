import { useMemo, useState } from 'react'
import Heatmap from '../components/Heatmap.jsx'
import ProgressChart from '../components/ProgressChart.jsx'
import TaskList from '../components/TaskList.jsx'
import {
  colorVar, unitFor, formatAmount, unitWord, normaliseCategory,
  STATUS, statusOf, revisitLabel,
} from '../lib/model.js'
import { goalStats, revisitStatus } from '../lib/stats.js'
import { formatShort, relativeDays, todayKey, dayKeyOf } from '../lib/date.js'
import { GoalIcon } from '../lib/goalIcons.jsx'

export default function GoalDetail({
  goal, entries, days, tasks = [], settings,
  onEdit, onLog, onDeleteEntry, onBack, onComplete, onRevisit, onReactivate,
  onAddTask, onToggleTask, onDeleteTask,
}) {
  const unit = unitFor(goal)
  const color = colorVar(goal.colorSlot)
  const stats = useMemo(() => goalStats(goal, days, settings, todayKey()), [goal, days, settings])
  const status = statusOf(goal)
  const revisit = status === STATUS.REVISIT ? revisitStatus(goal, stats) : null
  const finishedOn = goal.completedAt ? formatShort(dayKeyOf(goal.completedAt)) : null

  const [showAll, setShowAll] = useState(false)
  const all = useMemo(
    () => entries
      .filter((e) => e.goalId === goal.id)
      .sort((a, b) => (b.date === a.date ? b.loggedAt.localeCompare(a.loggedAt) : b.date.localeCompare(a.date))),
    [entries, goal.id],
  )
  const recent = showAll ? all : all.slice(0, 12)

  const pct = stats.target > 0 ? Math.round((stats.thisPeriod / stats.target) * 100) : null
  const delta = stats.thisPeriod - stats.lastPeriod

  return (
    <>
      <div className="page-head">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
          <span className="goal-emoji" style={{ '--goal-color': color, width: 46, height: 46, borderRadius: 999 }} aria-hidden="true">
            <GoalIcon id={goal.emoji} size={22} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 className="page-title">{goal.name}</h1>
              {normaliseCategory(goal.category) && (
                <span className="chip" style={{ '--goal-color': color }}>
                  <span className="dot" />
                  {normaliseCategory(goal.category)}
                </span>
              )}
              {status === STATUS.REVISIT && <span className="badge">🔁 Revisit</span>}
              {status === STATUS.DONE && <span className="badge">📦 Archived</span>}
            </div>
            <p className="page-sub">
              {status === STATUS.ACTIVE
                ? stats.target > 0
                  ? `Target ${formatAmount(stats.target, unit)} ${unitWord(stats.target, unit)} per ${goal.cadence}`
                  : `Measured in ${unit.many} · no target set`
                : status === STATUS.REVISIT
                  ? `Practised ${revisitLabel(revisit.every).toLowerCase()} · no target to chase`
                  : `Finished${finishedOn ? ` ${finishedOn}` : ''} · kept for the record`}
              {goal.why ? ` · ${goal.why}` : ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={onBack}>← All goals</button>
          <button className="btn" onClick={() => onEdit(goal)}>Edit</button>
          {status === STATUS.ACTIVE && (
            <button className="btn" onClick={() => onComplete(goal)}>✓ Mark complete</button>
          )}
          {status === STATUS.DONE ? (
            <button className="btn btn-primary" onClick={() => onReactivate(goal.id)}>Reactivate</button>
          ) : (
            <button className="btn btn-primary" onClick={() => onLog(goal.id)}>
              {status === STATUS.REVISIT ? 'Log practice' : 'Log progress'}
            </button>
          )}
        </div>
      </div>

      {status !== STATUS.ACTIVE && (
        <div className={`status-banner${status === STATUS.REVISIT && revisit.due ? ' is-due' : ''}`}>
          <div>
            <div className="t">
              {status === STATUS.REVISIT
                ? revisit.due
                  ? revisit.overdue > 0
                    ? `Due for a refresher — ${revisit.overdue} ${revisit.overdue === 1 ? 'day' : 'days'} past its check-in`
                    : 'Due for a refresher today'
                  : `Next nudge in ${revisit.dueIn} ${revisit.dueIn === 1 ? 'day' : 'days'}`
                : `Archived${finishedOn ? ` on ${finishedOn}` : ''}`}
            </div>
            <div className="s">
              {status === STATUS.REVISIT
                ? `Completed${finishedOn ? ` ${finishedOn}` : ''} · nudged ${revisitLabel(revisit.every).toLowerCase()} so it doesn’t fade`
                : 'Out of the nudge entirely. Its history is kept in full.'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
            {status === STATUS.REVISIT ? (
              <>
                <button className="btn btn-sm" onClick={() => onEdit(goal)}>Change interval</button>
                <button className="btn btn-sm" onClick={() => onReactivate(goal.id)}>Back to active</button>
              </>
            ) : (
              <button className="btn btn-sm" onClick={() => onRevisit(goal)}>Move to revisit</button>
            )}
          </div>
        </div>
      )}

      <div className="kpi-row">
        <div className="stat">
          <div className="k">This {goal.cadence}</div>
          <div className="v">
            {formatAmount(stats.thisPeriod, unit)}
            <small> {unit.abbr || unitWord(stats.thisPeriod, unit)}</small>
          </div>
          <div className={`d${delta > 0 ? ' up' : ''}`}>
            {stats.lastPeriod > 0
              ? `${delta >= 0 ? '+' : ''}${formatAmount(delta, unit)} vs last ${goal.cadence}`
              : `first ${goal.cadence} logged`}
          </div>
        </div>
        <div className="stat">
          <div className="k">All time</div>
          <div className="v">
            {formatAmount(stats.total, unit)}
            <small> {unit.abbr || unitWord(stats.total, unit)}</small>
          </div>
          <div className="d">over {stats.activeDays} active {stats.activeDays === 1 ? 'day' : 'days'}</div>
        </div>
        <div className="stat">
          <div className="k">Current streak</div>
          <div className="v">{stats.streak}<small> {stats.streak === 1 ? 'day' : 'days'}</small></div>
          <div className="d">best was {stats.longest} {stats.longest === 1 ? 'day' : 'days'}</div>
        </div>
        <div className="stat">
          <div className="k">Last logged</div>
          <div className="v" style={{ fontSize: 22 }}>{relativeDays(stats.daysSince)}</div>
          <div className="d">{stats.lastLogged ? formatShort(stats.lastLogged) : 'nothing yet'}</div>
        </div>
      </div>

      {status === STATUS.REVISIT && (
        <div className="card" style={{ marginBottom: 14, '--goal-color': color }}>
          <div className="meter-row">
            <span>
              Day {Math.min(revisit.elapsed, revisit.every)} of a {revisit.every}-day revisit cycle
            </span>
            <b>{revisit.due ? 'due now' : `${revisit.dueIn} to go`}</b>
          </div>
          <div className="meter meter-quiet">
            <i style={{ width: `${Math.round(revisit.pct * 100)}%` }} />
          </div>
        </div>
      )}

      {status === STATUS.ACTIVE && stats.target > 0 && (
        <div className="card" style={{ marginBottom: 14, '--goal-color': color }}>
          <div className="meter-row">
            <span>
              {pct}% of this {goal.cadence}'s target — day {stats.periodElapsed} of {stats.periodLength}
            </span>
            <b>
              {stats.onPace
                ? 'on pace'
                : `${formatAmount(Math.max(0, stats.paceTarget - stats.thisPeriod), unit)} behind pace`}
            </b>
          </div>
          <div className="meter"><i style={{ width: `${Math.min(100, pct)}%` }} /></div>
        </div>
      )}

      <div className="stack">
        <TaskList
          goal={goal}
          tasks={tasks}
          stats={stats}
          color={color}
          readOnly={status === STATUS.DONE}
          onAdd={onAddTask}
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
        />

        <ProgressChart
          goal={goal}
          days={days}
          unit={unit}
          color={color}
          settings={settings}
          showTable={settings.showTables}
        />

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Consistency</div>
              <div className="card-sub">
              {status === STATUS.DONE
                ? 'Darker means a bigger day, the full record, kept as it was'
                : 'Darker means a bigger day, click any square to log it'}
            </div>
            </div>
          </div>
          <Heatmap
            days={days}
            color={color}
            unit={unit}
            weeks={settings.heatmapWeeks}
            weekStart={settings.weekStart}
            label={goal.name}
            onSelectDay={status === STATUS.DONE ? undefined : (date) => onLog(goal.id, date)}
          />
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Recent entries</div>
            <span className="hint">
              {all.length === 0 ? 'none yet' : `${recent.length} of ${all.length}`}
            </span>
          </div>
          {recent.length === 0 ? (
            <p className="hint">Nothing logged yet. Hit “Log progress” to start the trail.</p>
          ) : (
            recent.map((e) => (
              <div className="entry-row" key={e.id}>
                <span className="e-date">{formatShort(e.date)}</span>
                <span className="e-amt">
                  {formatAmount(e.amount, unit)} {unit.abbr}
                </span>
                <span className="e-note">{e.note || <span style={{ color: 'var(--text-muted)' }}>—</span>}</span>
                <button
                  className="btn btn-ghost btn-sm e-del btn-danger"
                  onClick={() => onDeleteEntry(e.id)}
                  aria-label={`Delete entry from ${formatShort(e.date)}`}
                >
                  Delete
                </button>
              </div>
            ))
          )}
          {all.length > 12 && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 10 }}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? 'Show less' : `Show all ${all.length}`}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
