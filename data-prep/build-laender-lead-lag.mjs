/**
 * Lead-Lag-Analyse für alle 16 Landtage — Pendant zu build-lead-lag.mjs (Bund),
 * verallgemeinert nach dem Muster von build-laender-house-effects.mjs.
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT   = resolve(__dir, '..')
const RAW    = resolve(__dir, 'raw', 'dawum.json')
const OUT    = resolve(ROOT, 'src', 'data', 'laender-lead-lag.json')

const WINDOW_YEARS = 7
const TREND_DAYS   = 21
const STEP_DAYS    = 7
const MAX_LAG      = 6
// Deutlich niedriger als beim Bund (build-lead-lag.mjs: MIN_PAIRS=20, MIN_N_POLLS=30) —
// Landtags-Umfragen sind mit 22–186 Stück je Bundesland viel dünner gesät als die
// Bundestags-Serie. "reliable"-Flag pro Zelle kommuniziert die Aussagekraft weiterhin;
// besser mehr Zellen mit korrekt gesetzter Reliability zeigen als Bundesländer ganz auszuschließen.
const MIN_PAIRS    = 10
const MIN_N_POLLS  = 6
const MIN_CELLS    = 2
const EXCLUDE_NAMES = ['Bundestag', 'Europäisches Parlament']

const dayMs = 86_400_000
function toDate(str)    { return new Date(str + 'T12:00:00Z') }
function diffDays(a, b) { return (a - b) / dayMs }

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

const raw = JSON.parse(readFileSync(RAW, 'utf-8'))
const parliaments = raw.Parliaments ?? {}
const parties     = raw.Parties     ?? {}
const institutes  = raw.Institutes  ?? {}
const surveys     = raw.Surveys     ?? {}

const cutoffStr = new Date(Date.now() - WINDOW_YEARS * 365.25 * dayMs).toISOString().slice(0, 10)

const byState = {}

for (const [parlId, parl] of Object.entries(parliaments)) {
  if (EXCLUDE_NAMES.includes(parl.Name)) continue

  const allPolls = []
  for (const [, survey] of Object.entries(surveys)) {
    if (String(survey.Parliament_ID) !== String(parlId)) continue
    const dateStr = survey.Date ?? ''
    if (!dateStr || dateStr < cutoffStr) continue
    const instName = institutes[String(survey.Institute_ID ?? '')]?.Name ?? ''
    const n = parseInt(survey.Surveyed_Persons ?? '0') || null
    const results = {}
    for (const [pid, pct] of Object.entries(survey.Results ?? {})) {
      const pctNum = parseFloat(pct)
      if (isNaN(pctNum)) continue
      const p = parties[pid]
      if (!p) continue
      results[p.Shortcut ?? p.Name ?? pid] = pctNum
    }
    if (Object.keys(results).length === 0) continue
    allPolls.push({ date: dateStr, institute: instName, n, results })
  }
  if (allPolls.length < 30) continue
  allPolls.sort((a, b) => a.date.localeCompare(b.date))

  // Relevante Parteien für dieses Bundesland (>= 30% der Umfragen, "Sonstige" ausgeschlossen)
  const partyCounts = {}
  for (const p of allPolls) for (const k of Object.keys(p.results)) partyCounts[k] = (partyCounts[k] ?? 0) + 1
  const minCount = Math.ceil(allPolls.length * 0.30)
  const statePARTIES = Object.entries(partyCounts)
    .filter(([k, c]) => c >= minCount && k !== 'Sonstige')
    .map(([key]) => key)

  const startMs = toDate(allPolls[0].date).getTime()
  const endMs   = toDate(allPolls.at(-1).date).getTime()
  const weekDates = []
  for (let ms = startMs; ms <= endMs; ms += STEP_DAYS * dayMs) {
    weekDates.push(new Date(ms).toISOString().slice(0, 10))
  }

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
      wSum   += p.results[party] * (recency * sw)
      wTotal += (recency * sw)
    }
    return wTotal > 0 ? wSum / wTotal : null
  }

  const instCounts = {}
  for (const p of allPolls) instCounts[p.institute] = (instCounts[p.institute] ?? 0) + 1
  const instList = Object.entries(instCounts)
    .filter(([, c]) => c >= MIN_N_POLLS)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)

  if (instList.length < 2) continue

  const cells = []
  for (const inst of instList) {
    for (const party of statePARTIES) {
      const partyCount = allPolls.filter((p) => p.institute === inst && p.results[party] != null).length
      if (partyCount < MIN_N_POLLS) continue

      const instSeries = weekDates.map((w) => rollingAvg(w, party, null, inst))
      const consSeries = weekDates.map((w) => rollingAvg(w, party, inst, null))

      const instDiff = [], consDiff = []
      for (let i = 1; i < weekDates.length; i++) {
        if (instSeries[i] != null && instSeries[i - 1] != null && consSeries[i] != null && consSeries[i - 1] != null) {
          instDiff.push({ i, dv: instSeries[i] - instSeries[i - 1] })
          consDiff.push({ i, dv: consSeries[i] - consSeries[i - 1] })
        }
      }
      const instMap = new Map(instDiff.map((d) => [d.i, d.dv]))
      const consMap = new Map(consDiff.map((d) => [d.i, d.dv]))

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

      const best = lagResults.reduce((a, b) => (Math.abs(b.corr) > Math.abs(a.corr) ? b : a))
      const profile = lagResults.map((r) => ({ lag: r.lag, corr: Math.round(r.corr * 1000) / 1000 }))

      cells.push({
        institute: inst,
        party,
        lagWeeks: best.lag,
        maxCorr: Math.round(best.corr * 1000) / 1000,
        corrAt0: Math.round((lagResults.find((r) => r.lag === 0)?.corr ?? 0) * 1000) / 1000,
        n: best.n,
        nPolls: partyCount,
        reliable: best.n >= MIN_PAIRS && Math.abs(best.corr) >= 0.3,
        profile,
      })
    }
  }

  if (cells.length < MIN_CELLS) continue

  byState[parl.Shortcut] = { institutes: instList, parties: statePARTIES, cells }
  console.log(`${parl.Shortcut.padEnd(30)} ${cells.length} Zellen`)
}

const out = {
  meta: {
    generated: new Date().toISOString().slice(0, 10),
    methodNote: 'Cross-Korrelation der wöchentlichen Erstdifferenzen zwischen Institut-Trend und LOO-Konsens (Leave-One-Out), pro Bundesland. Positiver Lag = Institut reagiert früher auf Stimmungsänderungen als die anderen.',
    lagRange: [-MAX_LAG, MAX_LAG],
    stepDays: STEP_DAYS,
    trendDays: TREND_DAYS,
    minPairs: MIN_PAIRS,
    sourceNote: 'DAWUM (ODbL)',
  },
  states: byState,
}

writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf-8')
console.log(`\n✓ ${OUT}`)
console.log(`  ${Object.keys(byState).length} Bundesländer`)
