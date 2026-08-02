/* Goal / entry shapes, unit presets, and the categorical color slots. */

/* The eight validated categorical slots, in fixed order. A goal keeps its slot
   for life — color follows the entity, never its position in a list. */
export const COLOR_SLOTS = [
  { slot: 1, name: 'Blue' },
  { slot: 2, name: 'Orange' },
  { slot: 3, name: 'Aqua' },
  { slot: 4, name: 'Yellow' },
  { slot: 5, name: 'Magenta' },
  { slot: 6, name: 'Green' },
  { slot: 7, name: 'Violet' },
  { slot: 8, name: 'Red' },
]

export const colorVar = (slot) => `var(--series-${((slot - 1) % 8) + 1})`

/* Unit presets. `step` drives the quick-log stepper; `precision` how values
   render. Anything here can be overridden per goal, including a custom unit. */
export const UNIT_PRESETS = [
  { id: 'hours',    label: 'Hours',     one: 'hour',    many: 'hours',    abbr: 'h',    step: 0.5, precision: 1 },
  { id: 'minutes',  label: 'Minutes',   one: 'minute',  many: 'minutes',  abbr: 'min',  step: 15,  precision: 0 },
  { id: 'sessions', label: 'Sessions',  one: 'session', many: 'sessions', abbr: '',     step: 1,   precision: 0 },
  { id: 'projects', label: 'Projects',  one: 'project', many: 'projects', abbr: '',     step: 1,   precision: 0 },
  { id: 'pages',    label: 'Pages',     one: 'page',    many: 'pages',    abbr: 'pp',   step: 5,   precision: 0 },
  { id: 'words',    label: 'Words',     one: 'word',    many: 'words',    abbr: 'w',    step: 100, precision: 0 },
  { id: 'problems', label: 'Problems',  one: 'problem', many: 'problems', abbr: '',     step: 1,   precision: 0 },
  { id: 'reps',     label: 'Reps',      one: 'rep',     many: 'reps',     abbr: '',     step: 5,   precision: 0 },
  { id: 'km',       label: 'Kilometres',one: 'km',      many: 'km',       abbr: 'km',   step: 1,   precision: 1 },
  { id: 'miles',    label: 'Miles',     one: 'mile',    many: 'miles',    abbr: 'mi',   step: 1,   precision: 1 },
  { id: 'lessons',  label: 'Lessons',   one: 'lesson',  many: 'lessons',  abbr: '',     step: 1,   precision: 0 },
  { id: 'custom',   label: 'Custom…',   one: 'unit',    many: 'units',    abbr: '',     step: 1,   precision: 0 },
]

export const EMOJI_CHOICES = [
  '🎯', '📚', '💻', '🗣️', '🎸', '🏃', '🧘', '✍️', '🎨', '🧪',
  '💪', '🍳', '📷', '🌱', '🧠', '💤', '🎹', '📈', '🗂️', '🕯️',
]

export function unitFor(goal) {
  const preset = UNIT_PRESETS.find((u) => u.id === goal.unitId) || UNIT_PRESETS[0]
  return {
    ...preset,
    ...(goal.unitId === 'custom' ? { one: goal.unitOne || 'unit', many: goal.unitMany || 'units', abbr: '' } : {}),
    step: goal.unitStep ?? preset.step,
    precision: goal.unitPrecision ?? preset.precision,
  }
}

export function formatAmount(value, unit) {
  const n = Number(value) || 0
  const fixed = n.toFixed(unit.precision)
  const trimmed = unit.precision > 0 ? String(parseFloat(fixed)) : fixed
  return Number(trimmed).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: unit.precision,
  })
}

export function unitWord(value, unit) {
  return Math.abs(Number(value)) === 1 ? unit.one : unit.many
}

/** "12.5 hours" — the value with its unit spelled out. */
export function withUnit(value, unit) {
  return `${formatAmount(value, unit)} ${unitWord(value, unit)}`
}

export function newGoal(index = 0) {
  return {
    id: crypto.randomUUID(),
    name: '',
    emoji: EMOJI_CHOICES[index % EMOJI_CHOICES.length],
    colorSlot: (index % 8) + 1,
    unitId: 'hours',
    unitOne: '',
    unitMany: '',
    unitStep: null,
    unitPrecision: null,
    cadence: 'week',
    target: 5,
    why: '',
    archived: false,
    createdAt: new Date().toISOString(),
  }
}

export function newEntry(goalId, dateKey, amount, note = '') {
  return {
    id: crypto.randomUUID(),
    goalId,
    date: dateKey,
    amount: Number(amount) || 0,
    note,
    loggedAt: new Date().toISOString(),
  }
}

export const DEFAULT_SETTINGS = {
  theme: 'system',       // 'system' | 'light' | 'dark'
  weekStart: 1,          // 0 Sun, 1 Mon
  recencyWeight: 50,     // 0–100; deficit weight is the complement
  staleAfterDays: 4,     // a goal starts feeling neglected after this long
  heatmapWeeks: 27,
  showTables: false,
}
