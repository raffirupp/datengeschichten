/**
 * House-Effects-Analyse für Bundesländer
 * Leave-One-Out Methode, 21-Tage-gewichtetes Fenster
 * Nur Bundesländer mit n >= MIN_STATE_SURVEYS Umfragen
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dir, '..')
const IN    = resolve(__dir, 'raw', 'dawum.json')
const OUT   = resolve(ROOT, 'src', 'data', 'laender-house-effects.json')

const WINDOW_DAYS       = 21
const MIN_N             = 5    // Mindest-Umfragen pro Institut×Partei-Zelle
const MIN_STATE_SURVEYS = 60   // Mindest-Umfragen um ein Bundesland einzuschließen
const MIN_INST_N        = 10   // Mindest-Umfragen pro Institut im Bundesland

const raw = JSON.parse(readFileSync(IN, 'utf-8'))

// Alle Parliaments
const parlaments = raw.Parliaments  // keys are IDs
const surveys    = Object.values(raw.Surveys)
const instNames  = Object.fromEntries(Object.entries(raw.Institutes).map(([id, i]) => [id, i.Name]))

// Bundes-Parliament ausschließen; Europaparlament auch
const EXCLUDE_NAMES = ['Bundestag', 'Europäisches Parlament']

function lerpRgb(a, b, t) {
  return [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * t))
}

// Partei-ID → Shortcut Mapping
const partyShortcut = Object.fromEntries(
  Object.entries(raw.Parties).map(([id, p]) => [id, p.Shortcut])
)
const partyName = Object.fromEntries(
  Object.entries(raw.Parties).map(([id, p]) => [id, p.Name])
)

/**
 * 21-Tage gewichteter Rolling Average für eine Partei an einem Datum
 * excludeInstId: dieses Institut ausschließen (LOO)
 * instSurveys: Umfrage-Array des Bundeslands
 */
function rollingAvg(tStr, partyId, stateSurveys, excludeInstId = null) {
  const t      = new Date(tStr)
  const cutoff = new Date(t - WINDOW_DAYS * 86400_000)
  const cutStr = cutoff.toISOString().slice(0, 10)
  const matches = []

  for (const s of stateSurveys) {
    if (s.Date > tStr || s.Date < cutStr) continue
    if (excludeInstId != null && s.Institute_ID == excludeInstId) continue
    const pct = s.Results[partyId]
    if (pct == null) continue
    const age  = (t - new Date(s.Date)) / 86400_000
    const wRec = Math.max(0, 1 - age / WINDOW_DAYS)
    const wN   = s.Surveyed_Persons ? Math.sqrt(parseFloat(s.Surveyed_Persons)) : 1
    matches.push({ pct, w: wRec * wN })
  }

  if (matches.length < 2) return null
  const sumW = matches.reduce((a, b) => a + b.w, 0)
  if (sumW <= 0) return null
  const result = matches.reduce((a, b) => a + b.pct * b.w, 0) / sumW
  return isFinite(result) ? result : null
}

const stateResults = {}

for (const [pid, parl] of Object.entries(parlaments)) {
  if (EXCLUDE_NAMES.includes(parl.Name)) continue

  const stateSurveys = surveys.filter(s => s.Parliament_ID == pid)
  if (stateSurveys.length < MIN_STATE_SURVEYS) continue

  // Welche Institute haben >= MIN_INST_N Umfragen?
  const instCounts = {}
  for (const s of stateSurveys) {
    instCounts[s.Institute_ID] = (instCounts[s.Institute_ID] || 0) + 1
  }
  const stateInsts = Object.entries(instCounts)
    .filter(([, n]) => n >= MIN_INST_N)
    .map(([id]) => id)

  if (stateInsts.length < 2) continue  // Brauchen Vergleich

  // Welche Partei-IDs kommen genug vor?
  const partyCounts = {}
  for (const s of stateSurveys) {
    for (const pid2 of Object.keys(s.Results)) {
      partyCounts[pid2] = (partyCounts[pid2] || 0) + 1
    }
  }
  // Nur Parteien die in >= 50% aller Umfragen vorkommen
  const stateParties = Object.entries(partyCounts)
    .filter(([, n]) => n >= stateSurveys.length * 0.4)
    .map(([id]) => id)
    .filter(id => id !== '0')  // Sonstige ausschließen

  console.log(`\n${parl.Name} (n=${stateSurveys.length})`)
  console.log(`  Institute: ${stateInsts.map(id => instNames[id]).join(', ')}`)
  console.log(`  Parteien:  ${stateParties.map(id => partyShortcut[id]).join(', ')}`)

  // LOO House-Effects berechnen
  const cells = []

  for (const instId of stateInsts) {
    const instSurveys = stateSurveys.filter(s => s.Institute_ID == instId)

    for (const partyId of stateParties) {
      const deviations = []

      for (const survey of instSurveys) {
        const instPct = survey.Results[partyId]
        if (instPct == null) continue

        const looCons = rollingAvg(survey.Date, partyId, stateSurveys, instId)
        if (looCons == null) continue

        deviations.push(instPct - looCons)
      }

      if (deviations.length < MIN_N) continue

      const n    = deviations.length
      const mean = deviations.reduce((a, b) => a + b, 0) / n
      const se   = Math.sqrt(deviations.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(n - 1, 1)) / Math.sqrt(n)

      cells.push({
        institute: instNames[instId],
        party:     partyShortcut[partyId] || partyName[partyId],
        partyId,
        n,
        mean:      Math.round(mean * 100) / 100,
        se:        Math.round(se   * 100) / 100,
      })
    }
  }

  if (cells.length < 4) continue

  stateResults[parl.Name] = {
    n:          stateSurveys.length,
    institutes: stateInsts.map(id => instNames[id]),
    parties:    stateParties.map(id => partyShortcut[id] || partyName[id]),
    cells,
  }

  // Top Abweichungen
  const top = cells.filter(c => Math.abs(c.mean) >= 1.0 && c.n >= 10)
    .sort((a, b) => Math.abs(b.mean) - Math.abs(a.mean))
    .slice(0, 5)
  if (top.length) {
    console.log('  Top Abweichungen:')
    top.forEach(c => console.log(`    ${c.institute.padEnd(30)} ${c.party.padEnd(12)} mean=${c.mean > 0 ? '+' : ''}${c.mean} n=${c.n}`))
  }
}

// Output
const out = {
  meta: {
    generated:   new Date().toISOString().slice(0, 10),
    method:      `Leave-One-Out, ${WINDOW_DAYS}-Tage-Gewichtungsfenster. Min. ${MIN_N} Messungen pro Zelle.`,
    minN:        MIN_N,
    note:        'Abweichung vom Instituts-Konsens (LOO) — kein Wahrheitsurteil.',
  },
  states: stateResults,
}

writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf-8')
console.log(`\n✓ ${OUT}`)
console.log(`  ${Object.keys(stateResults).length} Bundesländer`)
for (const [state, r] of Object.entries(stateResults)) {
  console.log(`  ${state.padEnd(40)} ${r.cells.length} Zellen`)
}
