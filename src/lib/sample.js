/* Sample data, so the charts have something to say on a first look.
   Generated relative to today and fully deletable from Settings. */

import { todayKey, addDays } from './date.js'
import { newEntry } from './model.js'

const GOALS = [
  { name: 'Japanese', emoji: '🗣️', colorSlot: 1, unitId: 'hours',    cadence: 'week',  target: 5,
    why: 'Hold a real conversation on the next trip.',   density: 0.55, size: [0.5, 1.5] },
  { name: 'Side projects', emoji: '💻', colorSlot: 2, unitId: 'hours', cadence: 'week', target: 8,
    why: 'Ship something small every month.',            density: 0.42, size: [1, 3] },
  { name: 'Reading', emoji: '📚', colorSlot: 3, unitId: 'pages',      cadence: 'week',  target: 150,
    why: 'Two books a month.',                           density: 0.60, size: [10, 45] },
  { name: 'Running', emoji: '🏃', colorSlot: 4, unitId: 'km',         cadence: 'week',  target: 20,
    why: 'Half marathon in the spring.',                 density: 0.34, size: [3, 9] },
  { name: 'Piano', emoji: '🎹', colorSlot: 5, unitId: 'minutes',      cadence: 'week',  target: 150,
    why: 'Relearn the pieces I used to know.',           density: 0.14, size: [20, 45] },
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
  const today = todayKey()

  GOALS.forEach((g, gi) => {
    const id = crypto.randomUUID()
    goals.push({
      id,
      name: g.name,
      emoji: g.emoji,
      colorSlot: g.colorSlot,
      unitId: g.unitId,
      unitOne: '', unitMany: '', unitStep: null, unitPrecision: null,
      cadence: g.cadence,
      target: g.target,
      why: g.why,
      archived: false,
      createdAt: new Date().toISOString(),
    })

    const rand = rng(9871 + gi * 613)
    // Piano tails off deliberately — it becomes the goal that needs the nudge.
    const fadeOut = g.name === 'Piano'

    for (let back = 180; back >= 0; back--) {
      const recency = 1 - back / 180
      let chance = g.density * (0.65 + 0.5 * recency)
      if (fadeOut && back < 24) chance = 0
      if (rand() > chance) continue
      const [lo, hi] = g.size
      const amount = lo + rand() * (hi - lo)
      const rounded = g.unitId === 'hours' ? Math.round(amount * 2) / 2
        : g.unitId === 'km' ? Math.round(amount * 10) / 10
        : Math.round(amount)
      if (rounded <= 0) continue
      entries.push(newEntry(id, addDays(today, -back), rounded))
    }
  })

  return { goals, entries }
}
