/**
 * Pipeline: Bundestagsreden-Themenverlauf
 *
 * Liest CPP-BT Reden_Gesamt.csv (Wahlperioden 18–21, 2013–2026),
 * zählt Keyword-Treffer pro Thema und Jahr (Treffer/Mio. Tokens),
 * schreibt topics.json + series.json nach src/data/.
 *
 * Datenquelle: Sean Fobbe CPP-BT, gemeinfrei
 * https://codeberg.org/seanfobbe/cpp-bt
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import topics from './bundestag-sprache-lexikon.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const CSV_PATH = path.join(__dirname, 'raw', 'cpp-bt', 'CPP-BT_2026-01-17_DE_CSV_Reden_Gesamt.csv')
const OUT_TOPICS = path.join(ROOT, 'src', 'data', 'bundestag-sprache-topics.json')
const OUT_SERIES = path.join(ROOT, 'src', 'data', 'bundestag-sprache-series.json')

// Vorberechnete RegExps pro Thema (einmalig, nicht pro Zeile)
const topicPatterns = topics.map(({ key, keywords }) => ({
  key,
  // Alle Keywords als alternation, word-boundary links (kein \b rechts wegen Umlauten)
  re: new RegExp(
    keywords.map(kw => `(?<![a-zäöüß])${escapeRegex(kw)}`).join('|'),
    'gi'
  ),
}))

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Akkumulator: year → { topicKey: hitCount, _tokens: totalTokens, _speeches: count }
const byYear = new Map()

function getOrCreate(year) {
  if (!byYear.has(year)) {
    const entry = { _tokens: 0, _speeches: 0 }
    for (const { key } of topics) entry[key] = 0
    byYear.set(year, entry)
  }
  return byYear.get(year)
}

let rowCount = 0
let skipped = 0

console.log('Starte Ingest …')
console.log(`  CSV: ${CSV_PATH}`)
console.log(`  Themen: ${topics.length}`)

const stream = fs.createReadStream(CSV_PATH, { encoding: 'utf-8' })

await new Promise((resolve, reject) => {
  Papa.parse(stream, {
    header: true,
    skipEmptyLines: true,
    step(result) {
      const row = result.data
      const year = row.sitzung_jahr?.trim()
      const text = row.rede_text?.trim() ?? ''
      const tokensRaw = parseInt(row.tokens ?? '0', 10)

      // Zeilen ohne valides Jahr oder ohne Text überspringen
      if (!year || !/^\d{4}$/.test(year) || !text) {
        skipped++
        return
      }

      // Zu kurze Reden (Verfahrensrede / Applaus-Zeile) ignorieren
      if (tokensRaw < 20) {
        skipped++
        return
      }

      const entry = getOrCreate(year)
      entry._tokens += tokensRaw
      entry._speeches++

      const lc = text.toLowerCase()
      for (const { key, re } of topicPatterns) {
        const matches = lc.match(re)
        if (matches) entry[key] += matches.length
        re.lastIndex = 0
      }

      rowCount++
      if (rowCount % 10000 === 0) process.stdout.write(`  ${rowCount} Reden verarbeitet …\r`)
    },
    complete: resolve,
    error: reject,
  })
})

console.log(`\nIngest abgeschlossen: ${rowCount} Reden, ${skipped} übersprungen`)

// ── Normalisierung: Treffer / Mio. Tokens ──────────────────────────────────

const years = [...byYear.keys()].sort()
const series = years.map(year => {
  const entry = byYear.get(year)
  const mio = entry._tokens / 1_000_000 || 1
  const point = { year: parseInt(year, 10), _speeches: entry._speeches, _tokens: entry._tokens }
  for (const { key } of topics) {
    point[key] = Math.round((entry[key] / mio) * 10) / 10
  }
  return point
})

// ── Metadaten in topics.json (ohne keywords) ──────────────────────────────

const topicsMeta = topics.map(({ key, label, color }) => ({ key, label, color }))

// ── Ausgabe ───────────────────────────────────────────────────────────────

fs.writeFileSync(OUT_TOPICS, JSON.stringify(topicsMeta, null, 2), 'utf-8')
fs.writeFileSync(OUT_SERIES, JSON.stringify(series, null, 2), 'utf-8')

console.log(`\nGeschrieben:`)
console.log(`  ${OUT_TOPICS}`)
console.log(`  ${OUT_SERIES}`)
console.log(`\nJahre: ${years.join(', ')}`)
console.log('Stichprobe series[0]:', JSON.stringify(series[0]))
