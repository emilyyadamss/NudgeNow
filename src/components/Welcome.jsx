import { CircleCheckBig, Scale, ListChecks, RotateCcw } from 'lucide-react'
import logoUrl from '../assets/logo.png'
import logoLightUrl from '../assets/logo-light.png'

const FEATURES = [
  {
    icon: CircleCheckBig,
    title: 'One nudge a day',
    body: 'Compassed watches which goals go quiet and points you at the one that’s slipping — not everything at once.',
  },
  {
    icon: Scale,
    title: 'See the imbalance',
    body: 'A balance view puts every goal on one axis, so it’s obvious at a glance which one is being neglected.',
  },
  {
    icon: ListChecks,
    title: 'Next steps, not vague targets',
    body: 'Break a goal into concrete steps worth a real amount. Tick one off and the progress logs itself.',
  },
  {
    icon: RotateCcw,
    title: 'Finished isn’t forgotten',
    body: 'Move a done goal to Revisit and it resurfaces on its own schedule — weekly to twice-yearly — instead of quietly rusting.',
  },
]

export default function Welcome({ onNewGoal, onLoadSample }) {
  return (
    <div className="welcome">
      <div className="welcome-hero">
        <div className="welcome-brand">
          <span className="welcome-brand-mark" aria-hidden="true">
            <img src={logoUrl} className="logo-for-light" alt="" />
            <img src={logoLightUrl} className="logo-for-dark" alt="" />
          </span>
          <span className="welcome-brand-name">Compassed</span>
        </div>
        <h1 className="welcome-title">The goal tracker for people juggling more than one goal</h1>
        <p className="welcome-sub">
          It's easy to fall into one goal and forget the others. Compassed keeps every goal in
          view, and each day points you at the one that's actually slipping — with the charts
          to prove it, not just a reminder.
        </p>
        <div className="welcome-actions">
          <button className="btn btn-primary" onClick={onNewGoal}>+ Add your first goal</button>
          {onLoadSample && (
            <button className="btn" onClick={onLoadSample}>Try it with sample data</button>
          )}
        </div>
      </div>

      <div className="welcome-grid">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div className="welcome-feature" key={title}>
            <span className="welcome-feature-icon" aria-hidden="true"><Icon size={18} /></span>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </div>

      <p className="welcome-note">
        Everything lives in your browser's local storage — no account, and nothing leaves your machine.
      </p>
    </div>
  )
}
