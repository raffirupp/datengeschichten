/**
 * Granger-Kausalität: Sagen die Vergangenheitswerte eines Instituts
 * den LOO-Konsens vorher — über den Konsens selbst hinaus?
 *
 * Methode:
 * 1. Wöchentliche LOO-Zeitreihen (LOO = Konsens ohne das getestete Institut)
 * 2. Erste Differenzen (stationär machen)
 * 3. Bivariate Granger-Test mit VAR(LAGS) und F-Test
 * 4. Beide Richtungen: Institut → Konsens und Konsens → Institut
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dir, '..')
const IN    = resolve(__dir, 'raw', 'dawum.json')
const OUT   = resolve(ROOT, 'src', 'data', 'granger.json')

// ─── Config ──────────────────────────────────────────────────────────────────
const BTW_PARLIAMENT_ID = '0'
const LAGS        = 2     // VAR-Lag (2 Wochen)
const STEP_DAYS   = 7     // wöchentlicher Raster
const WINDOW_DAYS = 21    // Glättungsfenster Rolling Average
const MIN_OBS     = 40    // Mindest-Beobachtungen (nicht-null Paare) pro Test
const ALPHA       = 0.10  // Signifikanzschwelle
const START_DATE  = new Date('2020-01-01')
const END_DATE    = new Date('2026-06-01')

const TARGET_PARTIES = ['CDU/CSU', 'SPD', 'Grüne', 'AfD', 'FDP', 'Linke']

// ─── Daten laden ─────────────────────────────────────────────────────────────
const raw = JSON.parse(readFileSync(IN, 'utf-8'))

const surveys = Object.values(raw.Surveys).filter(s =>
  s.Parliament_ID == BTW_PARLIAMENT_ID &&
  s.Date >= '2020-01-01'
)

const instNames = {}
for (const [id, inst] of Object.entries(raw.Institutes)) {
  instNames[id] = inst.Name
}

const byInstitute = {}
for (const s of surveys) {
  if (!byInstitute[s.Institute_ID]) byInstitute[s.Institute_ID] = []
  byInstitute[s.Institute_ID].push(s)
}

const validInstitutes = Object.entries(byInstitute)
  .filter(([, ss]) => ss.length >= 20)
  .map(([id]) => id)

console.log('Institute:', validInstitutes.map(id => instNames[id]).join(', '))

// ─── Rolling Average ─────────────────────────────────────────────────────────
function rollingAvg(tStr, partyShortcut, surveyList) {
  const t = new Date(tStr)
  const cutoff = new Date(t - WINDOW_DAYS * 86400_000)
  const matches = []

  for (const s of surveyList) {
    if (s.Date > tStr || s.Date < cutoff.toISOString().slice(0, 10)) continue
    let pct = null
    for (const [pid, p] of Object.entries(raw.Parties)) {
      if (p.Shortcut === partyShortcut && s.Results[pid] != null) {
        pct = s.Results[pid]; break
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
  if (sumW <= 0) return null
  const result = matches.reduce((a, b) => a + b.pct * b.w, 0) / sumW
  return isFinite(result) ? result : null
}

// ─── Lineare Algebra (OLS) ───────────────────────────────────────────────────
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
  const n = Xmat.length, p = Xmat[0].length
  const XtX = Array.from({length: p}, (_, i) =>
    Array.from({length: p}, (_, j) => Xmat.reduce((s, r) => s + r[i]*r[j], 0))
  )
  const Xty = Array.from({length: p}, (_, i) => Xmat.reduce((s, r, k) => s + r[i]*y[k], 0))
  const beta = solveLinear(XtX, Xty)
  if (!beta) return null
  const yhat = Xmat.map(r => r.reduce((s, v, i) => s + v*beta[i], 0))
  return y.reduce((s, yi, i) => s + (yi - yhat[i])**2, 0)
}

// ─── F-Verteilung p-Wert ────────────────────────────────────────────────────
function lgamma(z) {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z)
  z -= 1
  const c = [0.99999999999980993,676.5203681218851,-1259.1392167224028,
              771.32342877765313,-176.61502916214059,12.507343278686905,
              -0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7]
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
    let num = m * (b - m) * x / ((a + 2*m - 1) * (a + 2*m))
    d = 1 + num * d; if (Math.abs(d) < 1e-30) d = 1e-30
    c = 1 + num / c; if (Math.abs(c) < 1e-30) c = 1e-30
    d = 1 / d; f *= c * d
    num = -(a + m) * (a + b + m) * x / ((a + 2*m) * (a + 2*m + 1))
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

// ─── Granger-Test ────────────────────────────────────────────────────────────
// Testet: Sagen vergangene Werte von x die Werte von y vorher,
// über vergangene Werte von y hinaus? (H0: nein)
function grangerTest(y, x, lags) {
  const n = y.length
  if (n < 2 * lags + 15) return null

  const yvec = [], Xr = [], Xu = []
  for (let t = lags; t < n; t++) {
    const rRow = [1], uRow = [1]
    for (let k = 1; k <= lags; k++) { rRow.push(y[t-k]); uRow.push(y[t-k]) }
    for (let k = 1; k <= lags; k++) { uRow.push(x[t-k]) }
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

  return {
    f:   Math.round(f * 100) / 100,
    p:   Math.round(fPValue(f, df1, df2) * 1000) / 1000,
    df1,
    df2,
    n,
  }
}

// ─── Zeitreihe aufbauen ──────────────────────────────────────────────────────
const weeks = []
for (let d = new Date(START_DATE); d <= END_DATE; d = new Date(d.getTime() + STEP_DAYS * 86400_000)) {
  weeks.push(d.toISOString().slice(0, 10))
}
console.log(`Wochen: ${weeks.length} (${weeks[0]} – ${weeks[weeks.length - 1]})`)

// ─── Hauptschleife ───────────────────────────────────────────────────────────
const results = {}

for (const party of TARGET_PARTIES) {
  console.log(`\n── ${party} ──`)
  results[party] = []

  for (const instId of validInstitutes) {
    const instSurveys   = byInstitute[instId]
    const otherSurveys  = surveys.filter(s => s.Institute_ID !== instId)

    // Wöchentliche Zeitreihen aufbauen
    const instSeries = [], looSeries = []
    for (const w of weeks) {
      instSeries.push(rollingAvg(w, party, instSurveys))
      looSeries.push(rollingAvg(w, party, otherSurveys))
    }

    // Nur Wochen wo beide Werte vorhanden
    const paired = weeks
      .map((_, i) => ({ inst: instSeries[i], loo: looSeries[i] }))
      .filter(p => p.inst != null && p.loo != null)

    if (paired.length < MIN_OBS) {
      console.log(`  ${instNames[instId].padEnd(30)} n=${paired.length} → zu wenig`)
      continue
    }

    // Erste Differenzen
    const dInst = paired.slice(1).map((p, i) => p.inst - paired[i].inst)
    const dLoo  = paired.slice(1).map((p, i) => p.loo  - paired[i].loo)

    // Granger-Test beide Richtungen
    const instToLoo = grangerTest(dLoo,  dInst, LAGS)
    const looToInst = grangerTest(dInst, dLoo,  LAGS)

    if (!instToLoo || !looToInst) {
      console.log(`  ${instNames[instId].padEnd(30)} → Test fehlgeschlagen`)
      continue
    }

    const sig = instToLoo.p < ALPHA ? '***' : instToLoo.p < 0.2 ? '  ·' : '   '
    console.log(
      `  ${sig} ${instNames[instId].padEnd(30)}` +
      ` inst→loo F=${instToLoo.f.toFixed(2)} p=${instToLoo.p.toFixed(3)}` +
      ` | loo→inst F=${looToInst.f.toFixed(2)} p=${looToInst.p.toFixed(3)}` +
      ` (n=${paired.length})`
    )

    results[party].push({
      institute:  instNames[instId],
      n:          paired.length,
      instToLoo:  instToLoo,
      looToInst:  looToInst,
      leadsConsensus: instToLoo.p < ALPHA && looToInst.p >= ALPHA,
      followsConsensus: looToInst.p < ALPHA && instToLoo.p >= ALPHA,
      bidirectional: instToLoo.p < ALPHA && looToInst.p < ALPHA,
    })
  }

  // Sortiere nach F-Statistik inst→loo absteigend
  results[party].sort((a, b) => b.instToLoo.f - a.instToLoo.f)
}

// ─── Output ──────────────────────────────────────────────────────────────────
const out = {
  meta: {
    generated:   new Date().toISOString().slice(0, 10),
    method:      `Bivariate Granger-Kausalität, VAR(${LAGS}), wöchentliche erste Differenzen, LOO-Konsens`,
    lags:        LAGS,
    windowDays:  WINDOW_DAYS,
    stepDays:    STEP_DAYS,
    minObs:      MIN_OBS,
    alpha:       ALPHA,
    startDate:   START_DATE.toISOString().slice(0, 10),
    endDate:     END_DATE.toISOString().slice(0, 10),
    interpretation: {
      leadsConsensus:   `Institut → Konsens sig (p<${ALPHA}), Konsens → Institut nicht sig`,
      followsConsensus: `Konsens → Institut sig (p<${ALPHA}), Institut → Konsens nicht sig`,
      bidirectional:    `Beide Richtungen sig`,
      none:             `Keine Richtung sig`,
    },
  },
  parties:    TARGET_PARTIES,
  institutes: validInstitutes.map(id => instNames[id]),
  results,
}

writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf-8')
console.log(`\n✓ ${OUT}`)
