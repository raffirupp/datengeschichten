import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '..')
const CSV_FILE = resolve(__dir, 'raw', 'gdelt-ngrams', 'mentions-2020-2026.csv')
const OUT_JSON = resolve(ROOT, 'src', 'data', 'gdelt-signal.json')

// Mapping CSV-NGram -> JSON-Partei-Key
const NGRAM_TO_PARTY = {
  AfD: 'AfD',
  SPD: 'SPD',
  CDU: 'CDU',
  CSU: 'CSU',
  FDP: 'FDP',
  BSW: 'BSW',
  Grüne: 'GRÜNE',
  Linke: 'LINKE',
}

const PARTIES = ['CDU', 'CSU', 'SPD', 'GRÜNE', 'FDP', 'AfD', 'LINKE', 'BSW']

// CSV einlesen und parsen
const lines = readFileSync(CSV_FILE, 'utf-8').trim().split('\n')
lines.shift() // Header entfernen

// week -> party -> mentions
const raw = new Map()

for (const line of lines) {
  const [week, ngram, mentionsStr] = line.split(',')
  const party = NGRAM_TO_PARTY[ngram]
  if (!party) continue
  const mentions = Number(mentionsStr)

  if (!raw.has(week)) raw.set(week, new Map())
  raw.get(week).set(party, mentions)
}

const weeks = [...raw.keys()].sort()

// Gesamtmenge je Woche (Summe aller 8 Parteien)
const totalByWeek = new Map()
for (const week of weeks) {
  let total = 0
  for (const mentions of raw.get(week).values()) total += mentions
  totalByWeek.set(week, total)
}

// byParty aufbauen
const byParty = {}
for (const party of PARTIES) {
  byParty[party] = weeks
    .filter((week) => raw.get(week).has(party))
    .map((week) => {
      const mentions = raw.get(week).get(party)
      const total = totalByWeek.get(week)
      return {
        week,
        attentionShare: total > 0 ? Math.round((mentions / total) * 1000) / 1000 : null,
        mentions,
      }
    })
}

const output = {
  meta: {
    weeks,
    parties: PARTIES,
    generatedAt: new Date().toISOString(),
    sourceNote: 'GDELT Web NGrams 3.0 via BigQuery, deutschsprachige Quellen',
    begriffe: {
      AfD: ['AfD'],
      SPD: ['SPD'],
      CDU: ['CDU'],
      CSU: ['CSU'],
      FDP: ['FDP'],
      BSW: ['BSW'],
      GRÜNE: ['Grüne'],
      LINKE: ['Linke'],
    },
  },
  byParty,
}

writeFileSync(OUT_JSON, JSON.stringify(output, null, 2), 'utf-8')
console.log(`✓ Ausgabe: ${OUT_JSON}`)
console.log(`  Zeitraum: ${weeks[0]} – ${weeks.at(-1)} (${weeks.length} Wochen)`)
for (const party of PARTIES) {
  console.log(`  ${party}: ${byParty[party].length} Wochen`)
}
