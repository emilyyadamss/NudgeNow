import { useState } from 'react'
import Modal from './Modal.jsx'
import {
  STATUS, REVISIT_PRESETS, DEFAULT_REVISIT_EVERY, revisitEvery,
  colorVar, unitFor, formatAmount, unitWord,
} from '../lib/model.js'
import { GoalIcon } from '../lib/goalIcons.jsx'

/* Finishing a goal asks one question: is this done, or done-for-now?
   Archiving files it away for good. Revisit keeps it in the rotation on a long
   interval — the nudge stays quiet until the interval elapses, then taps you
   once so a skill you worked for doesn't quietly rust.

   `intent` is 'complete' when finishing a live goal (both options offered) or
   'revisit' when the destination is already decided — moving something out of
   the archive, or switching a goal straight into practice mode. */
export default function CompleteModal({ goal, stats, intent = 'complete', onConfirm, onClose }) {
  const decided = intent === 'revisit'
  const [mode, setMode] = useState(STATUS.REVISIT)
  const [every, setEvery] = useState(revisitEvery(goal))
  const unit = unitFor(goal)
  const color = colorVar(goal.colorSlot)
  const days = Math.max(1, Math.round(Number(every) || DEFAULT_REVISIT_EVERY))

  const confirm = () => onConfirm({ status: decided ? STATUS.REVISIT : mode, revisitEvery: days })

  return (
    <Modal
      title={decided ? `Revisit ${goal.name}` : `Finish ${goal.name}?`}
      width={520}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={confirm}>
            {decided
              ? 'Start revisiting'
              : mode === STATUS.REVISIT ? 'Complete & keep practising' : 'Complete & archive'}
          </button>
        </>
      }
    >
      <div className="done-banner" style={{ '--goal-color': color }}>
        <span className="goal-emoji" aria-hidden="true"><GoalIcon id={goal.emoji} /></span>
        <div>
          <div className="t">{formatAmount(stats.total, unit)} {unitWord(stats.total, unit)} logged</div>
          <div className="s">
            over {stats.activeDays} active {stats.activeDays === 1 ? 'day' : 'days'}
            {stats.longest > 1 ? ` · best run of ${stats.longest} days` : ''}
          </div>
        </div>
      </div>

      {!decided && (
        <div className="field">
          <span className="label">What happens next</span>
          <div className="choice-row">
            <button
              className="choice"
              aria-pressed={mode === STATUS.REVISIT}
              onClick={() => setMode(STATUS.REVISIT)}
            >
              <span className="t">🔁 Keep it in revisit</span>
              <span className="s">
                Out of the daily rotation, but nudged every so often so it doesn’t fade.
              </span>
            </button>
            <button
              className="choice"
              aria-pressed={mode === STATUS.DONE}
              onClick={() => setMode(STATUS.DONE)}
            >
              <span className="t">📦 Archive it</span>
              <span className="s">
                Filed away with its full history. Never nudged — you can bring it back anytime.
              </span>
            </button>
          </div>
        </div>
      )}

      {(decided || mode === STATUS.REVISIT) && (
        <div className="field">
          <span className="label">Nudge me to practise</span>
          <div className="chip-row">
            {REVISIT_PRESETS.map((p) => (
              <button
                key={p.days}
                className="chip-btn"
                aria-pressed={days === p.days}
                onClick={() => setEvery(p.days)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
            <input
              className="input"
              type="number"
              min="1"
              max="730"
              value={every}
              onChange={(e) => setEvery(e.target.value)}
              aria-label="Days between revisits"
              style={{ width: 90 }}
            />
            <span className="hint">
              days between check-ins — {goal.name} goes quiet until {days} days after its last entry.
            </span>
          </div>
        </div>
      )}
    </Modal>
  )
}
