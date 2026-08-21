/* Derived numbers. Everything here is pure — given goals + entries + settings
   it returns the same result, so components can compute freely in a useMemo. */

import {
  todayKey, addDays, daysBetween, periodStart, periodLength,
  periodRange, dayRange,
} from './date.js'
import { isActive, revisitEvery } from './model.js'

/** goalId → Map(dateKey → summed amount) */
export function indexEntries(entries) {
  const byGoal = new Map()
  for (const e of entries) {
    let days = byGoal.get(e.goalId)
    if (!days) { days = new Map(); byGoal.set(e.goalId, days) }
    days.set(e.date, (days.get(e.date) || 0) + e.amount)
  }
  return byGoal
}

/** Sum of amounts in the last `n` days, inclusive of today. */
export function rollingTotal(days, n, from = todayKey()) {
  if (!days) return 0
  let sum = 0
  for (let i = 0; i < n; i++) sum += days.get(addDays(from, -i)) || 0
  return sum
}

/** Consecutive days logged, counting back from today (yesterday still counts —
    a streak shouldn't die just because today isn't over yet). */
export function currentStreak(days, from = todayKey()) {
  if (!days || days.size === 0) return 0
  let cursor = days.has(from) ? from : addDays(from, -1)
  if (!days.has(cursor)) return 0
  let n = 0
  while (days.has(cursor)) { n++; cursor = addDays(cursor, -1) }
  return n
}

export function longestStreak(days) {
  if (!days || days.size === 0) return 0
  const keys = [...days.keys()].sort()
  let best = 1, run = 1
  for (let i = 1; i < keys.length; i++) {
    run = daysBetween(keys[i - 1], keys[i]) === 1 ? run + 1 : 1
    if (run > best) best = run
  }
  return best
}

export function lastLoggedDate(days) {
  if (!days || days.size === 0) return null
  let latest = null
  for (const k of days.keys()) if (!latest || k > latest) latest = k
  return latest
}

/** Per-period totals across [from, to], oldest first. */
export function periodTotals(days, from, to, cadence, weekStart) {
  const starts = periodRange(from, to, cadence, weekStart)
  const buckets = new Map(starts.map((s) => [s, 0]))
  if (days) {
    for (const [key, amount] of days) {
      if (key < from || key > to) continue
      const p = periodStart(key, cadence, weekStart)
      if (buckets.has(p)) buckets.set(p, buckets.get(p) + amount)
    }
  }
  return starts.map((start) => ({ start, total: buckets.get(start) }))
}

/** Running cumulative total per day across [from, to]. */
export function cumulativeSeries(days, from, to) {
  let acc = 0
  return dayRange(from, to).map((date) => {
    acc += days?.get(date) || 0
    return { date, value: acc }
  })
}

/** The full picture for one goal. */
export function goalStats(goal, days, settings, today = todayKey()) {
  const cadence = goal.cadence
  const weekStart = settings.weekStart
  const pStart = periodStart(today, cadence, weekStart)
  const pLen = periodLength(cadence, pStart)
  const elapsed = daysBetween(pStart, today) + 1

  let total = 0
  let activeDays = 0
  let best = 0
  let first = null
  if (days) {
    for (const [k, v] of days) {
      total += v
      activeDays++
      if (v > best) best = v
      if (!first || k < first) first = k
    }
  }

  const last = lastLoggedDate(days)
  const daysSince = last ? Math.max(0, daysBetween(last, today)) : null
  // How long this goal has existed. Taken from the earlier of its creation date
  // and its first entry, so imported history isn't mistaken for a brand-new goal.
  const created = goal.createdAt ? goal.createdAt.slice(0, 10) : today
  const born = first && first < created ? first : created
  const age = Math.max(0, daysBetween(born, today))
  const thisPeriod = periodTotals(days, pStart, today, cadence, weekStart)[0]?.total || 0
  const prevStart = cadence === 'month'
    ? periodStart(addDays(pStart, -1), cadence, weekStart)
    : addDays(pStart, -7)
  const lastPeriod = periodTotals(days, prevStart, addDays(pStart, -1), cadence, weekStart)[0]?.total || 0

  const target = Number(goal.target) || 0
  // Rolling window the same length as the goal's cadence — smoother than a
  // calendar period, which resets to zero every Monday and lies for a day.
  const rolling = rollingTotal(days, pLen, today)

  return {
    total,
    activeDays,
    bestDay: best,
    lastLogged: last,
    daysSince,
    quietFor: daysSince ?? age,
    age,
    thisPeriod,
    lastPeriod,
    periodStart: pStart,
    periodLength: pLen,
    periodElapsed: elapsed,
    rolling,
    target,
    // pace target: what you'd need by now to be on track inside this period
    paceTarget: target ? (target * elapsed) / pLen : 0,
    pct: target ? Math.min(1, thisPeriod / target) : 0,
    rollingPct: target ? Math.min(1, rolling / target) : 0,
    onPace: target ? thisPeriod >= (target * elapsed) / pLen : true,
    streak: currentStreak(days, today),
    longest: longestStreak(days),
  }
}

