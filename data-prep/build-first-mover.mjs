/**
 * First-Mover Analysis: Wer erkennt echte Trendwenden als erstes?
 *
 * Methode:
 * 1. Wöchentlicher Gesamt-Konsens (21-Tage-Gewichtungsfenster, ALLE Institute)
 * 2. "Breakout": 4-Wochen-Verschiebung des Konsens überschreitet THRESHOLD PP
 * 3. Für jedes Breakout-Ereignis: Wann kreuzt jedes Institut die Halbzeit der Bewegung?
 * 4. Lead-Zeit = Kreuzdatum minus Konsensereignis-Datum (positiv = früher)
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir  = dirname(fileURLToPath(import.meta.url))
const ROOT   = resolve(__dir, '..')
const IN     = resolve(__dir, 'raw', 'dawum.json')
const OUT    = resolve(ROOT, 'src', 'data', 'first-mover.json')

const THRESHOLD   = 1.5   // PP über 8 Wochen → "echter Trend"
const WINDOW_DAYS = 21    // Glättungsfenster
const STEP_DAYS   = 7     // wöchentliche Abtastung
const LOOKBACK    = 8     // Wochen rückwärts für Breakout-Detection (2 Monate)
const LOOKAHEAD   = 8     // Wochen vorwärts um Institute zu beobachten
const MIN_EVENTS  = 3     // Mindest-Events pro Institut für zuverlässige Aussage
const MIN_N_POLLS = 20    // Mindest-Umfragen pro Institut insgesamt

// Nur Bundestagsumfragen
const BTW_PARLIAMENT_ID = '0'
// Startdatum (nach Ausreißer-Phase)
const START_DATE = new Date('2020-01-01')
const END_DATE   = new Date('2026-06-01')

// Parteien die wir analysieren
const TARGET_PARTIES = ['CDU/CSU', 'SPD', 'Grüne', 'AfD', 'FDP', 'Linke', 'BSW']

const raw = JSON.parse(readFileSync(IN, 'utf-8'))

// Umfragen filtern
const surveys = Object.values(raw.Surveys).filter(s =>
  s.Parliament_ID == BTW_PARLIAMENT_ID &&
  s.Date >= '2020-01-01'
)

// Parteien-ID-Map
const partyNameToId = {}
for (const [id, p] of Object.entries(raw.Parties)) {
  partyNameToId[p.Shortcut] = id
  // Aliase
  if (p.Shortcut === 'CDU/CSU') { partyNameToId['CDU/CSU'] = id }
  if (p.Shortcut === 'Grüne')   { partyNameToId['Grüne']   = id }
  if (p.Shortcut === 'Linke')   { partyNameToId['Linke']   = id }
}

// Shortcut-Map
const partyIdToShortcut = {}
for (const [id, p] of Object.entries(raw.Parties)) {
  partyIdToShortcut[id] = p.Shortcut
}

// Institut-Name-Map
const instNames = {}
for (const [id, inst] of Object.entries(raw.Institutes)) {
  instNames[id] = inst.Name
}

// Gruppiere Umfragen nach Institut
const byInstitute = {}
for (const s of surveys) {
  const instId = s.Institute_ID
  if (!byInstitute[instId]) byInstitute[instId] = []
  byInstitute[instId].push(s)
}

// Filtere Institute mit zu wenigen Umfragen
const validInstitutes = Object.entries(byInstitute)
  .filter(([, ss]) => ss.length >= MIN_N_POLLS)
  .map(([id]) => id)

console.log(`Institute mit n>=${MIN_N_POLLS}:`, validInstitutes.map(id => instNames[id]).join(', '))

/**
 * 21-Tage-Gewichtetes Rolling Average für Partei an Datum tStr
 * (ALLE Institute)
 */
