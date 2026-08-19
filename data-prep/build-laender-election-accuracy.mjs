/**
 * Wahlgenauigkeit für die Länder: letzte Umfrage je Institut vor der Landtagswahl gegen
 * das amtliche/vorläufige Ergebnis — analog zu build-election-accuracy.mjs (Bund), aber
 * aus einer anderen Rohquelle: von ChatGPT aus marktforschung.de-Artikeln (+ Wahlrecht.de/
 * DAWUM als Ersatzquelle, wo kein Artikel existierte) aufbereitete Tabellen, gegen mehrere
 * bekannte Wahlergebnisse stichprobenartig verifiziert. Zwei Dateien mit identischem Schema:
 * Batch 1 (13 Länder) + eine Ergänzung, die die restlichen 3 auffüllt (NRW, Bremen,
 * Mecklenburg-Vorpommern) und zusätzlich Berlin 2021 beisteuert (die wegen Wahlpannen
 * annullierte Wahl vor der Wiederholung 2023, die schon in Batch 1 steckt).
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import pkg from 'xlsx'
const { readFile, utils } = pkg

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dir, '..')
const RAW_DIR = resolve(__dir, 'raw', 'marktforschung')
const XLS_FILES = [
  'wahlumfragen_marktforschung_master_batch1.xlsx',
  'wahlumfragen_deutschland_ergaenzung_v2_mit_civey_wahlkreisprognose.xlsx',
].map((f) => resolve(RAW_DIR, f))
const OUT   = resolve(ROOT, 'src', 'data', 'laender-election-accuracy.json')

// Wahlen mit einer bemerkenswerten Besonderheit, die eine reine Abweichungs-Tabelle nicht
// zeigt — als zusätzlicher Hinweis an jeden Eintrag dieser Wahl angehängt.
const ELECTION_NOTES = {
  DE_BE_2021: 'Diese Wahl wurde 2022 wegen massiver Organisationspannen für ungültig erklärt und am 12.02.2023 wiederholt (siehe Berlin 2023 in dieser Auswertung).',
}

function excelDateToIso(serial) {
  if (typeof serial !== 'number') return null
  const ms = (serial - 25569) * 86400 * 1000
  return new Date(ms).toISOString().slice(0, 10)
}

function daysBetween(a, b) {
  if (!a || !b) return null
  return Math.round((new Date(b) - new Date(a)) / 86_400_000)
}

// Elections.region -> Projekt-Ländercode (gleiche Codes wie laender-coalitions.json).
const REGION_TO_CODE = {
  'Baden-Württemberg':      'BW',
  'Bayern':                 'BY',
  'Berlin':                 'BE',
  'Brandenburg':            'BB',
  'Bremen':                 'HB',
  'Hamburg':                'HH',
  'Hessen':                 'HE',
  'Mecklenburg-Vorpommern': 'MV',
  'Niedersachsen':          'NI',
  'Nordrhein-Westfalen':    'NW',
  'Rheinland-Pfalz':        'RP',
  'Saarland':               'SL',
  'Sachsen':                'SN',
  'Sachsen-Anhalt':         'ST',
  'Schleswig-Holstein':     'SH',
  'Thüringen':              'TH',
}

// party_or_category der Tabelle -> Projekt-Konvention. Länder-Ebene führt CDU/CSU
// getrennt (wie polls-laender.json/partyColors.js), Groß-/Kleinschreibung wie DAWUM
// ("Grüne"/"Linke"), nicht wie laender-coalitions.json ("GRÜNE"/"LINKE").
const PARTY_NORM = {
  'CDU': 'CDU', 'CSU': 'CSU', 'SPD': 'SPD', 'FDP': 'FDP', 'AfD': 'AfD',
  'GRÜNE': 'Grüne', 'LINKE': 'Linke', 'BSW': 'BSW', 'SSW': 'SSW', 'Volt': 'Volt',
  'Freie Wähler': 'Freie Wähler', 'BVB/FW': 'BVB/FW', 'NPD': 'NPD',
  // "BD" ist die DAWUM/polls-laender.json-Schreibweise für Bremens "Bürger in Wut" —
  // die Ergänzungsdatei führt dieselbe Partei als "BD/BIW".
  'BD/BIW': 'BD',
  // "Sonstige", "Sonstige inkl. X" und die Kopfzeilen-Artefaktzeile bleiben absichtlich
  // ungemappt und werden dadurch übersprungen — keine sauberen Einzelparteien-Werte.
}

const elections = []
const polls     = []
const pollParty = []
for (const xls of XLS_FILES) {
  const wb = readFile(xls)
  elections.push(...utils.sheet_to_json(wb.Sheets['Elections'], { defval: null }))
  polls.push(...utils.sheet_to_json(wb.Sheets['Polls'], { defval: null }))
  pollParty.push(...utils.sheet_to_json(wb.Sheets['Poll_Party'], { defval: null }))
}

const electionById = Object.fromEntries(elections.map((e) => [e.election_id, e]))
const pollById     = Object.fromEntries(polls.map((p) => [p.poll_id, p]))

const byState = {}
let skippedParty = 0

for (const row of pollParty) {
  const election = electionById[row.election_id]
  if (!election || election.election_level !== 'State') continue

  const code = REGION_TO_CODE[election.region]
  if (!code) continue

  const party = PARTY_NORM[row.party_or_category]
  if (!party) { skippedParty++; continue }

  if (row.poll_share == null || row.actual_share == null) continue

  const poll = pollById[row.poll_id]
  if (!poll) continue

  const electionDate = excelDateToIso(election.election_date)
  const pollDate      = excelDateToIso(poll.fieldwork_end)

  if (!byState[code]) byState[code] = { entriesByYear: new Map(), electionMeta: new Map(), parties: new Set(), institutes: new Set() }
  const state = byState[code]

  const year = electionDate?.slice(0, 4)
  state.electionMeta.set(year, { year, date: electionDate, name: election.election_name })
  state.parties.add(party)
  state.institutes.add(poll.pollster)

  const notes = []
  if ((election.result_status ?? '').toLowerCase().includes('provisional')) {
    notes.push('Wahlergebnis laut Quelle vorläufig (Wahlabend-Stand), nicht das amtliche Endergebnis.')
  }
  if (ELECTION_NOTES[row.election_id]) notes.push(ELECTION_NOTES[row.election_id])

  if (!state.entriesByYear.has(year)) state.entriesByYear.set(year, [])
  state.entriesByYear.get(year).push({
    year,
    electionDate,
    institute: poll.pollster,
    party,
    pollDate,
    daysBeforeElection: daysBetween(pollDate, electionDate),
    poll:   Math.round(row.poll_share   * 100) / 100,
    result: Math.round(row.actual_share * 100) / 100,
    deviation: Math.round((row.poll_share - row.actual_share) * 100) / 100,
    note: notes.length ? notes.join(' ') : null,
  })
}

const output = { meta: { generated: new Date().toISOString().slice(0, 10) }, byState: {} }

for (const [code, state] of Object.entries(byState)) {
  const elections2 = [...state.electionMeta.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
  const entries = elections2.flatMap((e) => state.entriesByYear.get(e.year))
  output.byState[code] = {
    meta: { elections: elections2 },
    parties: [...state.parties].sort(),
    entries,
  }
}

const missing = Object.keys(REGION_TO_CODE).map((r) => REGION_TO_CODE[r]).filter((c) => !output.byState[c])
output.meta.sourceNote = missing.length
  ? `marktforschung.de, aufbereitet (Batch 1 + Ergänzung) — ${Object.keys(output.byState).length} von 16 Ländern; ${missing.join(', ')} fehlen noch.`
  : 'marktforschung.de, aufbereitet (Batch 1 + Ergänzung) — alle 16 Länder.'
output.meta.note = 'Abweichung = letzte Umfrage vor der Wahl minus Wahlergebnis in Prozentpunkten. Positiv = Institut lag zu hoch.'
output.meta.codes = Object.keys(output.byState).sort()

writeFileSync(OUT, JSON.stringify(output, null, 2), 'utf-8')
console.log(`✓ ${OUT}`)
console.log(`  ${Object.keys(output.byState).length} von 16 Ländern, ${skippedParty} Zeilen ohne eindeutige Einzelpartei übersprungen`)
for (const [code, s] of Object.entries(output.byState)) {
  console.log(`  ${code}  ${s.meta.elections.map((e) => e.year).join('/')}  ${s.entries.length} Einträge, Parteien: ${s.parties.join(', ')}`)
}
