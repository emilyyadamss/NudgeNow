/* localStorage persistence. Everything lives on this machine — no account,
   no network. Export/import gives you a portable JSON backup. */

import { DEFAULT_SETTINGS } from './model.js'

const KEY = 'nudgenow:v1'

const EMPTY = { goals: [], entries: [], settings: { ...DEFAULT_SETTINGS } }

export function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw)
    return {
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    }
  } catch {
    return { ...EMPTY }
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      goals: state.goals,
      entries: state.entries,
      settings: state.settings,
    }))
    return true
  } catch {
    return false
  }
}

export function exportJSON(state) {
  return JSON.stringify(
    { app: 'NudgeNow', version: 1, exportedAt: new Date().toISOString(), ...state },
    null,
    2,
  )
}

export function parseImport(text) {
  const parsed = JSON.parse(text)
  if (!Array.isArray(parsed.goals) || !Array.isArray(parsed.entries)) {
    throw new Error('That file does not look like a NudgeNow backup.')
  }
  return {
    goals: parsed.goals,
    entries: parsed.entries,
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
  }
}

export function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
