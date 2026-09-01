/* Backup export/import. State itself now lives in Supabase, scoped to the
   signed-in account — see db.js. This file only handles the portable JSON
   backup: Settings → Export backup writes one, Import backup reads one back
   (via db.replaceAll, so a restore fully replaces the account's data). */

import { DEFAULT_SETTINGS, migrateGoal, migrateTask } from './model.js'

export function exportJSON(state) {
  return JSON.stringify(
    { app: 'Compassed', version: 1, exportedAt: new Date().toISOString(), ...state },
    null,
    2,
  )
}

export function parseImport(text) {
  const parsed = JSON.parse(text)
  if (!Array.isArray(parsed.goals) || !Array.isArray(parsed.entries)) {
    throw new Error('That file does not look like a Compassed backup.')
  }
  return {
    goals: parsed.goals.map(migrateGoal),
    entries: parsed.entries,
    // Backups written before task lists existed simply have none.
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map(migrateTask) : [],
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
