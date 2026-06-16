import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import partyLeftRight from '../src/data/partyLeftRight.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '..')
const RAW_DIR = resolve(__dir, 'raw')
const RAW_JSON = resolve(RAW_DIR, 'laender-governments-wikidata.json')
const OUT_JSON = resolve(ROOT, 'src', 'data', 'laender-governments.json')

const SPARQL_URL = 'https://query.wikidata.org/sparql'
const USER_AGENT = 'datengeschichten-data-pipeline/1.0 (https://github.com/raffirupp/datengeschichten; Kontakt: raffiruppert@gmail.com)'

const START_YEAR = 2000
const END_YEAR = 2025

// QIDs der 16 Bundesländer (Reihenfolge wie im Auftrag)
const LAND_QIDS = {
  BW: 'Q985', BY: 'Q980', BE: 'Q64', BB: 'Q1208', HB: 'Q24879', HH: 'Q1055',
  HE: 'Q1199', MV: 'Q1196', NI: 'Q1197', NW: 'Q1198', RP: 'Q1200', SL: 'Q1201',
  SN: 'Q1202', ST: 'Q1206', SH: 'Q1194', TH: 'Q1205',
}
const QID_TO_CODE = Object.fromEntries(Object.entries(LAND_QIDS).map(([c, q]) => [q, c]))

// P6 = "head of government" — funktioniert auch für die Stadtstaaten Berlin/Hamburg/Bremen,
// deren Amtsbezeichnungen (Regierender Bürgermeister / Erster Bürgermeister / Präsident des
// Senats) Wikidata unter dieser gemeinsamen Eigenschaft abbildet.
const SPARQL_QUERY = `
SELECT ?land ?person ?personLabel ?start ?end ?party ?partyLabel ?partyStart ?partyEnd WHERE {
  VALUES ?land { ${Object.values(LAND_QIDS).map((q) => `wd:${q}`).join(' ')} }
  ?land p:P6 ?statement .
  ?statement ps:P6 ?person .
  OPTIONAL { ?statement pq:P580 ?start. }
  OPTIONAL { ?statement pq:P582 ?end. }
  OPTIONAL {
    ?person p:P102 ?partyStatement .
    ?partyStatement ps:P102 ?party .
    OPTIONAL { ?partyStatement pq:P580 ?partyStart. }
    OPTIONAL { ?partyStatement pq:P582 ?partyEnd. }
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
}
ORDER BY ?land ?start
`

function qidFromUri(uri) {
  return uri.split('/').pop()
}

function toDateOnly(isoDateTime) {
  return isoDateTime ? isoDateTime.slice(0, 10) : null
}

// Ordnet einen Wikidata-Parteinamen einem unserer Kürzel aus partyLeftRight.js zu.
function normalizePartyLabel(label) {
  const l = label.toLowerCase()
  if (/\blinke\b|\bpds\b|demokratischen sozialismus/.test(l)) return 'LINKE'
  if (/grüne|bündnis 90/.test(l)) return 'GRÜNE'
  if (/sozialdemokratische partei|\bspd\b/.test(l)) return 'SPD'
  if (/südschleswigscher|\bssw\b/.test(l)) return 'SSW'
  if (/sahra wagenknecht|\bbsw\b/.test(l)) return 'BSW'
  if (/freie wähler|\bfw\b/.test(l)) return 'FW'
  if (/freie demokratische partei|\bfdp\b/.test(l)) return 'FDP'
  if (/christlich-soziale union|\bcsu\b/.test(l)) return 'CSU'
  if (/christlich[- ]demokratische union|\bcdu\b/.test(l)) return 'CDU'
  if (/alternative für deutschland|\bafd\b/.test(l)) return 'AfD'
  return null
}

// — Step 1: Wikidata abfragen (einmalig, dann lokal gecacht) —
if (!existsSync(RAW_DIR)) mkdirSync(RAW_DIR, { recursive: true })

let bindings
if (!existsSync(RAW_JSON)) {
  console.log('Frage Wikidata SPARQL-Endpoint ab …')
  const url = `${SPARQL_URL}?format=json&query=${encodeURIComponent(SPARQL_QUERY)}`
  let res
  try {
    res = await fetch(url, {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': USER_AGENT },
    })
  } catch (e) {
    console.error(`Netzwerkfehler: ${e.message}`)
    process.exit(1)
  }
  if (!res.ok) {
    console.error(`HTTP ${res.status} von Wikidata`)
    process.exit(1)
  }
  const json = await res.json()
  writeFileSync(RAW_JSON, JSON.stringify(json), 'utf-8')
  console.log(`Gespeichert: ${RAW_JSON}`)
  bindings = json.results.bindings
} else {
  console.log('Wikidata-Rohdaten vorhanden, kein erneuter Abruf nötig.')
  bindings = JSON.parse(readFileSync(RAW_JSON, 'utf-8')).results.bindings
}
console.log(`Zeilen gesamt: ${bindings.length}`)

// — Step 2: Zeilen zu Amtszeiten gruppieren (eine Amtszeit kann mehrere Partei-Kandidaten haben) —
const termMap = new Map() // key: code|person|start|end -> Amtszeit
const skippedNoStart = []

