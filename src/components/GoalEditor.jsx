import { useState } from 'react'
import Modal from './Modal.jsx'
import {
  COLOR_SLOTS, colorVar, ICON_CHOICES, UNIT_PRESETS, unitFor, unitWord,
  CATEGORY_SUGGESTIONS, categoryList, normaliseCategory,
  STATUS, STATUS_LABELS, REVISIT_PRESETS, statusOf, revisitEvery, withStatus,
} from '../lib/model.js'
import { GoalIcon } from '../lib/goalIcons.jsx'

const STATUS_HINTS = {
  [STATUS.ACTIVE]: 'Nudged on how quiet it has gone and how far behind target it is.',
  [STATUS.REVISIT]: 'Finished, but kept warm. Nudged only when the interval below has elapsed.',
  [STATUS.DONE]: 'Filed away. Never nudged, and left out of every count.',
}

export default function GoalEditor({ goal, isNew, allGoals = [], onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(goal)
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const unit = unitFor(draft)
  const custom = draft.unitId === 'custom'
  const valid = draft.name.trim().length > 0
  const status = statusOf(draft)
  const every = revisitEvery(draft)

  // Existing categories first, then any suggestions not already in use.
  const inUse = categoryList(allGoals).filter(Boolean)
  const options = [...inUse, ...CATEGORY_SUGGESTIONS.filter((c) => !inUse.includes(c))]
  const currentCategory = normaliseCategory(draft.category)

  const submit = () => {
    if (!valid) return
    onSave(withStatus(
      {
        ...draft,
        name: draft.name.trim(),
        category: normaliseCategory(draft.category),
        target: Math.max(0, Number(draft.target) || 0),
        revisitEvery: every,
      },
      status,
    ))
  }

  return (
    <Modal
      title={isNew ? 'New goal' : 'Edit goal'}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <button className="btn btn-ghost btn-danger" onClick={() => onDelete(draft.id)} style={{ marginRight: 'auto' }}>
              Delete
            </button>
          )}
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={!valid}>
            {isNew ? 'Create goal' : 'Save changes'}
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="g-name">Name</label>
        <input
          id="g-name"
          className="input"
          value={draft.name}
          placeholder="Japanese, Side projects, Running…"
          onChange={(e) => set({ name: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter' && valid) submit() }}
        />
      </div>

      <div className="field">
        <label htmlFor="g-cat">Category <span className="hint">(optional, for grouping only)</span></label>
        <input
          id="g-cat"
          className="input"
          list="category-options"
          value={draft.category || ''}
          placeholder="Learning, Health, Creative…"
          onChange={(e) => set({ category: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter' && valid) submit() }}
        />
        <datalist id="category-options">
          {options.map((c) => <option key={c} value={c} />)}
        </datalist>
        {options.length > 0 && (
          <div className="chip-row" style={{ marginTop: 2 }}>
            {options.slice(0, 6).map((c) => (
              <button
                key={c}
                className="chip-btn"
                aria-pressed={currentCategory === c}
                onClick={() => set({ category: currentCategory === c ? '' : c })}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="g-why">Why it matters <span className="hint">(optional, shown on the nudge)</span></label>
        <input
          id="g-why"
          className="input"
          value={draft.why || ''}
          placeholder="Hold a real conversation on the next trip"
          onChange={(e) => set({ why: e.target.value })}
        />
      </div>

      <div className="field">
        <span className="label">Measured in</span>
        <div className="row-2">
          <select className="input" value={draft.unitId} onChange={(e) => set({ unitId: e.target.value })}>
            {UNIT_PRESETS.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              value={draft.target}
              onChange={(e) => set({ target: e.target.value })}
              aria-label="Target amount"
            />
            <select
              className="input"
              value={draft.cadence}
              onChange={(e) => set({ cadence: e.target.value })}
              aria-label="Target cadence"
            >
              <option value="week">per week</option>
              <option value="month">per month</option>
            </select>
          </div>
        </div>
        <span className="hint">
          {Number(draft.target) > 0
            ? `Aiming for ${draft.target} ${unitWord(Number(draft.target), unit)} every ${draft.cadence}.`
            : 'No target. This goal will be compassed to on how long it has been quiet alone.'}
        </span>
      </div>

      {custom && (
        <div className="row-3">
          <div className="field">
            <label htmlFor="g-one">Unit (one)</label>
            <input id="g-one" className="input" value={draft.unitOne || ''} placeholder="chapter" onChange={(e) => set({ unitOne: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="g-many">Unit (many)</label>
            <input id="g-many" className="input" value={draft.unitMany || ''} placeholder="chapters" onChange={(e) => set({ unitMany: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="g-prec">Decimals</label>
            <select id="g-prec" className="input" value={draft.unitPrecision ?? 0} onChange={(e) => set({ unitPrecision: Number(e.target.value) })}>
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </div>
        </div>
      )}

      <div className="field">
        <span className="label">Colour</span>
        <div className="swatch-picker">
          {COLOR_SLOTS.map((c) => (
            <button
              key={c.slot}
              aria-pressed={draft.colorSlot === c.slot}
              aria-label={c.name}
              title={c.name}
              style={{ background: colorVar(c.slot), '--sw': colorVar(c.slot) }}
              onClick={() => set({ colorSlot: c.slot })}
            />
          ))}
        </div>
      </div>

      {!isNew && (
        <div className="field">
          <span className="label">State</span>
          <div className="seg">
            {[STATUS.ACTIVE, STATUS.REVISIT, STATUS.DONE].map((s) => (
              <button
                key={s}
                aria-pressed={status === s}
                onClick={() => set(withStatus(draft, s, { revisitEvery: every }))}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <span className="hint">{STATUS_HINTS[status]}</span>
          {status === STATUS.REVISIT && (
            <div className="chip-row" style={{ marginTop: 4 }}>
              {REVISIT_PRESETS.map((p) => (
                <button
                  key={p.days}
                  className="chip-btn"
                  aria-pressed={every === p.days}
                  onClick={() => set({ revisitEvery: p.days })}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="field">
        <span className="label">Icon</span>
        <div className="emoji-picker">
          {ICON_CHOICES.map((id) => (
            <button key={id} aria-pressed={draft.emoji === id} aria-label={`Icon ${id}`} onClick={() => set({ emoji: id })}>
              <GoalIcon id={id} size={16} />
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