function consensusAt(tStr, partyShortcut, excludeInstId = null) {
  const t = new Date(tStr)
  const cutoff = new Date(t - WINDOW_DAYS * 86400_000)
  const matches = []

  for (const s of surveys) {
    if (s.Date > tStr || s.Date < cutoff.toISOString().slice(0, 10)) continue
    if (excludeInstId && s.Institute_ID == excludeInstId) continue

    // Finde Partei-ID für diesen Shortcut
    let pct = null
    for (const [pid, p] of Object.entries(raw.Parties)) {
      if (p.Shortcut === partyShortcut && s.Results[pid] != null) {
        pct = s.Results[pid]
        break
      }
    }
    if (pct == null) continue

    const age  = (t - new Date(s.Date)) / 86400_000
    const wRec = 1 - (age / WINDOW_DAYS)
    const wN   = s.Sample ? Math.sqrt(s.Sample) : 1
    matches.push({ pct, w: wRec * wN })
  }

  if (matches.length < 2) return null
  const sumW = matches.reduce((a, b) => a + b.w, 0)
  return matches.reduce((a, b) => a + b.pct * b.w, 0) / sumW
}

/**
 * Institut-eigener Rolling Average an Datum tStr
 */
function instituteAt(tStr, partyShortcut, instId) {
  const t = new Date(tStr)
  const cutoff = new Date(t - WINDOW_DAYS * 86400_000)
  const ss = byInstitute[instId] ?? []
  const matches = []

  for (const s of ss) {
    if (s.Date > tStr || s.Date < cutoff.toISOString().slice(0, 10)) continue
    let pct = null
    for (const [pid, p] of Object.entries(raw.Parties)) {
      if (p.Shortcut === partyShortcut && s.Results[pid] != null) {
        pct = s.Results[pid]
        break
      }
    }
    if (pct == null) continue
    const age  = (t - new Date(s.Date)) / 86400_000
    const wRec = 1 - (age / WINDOW_DAYS)
    const wN   = s.Sample ? Math.sqrt(s.Sample) : 1
    matches.push({ pct, w: wRec * wN })
  }

  if (matches.length < 1) return null
  const sumW = matches.reduce((a, b) => a + b.w, 0)
  return matches.reduce((a, b) => a + b.pct * b.w, 0) / sumW
}

// ── Wöchentliche Zeitreihe aufbauen ─────────────────────────────────────────
const weeks = []
for (let d = new Date(START_DATE); d <= END_DATE; d = new Date(d.getTime() + STEP_DAYS * 86400_000)) {
  weeks.push(d.toISOString().slice(0, 10))
}
console.log(`Wochen: ${weeks.length} (${weeks[0]} – ${weeks[weeks.length - 1]})`)

// ── Für jede Partei: Breakouts finden und Institute bewerten ─────────────────
const results = {}

