import { motion } from 'motion/react'
import { CircleCheckBig, Scale, ListChecks, RotateCcw } from 'lucide-react'
import logoUrl from '../assets/logo.png'
import logoLightUrl from '../assets/logo-light.png'

const heroContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const heroItem = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
}

const FEATURES = [
  {
    icon: CircleCheckBig,
    title: 'One step a day',
    body: 'Compassed watches which goals go quiet and points you at the one that’s slipping, not everything at once.',
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
    body: 'Move a done goal to Revisit and it resurfaces on its own schedule, weekly to twice-yearly, instead of quietly rusting.',
  },
]

export default function Welcome({ onNewGoal, onLoadSample }) {
  return (
    <div className="welcome">
      <motion.div
        className="welcome-hero"
        variants={heroContainer}
        initial="hidden"
        animate="show"
      >
        <div className="welcome-brand">
          <span className="welcome-brand-mark" aria-hidden="true">
            <img src={logoUrl} className="logo-for-light" alt="" />
            <img src={logoLightUrl} className="logo-for-dark" alt="" />
          </span>
          <span className="welcome-brand-name">Compassed</span>
        </div>
        <motion.h1 className="welcome-title" variants={heroItem}>
          The goal tracker to complete every goal without forgetting any
        </motion.h1>
        <motion.p className="welcome-sub" variants={heroItem}>
          It's easy to fall into one goal and forget the others. Compassed keeps every goal in
          view, and each day points you at the one that's actually slipping, with the charts
          to prove it, not just a reminder.
        </motion.p>
        <motion.div className="welcome-actions" variants={heroItem}>
          <button className="btn btn-primary" onClick={onNewGoal}>+ Add your first goal</button>
          {onLoadSample && (
            <button className="btn" onClick={onLoadSample}>Try it with sample data</button>
          )}
        </motion.div>
      </motion.div>

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
        Your data stays on this device. Compassed© saves everything to your browser's local
        storage. There's no account, no server, and nothing is ever sent anywhere or
        tracked. Use Settings to export a backup, since clearing your browser's data or
        switching devices means starting fresh.
      </p>
    </div>
  )
}