for (const row of bindings) {
  const landQid = qidFromUri(row.land.value)
  const code = QID_TO_CODE[landQid]
  if (!code) continue

  const person = row.person.value
  const personLabel = row.personLabel?.value ?? person
  const start = toDateOnly(row.start?.value)
  const end = toDateOnly(row.end?.value)
  const key = `${code}|${person}|${start}|${end}`

  if (!termMap.has(key)) {
    termMap.set(key, { code, person, personLabel, start, end, partyCandidates: [] })
  }
  if (row.party) {
    termMap.get(key).partyCandidates.push({
      label: row.partyLabel?.value ?? row.party.value,
      start: toDateOnly(row.partyStart?.value),
      end: toDateOnly(row.partyEnd?.value),
    })
  }
}

// Wählt aus mehreren Parteimitgliedschaften die zum Amtszeitraum passende.
function resolveParty(term) {
  const { partyCandidates, start } = term
  if (partyCandidates.length === 0) return null
  if (partyCandidates.length === 1) return partyCandidates[0].label

  // Mehrere Kandidaten ohne Enddatum (z. B. eine frühe Mitgliedschaft, die Wikidata nie mit
  // einem Enddatum versehen hat) sind keine echten "Gleichstände" — der zuletzt begonnene
  // Kandidat ist die plausiblere aktuelle Partei.
  const byLatestStart = (list) =>
    list.slice().sort((a, b) => ((a.start ?? '') < (b.start ?? '') ? 1 : -1))[0]

  if (start) {
    const overlapping = partyCandidates.filter((p) => {
      if (!p.start && !p.end) return false
      const afterStart = !p.start || p.start <= start
      const beforeEnd = !p.end || p.end >= start
      return afterStart && beforeEnd
    })
    if (overlapping.length >= 1) return byLatestStart(overlapping).label
  }

  const withStart = partyCandidates.filter((p) => p.start)
  if (withStart.length) return byLatestStart(withStart).label
  return partyCandidates[0].label
}

const byLand = {}
for (const term of termMap.values()) {
  if (!term.start) {
    skippedNoStart.push(`${term.code}: ${term.personLabel} (kein Startdatum, kann nicht zeitlich eingeordnet werden)`)
    continue
  }
  byLand[term.code] ??= []
  byLand[term.code].push({
    start: term.start,
    end: term.end,
    person: term.personLabel,
    partyLabel: resolveParty(term),
  })
}
for (const code of Object.keys(byLand)) {
  byLand[code].sort((a, b) => (a.start < b.start ? -1 : 1))
}

// — Step 3: Pro Land zur Kontrolle loggen —
console.log('\n--- Gefundene Amtszeiten pro Land ---')
for (const code of Object.keys(LAND_QIDS)) {
  const terms = byLand[code] ?? []
  if (terms.length === 0) {
    console.log(`${code}: (keine Amtszeiten gefunden)`)
    continue
  }
  console.log(`${code}:`)
  for (const t of terms) {
    console.log(`  ${t.start} – ${t.end ?? 'heute'}  ${t.person}  [${t.partyLabel ?? 'keine Partei'}]`)
  }
}
if (skippedNoStart.length) {
  console.log('\n--- Übersprungene Amtszeiten ohne Startdatum ---')
  for (const line of skippedNoStart) console.warn(`⚠ ${line}`)
}

// — Step 4: Partei -> Wert, Jahreswerte zum 1. Juli bestimmen —
const unknownParties = new Set()
const incompleteLands = []

const years = []
for (let y = START_YEAR; y <= END_YEAR; y++) years.push(y)

const byYear = {}
for (const year of years) byYear[String(year)] = {}

for (const code of Object.keys(LAND_QIDS)) {
  const terms = byLand[code] ?? []
  if (terms.length === 0) {
    incompleteLands.push(code)
    continue
  }

  let landHasAnyValue = false
  for (const year of years) {
    const julFirst = `${year}-07-01`
    let active = null
    for (const t of terms) {
      if (t.start <= julFirst) active = t
      else break
    }
    if (!active) continue

    if (!active.partyLabel) {
      unknownParties.add(`(keine Partei bekannt für ${active.person}, ${code})`)
      continue
    }
    const partyCode = normalizePartyLabel(active.partyLabel)
    if (!partyCode) {
      unknownParties.add(active.partyLabel)
      continue
    }
    const value = partyLeftRight.get(partyCode)
    if (value == null) {
      unknownParties.add(`${partyCode} (nicht in partyLeftRight.js)`)
      continue
    }
    byYear[String(year)][code] = Math.round(value * 100) / 100
    landHasAnyValue = true
  }
  if (!landHasAnyValue) incompleteLands.push(code)
}

// — Step 5: Ausgabe schreiben —
const output = {
  meta: {
    years,
    codes: Object.keys(LAND_QIDS),
    mid: 5,
    sourceNote: 'Regierungschefs: Wikidata; Links-rechts-Einordnung der Parteien: eigene Systematik',
  },
  byYear,
}
writeFileSync(OUT_JSON, JSON.stringify(output, null, 2), 'utf-8')
console.log(`\n✓ Ausgabe: ${OUT_JSON}`)

// — Step 6: Konsolen-Zusammenfassung —
console.log('\n=== ZUSAMMENFASSUNG ===')
if (incompleteLands.length) {
  console.warn(`⚠ Lückenhafte/leere Länder (keine oder unvollständige Werte): ${incompleteLands.join(', ')}`)
} else {
  console.log('✓ Alle 16 Länder haben durchgängig Werte 2000–2025.')
}
if (unknownParties.size) {
  console.warn(`⚠ Unbekannte/nicht zugeordnete Parteien: ${[...unknownParties].join(' | ')}`)
} else {
  console.log('✓ Alle gefundenen Parteien konnten einem Wert zugeordnet werden.')
}
