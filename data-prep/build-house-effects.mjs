import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT   = resolve(__dir, '..')
const RAW    = resolve(__dir, 'raw', 'dawum.json')

const PARLIAMENT_NAME = 'Bundestag'
const WINDOW_YEARS    = 7
const TREND_DAYS      = 21
const MIN_N           = 5   // Mindeststichprobe für eine verlässliche Zelle

// Bundestagswahlen als Perioden-Trennpunkte
const BTW2021 = '2021-09-26'
const BTW2025 = '2025-02-23'

const PARTIES = ['CDU/CSU', 'SPD', 'Grüne', 'AfD', 'FDP', 'Linke', 'BSW']

const PERIOD_DEFS = [
  { id: 'p1', label: 'vor BTW 2021',     range: 'Jun 2019 – Sep 2021' },
  { id: 'p2', label: 'BTW 2021–2025',    range: 'Okt 2021 – Feb 2025' },
  { id: 'p3', label: 'seit BTW 2025',    range: 'Mär 2025 – heute'    },
]

const dayMs = 86_400_000
function toDate(str) { return new Date(str + 'T12:00:00Z') }
function diffDays(a, b) { return (a - b) / dayMs }

const raw = JSON.parse(readFileSync(RAW, 'utf-8'))
const parliaments = raw.Parliaments ?? {}
const parties     = raw.Parties     ?? {}
const institutes  = raw.Institutes  ?? {}
const surveys     = raw.Surveys     ?? {}

const parlEntry = Object.entries(parliaments).find(([, p]) => p.Name === PARLIAMENT_NAME)
if (!parlEntry) { console.error('Parlament nicht gefunden'); process.exit(1) }
const [parlId] = parlEntry

const cutoffStr = new Date(Date.now() - WINDOW_YEARS * 365.25 * dayMs)
  .toISOString().slice(0, 10)

// Alle Umfragen für Bundestag seit Cutoff einlesen
const allPolls = []
for (const [, survey] of Object.entries(surveys)) {
  if (String(survey.Parliament_ID) !== String(parlId)) continue
  const dateStr = survey.Date ?? ''
  if (!dateStr || dateStr < cutoffStr) continue

  const instituteId   = String(survey.Institute_ID ?? '')
  const instituteName = institutes[instituteId]?.Name ?? instituteId
  const n = parseInt(survey.Surveyed_Persons ?? '0') || null

  const results = {}
  for (const [partyId, pct] of Object.entries(survey.Results ?? {})) {
    const pctNum = parseFloat(pct)
    if (isNaN(pctNum)) continue
    const partyObj = parties[partyId]
    if (!partyObj) continue
    const key = partyObj.Shortcut ?? partyObj.Name ?? partyId
    if (PARTIES.includes(key)) results[key] = pctNum
  }

  if (Object.keys(results).length === 0) continue
  allPolls.push({ date: dateStr, institute: instituteName, n, results })
}

allPolls.sort((a, b) => a.date.localeCompare(b.date))
console.log(`Umfragen (${cutoffStr}+): ${allPolls.length}`)

// Für jede Umfrage: Leave-One-Out-Konsens berechnen
// LOO = 21-Tage-Fenster OHNE Umfragen desselben Instituts
const deviations = []

for (const poll of allPolls) {
  const tDate = toDate(poll.date)

  const period =
    poll.date < BTW2021 ? 'p1' :
    poll.date < BTW2025 ? 'p2' : 'p3'

  // LOO-Fenster: andere Institute, bis zu 21 Tage vor diesem Datum
  const window = allPolls.filter(p => {
    if (p.institute === poll.institute) return false
    const age = diffDays(tDate, toDate(p.date))
    return age >= 0 && age < TREND_DAYS
  })

  for (const party of PARTIES) {
    const value = poll.results[party]
    if (value == null) continue

    let wSum = 0, wTotal = 0
    for (const p of window) {
      if (p.results[party] == null) continue
      const age     = diffDays(tDate, toDate(p.date))
      const recency = 1 - age / TREND_DAYS
      const sw      = p.n ? Math.sqrt(p.n) : 1
      const w       = recency * sw
      wSum   += p.results[party] * w
      wTotal += w
    }

    if (wTotal === 0) continue  // kein anderes Institut im Fenster → überspringen

    const consensus = wSum / wTotal
    const deviation = value - consensus
    deviations.push({ institute: poll.institute, party, deviation, period })
  }
}

// Institute sortiert nach Umfrageanzahl (absteigend), Mindest-n für Aufnahme
const instCounts = {}
for (const p of allPolls) instCounts[p.institute] = (instCounts[p.institute] ?? 0) + 1

const instList = Object.entries(instCounts)
  .filter(([, c]) => c >= MIN_N)
  .sort((a, b) => b[1] - a[1])
  .map(([name]) => name)

console.log('Institute:', instList.join(', '))

// Aggregation: Institut × Partei
const cells = []

for (const inst of instList) {
  for (const party of PARTIES) {
    const rows = deviations.filter(d => d.institute === inst && d.party === party)
    if (rows.length === 0) continue

    const n    = rows.length
    const mean = rows.reduce((s, d) => s + d.deviation, 0) / n
    const variance = rows.reduce((s, d) => s + (d.deviation - mean) ** 2, 0) / Math.max(n - 1, 1)
    const se   = Math.sqrt(variance / n)

    // Perioden-Aufschlüsselung
    const periods = PERIOD_DEFS.map(pd => {
      const pr = rows.filter(d => d.period === pd.id)
      if (pr.length === 0) return { id: pd.id, n: 0, mean: null }
      const pm = pr.reduce((s, d) => s + d.deviation, 0) / pr.length
      return { id: pd.id, n: pr.length, mean: Math.round(pm * 100) / 100 }
    })

    // Stabilitäts-Check: ≥2 Perioden mit genug Daten — zeigen sie in dieselbe Richtung?
    const validPeriods = periods.filter(p => p.n >= MIN_N && p.mean !== null)
    const stable = validPeriods.length < 2
      || validPeriods.every(p => Math.sign(p.mean) === Math.sign(validPeriods[0].mean))

    cells.push({
      institute: inst,
      party,
      n,
      mean:   Math.round(mean * 100) / 100,
      se:     Math.round(se  * 100) / 100,
      stable,
      periods,
    })
  }
}

// Kurze Plausibilitäts-Ausgabe
console.log('\nTop-Abweichungen (|mean| > 1.0, n ≥ 30):')
cells
  .filter(c => Math.abs(c.mean) > 1.0 && c.n >= 30)
  .sort((a, b) => Math.abs(b.mean) - Math.abs(a.mean))
  .slice(0, 15)
  .forEach(c =>
    console.log(`  ${c.institute.padEnd(28)} ${c.party.padEnd(10)} mean=${c.mean>0?'+':''}${c.mean} n=${c.n} stable=${c.stable}`)
  )

const out = {
  meta: {
    generated:   new Date().toISOString().slice(0, 10),
    minN:        MIN_N,
    methodNote:  'Leave-One-Out: die Konsens-Linie für jede einzelne Umfrage wird ohne die Umfragen desselben Instituts berechnet.',
    periods:     PERIOD_DEFS,
    sourceNote:  'DAWUM (ODbL)',
  },
  institutes: instList,
  parties:    PARTIES,
  cells,
}

const outPath = resolve(ROOT, 'src', 'data', 'house-effects.json')
writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8')
console.log(`\n✓ ${outPath}`)
console.log(`  ${cells.length} Zellen (${instList.length} Institute × ${PARTIES.length} Parteien)`)
