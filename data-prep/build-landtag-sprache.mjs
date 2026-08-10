/**
 * Pipeline: Landtags-Themenverlauf
 *
 * Liest StateParl v3 paragraphs.csv (16 Landesparlamente, 2000–2025),
 * zählt Keyword-Treffer pro Thema, Bundesland/Partei und Jahr (Treffer/Mio. Tokens),
 * schreibt topics.json + national.json + states.json + parties.json nach src/data/.
 *
 * Datenquelle: Beltermann, E., Souris, A., Nguyen, C., & Kropp, S. (2026).
 * StateParl (Version 3.0.0) [Data set]. GESIS, Cologne. https://doi.org/10.7802/3062
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import topics from './landtag-sprache-lexikon.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const CSV_PATH = path.join(__dirname, 'raw', 'stateparl', 'csv', 'stateparl_v3_paragraphs.csv')
const OUT_TOPICS = path.join(ROOT, 'src', 'data', 'landtag-sprache-topics.json')
const OUT_NATIONAL = path.join(ROOT, 'src', 'data', 'landtag-sprache-national.json')
const OUT_STATES = path.join(ROOT, 'src', 'data', 'landtag-sprache-states.json')
const OUT_PARTIES = path.join(ROOT, 'src', 'data', 'landtag-sprache-parties.json')
const OUT_PARTIES_TOTAL = path.join(ROOT, 'src', 'data', 'landtag-sprache-parties-total.json')

// Regieanweisungen/Verfahrensteile ohne inhaltliche Aussage — nicht mitzählen
const EXCLUDED_AFFILIATIONS = new Set(['nsc', 'pre'])
const MIN_WORDS = 5

// StateParl-affiliation-Codes → Fraktionen aus partyColors.js. Regierungsbank
// ("gov", Minister-Antworten, keine Fraktion) und kleine/historische Parteien
// (npd, dvu, rep, ssw, pir, ind, oth, …) bleiben außen vor — sonst kaum lesbar.
// "lin" bekommt die historische PDS-Vorläuferin dazu (Fusion 2007), sonst
// wirkt Die Linke in den 2000ern künstlich klein.
const PARTY_MAP = {
  cdu: 'CDU/CSU', csu: 'CDU/CSU',
  spd: 'SPD',
  grn: 'Grüne',
  fdp: 'FDP',
  afd: 'AfD',
  lin: 'Linke', pds: 'Linke',
  bsw: 'BSW',
  frw: 'Freie Wähler',
}

// Vorberechnete RegExps pro Thema (einmalig, nicht pro Zeile)
const topicPatterns = topics.map(({ key, keywords }) => ({
  key,
  re: new RegExp(
    keywords.map(kw => `(?<![a-zäöüß])${escapeRegex(kw)}`).join('|'),
    'gi'
  ),
}))

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// state → year → { _tokens, _paragraphs, topicKey: hitCount }
const byStateYear = new Map()
// party → year → { _tokens, _paragraphs, topicKey: hitCount }
const byPartyYear = new Map()

function getOrCreate(map, groupKey, year) {
  if (!map.has(groupKey)) map.set(groupKey, new Map())
  const byYear = map.get(groupKey)
  if (!byYear.has(year)) {
    const entry = { _tokens: 0, _paragraphs: 0 }
    for (const { key } of topics) entry[key] = 0
    byYear.set(year, entry)
  }
  return byYear.get(year)
}

function accumulate(entry, wordCount, lc) {
  entry._tokens += wordCount
  entry._paragraphs++
  for (const { key, re } of topicPatterns) {
    const matches = lc.match(re)
    if (matches) entry[key] += matches.length
    re.lastIndex = 0
  }
}

let rowCount = 0
let kept = 0
let skipped = 0

console.log('Starte Ingest …')
console.log(`  CSV: ${CSV_PATH}`)
console.log(`  Themen: ${topics.length}`)

const stream = fs.createReadStream(CSV_PATH, { encoding: 'utf-8' })

await new Promise((resolve, reject) => {
  Papa.parse(stream, {
    header: true,
    delimiter: '|',
    skipEmptyLines: true,
    step(result) {
      rowCount++
      const row = result.data
      const state = row.state?.trim()
      const affiliation = row.affiliation?.trim()
      const date = row.date?.trim()
      const text = row.content?.trim() ?? ''

      if (!state || !date || !text) { skipped++; return }
      if (EXCLUDED_AFFILIATIONS.has(affiliation)) { skipped++; return }

      const year = date.slice(0, 4)
      if (!/^\d{4}$/.test(year)) { skipped++; return }

      const wordCount = text.split(/\s+/).filter(Boolean).length
      if (wordCount < MIN_WORDS) { skipped++; return }

      const lc = text.toLowerCase()

      const stateEntry = getOrCreate(byStateYear, state.toUpperCase(), year)
      accumulate(stateEntry, wordCount, lc)

      const party = PARTY_MAP[affiliation]
      if (party) {
        const partyEntry = getOrCreate(byPartyYear, party, year)
        accumulate(partyEntry, wordCount, lc)
      }

      kept++
      if (rowCount % 200000 === 0) process.stdout.write(`  ${rowCount} Zeilen gelesen (${kept} verwendet) …\r`)
    },
    complete: resolve,
    error: reject,
  })
})

console.log(`\nIngest abgeschlossen: ${rowCount} Zeilen, ${kept} verwendet, ${skipped} übersprungen`)

// ── Normalisierung: Treffer / Mio. Tokens ──────────────────────────────────

function normalize(entry) {
  const mio = entry._tokens / 1_000_000 || 1
  const point = { _tokens: entry._tokens }
  for (const { key } of topics) {
    point[key] = Math.round((entry[key] / mio) * 10) / 10
  }
  return point
}

// ── states.json: flache Liste { state, year, _tokens, topicKey... } ───────

const statesOut = []
const states = [...byStateYear.keys()].sort()
for (const state of states) {
  const byYear = byStateYear.get(state)
  const years = [...byYear.keys()].sort()
  for (const year of years) {
    const entry = byYear.get(year)
    statesOut.push({ state, year: parseInt(year, 10), _paragraphs: entry._paragraphs, ...normalize(entry) })
  }
}

// ── parties.json: flache Liste { party, year, _tokens, topicKey... } ──────

const partiesOut = []
const parties = [...byPartyYear.keys()].sort()
for (const party of parties) {
  const byYear = byPartyYear.get(party)
  const years = [...byYear.keys()].sort()
  for (const year of years) {
    const entry = byYear.get(year)
    partiesOut.push({ party, year: parseInt(year, 10), _paragraphs: entry._paragraphs, ...normalize(entry) })
  }
}

// ── parties-total.json: über alle Jahre summiert, aus den rohen (noch nicht
// normalisierten) Jahreswerten — vermeidet Rundungsfehler durch nachträgliches
// Aufsummieren bereits normalisierter Werte ───────────────────────────────

const partiesTotalOut = parties.map(party => {
  const byYear = byPartyYear.get(party)
  const acc = { _tokens: 0, _paragraphs: 0 }
  for (const { key } of topics) acc[key] = 0
  for (const entry of byYear.values()) {
    acc._tokens += entry._tokens
    acc._paragraphs += entry._paragraphs
    for (const { key } of topics) acc[key] += entry[key]
  }
  return { party, _paragraphs: acc._paragraphs, ...normalize(acc) }
})

// ── national.json: über alle Bundesländer summierte Jahreswerte ───────────

const nationalByYear = new Map()
for (const state of states) {
  const byYear = byStateYear.get(state)
  for (const [year, entry] of byYear) {
    if (!nationalByYear.has(year)) {
      const acc = { _tokens: 0, _paragraphs: 0 }
      for (const { key } of topics) acc[key] = 0
      nationalByYear.set(year, acc)
    }
    const acc = nationalByYear.get(year)
    acc._tokens += entry._tokens
    acc._paragraphs += entry._paragraphs
    for (const { key } of topics) acc[key] += entry[key]
  }
}

const nationalYears = [...nationalByYear.keys()].sort()
const nationalOut = nationalYears.map(year => {
  const entry = nationalByYear.get(year)
  return { year: parseInt(year, 10), _paragraphs: entry._paragraphs, ...normalize(entry) }
})

// ── topics.json: Metadaten ohne keywords ───────────────────────────────────

const topicsMeta = topics.map(({ key, label, color }) => ({ key, label, color }))

// ── Ausgabe ───────────────────────────────────────────────────────────────

fs.writeFileSync(OUT_TOPICS, JSON.stringify(topicsMeta, null, 2), 'utf-8')
fs.writeFileSync(OUT_NATIONAL, JSON.stringify(nationalOut, null, 2), 'utf-8')
fs.writeFileSync(OUT_STATES, JSON.stringify(statesOut, null, 2), 'utf-8')
fs.writeFileSync(OUT_PARTIES, JSON.stringify(partiesOut, null, 2), 'utf-8')
fs.writeFileSync(OUT_PARTIES_TOTAL, JSON.stringify(partiesTotalOut, null, 2), 'utf-8')

console.log(`\nGeschrieben:`)
console.log(`  ${OUT_TOPICS}`)
console.log(`  ${OUT_NATIONAL}`)
console.log(`  ${OUT_STATES}`)
console.log(`  ${OUT_PARTIES}`)
console.log(`  ${OUT_PARTIES_TOTAL}`)
console.log(`\nBundesländer: ${states.join(', ')}`)
console.log(`Parteien: ${parties.join(', ')}`)
console.log('Stichprobe national[0]:', JSON.stringify(nationalOut[0]))
console.log('Stichprobe states[0]:', JSON.stringify(statesOut[0]))
console.log('Stichprobe parties[0]:', JSON.stringify(partiesOut[0]))
console.log('parties-total:', JSON.stringify(partiesTotalOut, null, 1))
