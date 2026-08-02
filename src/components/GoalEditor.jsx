import { useState } from 'react'
import Modal from './Modal.jsx'
import {
  COLOR_SLOTS, colorVar, EMOJI_CHOICES, UNIT_PRESETS, unitFor, unitWord,
} from '../lib/model.js'

export default function GoalEditor({ goal, isNew, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(goal)
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const unit = unitFor(draft)
  const custom = draft.unitId === 'custom'
  const valid = draft.name.trim().length > 0

  const submit = () => {
    if (!valid) return
    onSave({
      ...draft,
      name: draft.name.trim(),
      target: Math.max(0, Number(draft.target) || 0),
    })
  }

  return (
    <Modal
      title={isNew ? 'New goal' : 'Edit goal'}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <>
              <button className="btn btn-ghost btn-danger" onClick={() => onDelete(draft.id)} style={{ marginRight: 'auto' }}>
                Delete
              </button>
              <button className="btn" onClick={() => onSave({ ...draft, archived: !draft.archived })}>
                {draft.archived ? 'Unarchive' : 'Archive'}
              </button>
            </>
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
        <label htmlFor="g-why">Why it matters <span className="hint">(optional — shown on the nudge)</span></label>
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
            : 'No target — this goal will be nudged on how long it has been quiet alone.'}
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

      <div className="field">
        <span className="label">Icon</span>
        <div className="emoji-picker">
          {EMOJI_CHOICES.map((e) => (
            <button key={e} aria-pressed={draft.emoji === e} aria-label={`Icon ${e}`} onClick={() => set({ emoji: e })}>
              {e}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
