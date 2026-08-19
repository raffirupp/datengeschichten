// Umfragetrend für alle 16 Landtage in einer Datei, analog zu build-polls.mjs (Bund),
// aber alle Bundesländer auf einmal (gleiches Muster wie build-laender-house-effects.mjs).
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { buildPollsData } from './pollsTrendCore.mjs'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dir, '..')
const RAW   = resolve(__dir, 'raw', 'dawum.json')
const OUT   = resolve(ROOT, 'src', 'data', 'polls-laender.json')

const WINDOW_YEARS = 7
const TREND_DAYS   = 21

// DAWUM-Shortcut -> Projekt-Ländercode (gleiche Codes wie laender-coalitions.json / laender-governments.json)
const SHORTCUT_TO_CODE = {
  'Baden-Württemberg': 'BW',
  'Bayern': 'BY',
  'Berlin': 'BE',
  'Brandenburg': 'BB',
  'Bremen': 'HB',
  'Hamburg': 'HH',
  'Hessen': 'HE',
  'Mecklenburg-Vorpommern': 'MV',
  'Niedersachsen': 'NI',
  'Nordrhein-Westfalen (NRW)': 'NW',
  'Rheinland-Pfalz': 'RP',
  'Saarland': 'SL',
  'Sachsen': 'SN',
  'Sachsen-Anhalt': 'ST',
  'Schleswig-Holstein': 'SH',
  'Thüringen': 'TH',
}

const raw = JSON.parse(readFileSync(RAW, 'utf-8'))

const byState = {}
for (const [id, parl] of Object.entries(raw.Parliaments ?? {})) {
  const code = SHORTCUT_TO_CODE[parl.Shortcut]
  if (!code) continue // Bundestag, Europäisches Parlament

  const { polls, trend, partyList } = buildPollsData(raw, id, { windowYears: WINDOW_YEARS, trendDays: TREND_DAYS })
  if (polls.length === 0) {
    console.warn(`⚠ ${parl.Name} (${code}): keine Umfragen im Zeitfenster — übersprungen`)
    continue
  }

  byState[code] = {
    meta: {
      state: code,
      parliament: parl.Name,
      parties: partyList,
    },
    polls,
    trend,
  }
  console.log(`${code.padEnd(3)} ${parl.Name.padEnd(35)} ${polls.length} Umfragen, Parteien: ${partyList.map((p) => p.key).join(', ')}`)
}

const out = {
  meta: {
    lastUpdated: new Date().toISOString().slice(0, 10),
    sourceNote: 'DAWUM (ODbL)',
    codes: Object.keys(byState).sort(),
  },
  byState,
}

writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf-8')
console.log(`\n✓ ${OUT}`)
console.log(`  ${Object.keys(byState).length} von 16 Bundesländern`)
