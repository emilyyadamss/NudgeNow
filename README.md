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
- A **category filter row**, scoping the board to Learning, Health, Creative, or
  whatever you name — see [Categories](#categories) below.
- **Attention balance** (0–100) — normalised entropy of how your effort is spread.
  100 means perfectly even; low means one goal is eating everything.
- A cross-goal heatmap of how many different goals you touched each day.

## Finishing a goal

A goal that's done shouldn't just be deleted, and it shouldn't keep nagging
either. Marking one complete asks a single question:

| Ending | What happens |
|---|---|
| **Archive** | Filed away with its full history. Never nudged, left out of every count, and one click from coming back. Lives under *Archive → Completed*. |
| **Revisit** | Finished, but kept warm. It leaves the target treadmill and is nudged only when its interval elapses — weekly through twice-yearly, or any number of days you type. |

Revisit exists for the things you *learned* rather than the things you're
grinding: a skill you worked for will quietly rust if nothing ever asks you to
touch it again. A revisit goal scores **zero** until its interval has passed, so
it never competes for daily attention; once due it enters just above the nudge
threshold and climbs from there, so something badly overdue eventually outranks
a merely quiet goal. Logging against it resets the clock.

Revisit goals get their own *Keeping it fresh* section on Today and their own
sidebar group showing the days until each is due. They sit out the attention
balance score — they're deliberately low-volume, and counting them would read as
lopsided when it's the intended shape.

Anything archived can be moved into revisit later, and anything in revisit can go
back to being fully active.

## Categories

Goals can carry a category — free text, with `Learning` / `Health` / `Creative` /
`Career` / `Personal` offered as starting suggestions. Type a new one in the goal
editor and it exists; every category already in use shows up as a one-tap chip.

Categories group the sidebar and the goal list, and add a filter row above the
board that scopes the stat tiles, the balance chart, and the cross-goal heatmap.

**The nudge deliberately stays global.** Scoring never looks at categories, and
the nudge card sits *above* the filter row — so narrowing the board to one
category can't hide a slipping goal from another. That would reintroduce exactly
the problem the app exists to solve.

Goals with no category collect under *Uncategorised*, always sorted last.

## Customisation

- Name, icon, colour, unit, target, and cadence per goal — all editable after the fact.
- Categories, created on the fly — see above.
- Custom units with your own singular/plural and decimal precision.
- Nudge weighting and the staleness threshold.
- Light / dark / system theme, week starting Monday or Sunday, heatmap length.
- Complete a goal into the archive, or into revisit on your own interval — see above.
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
    model.js     goal & entry shapes, lifecycle, unit presets, colour slots
    stats.js     streaks, rolling totals, per-period series, balance score
    nudge.js     the scoring engine
    chart.js     axis ticks, mark paths, resize hook
    storage.js   localStorage + export/import
    sample.js    the demo dataset
  components/    Heatmap, ProgressChart, BalanceBars, Sparkline, cards, modals
  views/         Dashboard, GoalDetail, ArchiveView, SettingsView
```

Charts are hand-drawn SVG — no charting dependency. The eight goal colours are a
colourblind-validated categorical set with separately-chosen dark-mode steps; every
chart also has a table view, and goals are direct-labelled so identity never rests
on colour alone.
