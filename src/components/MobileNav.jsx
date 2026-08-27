import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Home, ListChecks, Archive, Settings } from 'lucide-react'

const menuVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.85 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 420, damping: 28 },
  },
  exit: { opacity: 0, y: 10, scale: 0.85, transition: { duration: 0.12 } },
}

export default function MobileNav({ view, setView, archivedCount, onNewGoal }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  // Ordered closest-to-farthest from the button: the panel stacks upward
  // (column-reverse), so the first entry here lands nearest the thumb.
  const items = [
    { key: 'dashboard', label: 'Today', icon: Home },
    { key: 'new-goal', label: 'New goal', icon: Plus, onSelect: onNewGoal },
    { key: 'activity', label: 'Activity', icon: ListChecks },
    ...(archivedCount > 0
      ? [{ key: 'archive', label: 'Completed', icon: Archive, meta: archivedCount }]
      : []),
    { key: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-fab-menu"
            variants={menuVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
          >
            {items.map(({ key, label, icon: Icon, meta, onSelect }) => (
              <motion.button
                key={key}
                className="mobile-fab-item"
                variants={itemVariants}
                exit="exit"
                aria-current={view.name === key}
                whileTap={{ scale: 0.92 }}
                onClick={() => { close(); onSelect ? onSelect() : setView({ name: key }) }}
              >
                <Icon size={17} strokeWidth={2.25} />
                <span>{label}</span>
                {meta != null && <em>{meta}</em>}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="mobile-fab-trigger"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((o) => !o)}
      >
        <motion.span
          className="mobile-fab-icon"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
        >
          <Plus size={24} strokeWidth={2.25} />
        </motion.span>
      </motion.button>
    </>
  )
}