for (const party of TARGET_PARTIES) {
  console.log(`\n── ${party} ──`)

  // Konsens-Zeitreihe aufbauen
  const consMap = {}
  for (const w of weeks) {
    consMap[w] = consensusAt(w, party)
  }

  // Breakout-Events finden
  const events = []
  for (let i = LOOKBACK; i < weeks.length - LOOKAHEAD; i++) {
    const wNow  = weeks[i]
    const wBack = weeks[i - LOOKBACK]
    const vNow  = consMap[wNow]
    const vBack = consMap[wBack]
    if (vNow == null || vBack == null) continue

    const delta = vNow - vBack
    if (Math.abs(delta) >= THRESHOLD) {
      events.push({
        week:      wNow,
        weekIdx:   i,
        direction: delta > 0 ? 1 : -1,
        totalMove: delta,
        vStart:    vBack,
        vEnd:      vNow,
        halfPoint: vBack + delta / 2,
      })
    }
  }

  // De-duplicate events (innerhalb von LOOKBACK Wochen: nur stärksten behalten)
  const dedupEvents = []
  let lastIdx = -99
  for (const ev of events) {
    if (ev.weekIdx - lastIdx < LOOKBACK) {
      // Ersetze falls stärkerer Event
      if (Math.abs(ev.totalMove) > Math.abs(dedupEvents[dedupEvents.length - 1]?.totalMove ?? 0)) {
        dedupEvents[dedupEvents.length - 1] = ev
      }
    } else {
      dedupEvents.push(ev)
      lastIdx = ev.weekIdx
    }
  }

  console.log(`  Breakout-Events (|Δ${LOOKBACK}w| >= ${THRESHOLD} PP): ${dedupEvents.length}`)
  if (dedupEvents.length < MIN_EVENTS) {
    console.log(`  Zu wenig Events → überspringen`)
    continue
  }

  // Institut-Zeitreihen aufbauen
  const instMaps = {}
  for (const instId of validInstitutes) {
    const m = {}
    for (const w of weeks) {
      m[w] = instituteAt(w, party, instId)
    }
    instMaps[instId] = m
  }

  // Für jedes Institut: Lead-Zeiten über alle Events berechnen
  const instScores = {}
  for (const instId of validInstitutes) {
    const m = instMaps[instId]
    const leads = []

    for (const ev of dedupEvents) {
      const { weekIdx, direction, halfPoint, vStart } = ev

      // Hat Institut genug Daten um dieses Event zu beobachten?
      // Brauchen Werte in [weekIdx-LOOKBACK-1, weekIdx+LOOKAHEAD]
      const preIdx   = Math.max(0, weekIdx - LOOKBACK - 2)
      const postIdx  = Math.min(weeks.length - 1, weekIdx + LOOKAHEAD)

      // Vorher-Wert des Instituts (Median der LOOKBACK+1 Wochen vor Event)
      const preVals = []
      for (let k = weekIdx - LOOKBACK - 1; k < weekIdx - 1; k++) {
        if (k < 0) continue
        const v = m[weeks[k]]
        if (v != null) preVals.push(v)
      }
      if (preVals.length < 2) continue  // zu wenig Pre-Event-Daten

      const instPreVal = preVals.reduce((a, b) => a + b, 0) / preVals.length

      // Suche: wann kreuzt Institut die Halbzeit-Bewegung?
      let crossWeekIdx = null
      // Suche in [weekIdx-LOOKBACK, weekIdx+LOOKAHEAD]
      for (let k = weekIdx - LOOKBACK; k <= postIdx; k++) {
        if (k < 0) continue
        const v = m[weeks[k]]
        if (v == null) continue
        const instDelta = (v - instPreVal) * direction
        const halfMove  = Math.abs(halfPoint - vStart)
        if (instDelta >= halfMove * 0.7) {
          crossWeekIdx = k
          break
        }
      }

      if (crossWeekIdx == null) continue  // Institut hat Bewegung gar nicht erfasst

      // Lead = weekIdx - crossWeekIdx (positiv = Institut war früher)
      const lead = weekIdx - crossWeekIdx
      leads.push(lead)
    }

    if (leads.length >= MIN_EVENTS) {
      const median = leads.sort((a, b) => a - b)[Math.floor(leads.length / 2)]
      const mean   = leads.reduce((a, b) => a + b, 0) / leads.length
      instScores[instId] = {
        institute: instNames[instId],
        leadMedian: Math.round(median * 10) / 10,
        leadMean:   Math.round(mean * 10) / 10,
        n:          leads.length,
        leads,
      }
      console.log(`  ${instNames[instId].padEnd(30)} median=${median > 0 ? '+' : ''}${median}w n=${leads.length}`)
    }
  }

  if (Object.keys(instScores).length < 2) {
    console.log(`  Zu wenig Institute mit Daten → überspringen`)
    continue
  }

  results[party] = {
    events: dedupEvents.length,
    threshold: THRESHOLD,
    lookback: LOOKBACK,
    institutes: Object.values(instScores),
  }
}

// ── Output ────────────────────────────────────────────────────────────────────
const out = {
  meta: {
    generated:  new Date().toISOString().slice(0, 10),
    method:     `Threshold-Crossing: Breakout wenn |Δ${LOOKBACK}w Konsens| >= ${THRESHOLD} PP. Lead = Institut-Halbzeitpunkt minus Konsens-Breakout-Woche.`,
    threshold:  THRESHOLD,
    lookback:   LOOKBACK,
    minEvents:  MIN_EVENTS,
    startDate:  START_DATE.toISOString().slice(0, 10),
    note:       'Positive Lead-Zeit = Institut erfasste Bewegung früher als der Gesamt-Konsens.',
    caveat:     'Explorative Analyse. Event-Identifikation und Halbzeit-Kriterium sind Modell-Entscheidungen, die das Ergebnis beeinflussen.',
  },
  parties: Object.keys(results),
  results,
}

writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf-8')
console.log(`\n✓ ${OUT}`)
console.log(`  ${Object.keys(results).length} Parteien, ${Object.values(results).reduce((s, r) => s + r.institutes.length, 0)} Institut-Einträge`)
