import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT   = resolve(__dir, '..')
const RAW    = resolve(__dir, 'raw', 'dawum.json')

const PARLIAMENT_NAME = 'Bundestag'
const WINDOW_YEARS    = 7
const TREND_DAYS      = 21
const STEP_DAYS       = 7        // wöchentliche Stichprobe
const MAX_LAG         = 6        // Lags -6..+6 Wochen
const MIN_PAIRS       = 20       // Mindest-Datenpunkte pro Korrelation
const MIN_N_POLLS     = 30       // Mindest-Umfragen pro Institut-Partei-Kombination

const PARTIES = ['CDU/CSU', 'SPD', 'Grüne', 'AfD', 'FDP', 'Linke', 'BSW']

const dayMs = 86_400_000
function toDate(str)     { return new Date(str + 'T12:00:00Z') }
function diffDays(a, b)  { return (a - b) / dayMs }

const raw         = JSON.parse(readFileSync(RAW, 'utf-8'))
const parliaments = raw.Parliaments ?? {}
const parties     = raw.Parties     ?? {}
const institutes  = raw.Institutes  ?? {}
const surveys     = raw.Surveys     ?? {}

const parlEntry = Object.entries(parliaments).find(([, p]) => p.Name === PARLIAMENT_NAME)
const [parlId]  = parlEntry

const cutoffStr = new Date(Date.now() - WINDOW_YEARS * 365.25 * dayMs).toISOString().slice(0, 10)

const allPolls = []
for (const [, survey] of Object.entries(surveys)) {
  if (String(survey.Parliament_ID) !== String(parlId)) continue
  const dateStr = survey.Date ?? ''
  if (!dateStr || dateStr < cutoffStr) continue

  const instName = institutes[String(survey.Institute_ID ?? '')]?.Name ?? ''
  const n        = parseInt(survey.Surveyed_Persons ?? '0') || null
  const results  = {}

  for (const [pid, pct] of Object.entries(survey.Results ?? {})) {
    const pctNum = parseFloat(pct)
    if (isNaN(pctNum)) continue
    const p = parties[pid]
    if (!p) continue
    const key = p.Shortcut ?? p.Name ?? pid
    if (PARTIES.includes(key)) results[key] = pctNum
  }

  if (Object.keys(results).length === 0) continue
  allPolls.push({ date: dateStr, institute: instName, n, results })
}

allPolls.sort((a, b) => a.date.localeCompare(b.date))
console.log(`Umfragen: ${allPolls.length}, Zeitraum: ${allPolls[0].date} – ${allPolls.at(-1).date}`)

// ── Wöchentliche Stichpunkte ────────────────────────────────────────────────
const startMs = toDate(allPolls[0].date).getTime()
const endMs   = toDate(allPolls.at(-1).date).getTime()
const weekDates = []
for (let ms = startMs; ms <= endMs; ms += STEP_DAYS * dayMs) {
  weekDates.push(new Date(ms).toISOString().slice(0, 10))
}
console.log(`Wöchentliche Stichpunkte: ${weekDates.length}`)

// 21-Tage gewichteter Mittelwert zum Zeitpunkt tStr, optional Ausschluss eines Instituts
function rollingAvg(tStr, party, excludeInst = null, onlyInst = null) {
  const tDate = toDate(tStr)
  let wSum = 0, wTotal = 0
  for (const p of allPolls) {
    if (excludeInst && p.institute === excludeInst) continue
    if (onlyInst    && p.institute !== onlyInst)    continue
    if (p.results[party] == null) continue
    const age = diffDays(tDate, toDate(p.date))
    if (age < 0 || age >= TREND_DAYS) continue
    const recency = 1 - age / TREND_DAYS
    const sw      = p.n ? Math.sqrt(p.n) : 1
    const w       = recency * sw
    wSum   += p.results[party] * w
    wTotal += w
  }
  return wTotal > 0 ? wSum / wTotal : null
}

// Pearson-Korrelation zweier Arrays (gleiche Länge, kein null)
function pearson(x, y) {
  const n = x.length
  if (n < MIN_PAIRS) return null
  const mx = x.reduce((s, v) => s + v, 0) / n
  const my = y.reduce((s, v) => s + v, 0) / n
  let cov = 0, vx = 0, vy = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my
    cov += dx * dy; vx += dx * dx; vy += dy * dy
  }
  return vx > 0 && vy > 0 ? cov / Math.sqrt(vx * vy) : null
}

