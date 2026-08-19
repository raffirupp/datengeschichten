import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { findParliament, buildPollsData } from './pollsTrendCore.mjs'

const __dir  = dirname(fileURLToPath(import.meta.url))
const ROOT   = resolve(__dir, '..')
const RAW    = resolve(__dir, 'raw', 'dawum.json')
const DAWUM_URL = 'https://api.dawum.de/'

const PARLIAMENT_NAME = process.argv[2] ?? 'Bundestag'
const WINDOW_YEARS    = 7
const TREND_DAYS      = 21

// ---- download ----
if (!existsSync(RAW)) {
  console.log('Lade DAWUM-API …')
  let res
  try { res = await fetch(DAWUM_URL) } catch(e) {
    console.error(`Netzwerkfehler: ${e.message}`); process.exit(1)
  }
  if (!res.ok) { console.error(`HTTP ${res.status}`); process.exit(1) }
  mkdirSync(resolve(__dir, 'raw'), { recursive: true })
  writeFileSync(RAW, await res.text(), 'utf-8')
  console.log('Gespeichert:', RAW)
} else {
  console.log('Lokale DAWUM-Datei vorhanden.')
}

const raw = JSON.parse(readFileSync(RAW, 'utf-8'))

// DAWUM structure:
//   Parliaments: { id: { Shortcut, Name, Election } }
//   Parties:     { id: { Shortcut, Name } }
//   Institutes:  { id: { Name } }
//   Surveys:     { id: { Date, Parliament_ID, Institute_ID, Surveyed_Persons,
//                         Results: { party_id: pct, ... } } }
const parliaments = raw.Parliaments ?? {}

const parlEntry = findParliament(raw, PARLIAMENT_NAME)
if (!parlEntry) {
  console.error(`Parlament "${PARLIAMENT_NAME}" nicht gefunden. Verfügbar:`)
  Object.entries(parliaments).forEach(([id, p]) =>
    console.error(`  [${id}] ${p.Name} (${p.Shortcut})`)
  )
  process.exit(1)
}
const [parlId, parlObj] = parlEntry
console.log(`Parlament: [${parlId}] ${parlObj.Name}`)

const { polls, trend, partyList } = buildPollsData(raw, parlId, { windowYears: WINDOW_YEARS, trendDays: TREND_DAYS })
console.log(`Umfragen im Zeitfenster: ${polls.length}`)
console.log('Relevante Parteien:', partyList.map((p) => p.key).join(', '))

// ---- write ----
const out = {
  meta: {
    parliament: parlObj.Name ?? PARLIAMENT_NAME,
    parties: partyList,
    lastUpdated: new Date().toISOString().slice(0, 10),
    sourceNote: 'DAWUM (ODbL)',
  },
  polls,
  trend,
}
const outPath = resolve(ROOT, 'src', 'data', `polls-${PARLIAMENT_NAME.toLowerCase()}.json`)
writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8')
console.log(`\n✓ ${outPath}`)
console.log(`  Umfragen: ${out.polls.length} | Trend: ${out.trend.length} Punkte`)
console.log(`  Zeitraum: ${out.polls[0]?.date} – ${out.polls.at(-1)?.date}`)
