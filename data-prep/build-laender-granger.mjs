/**
 * Granger-Kausalität für alle 16 Landtage — Pendant zu build-granger.mjs (Bund),
 * verallgemeinert nach dem Muster von build-laender-house-effects.mjs.
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dir, '..')
const IN    = resolve(__dir, 'raw', 'dawum.json')
const OUT   = resolve(ROOT, 'src', 'data', 'laender-granger.json')

const LAGS        = 2
const STEP_DAYS    = 7
const WINDOW_DAYS  = 21
// Niedriger als beim Bund (build-granger.mjs: MIN_OBS=40) — dünnere Landtags-Umfragenlage.
const MIN_OBS      = 20
const ALPHA        = 0.10
const WINDOW_YEARS = 7
const EXCLUDE_NAMES = ['Bundestag', 'Europäisches Parlament']

const raw = JSON.parse(readFileSync(IN, 'utf-8'))
const parties    = raw.Parties ?? {}
const institutes = raw.Institutes ?? {}

function solveLinear(A, b) {
  const n = A.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let maxRow = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row
    }
    ;[M[col], M[maxRow]] = [M[maxRow], M[col]]
    if (Math.abs(M[col][col]) < 1e-14) return null
    for (let row = col + 1; row < n; row++) {
      const f = M[row][col] / M[col][col]
      for (let k = col; k <= n; k++) M[row][k] -= f * M[col][k]
    }
  }
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n] / M[i][i]
    for (let j = i - 1; j >= 0; j--) M[j][n] -= M[j][i] * x[i]
  }
  return x
}

function olsRSS(Xmat, y) {
  const p = Xmat[0].length
  const XtX = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => Xmat.reduce((s, r) => s + r[i] * r[j], 0)))
  const Xty = Array.from({ length: p }, (_, i) => Xmat.reduce((s, r, k) => s + r[i] * y[k], 0))
  const beta = solveLinear(XtX, Xty)
  if (!beta) return null
  const yhat = Xmat.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0))
  return y.reduce((s, yi, i) => s + (yi - yhat[i]) ** 2, 0)
}

function lgamma(z) {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z)
  z -= 1
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
  let s = c[0]
  for (let i = 1; i < 9; i++) s += c[i] / (z + i)
  const t = z + 7.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(s)
}

function betaInc(x, a, b) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  if (x > (a + 1) / (a + b + 2)) return 1 - betaInc(1 - x, b, a)
  const lbeta = lgamma(a) + lgamma(b) - lgamma(a + b)
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta) / a
  let d = 1 - (a + b) * x / (a + 1)
  if (Math.abs(d) < 1e-30) d = 1e-30
  d = 1 / d; let c = 1, f = d
  for (let m = 1; m <= 300; m++) {
    let num = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m))
    d = 1 + num * d; if (Math.abs(d) < 1e-30) d = 1e-30
    c = 1 + num / c; if (Math.abs(c) < 1e-30) c = 1e-30
    d = 1 / d; f *= c * d
    num = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1))
    d = 1 + num * d; if (Math.abs(d) < 1e-30) d = 1e-30
    c = 1 + num / c; if (Math.abs(c) < 1e-30) c = 1e-30
    d = 1 / d; const delta = c * d; f *= delta
    if (Math.abs(delta - 1) < 1e-12) break
  }
  return front * f
}

function fPValue(f, df1, df2) {
  if (!isFinite(f) || f <= 0) return 1
  return betaInc(df2 / (df2 + df1 * f), df2 / 2, df1 / 2)
}

function grangerTest(y, x, lags) {
  const n = y.length
  if (n < 2 * lags + 15) return null
  const yvec = [], Xr = [], Xu = []
  for (let t = lags; t < n; t++) {
    const rRow = [1], uRow = [1]
    for (let k = 1; k <= lags; k++) { rRow.push(y[t - k]); uRow.push(y[t - k]) }
    for (let k = 1; k <= lags; k++) { uRow.push(x[t - k]) }
    yvec.push(y[t]); Xr.push(rRow); Xu.push(uRow)
  }
  const rss_r = olsRSS(Xr, yvec)
  const rss_u = olsRSS(Xu, yvec)
  if (rss_r == null || rss_u == null || rss_u <= 0) return null
  const df1 = lags
  const df2 = n - lags - 2 * lags - 1
  if (df2 <= 0) return null
  const f = ((rss_r - rss_u) / df1) / (rss_u / df2)
  if (!isFinite(f)) return null
  return { f: Math.round(f * 100) / 100, p: Math.round(fPValue(f, df1, df2) * 1000) / 1000, df1, df2, n }
}

const dayMs = 86_400_000
const cutoffStr = new Date(Date.now() - WINDOW_YEARS * 365.25 * dayMs).toISOString().slice(0, 10)

function rollingAvg(tStr, partyShortcut, surveyList) {
  const t = new Date(tStr)
  const cutoff = new Date(t - WINDOW_DAYS * dayMs)
  const matches = []
  for (const s of surveyList) {
    if (s.Date > tStr || s.Date < cutoff.toISOString().slice(0, 10)) continue
    let pct = null
    for (const [pid, p] of Object.entries(parties)) {
      if (p.Shortcut === partyShortcut && s.Results[pid] != null) { pct = s.Results[pid]; break }
    }
    if (pct == null) continue
    const age = (t - new Date(s.Date)) / dayMs
    const wRec = 1 - age / WINDOW_DAYS
    const wN = s.Surveyed_Persons ? Math.sqrt(parseFloat(s.Surveyed_Persons)) : 1
    matches.push({ pct, w: wRec * wN })
  }
  if (matches.length < 1) return null
  const sumW = matches.reduce((a, b) => a + b.w, 0)
  if (sumW <= 0) return null
  const result = matches.reduce((a, b) => a + b.pct * b.w, 0) / sumW
  return isFinite(result) ? result : null
}

const byState = {}

for (const [parlId, parl] of Object.entries(raw.Parliaments ?? {})) {
  if (EXCLUDE_NAMES.includes(parl.Name)) continue

  const surveys = Object.values(raw.Surveys ?? {}).filter((s) => String(s.Parliament_ID) === String(parlId) && s.Date >= cutoffStr)
  if (surveys.length < 20) continue

  const byInstitute = {}
  for (const s of surveys) {
    if (!byInstitute[s.Institute_ID]) byInstitute[s.Institute_ID] = []
    byInstitute[s.Institute_ID].push(s)
  }
  const validInstitutes = Object.entries(byInstitute).filter(([, ss]) => ss.length >= 8).map(([id]) => id)
  if (validInstitutes.length < 2) continue

  // Relevante Parteien für dieses Bundesland
  const partyCounts = {}
  for (const s of surveys) {
    for (const [pid, pct] of Object.entries(s.Results ?? {})) {
      if (pct == null) continue
      const sc = parties[pid]?.Shortcut
      if (sc) partyCounts[sc] = (partyCounts[sc] ?? 0) + 1
    }
  }
  const minCount = Math.ceil(surveys.length * 0.30)
  const stateParties = Object.entries(partyCounts).filter(([k, c]) => c >= minCount && k !== 'Sonstige').map(([k]) => k)

  const startDate = surveys.reduce((min, s) => (s.Date < min ? s.Date : min), surveys[0].Date)
  const endDate = surveys.reduce((max, s) => (s.Date > max ? s.Date : max), surveys[0].Date)
  const weeks = []
  for (let d = new Date(startDate); d <= new Date(endDate); d = new Date(d.getTime() + STEP_DAYS * dayMs)) {
    weeks.push(d.toISOString().slice(0, 10))
  }

  const results = {}
  for (const party of stateParties) {
    results[party] = []
    for (const instId of validInstitutes) {
      const instSurveys = byInstitute[instId]
      const otherSurveys = surveys.filter((s) => s.Institute_ID !== instId)

      const instSeries = [], looSeries = []
      for (const w of weeks) {
        instSeries.push(rollingAvg(w, party, instSurveys))
        looSeries.push(rollingAvg(w, party, otherSurveys))
      }
      const paired = weeks.map((_, i) => ({ inst: instSeries[i], loo: looSeries[i] })).filter((p) => p.inst != null && p.loo != null)
      if (paired.length < MIN_OBS) continue

      const dInst = paired.slice(1).map((p, i) => p.inst - paired[i].inst)
      const dLoo  = paired.slice(1).map((p, i) => p.loo  - paired[i].loo)

      const instToLoo = grangerTest(dLoo, dInst, LAGS)
      const looToInst = grangerTest(dInst, dLoo, LAGS)
      if (!instToLoo || !looToInst) continue

      results[party].push({
        institute: institutes[instId]?.Name ?? instId,
        n: paired.length,
        instToLoo, looToInst,
        leadsConsensus: instToLoo.p < ALPHA && looToInst.p >= ALPHA,
        followsConsensus: looToInst.p < ALPHA && instToLoo.p >= ALPHA,
        bidirectional: instToLoo.p < ALPHA && looToInst.p < ALPHA,
      })
    }
    results[party].sort((a, b) => b.instToLoo.f - a.instToLoo.f)
    if (results[party].length === 0) delete results[party]
  }

  const totalCells = Object.values(results).reduce((s, r) => s + r.length, 0)
  if (totalCells < 2) continue

  byState[parl.Shortcut] = {
    parties: Object.keys(results),
    institutes: validInstitutes.map((id) => institutes[id]?.Name ?? id),
    results,
  }
  console.log(`${parl.Shortcut.padEnd(30)} ${totalCells} Zellen über ${Object.keys(results).length} Parteien`)
}

const out = {
  meta: {
    generated: new Date().toISOString().slice(0, 10),
    method: `Bivariate Granger-Kausalität, VAR(${LAGS}), wöchentliche erste Differenzen, LOO-Konsens, pro Bundesland`,
    lags: LAGS,
    windowDays: WINDOW_DAYS,
    stepDays: STEP_DAYS,
    minObs: MIN_OBS,
    alpha: ALPHA,
    interpretation: {
      leadsConsensus: `Institut → Konsens sig (p<${ALPHA}), Konsens → Institut nicht sig`,
      followsConsensus: `Konsens → Institut sig (p<${ALPHA}), Institut → Konsens nicht sig`,
      bidirectional: 'Beide Richtungen sig',
      none: 'Keine Richtung sig',
    },
  },
  states: byState,
}

writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf-8')
console.log(`\n✓ ${OUT}`)
console.log(`  ${Object.keys(byState).length} Bundesländer`)
