import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir  = dirname(fileURLToPath(import.meta.url))
const ROOT   = resolve(__dir, '..')
const RAW    = resolve(__dir, 'raw', 'dawum.json')
const DAWUM_URL = 'https://api.dawum.de/'

const PARLIAMENT_NAME = process.argv[2] ?? 'Bundestag'
const WINDOW_YEARS    = 3
const TREND_DAYS      = 21

const dayMs = 86_400_000
function toDate(str) { return new Date(str + 'T12:00:00Z') }
function diffDays(a, b) { return (a - b) / dayMs }

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
const parties     = raw.Parties     ?? {}
const institutes  = raw.Institutes  ?? {}
const surveys     = raw.Surveys     ?? {}

// Find parliament
const parlEntry = Object.entries(parliaments).find(([, p]) =>
  (p.Name ?? '').toLowerCase() === PARLIAMENT_NAME.toLowerCase() ||
  (p.Shortcut ?? '').toLowerCase() === PARLIAMENT_NAME.toLowerCase()
)
if (!parlEntry) {
  console.error(`Parlament "${PARLIAMENT_NAME}" nicht gefunden. Verfügbar:`)
  Object.entries(parliaments).forEach(([id, p]) =>
    console.error(`  [${id}] ${p.Name} (${p.Shortcut})`)
  )
  process.exit(1)
}
const [parlId, parlObj] = parlEntry
console.log(`Parlament: [${parlId}] ${parlObj.Name}`)

// Cut-off date (ISO string for easy comparison)
const cutoffStr = new Date(Date.now() - WINDOW_YEARS * 365.25 * dayMs)
  .toISOString().slice(0, 10)

// ---- process surveys ----
const rawPolls = []

for (const [, survey] of Object.entries(surveys)) {
  if (String(survey.Parliament_ID) !== String(parlId)) continue
  const dateStr = survey.Date ?? ''
  if (!dateStr || dateStr < cutoffStr) continue

  const instituteId   = String(survey.Institute_ID ?? '')
  const instituteName = institutes[instituteId]?.Name ?? instituteId
  const n = parseInt(survey.Surveyed_Persons ?? '0') || null

  // Results: { party_id: percentage }  (directly inside survey)
  const rawResults = survey.Results ?? {}
  const results = {}
  for (const [partyId, pct] of Object.entries(rawResults)) {
    const pctNum = parseFloat(pct)
    if (isNaN(pctNum)) continue
    const partyObj = parties[partyId]
    if (!partyObj) continue
    const key = partyObj.Shortcut ?? partyObj.Name ?? partyId
    results[key] = pctNum
  }

  if (Object.keys(results).length === 0) continue
  rawPolls.push({ date: dateStr, institute: instituteName, n, results })
}

rawPolls.sort((a, b) => a.date.localeCompare(b.date))
console.log(`Umfragen im Zeitfenster: ${rawPolls.length}`)

// ---- relevant parties: appear in ≥30% of polls, exclude "Sonstige" ----
const partyCounts = {}
for (const p of rawPolls) {
  for (const k of Object.keys(p.results)) partyCounts[k] = (partyCounts[k] ?? 0) + 1
}
const minCount = Math.ceil(rawPolls.length * 0.30)
const relevantParties = Object.entries(partyCounts)
  .filter(([k, c]) => c >= minCount && k !== 'Sonstige')
  .sort((a, b) => b[1] - a[1])
  .map(([key]) => key)

// Build party meta list
const partyKeyToName = {}
for (const [, p] of Object.entries(parties)) {
  partyKeyToName[p.Shortcut ?? p.Name] = p.Name
}
const partyList = relevantParties.map(key => ({ key, name: partyKeyToName[key] ?? key }))
console.log('Relevante Parteien:', relevantParties.join(', '))

// ---- trend: 21-day weighted rolling average ----
const pollDates = [...new Set(rawPolls.map(p => p.date))].sort()

const trend = pollDates.map(targetDate => {
  const tDate = toDate(targetDate)
  const window = rawPolls.filter(p => {
    const age = diffDays(tDate, toDate(p.date))
    return age >= 0 && age < TREND_DAYS
  })
  if (window.length === 0) return null

  const values = {}
  for (const party of relevantParties) {
    let wSum = 0, wTotal = 0
    for (const poll of window) {
      if (poll.results[party] == null) continue
      const age     = diffDays(tDate, toDate(poll.date))
      const recency = 1 - age / TREND_DAYS
      const sampleW = poll.n ? Math.sqrt(poll.n) : 1
      const w       = recency * sampleW
      wSum   += poll.results[party] * w
      wTotal += w
    }
    if (wTotal > 0) values[party] = Math.round((wSum / wTotal) * 10) / 10
  }
  return { date: targetDate, values }
}).filter(Boolean)

// ---- write ----
const out = {
  meta: {
    parliament: parlObj.Name ?? PARLIAMENT_NAME,
    parties: partyList,
    lastUpdated: new Date().toISOString().slice(0, 10),
    sourceNote: 'DAWUM (ODbL)',
  },
  polls: rawPolls.map(({ date, institute, results }) => ({ date, institute, results })),
  trend,
}
const outPath = resolve(ROOT, 'src', 'data', `polls-${PARLIAMENT_NAME.toLowerCase()}.json`)
writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8')
console.log(`\n✓ ${outPath}`)
console.log(`  Umfragen: ${out.polls.length} | Trend: ${out.trend.length} Punkte`)
console.log(`  Zeitraum: ${out.polls[0]?.date} – ${out.polls.at(-1)?.date}`)
