import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Dashboard from './views/Dashboard.jsx'
import GoalDetail from './views/GoalDetail.jsx'
import SettingsView from './views/SettingsView.jsx'
import GoalEditor from './components/GoalEditor.jsx'
import LogModal from './components/LogModal.jsx'
import { load, save } from './lib/storage.js'
import { buildSample } from './lib/sample.js'
import { colorVar, newGoal, newEntry, unitFor, formatAmount, unitWord, DEFAULT_SETTINGS } from './lib/model.js'
import { indexEntries } from './lib/stats.js'
import { scoreGoals, pickNudge } from './lib/nudge.js'
import { todayKey } from './lib/date.js'

export default function App() {
  const [state, setState] = useState(load)
  const [view, setView] = useState({ name: 'dashboard' })
  const [editing, setEditing] = useState(null)     // { goal, isNew }
  const [logging, setLogging] = useState(null)     // { goalId, date }
  const [cycle, setCycle] = useState(0)
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  const { goals, entries, settings } = state

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
  const activeGoals = useMemo(() => goals.filter((g) => !g.archived), [goals])
  const archived = useMemo(() => goals.filter((g) => g.archived), [goals])
  const ranked = useMemo(
    () => scoreGoals(goals, byGoal, settings, todayKey()),
    [goals, byGoal, settings],
  )
  const top = useMemo(() => pickNudge(ranked), [ranked])
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
    }))
    setEditing(null)
    setView({ name: 'dashboard' })
    toast('Goal deleted')
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

  const deleteEntry = useCallback((id) => {
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }))
    toast('Entry removed')
  }, [toast])

  const openNewGoal = useCallback(() => {
    setEditing({ goal: newGoal(goals.length), isNew: true })
  }, [goals.length])

  const openLog = useCallback((goalId, date) => {
    if (activeGoals.length === 0) { openNewGoal(); return }
    setLogging({ goalId: goalId || activeGoals[0].id, date })
  }, [activeGoals, openNewGoal])

  /* ------------------------------------------------------------- shortcuts */
  useEffect(() => {
    const onKey = (e) => {
      if (editing || logging) return
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
  }, [editing, logging, view, openNewGoal, openLog])

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

        {activeGoals.length > 0 && <div className="nav-label">Goals</div>}
        {ranked.map(({ goal, stats }) => (
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

        {archived.length > 0 && (
          <>
            <div className="nav-label">Archived</div>
            {archived.map((goal) => (
              <button
                key={goal.id}
                className="nav-item"
                style={{ '--goal-color': 'var(--text-muted)' }}
                aria-current={view.name === 'goal' && view.goalId === goal.id}
                onClick={() => setView({ name: 'goal', goalId: goal.id })}
              >
                <span className="dot" />
                <span className="nav-name">{goal.name}</span>
              </button>
            ))}
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
                  {activeGoals.length > 0
                    ? 'One goal gets your attention. The rest keep their place.'
                    : 'Let’s get your goals in.'}
                </p>
              </div>
              {activeGoals.length > 0 && (
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
              ranked={ranked}
              pick={pick}
              cycled={cycle > 0}
              settings={settings}
              onLog={openLog}
              onOpen={(id) => setView({ name: 'goal', goalId: id })}
              onCycle={() => setCycle((c) => (c > 0 ? 0 : 1))}
              onNewGoal={openNewGoal}
            />
          </>
        )}

        {view.name === 'goal' && currentGoal && (
          <GoalDetail
            goal={currentGoal}
            entries={entries}
            days={byGoal.get(currentGoal.id)}
            settings={settings}
            onEdit={(g) => setEditing({ goal: g, isNew: false })}
            onLog={openLog}
            onDeleteEntry={deleteEntry}
            onBack={() => setView({ name: 'dashboard' })}
          />
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
              const { goals: g, entries: e } = buildSample()
              setState((s) => ({ ...s, goals: g, entries: e }))
              setView({ name: 'dashboard' })
              toast('Sample data loaded')
            }}
            onClearAll={() => {
              setState({ goals: [], entries: [], settings: { ...DEFAULT_SETTINGS, theme: settings.theme } })
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
          onSave={saveGoal}
          onDelete={deleteGoal}
          onClose={() => setEditing(null)}
        />
      )}

      {logging && (
        <LogModal
          goals={activeGoals}
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
