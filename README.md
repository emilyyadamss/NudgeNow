# NudgeNow

A goal tracker built around one problem: you fall into one goal and forget the
others. NudgeNow watches which goals go quiet, and each day points you at the one
that's slipping — with a heatmap and progress chart per goal so you can see it,
not just be told it.

```bash
npm install
npm run dev
```

Everything is stored in your browser's `localStorage`. No account, no server,
nothing leaves the machine. Settings → **Export backup** writes a JSON file you
can re-import later.

First run is empty. Settings → **Load sample data** fills it with five plausible
goals and six months of history if you'd rather see the charts before typing
anything in.

## How the nudge decides

Two independent signals per goal, blended by a slider in Settings:

| Signal | What it measures |
|---|---|
| **Recency** | Days since you last logged, on a saturating curve — so "12 days" and "40 days" both read as very stale without one ancient goal permanently owning the nudge. The curve's midpoint is the *"starts feeling neglected after N days"* setting. |
| **Deficit** | How far under target you are across a rolling window the length of the goal's own cadence. Unit-free (a fraction of target), so hours, projects, and pages compete fairly. |

```
score = w · recency  +  (1 − w) · deficit
```

`w` is the Settings slider — all the way left is pure "furthest behind target",
all the way right is pure "longest neglected", and the middle means a goal has to
be *both* quiet and behind to reach the top. The Settings page shows the live
ranking with your current weights, so you can see the effect as you drag.

A rolling window is used rather than the calendar week on purpose: a calendar
week resets to zero every Monday and would claim you're 100% behind on Monday
morning.

When every goal is fresh and near target, the nudge card says so instead of
manufacturing something to worry about.

## What each goal tracks

Goals are measured in **your** unit — hours, projects, pages, km, reps, lessons,
or a custom one you name — with a target per week or per month. Language learning
in hours and coding in projects sit side by side and are still comparable, because
the cross-goal view indexes each to its own target.

Per goal you get:

- **Progress chart** — weekly/monthly totals against your target line, or a
  cumulative view, over 3M / 6M / 1Y.
- **Consistency heatmap** — up to a year of days, darker for bigger days.
  Click any square to log against that date.
- Streak, all-time total, pace against this period's target, and an editable
  entry log.

And across all goals, on **Today**:

- The nudge card, with the reason it picked that goal and a bite-sized ask.
- **Balance across goals** — every goal on one axis as a share of its own target,
  lowest first. This is the direct answer to "which one am I neglecting?"
- **Attention balance** (0–100) — normalised entropy of how your effort is spread.
  100 means perfectly even; low means one goal is eating everything.
- A cross-goal heatmap of how many different goals you touched each day.

## Customisation

- Name, icon, colour, unit, target, and cadence per goal — all editable after the fact.
- Custom units with your own singular/plural and decimal precision.
- Nudge weighting and the staleness threshold.
- Light / dark / system theme, week starting Monday or Sunday, heatmap length.
- Archive goals to park them without losing their history.
- Data tables under every chart (Settings → *Show data tables*).

## Keyboard

| Key | Action |
|---|---|
| `N` | New goal |
| `L` | Log progress |
| `G` | Back to Today |
| `,` | Settings |
| `⌘↵` | Save, from inside the log dialog |
| `Esc` | Close a dialog |

## Layout

```
src/
  lib/
    date.js      local-date helpers, week/month bucketing
    model.js     goal & entry shapes, unit presets, colour slots
    stats.js     streaks, rolling totals, per-period series, balance score
    nudge.js     the scoring engine
    chart.js     axis ticks, mark paths, resize hook
    storage.js   localStorage + export/import
    sample.js    the demo dataset
  components/    Heatmap, ProgressChart, BalanceBars, Sparkline, cards, modals
  views/         Dashboard, GoalDetail, SettingsView
```

Charts are hand-drawn SVG — no charting dependency. The eight goal colours are a
colourblind-validated categorical set with separately-chosen dark-mode steps; every
chart also has a table view, and goals are direct-labelled so identity never rests
on colour alone.