/** Where a goal sits in its revisit cycle. Positive `dueIn` means still fresh;
    `overdue` counts the days past the interval. */
export function revisitStatus(goal, stats) {
  const every = revisitEvery(goal)
  const elapsed = stats.quietFor
  return {
    every,
    elapsed,
    dueIn: every - elapsed,
    overdue: Math.max(0, elapsed - every),
    due: elapsed >= every,
    pct: Math.min(1, elapsed / every),
  }
}

/** How evenly attention is spread across goals, 0–100.
    Normalised Shannon entropy of each goal's share of the last 30 days,
    measured on target-relative progress so goals in different units compare.
    Revisit goals sit this out — they're deliberately low-volume, and counting
    them would read as lopsided attention when it's the intended shape. */
export function balanceScore(goals, byGoal, settings, today = todayKey()) {
  const active = goals.filter(isActive)
  if (active.length < 2) return null
  const shares = active.map((g) => {
    const days = byGoal.get(g.id)
    const pLen = periodLength(g.cadence, periodStart(today, g.cadence, settings.weekStart))
    const rolling = rollingTotal(days, pLen, today)
    const target = Number(g.target) || 0
    return target > 0 ? Math.min(1.5, rolling / target) : rolling > 0 ? 1 : 0
  })
  const sum = shares.reduce((a, b) => a + b, 0)
  if (sum <= 0) return 0
  const n = active.length
  let h = 0
  for (const s of shares) {
    const p = s / sum
    if (p > 0) h -= p * Math.log(p)
  }
  return Math.round((h / Math.log(n)) * 100)
}

/** What a goal's task list amounts to, in the goal's own unit.

    `covers` answers the question the list is really for: if I tick off
    everything still open, does this period's target get met? It is measured
    against what's left to do, not the whole target, so a goal already halfway
    there isn't told it needs the full amount again. */
export function taskSummary(tasks, stats) {
  const list = tasks || []
  const open = list.filter((t) => !t.done)
  const done = list.filter((t) => t.done)
  const planned = open.reduce((a, t) => a + (Number(t.amount) || 0), 0)
  const delivered = done.reduce((a, t) => a + (Number(t.amount) || 0), 0)
  const remaining = Math.max(0, (stats?.target || 0) - (stats?.thisPeriod || 0))
  return {
    total: list.length,
    open: open.length,
    done: done.length,
    planned,
    delivered,
    remaining,
    // 0–1 share of the outstanding target the open tasks would cover.
    covers: remaining > 0 ? Math.min(1, planned / remaining) : planned > 0 ? 1 : 0,
    enough: remaining > 0 ? planned >= remaining : true,
    pct: list.length ? Math.round((done.length / list.length) * 100) : 0,
  }
}

/** The task to put in front of someone next: first open one in list order. */
export function nextTask(tasks) {
  return (tasks || []).find((t) => !t.done) || null
}
