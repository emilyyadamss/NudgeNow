import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Dashboard from './views/Dashboard.jsx'
import GoalDetail from './views/GoalDetail.jsx'
import SettingsView from './views/SettingsView.jsx'
import ArchiveView from './views/ArchiveView.jsx'
import GoalEditor from './components/GoalEditor.jsx'
import LogModal from './components/LogModal.jsx'
import CompleteModal from './components/CompleteModal.jsx'
import { load, save } from './lib/storage.js'
import { buildSample } from './lib/sample.js'
import {
  colorVar, newGoal, newEntry, newTask, indexTasks, reopenTask, unitFor, formatAmount, unitWord,
  DEFAULT_SETTINGS, groupByCategory, categoryLabel, STATUS, isActive, isRevisit, isDone,
  inPlay, statusOf, withStatus, revisitLabel, withUnit,
} from './lib/model.js'
import { goalStats } from './lib/stats.js'
import { indexEntries } from './lib/stats.js'
import { scoreGoals, pickNudge } from './lib/nudge.js'
import { todayKey } from './lib/date.js'

export default function App() {
  const [state, setState] = useState(load)
  const [view, setView] = useState({ name: 'dashboard' })
  const [editing, setEditing] = useState(null)     // { goal, isNew }
  const [logging, setLogging] = useState(null)     // { goalId, date }
  const [finishing, setFinishing] = useState(null) // { goal, intent }
  const [cycle, setCycle] = useState(0)
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  const { goals, entries, settings } = state
  // Older saves (and backups written before task lists existed) simply have none.
  const tasks = state.tasks || []

  /* ------------------------------------------------------------ persistence */
  useEffect(() => { save(state) }, [state])

  /* ----------------------------------------------------------------- theme */
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  /* ---------------------------------------------------------------- toasts */
  const toast = useCallback((message) => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  /* ------------------------------------------------------------- derived */
  const byGoal = useMemo(() => indexEntries(entries), [entries])
  const byTask = useMemo(() => indexTasks(tasks), [tasks])
  const activeGoals = useMemo(() => goals.filter(isActive), [goals])
  const revisitGoals = useMemo(() => goals.filter(isRevisit), [goals])
  const archived = useMemo(() => goals.filter(isDone), [goals])
  // Anything you can still log against: active goals and goals in revisit.
  const loggable = useMemo(() => goals.filter(inPlay), [goals])
  const ranked = useMemo(
    () => scoreGoals(goals, byGoal, settings, todayKey()),
    [goals, byGoal, settings],
  )
  const rankedActive = useMemo(() => ranked.filter((r) => r.mode === 'active'), [ranked])
  const rankedRevisit = useMemo(() => ranked.filter((r) => r.mode === 'revisit'), [ranked])
  const dueRevisit = useMemo(() => rankedRevisit.filter((r) => r.revisit.due), [rankedRevisit])
  const top = useMemo(() => pickNudge(ranked), [ranked])
  // Sidebar groups by category; within each group the neediest goal stays first,
  // since `ranked` is already score-ordered. Revisit goals get their own group.
  const navGroups = useMemo(() => groupByCategory(rankedActive, (r) => r.goal), [rankedActive])
  const pick = cycle > 0 && ranked.length > 0 ? ranked[cycle % ranked.length] : top

  /* ------------------------------------------------------------- mutations */
  const setSettings = useCallback((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [])

  const saveGoal = useCallback((goal) => {
    setState((s) => {
      const exists = s.goals.some((g) => g.id === goal.id)
      return { ...s, goals: exists ? s.goals.map((g) => (g.id === goal.id ? goal : g)) : [...s.goals, goal] }
    })
    setEditing(null)
    toast(`Saved ${goal.name}`)
  }, [toast])

  const deleteGoal = useCallback((id) => {
    setState((s) => ({
      ...s,
      goals: s.goals.filter((g) => g.id !== id),
      entries: s.entries.filter((e) => e.goalId !== id),
      tasks: (s.tasks || []).filter((t) => t.goalId !== id),
    }))
    setEditing(null)
    setView({ name: 'dashboard' })
    toast('Goal deleted')
  }, [toast])

  /* Completing a goal is one decision with two endings: file it away, or keep
     it in revisit so it still gets tapped on a long interval. Either way the
     goal and its entries stay exactly as they were. */
  const finishGoal = useCallback((id, { status, revisitEvery }) => {
    let name = ''
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) => {
        if (g.id !== id) return g
        name = g.name
        return withStatus(g, status, { revisitEvery })
      }),
    }))
    setFinishing(null)
    toast(status === STATUS.REVISIT
      ? `${name} moved to revisit — ${revisitLabel(revisitEvery).toLowerCase()}`
      : `${name} archived`)
  }, [toast])

  const reactivateGoal = useCallback((id) => {
    let name = ''
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) => {
        if (g.id !== id) return g
        name = g.name
        return withStatus(g, STATUS.ACTIVE)
      }),
    }))
    toast(`${name} is active again`)
  }, [toast])

  const addEntry = useCallback(({ goalId, date, amount, note }) => {
    setState((s) => ({ ...s, entries: [...s.entries, newEntry(goalId, date, amount, note)] }))
    setLogging(null)
    setCycle(0)
    const g = goals.find((x) => x.id === goalId)
    if (g) {
      const u = unitFor(g)
      toast(`Logged ${formatAmount(amount, u)} ${unitWord(amount, u)} of ${g.name}`)
    }
  }, [goals, toast])

  /* Deleting an entry that came from a ticked-off step reopens that step —
     otherwise the checkbox would claim credit for progress no longer there. */
  const deleteEntry = useCallback((id) => {
    setState((s) => {
      const entry = s.entries.find((e) => e.id === id)
      return {
        ...s,
        entries: s.entries.filter((e) => e.id !== id),
        tasks: entry?.taskId
          ? (s.tasks || []).map((t) => (t.id === entry.taskId ? reopenTask(t) : t))
          : s.tasks || [],
      }
    })
    toast('Entry removed')
  }, [toast])

  /* ----------------------------------------------------------------- tasks */

  const addTask = useCallback(({ goalId, title, amount }) => {
    setState((s) => {
      const list = s.tasks || []
      const order = list.filter((t) => t.goalId === goalId).length
      return { ...s, tasks: [...list, newTask(goalId, title, amount, order)] }
    })
  }, [])

  /* Ticking a step off is just logging: it writes an ordinary entry for today,
     stamped with the step that produced it. Unticking deletes exactly that
     entry and nothing else, so the goal's totals stay honest in both
     directions. A step worth 0 is checked off without touching the numbers. */
  const toggleTask = useCallback((id) => {
    let message = ''
    setState((s) => {
      const task = (s.tasks || []).find((t) => t.id === id)
      if (!task) return s
      if (task.done) {
        message = `“${task.title}” is open again`
        return {
          ...s,
          entries: task.entryId ? s.entries.filter((e) => e.id !== task.entryId) : s.entries,
          tasks: s.tasks.map((t) => (t.id === id ? reopenTask(t) : t)),
        }
      }
      const goal = s.goals.find((g) => g.id === task.goalId)
      const worth = Math.max(0, Number(task.amount) || 0)
      const entry = worth > 0 ? newEntry(task.goalId, todayKey(), worth, task.title, task.id) : null
      message = entry && goal
        ? `“${task.title}” done — ${withUnit(worth, unitFor(goal))} on ${goal.name}`
        : `“${task.title}” done`
      return {
        ...s,
        entries: entry ? [...s.entries, entry] : s.entries,
        tasks: s.tasks.map((t) => (t.id === id
          ? { ...t, done: true, entryId: entry?.id || null, completedAt: new Date().toISOString() }
          : t)),
      }
    })
    setCycle(0)
    if (message) toast(message)
  }, [toast])

  /* Deleting a finished step keeps the entry it logged. The work happened;
     only the to-do item goes. */
  const deleteTask = useCallback((id) => {
    let logged = false
    setState((s) => {
      const task = (s.tasks || []).find((t) => t.id === id)
      logged = !!task?.entryId
      return {
        ...s,
        tasks: (s.tasks || []).filter((t) => t.id !== id),
        entries: task?.entryId
          ? s.entries.map((e) => (e.id === task.entryId ? { ...e, taskId: null } : e))
          : s.entries,
      }
    })
    toast(logged ? 'Step removed — the progress it logged stays' : 'Step removed')
  }, [toast])

  const openNewGoal = useCallback(() => {
    setEditing({ goal: newGoal(goals.length), isNew: true })
  }, [goals.length])

  const openLog = useCallback((goalId, date) => {
    if (loggable.length === 0) { openNewGoal(); return }
    const target = goalId && loggable.some((g) => g.id === goalId) ? goalId : loggable[0].id
    setLogging({ goalId: target, date })
  }, [loggable, openNewGoal])

  /* ------------------------------------------------------------- shortcuts */
  useEffect(() => {
    const onKey = (e) => {
      if (editing || logging || finishing) return
      const t = e.target
      if (t instanceof HTMLElement && /input|textarea|select/i.test(t.tagName)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'n') { e.preventDefault(); openNewGoal() }
      if (e.key === 'l') { e.preventDefault(); openLog(view.name === 'goal' ? view.goalId : undefined) }
      if (e.key === 'g') { e.preventDefault(); setView({ name: 'dashboard' }) }
      if (e.key === ',') { e.preventDefault(); setView({ name: 'settings' }) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, logging, finishing, view, openNewGoal, openLog])

  const currentGoal = view.name === 'goal' ? goals.find((g) => g.id === view.goalId) : null

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="8" cy="8" r="3" fill="currentColor" />
            </svg>
          </span>
          NudgeNow
        </div>

        <button
          className="nav-item"
          aria-current={view.name === 'dashboard'}
          onClick={() => setView({ name: 'dashboard' })}
        >
          <span aria-hidden="true">◎</span>
          <span className="nav-name">Today</span>
        </button>

        {navGroups.map(([category, items]) => (
          <div key={category || '_none'} style={{ display: 'contents' }}>
            <div className="nav-label">
              {navGroups.length === 1 && !category ? 'Goals' : categoryLabel(category)}
            </div>
            {items.map(({ goal, stats }) => (
              <button
                key={goal.id}
                className="nav-item"
                style={{ '--goal-color': colorVar(goal.colorSlot) }}
                aria-current={view.name === 'goal' && view.goalId === goal.id}
                onClick={() => setView({ name: 'goal', goalId: goal.id })}
              >
                <span className="dot" />
                <span className="nav-name">{goal.name}</span>
                <span className="nav-meta">
                  {stats.daysSince == null ? '—' : stats.daysSince === 0 ? 'today' : `${stats.daysSince}d`}
                </span>
              </button>
            ))}
          </div>
        ))}

        {rankedRevisit.length > 0 && (
          <>
            <div className="nav-label">Revisit</div>
            {rankedRevisit.map(({ goal, revisit }) => (
              <button
                key={goal.id}
                className="nav-item"
                style={{ '--goal-color': colorVar(goal.colorSlot) }}
                aria-current={view.name === 'goal' && view.goalId === goal.id}
                onClick={() => setView({ name: 'goal', goalId: goal.id })}
              >
                <span className="dot" />
                <span className="nav-name">{goal.name}</span>
                <span className="nav-meta">{revisit.due ? 'due' : `${revisit.dueIn}d`}</span>
              </button>
            ))}
          </>
        )}

        {archived.length > 0 && (
          <>
            <div className="nav-label">Archive</div>
            <button
              className="nav-item"
              aria-current={view.name === 'archive'}
              onClick={() => setView({ name: 'archive' })}
            >
              <span aria-hidden="true">📦</span>
              <span className="nav-name">Completed</span>
              <span className="nav-meta">{archived.length}</span>
            </button>
          </>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 16, display: 'grid', gap: 4 }}>
          <button className="nav-item" onClick={openNewGoal}>
            <span aria-hidden="true">＋</span>
            <span className="nav-name">New goal</span>
            <span className="nav-meta">N</span>
          </button>
          <button
            className="nav-item"
            aria-current={view.name === 'settings'}
            onClick={() => setView({ name: 'settings' })}
          >
            <span aria-hidden="true">⚙</span>
            <span className="nav-name">Settings</span>
            <span className="nav-meta">,</span>
          </button>
        </div>
      </aside>

      <main className="main" key={view.name + (view.goalId || '')}>
        {view.name === 'dashboard' && (
          <>
            <div className="page-head">
              <div>
                <h1 className="page-title">Today</h1>
                <p className="page-sub">
                  {loggable.length === 0
                    ? 'Let’s get your goals in.'
                    : dueRevisit.length > 0
                      ? `One goal gets your attention. ${dueRevisit.length} finished ${dueRevisit.length === 1 ? 'goal is' : 'goals are'} due for practice.`
                      : 'One goal gets your attention. The rest keep their place.'}
                </p>
              </div>
              {loggable.length > 0 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={openNewGoal}>+ New goal</button>
                  <button className="btn btn-primary" onClick={() => openLog()}>Log progress</button>
                </div>
              )}
            </div>
            <Dashboard
              goals={activeGoals}
              entries={entries}
              byGoal={byGoal}
              byTask={byTask}
              ranked={rankedActive}
              revisit={rankedRevisit}
              pool={ranked}
              pick={pick}
              cycled={cycle > 0}
              settings={settings}
              onLog={openLog}
              onOpen={(id) => setView({ name: 'goal', goalId: id })}
              onCycle={() => setCycle((c) => (c > 0 ? 0 : 1))}
              onNewGoal={openNewGoal}
              onComplete={(goal) => setFinishing({ goal, intent: 'complete' })}
              onToggleTask={toggleTask}
            />
          </>
        )}

        {view.name === 'goal' && currentGoal && (
          <GoalDetail
            goal={currentGoal}
            entries={entries}
            days={byGoal.get(currentGoal.id)}
            tasks={byTask.get(currentGoal.id)}
            settings={settings}
            onEdit={(g) => setEditing({ goal: g, isNew: false })}
            onLog={openLog}
            onDeleteEntry={deleteEntry}
            onBack={() => setView({ name: statusOf(currentGoal) === STATUS.DONE ? 'archive' : 'dashboard' })}
            onComplete={(g) => setFinishing({ goal: g, intent: 'complete' })}
            onRevisit={(g) => setFinishing({ goal: g, intent: 'revisit' })}
            onReactivate={reactivateGoal}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
          />
        )}

        {view.name === 'archive' && (
          <>
            <div className="page-head">
              <div>
                <h1 className="page-title">Archive</h1>
                <p className="page-sub">
                  {archived.length} finished {archived.length === 1 ? 'goal' : 'goals'} · nothing here is
                  nudged, and nothing is lost
                </p>
              </div>
              <button className="btn" onClick={() => setView({ name: 'dashboard' })}>← Today</button>
            </div>
            <ArchiveView
              goals={archived}
              byGoal={byGoal}
              settings={settings}
              onOpen={(id) => setView({ name: 'goal', goalId: id })}
              onReactivate={reactivateGoal}
              onRevisit={(g) => setFinishing({ goal: g, intent: 'revisit' })}
              onBack={() => setView({ name: 'dashboard' })}
            />
          </>
        )}

        {view.name === 'goal' && !currentGoal && (
          <div className="empty">
            <h3>That goal is gone</h3>
            <button className="btn" onClick={() => setView({ name: 'dashboard' })}>Back to today</button>
          </div>
        )}

        {view.name === 'settings' && (
          <SettingsView
            settings={settings}
            setSettings={setSettings}
            state={state}
            ranked={ranked}
            toast={toast}
            onImport={(next) => { setState(next); toast('Backup restored'); setView({ name: 'dashboard' }) }}
            onLoadSample={() => {
              const { goals: g, entries: e, tasks: t } = buildSample()
              setState((s) => ({ ...s, goals: g, entries: e, tasks: t }))
              setView({ name: 'dashboard' })
              toast('Sample data loaded')
            }}
            onClearAll={() => {
              setState({ goals: [], entries: [], tasks: [], settings: { ...DEFAULT_SETTINGS, theme: settings.theme } })
              setView({ name: 'dashboard' })
              toast('All data cleared')
            }}
          />
        )}
      </main>

      {editing && (
        <GoalEditor
          goal={editing.goal}
          isNew={editing.isNew}
          allGoals={goals}
          onSave={saveGoal}
          onDelete={deleteGoal}
          onClose={() => setEditing(null)}
        />
      )}

      {finishing && (
        <CompleteModal
          goal={finishing.goal}
          stats={goalStats(finishing.goal, byGoal.get(finishing.goal.id), settings, todayKey())}
          intent={finishing.intent}
          onConfirm={(choice) => finishGoal(finishing.goal.id, choice)}
          onClose={() => setFinishing(null)}
        />
      )}

      {logging && (
        <LogModal
          goals={loggable}
          goalId={logging.goalId}
          date={logging.date}
          onSave={addEntry}
          onClose={() => setLogging(null)}
        />
      )}

      <div className="toasts">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>{t.message}</div>
        ))}
      </div>
    </div>
  )
}