// Institute mit ausreichend Daten
const instCounts = {}
for (const p of allPolls) instCounts[p.institute] = (instCounts[p.institute] ?? 0) + 1
const instList = Object.entries(instCounts)
  .filter(([, c]) => c >= MIN_N_POLLS)
  .sort((a, b) => b[1] - a[1])
  .map(([name]) => name)

console.log('Institute:', instList.join(', '))

// ── Hauptberechnung ─────────────────────────────────────────────────────────
const cells = []

for (const inst of instList) {
  for (const party of PARTIES) {
    // Prüfe ob Institut genug Daten für diese Partei hat
    const partyCount = allPolls.filter(p => p.institute === inst && p.results[party] != null).length
    if (partyCount < MIN_N_POLLS) continue

    // Wöchentliche Zeitreihe für Institut und LOO-Konsens
    const instSeries = weekDates.map(w => rollingAvg(w, party, null, inst))
    const consSeries = weekDates.map(w => rollingAvg(w, party, inst, null))

    // Erste Differenzen (Woche-über-Woche Änderung)
    // Nur Wochen, in denen BEIDE Werte bekannt sind
    const instDiff = []
    const consDiff = []
    for (let i = 1; i < weekDates.length; i++) {
      if (instSeries[i] != null && instSeries[i - 1] != null &&
          consSeries[i] != null && consSeries[i - 1] != null) {
        instDiff.push({ i, dv: instSeries[i] - instSeries[i - 1] })
        consDiff.push({ i, dv: consSeries[i] - consSeries[i - 1] })
      }
    }

    // Lookup-Maps für Korrelation mit Lag
    const instMap = new Map(instDiff.map(d => [d.i, d.dv]))
    const consMap = new Map(consDiff.map(d => [d.i, d.dv]))

    // Cross-Correlation: corr(inst[t], cons[t + lag])
    // Positiver Lag → Institut zeigt Bewegung, bevor Konsens folgt → Institut führt
    const lagResults = []
    for (let lag = -MAX_LAG; lag <= MAX_LAG; lag++) {
      const x = [], y = []
      for (const [i, dv] of instMap) {
        const j = i + lag
        if (consMap.has(j)) { x.push(dv); y.push(consMap.get(j)) }
      }
      const r = pearson(x, y)
      if (r !== null) lagResults.push({ lag, corr: r, n: x.length })
    }

    if (lagResults.length === 0) continue

    // Optimaler Lag = höchste absolute Korrelation
    const best = lagResults.reduce((a, b) => Math.abs(b.corr) > Math.abs(a.corr) ? b : a)

    // Verlauf der Korrelation über alle Lags (für spätere Visualisierung)
    const profile = lagResults.map(r => ({ lag: r.lag, corr: Math.round(r.corr * 1000) / 1000 }))

    cells.push({
      institute: inst,
      party,
      lagWeeks:  best.lag,
      maxCorr:   Math.round(best.corr  * 1000) / 1000,
      corrAt0:   Math.round((lagResults.find(r => r.lag === 0)?.corr ?? 0) * 1000) / 1000,
      n:         best.n,
      nPolls:    partyCount,
      reliable:  best.n >= MIN_PAIRS && Math.abs(best.corr) >= 0.3,
      profile,
    })
  }
}

console.log(`\nErgebnisse: ${cells.length} Institut × Partei Zellen`)
console.log('\nAuffälligste Lead/Lags (|lag| ≥ 2, reliable):')
cells
  .filter(c => c.reliable && Math.abs(c.lagWeeks) >= 2)
  .sort((a, b) => Math.abs(b.lagWeeks) - Math.abs(a.lagWeeks))
  .slice(0, 12)
  .forEach(c => console.log(
    `  ${c.institute.padEnd(28)} ${c.party.padEnd(10)} lag=${c.lagWeeks > 0 ? '+' : ''}${c.lagWeeks}w  r=${c.maxCorr}`
  ))

const out = {
  meta: {
    generated:   new Date().toISOString().slice(0, 10),
    methodNote:  'Cross-Korrelation der wöchentlichen Erstdifferenzen zwischen Institut-Trend und LOO-Konsens (Leave-One-Out). Positiver Lag = Institut reagiert früher auf Stimmungsänderungen als die anderen.',
    lagRange:    [-MAX_LAG, MAX_LAG],
    stepDays:    STEP_DAYS,
    trendDays:   TREND_DAYS,
    minPairs:    MIN_PAIRS,
    parties:     PARTIES,
    sourceNote:  'DAWUM (ODbL)',
  },
  institutes: instList,
  parties:    PARTIES,
  cells,
}

const outPath = resolve(ROOT, 'src', 'data', 'lead-lag.json')
writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8')
console.log(`\n✓ ${outPath}`)
