/* Sample data, so the charts have something to say on a first look.
   Generated relative to today and fully deletable from Settings. */

import { todayKey, addDays, fromKey } from './date.js'
import { newEntry, newTask, STATUS, DEFAULT_REVISIT_EVERY } from './model.js'

const GOALS = [
  { name: 'Japanese', emoji: '🗣️', colorSlot: 1, unitId: 'hours',    cadence: 'week',  target: 5,
    category: 'Learning',
    why: 'Hold a real conversation on the next trip.',   density: 0.55, size: [0.5, 1.5],
    tasks: [['Finish Genki chapter 4', 1.5], ['Shadow three podcast episodes', 1], ['Book a tutor session', 1]] },
  { name: 'Side projects', emoji: '💻', colorSlot: 2, unitId: 'hours', cadence: 'week', target: 8,
    category: 'Creative',
    why: 'Ship something small every month.',            density: 0.42, size: [1, 3] },
  { name: 'Reading', emoji: '📚', colorSlot: 3, unitId: 'pages',      cadence: 'week',  target: 150,
    category: 'Learning',
    why: 'Two books a month.',                           density: 0.60, size: [10, 45],
    tasks: [['Finish part two of the current book', 80], ['Return library books', 0]] },
  { name: 'Running', emoji: '🏃', colorSlot: 4, unitId: 'km',         cadence: 'week',  target: 20,
    category: 'Health',
    why: 'Half marathon in the spring.',                 density: 0.34, size: [3, 9] },
  { name: 'Piano', emoji: '🎹', colorSlot: 5, unitId: 'minutes',      cadence: 'week',  target: 150,
    category: 'Creative',
    why: 'Relearn the pieces I used to know.',           density: 0.14, size: [20, 45],
    tasks: [['Scales for 10 minutes', 10], ['Run through the Chopin prelude', 20], ['Get the piano tuned', 0]] },

  /* Two finished goals, so both endings are visible on a first look: one kept
     warm on a revisit interval (and deliberately overdue), one archived. */
  { name: 'Touch typing', emoji: '⌨️', colorSlot: 6, unitId: 'sessions', cadence: 'week', target: 3,
    category: 'Learning',
    why: 'Stop looking at the keyboard.',                density: 0.5,  size: [1, 2],
    status: STATUS.REVISIT, revisitEvery: 30, finishedDaysAgo: 47 },
  { name: 'Driving lessons', emoji: '🚗', colorSlot: 7, unitId: 'lessons', cadence: 'week', target: 2,
    category: 'Personal',
    why: 'Pass the test before the summer.',             density: 0.28, size: [1, 1],
    status: STATUS.DONE, finishedDaysAgo: 62 },
]

/* A tiny seeded PRNG keeps the sample stable-ish and avoids a jarring
   all-different dataset every reload. */
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export function buildSample() {
  const goals = []
  const entries = []
  const tasks = []
  const today = todayKey()

  GOALS.forEach((g, gi) => {
    const id = crypto.randomUUID()
    const status = g.status || STATUS.ACTIVE
    const completedAt = g.finishedDaysAgo
      ? fromKey(addDays(today, -g.finishedDaysAgo)).toISOString()
      : null
    goals.push({
      id,
      name: g.name,
      category: g.category,
      emoji: g.emoji,
      colorSlot: g.colorSlot,
      unitId: g.unitId,
      unitOne: '', unitMany: '', unitStep: null, unitPrecision: null,
      cadence: g.cadence,
      target: g.target,
      why: g.why,
      status,
      archived: status === STATUS.DONE,
      revisitEvery: g.revisitEvery ?? DEFAULT_REVISIT_EVERY,
      completedAt,
      createdAt: new Date().toISOString(),
    })

    const rand = rng(9871 + gi * 613)
    // Piano tails off deliberately — it becomes the goal that needs the nudge.
    const fadeOut = g.name === 'Piano'

    for (let back = 180; back >= 0; back--) {
      const recency = 1 - back / 180
      let chance = g.density * (0.65 + 0.5 * recency)
      if (fadeOut && back < 24) chance = 0
      // A finished goal stops logging when it was finished.
      if (g.finishedDaysAgo && back < g.finishedDaysAgo) chance = 0
      if (rand() > chance) continue
      const [lo, hi] = g.size
      const amount = lo + rand() * (hi - lo)
      const rounded = g.unitId === 'hours' ? Math.round(amount * 2) / 2
        : g.unitId === 'km' ? Math.round(amount * 10) / 10
        : Math.round(amount)
      if (rounded <= 0) continue
      entries.push(newEntry(id, addDays(today, -back), rounded))
    }

    // Sample steps all start open — nothing here claims progress you didn't make.
    ;(g.tasks || []).forEach(([title, amount], ti) => {
      tasks.push(newTask(id, title, amount, ti))
    })
  })

  return { goals, entries, tasks }
}
