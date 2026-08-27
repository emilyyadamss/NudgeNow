/* Local-date helpers. Everything is keyed 'YYYY-MM-DD' in the user's own
   timezone — no UTC shifting, so "today" always means today where you are. */

const pad = (n) => String(n).padStart(2, '0')

export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey() {
  return toKey(new Date())
}

/** An ISO timestamp → the day key it fell on *here*. Slicing the string
    instead would hand back the UTC day, which is tomorrow for anyone west of
    Greenwich in the evening. */
export function dayKeyOf(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d) ? null : toKey(d)
}

export function addDays(key, n) {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

/** Whole days from a → b (b later ⇒ positive). */
export function daysBetween(a, b) {
  const ms = fromKey(b).getTime() - fromKey(a).getTime()
  return Math.round(ms / 86400000)
}

/** weekStart: 0 = Sunday, 1 = Monday */
export function startOfWeek(key, weekStart = 1) {
  const d = fromKey(key)
  const shift = (d.getDay() - weekStart + 7) % 7
  d.setDate(d.getDate() - shift)
  return toKey(d)
}

export function startOfMonth(key) {
  const [y, m] = key.split('-')
  return `${y}-${m}-01`
}

/** Bucket a date into the period it belongs to; returns the period's first day. */
export function periodStart(key, cadence, weekStart = 1) {
  return cadence === 'month' ? startOfMonth(key) : startOfWeek(key, weekStart)
}

export function periodLength(cadence, startKey) {
  if (cadence !== 'month') return 7
  const d = fromKey(startKey)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

/** List of period-start keys covering [from, to], oldest first. */
export function periodRange(from, to, cadence, weekStart = 1) {
  const out = []
  let cur = periodStart(from, cadence, weekStart)
  const end = periodStart(to, cadence, weekStart)
  let guard = 0
  while (cur <= end && guard++ < 1000) {
    out.push(cur)
    cur = cadence === 'month'
      ? startOfMonth(addDays(cur, periodLength('month', cur)))
      : addDays(cur, 7)
  }
  return out
}

export function dayRange(from, to) {
  const out = []
  let cur = from
  let guard = 0
  while (cur <= to && guard++ < 4000) {
    out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function formatShort(key) {
  const d = fromKey(key)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function formatLong(key) {
  const d = fromKey(key)
  return `${DAY_NAMES[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/** An ISO timestamp → the clock time it was written, in the user's locale.
    Entries are keyed by day; this is only ever a tie-breaker for the eye when
    several land on the same one. */
export function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d) ? '' : d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function monthLabel(key) {
  return MONTHS[fromKey(key).getMonth()]
}

export function formatPeriod(key, cadence) {
  if (cadence === 'month') {
    const d = fromKey(key)
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  }
  return `Week of ${formatShort(key)}`
}

/** "today" / "yesterday" / "5 days ago" / "never" */
export function relativeDays(days) {
  if (days == null) return 'never'
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 60) return 'a month ago'
  return `${Math.round(days / 30)} months ago`
}
