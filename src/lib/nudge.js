/* The nudge engine.

   Two independent signals, blended by a weight you control in Settings:

     recency  — how long since you last touched it, on a saturating curve so
                "12 days" and "40 days" both read as very stale without one
                ancient goal permanently monopolising the nudge.
     deficit  — how far under target you are over a rolling window the length
                of the goal's own cadence. Unit-free, so hours and projects
                and pages compete fairly.

   score = w·recency + (1−w)·deficit, and the highest score gets nudged. */

import { relativeDays, formatShort } from './date.js'
import { goalStats } from './stats.js'
import { unitFor, withUnit } from './model.js'

/** 0 → just logged, ~0.63 at the stale threshold, ~0.95 at 3× it.
    `quietDays` counts from the last entry, or from the goal's creation date if
    it has never been logged — so a goal added today starts at zero, not one. */
function recencySignal(quietDays, staleAfter) {
  const k = Math.max(1, staleAfter)
  return 1 - Math.exp(-Math.max(0, quietDays) / k)
}

/** 0 → at or over target, 1 → nothing logged this window.
    Faded in over a goal's first window: a goal created this morning has had no
    real chance to hit a weekly target, so it shouldn't read as 100% behind on
    day one. By the time the window has elapsed the signal is at full strength. */
function deficitSignal(rolling, target, age, windowLen) {
  if (!target || target <= 0) return 0       // no target set → recency decides
  const raw = Math.max(0, Math.min(1, 1 - rolling / target))
  const maturity = Math.min(1, (age + 1) / Math.max(1, windowLen))
  return raw * maturity
}

export function scoreGoals(goals, byGoal, settings, today) {
  const w = Math.max(0, Math.min(1, (settings.recencyWeight ?? 50) / 100))

  return goals
    .filter((g) => !g.archived)
    .map((goal) => {
      const days = byGoal.get(goal.id)
      const stats = goalStats(goal, days, settings, today)
      const recency = recencySignal(stats.quietFor, settings.staleAfterDays)
      const deficit = deficitSignal(stats.rolling, stats.target, stats.age, stats.periodLength)
      const score = w * recency + (1 - w) * deficit
      return { goal, stats, recency, deficit, score }
    })
    .sort((a, b) => b.score - a.score || b.stats.quietFor - a.stats.quietFor)
}

/** The single goal to surface, or null when everything is genuinely on track. */
export function pickNudge(ranked) {
  if (ranked.length === 0) return null
  const top = ranked[0]
  if (top.score >= 0.2) return top
  // Nothing is slipping. But a goal you've never started still deserves the
  // spotlight — as an invitation, not an accusation.
  const unstarted = ranked.find((r) => r.stats.daysSince == null)
  if (unstarted) return { ...unstarted, fresh: true }
  // Everyone's active and on target — say so instead of manufacturing urgency.
  return null
}

/** Plain-English explanation of why this goal won. */
export function explainNudge({ goal, stats, recency, deficit, fresh }, settings) {
  const unit = unitFor(goal)
  const window = goal.cadence === 'month' ? 'month' : 'week'

  if (fresh) {
    return {
      lead: 'Nothing is slipping yet.',
      detail: `${goal.name} just hasn't been started — the first entry is the one that matters`,
      driver: 'fresh',
    }
  }

  const bits = []

  if (stats.daysSince == null) {
    bits.push("you haven't logged this one yet")
  } else if (stats.daysSince === 0) {
    bits.push('you logged it today')
  } else {
    bits.push(`last logged ${relativeDays(stats.daysSince)}`)
  }

  if (stats.target > 0) {
    const pct = Math.round((stats.rolling / stats.target) * 100)
    bits.push(`${pct}% of your ${window}ly target over the last ${stats.periodLength} days`)
  }

  const lead = recency >= deficit
    ? 'It has been quiet the longest.'
    : 'It is the furthest behind its target.'

  return {
    lead,
    detail: bits.join(' · '),
    driver: recency >= deficit ? 'recency' : 'deficit',
  }
}

/** A concrete, small ask — the amount that would put this goal back on pace. */
export function suggestedAction(goal, stats) {
  const unit = unitFor(goal)
  if (!stats.target || stats.target <= 0) {
    return `Log a session of ${goal.name}`
  }
  const gap = Math.max(0, stats.target - stats.rolling)
  if (gap <= 0) return `Keep ${goal.name} ticking over`
  // Ask for a bite-sized slice, not the whole gap — a nudge, not a guilt trip.
  const bite = Math.max(unit.step, Math.min(gap, stats.target / 4))
  const rounded = unit.precision === 0
    ? Math.max(1, Math.round(bite))
    : Math.round(bite * 2) / 2
  return `${withUnit(rounded, unit)} today gets you moving again`
}

/** Goals that are quietly fine — used for the "all caught up" state. */
export function healthyCount(ranked) {
  return ranked.filter((r) => r.score < 0.35).length
}
