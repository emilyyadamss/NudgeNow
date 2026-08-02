import { useMemo } from 'react'
import NudgeCard from '../components/NudgeCard.jsx'
import GoalCard from '../components/GoalCard.jsx'
import BalanceBars from '../components/BalanceBars.jsx'
import Heatmap from '../components/Heatmap.jsx'
import { balanceScore, periodTotals } from '../lib/stats.js'
import { todayKey, addDays, startOfWeek } from '../lib/date.js'

const GOALS_UNIT = { one: 'goal', many: 'goals', abbr: '', precision: 0, step: 1 }

export default function Dashboard({
  goals, entries, byGoal, ranked, pick, settings, cycled,
  onLog, onOpen, onCycle, onNewGoal,
}) {
  const today = todayKey()

  /* Cross-goal heatmap: how many distinct goals you touched each day. It answers
     the spread question directly — a day with three goals reads darker than a
     day spent entirely on one. */
  const spreadDays = useMemo(() => {
    const m = new Map()
    for (const e of entries) {
      let set = m.get(e.date)
      if (!set) { set = new Set(); m.set(e.date, set) }
      set.add(e.goalId)
    }
    return new Map([...m].map(([k, v]) => [k, v.size]))
  }, [entries])

  const balance = useMemo(
    () => balanceScore(goals, byGoal, settings, today),
    [goals, byGoal, settings, today],
  )

  const trends = useMemo(() => {
    const out = new Map()
    for (const g of goals) {
      const from = g.cadence === 'month' ? addDays(today, -365) : addDays(today, -83)
      out.set(g.id, periodTotals(byGoal.get(g.id), from, today, g.cadence, settings.weekStart).slice(-12))
    }
    return out
  }, [goals, byGoal, settings.weekStart, today])

  const bestStreak = Math.max(0, ...ranked.map((r) => r.stats.streak))
  const weekStart = startOfWeek(today, settings.weekStart)
  const activeThisWeek = [...spreadDays.keys()].filter((d) => d >= weekStart && d <= today).length
  // "Needs attention" tracks the same score the nudge uses, so the tile and the
  // hero card never disagree about how much is actually slipping.
  const needsAttention = ranked.filter((r) => r.score >= 0.4).length

  if (goals.length === 0) {
    return (
      <div className="empty">
        <h3>Nothing to track yet</h3>
        <p>
          Add the goals you keep meaning to get to. NudgeNow watches which ones go quiet
          and points you back at them before they slip.
        </p>
        <button className="btn btn-primary" onClick={onNewGoal}>Add your first goal</button>
      </div>
    )
  }

  return (
    <>
      <NudgeCard
        pick={pick}
        ranked={ranked}
        settings={settings}
        cycled={cycled}
        onLog={onLog}
        onOpen={onOpen}
        onCycle={onCycle}
      />

      <div className="kpi-row">
        <div className="stat">
          <div className="k">Goals in play</div>
          <div className="v">{ranked.length}</div>
          <div className="d">
            {needsAttention > 0 ? `${needsAttention} slipping` : 'none slipping'}
          </div>
        </div>
        <div className="stat">
          <div className="k">Attention balance</div>
          <div className="v">{balance == null ? '—' : `${balance}`}<small> / 100</small></div>
          <div className="d">
            {balance == null ? 'add a second goal' : balance >= 75 ? 'evenly spread' : balance >= 45 ? 'a bit lopsided' : 'one goal is eating everything'}
          </div>
        </div>
        <div className="stat">
          <div className="k">Best current streak</div>
          <div className="v">{bestStreak}<small> {bestStreak === 1 ? 'day' : 'days'}</small></div>
          <div className="d">consecutive days logged</div>
        </div>
        <div className="stat">
          <div className="k">Active days this week</div>
          <div className="v">{activeThisWeek}<small> / 7</small></div>
          <div className="d">days you logged anything</div>
        </div>
      </div>

      <div className="stack" style={{ marginBottom: 14 }}>
        <BalanceBars ranked={ranked} settings={settings} showTable={settings.showTables} />

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Everything, day by day</div>
              <div className="card-sub">How many different goals you touched each day</div>
            </div>
          </div>
          <Heatmap
            days={spreadDays}
            color="var(--accent)"
            unit={GOALS_UNIT}
            weeks={settings.heatmapWeeks}
            weekStart={settings.weekStart}
            label="Goals touched"
            summary={({ activeDays, weeks }) =>
              `${activeDays} active ${activeDays === 1 ? 'day' : 'days'} in the last ${weeks} weeks`}
          />
        </div>
      </div>

      <div className="card-head" style={{ marginTop: 24 }}>
        <h2 className="card-title" style={{ fontSize: 15 }}>Your goals</h2>
        <button className="btn btn-sm" onClick={onNewGoal}>+ New goal</button>
      </div>

      <div className="grid-cards">
        {ranked.map(({ goal, stats }) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            stats={stats}
            trend={trends.get(goal.id) || []}
            onOpen={onOpen}
            onLog={onLog}
          />
        ))}
      </div>
    </>
  )
}
