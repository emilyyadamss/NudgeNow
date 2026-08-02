import { useMemo, useState } from 'react'
import Heatmap from '../components/Heatmap.jsx'
import ProgressChart from '../components/ProgressChart.jsx'
import { colorVar, unitFor, formatAmount, unitWord } from '../lib/model.js'
import { goalStats } from '../lib/stats.js'
import { formatShort, relativeDays, todayKey } from '../lib/date.js'

export default function GoalDetail({ goal, entries, days, settings, onEdit, onLog, onDeleteEntry, onBack }) {
  const unit = unitFor(goal)
  const color = colorVar(goal.colorSlot)
  const stats = useMemo(() => goalStats(goal, days, settings, todayKey()), [goal, days, settings])

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
          <span className="goal-emoji" style={{ '--goal-color': color, width: 46, height: 46, fontSize: 22, borderRadius: 14 }} aria-hidden="true">
            {goal.emoji}
          </span>
          <div style={{ minWidth: 0 }}>
            <h1 className="page-title">{goal.name}</h1>
            <p className="page-sub">
              {stats.target > 0
                ? `Target ${formatAmount(stats.target, unit)} ${unitWord(stats.target, unit)} per ${goal.cadence}`
                : `Measured in ${unit.many} · no target set`}
              {goal.why ? ` · ${goal.why}` : ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={onBack}>← All goals</button>
          <button className="btn" onClick={() => onEdit(goal)}>Edit</button>
          <button className="btn btn-primary" onClick={() => onLog(goal.id)}>+ Log progress</button>
        </div>
      </div>

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

      {stats.target > 0 && (
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
              <div className="card-sub">Darker means a bigger day — click any square to log it</div>
            </div>
          </div>
          <Heatmap
            days={days}
            color={color}
            unit={unit}
            weeks={settings.heatmapWeeks}
            weekStart={settings.weekStart}
            label={goal.name}
            onSelectDay={(date) => onLog(goal.id, date)}
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
