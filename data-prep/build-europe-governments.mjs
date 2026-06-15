import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '..')
const RAW_DIR = resolve(__dir, 'raw')
const RAW_CSV = resolve(RAW_DIR, 'view_cabinet.csv')
const OUT_JSON = resolve(ROOT, 'src', 'data', 'europe-governments.json')
const CSV_URL = 'https://www.parlgov.org/data/parlgov-development_csv-utf-8/view_cabinet.csv'

// Tile layout whitelist
const TILE_CODES = new Set([
  'ISL','NOR','SWE','FIN',
  'GBR','DNK','EST',
  'IRL','NLD','DEU','POL','LVA',
  'BEL','LUX','CZE','LTU',
  'FRA','CHE','AUT','SVK',
  'PRT','ESP','ITA','SVN','HUN','ROU',
  'HRV','BGR',
  'MLT','GRC','CYP',
])

const START_YEAR = 2000
const END_YEAR = 2025

// — Step 1: get raw CSV —
if (!existsSync(RAW_DIR)) mkdirSync(RAW_DIR, { recursive: true })

if (!existsSync(RAW_CSV)) {
  console.log('Lade view_cabinet.csv von ParlGov …')
  let res
  try {
    res = await fetch(CSV_URL)
  } catch (e) {
    console.error(`Netzwerkfehler: ${e.message}`)
    console.error(`Bitte die Datei manuell nach data-prep/raw/view_cabinet.csv legen:`)
    console.error(`  ${CSV_URL}`)
    process.exit(1)
  }
  if (!res.ok) {
    console.error(`Download fehlgeschlagen: HTTP ${res.status}`)
    console.error(`Bitte die Datei manuell nach data-prep/raw/view_cabinet.csv legen:`)
    console.error(`  ${CSV_URL}`)
    process.exit(1)
  }
  const text = await res.text()
  writeFileSync(RAW_CSV, text, 'utf-8')
  console.log(`Gespeichert: ${RAW_CSV}`)
} else {
  console.log('Raw-CSV vorhanden, kein Download nötig.')
}

// — Step 2: parse —
const csvText = readFileSync(RAW_CSV, 'utf-8')
const { data: rows } = Papa.parse(csvText, {
  header: true,
  dynamicTyping: false,
  skipEmptyLines: true,
})
console.log(`Zeilen gesamt: ${rows.length}`)

// — Step 3: filter to whitelist countries —
const filtered = rows.filter((r) => TILE_CODES.has(r.country_name_short))
console.log(`Zeilen nach Länder-Filter: ${filtered.length}`)

// — Step 4: group by (country_name_short, cabinet_id), compute weighted left_right mean —
const cabinetMap = new Map() // key: `${country}|${cabinet_id}` -> { country, cabinetId, startDate, sum, weight }

for (const row of filtered) {
  const country = row.country_name_short
  const cabinetId = row.cabinet_id
  const key = `${country}|${cabinetId}`

  if (!cabinetMap.has(key)) {
    cabinetMap.set(key, {
      country,
      cabinetId,
      startDate: row.start_date,
      sum: 0,
      weight: 0,
    })
  }
  const cab = cabinetMap.get(key)

  // Update start_date to earliest seen (data may have multiple rows per cabinet)
  if (row.start_date && (!cab.startDate || row.start_date < cab.startDate)) {
    cab.startDate = row.start_date
  }

  // Only governing parties with valid left_right and seats
  if (row.cabinet_party !== '1') continue
  const lr = parseFloat(row.left_right)
  const seats = parseFloat(row.seats)
  if (isNaN(lr) || row.left_right.trim() === '') continue
  const w = isNaN(seats) || seats <= 0 ? 1 : seats
  cab.sum += lr * w
  cab.weight += w
}

// Build cabinet list with value
const cabinets = []
for (const cab of cabinetMap.values()) {
  if (cab.weight === 0) continue // no valid governing parties
  cabinets.push({
    country: cab.country,
    startDate: cab.startDate,
    value: Math.round((cab.sum / cab.weight) * 100) / 100,
  })
}
console.log(`Kabinette mit Wert: ${cabinets.length}`)

// — Step 5: sort per country, compute validity intervals —
const byCountry = {}
for (const c of cabinets) {
  if (!byCountry[c.country]) byCountry[c.country] = []
  byCountry[c.country].push(c)
}
for (const country of Object.keys(byCountry)) {
  byCountry[country].sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
}

// — Step 6: for each year 2000–2025, find active cabinet per country on July 1 —
const years = []
for (let y = START_YEAR; y <= END_YEAR; y++) years.push(y)

const byYear = {}
let valueMin = Infinity
let valueMax = -Infinity
const countriesSet = new Set()

for (const year of years) {
  const snapshot = {}
  const julFirst = `${year}-07-01`

  for (const [country, cabs] of Object.entries(byCountry)) {
    // Find the last cabinet that started on or before July 1
    let active = null
    for (const cab of cabs) {
      if (cab.startDate <= julFirst) active = cab
      else break
    }
    if (!active) continue
    snapshot[country] = active.value
    if (active.value < valueMin) valueMin = active.value
    if (active.value > valueMax) valueMax = active.value
    countriesSet.add(country)
  }
  byYear[String(year)] = snapshot
}

// — Step 7: write JSON —
const output = {
  meta: {
    years,
    countries: [...countriesSet].sort(),
    valueMin: Math.round(valueMin * 100) / 100,
    valueMax: Math.round(valueMax * 100) / 100,
    mid: 5,
  },
  byYear,
}

writeFileSync(OUT_JSON, JSON.stringify(output, null, 2), 'utf-8')
console.log(`\n✓ Ausgabe: ${OUT_JSON}`)
console.log(`  Jahre: ${START_YEAR}–${END_YEAR}`)
console.log(`  Länder: ${countriesSet.size}`)
console.log(`  Wertebereich: ${output.meta.valueMin} – ${output.meta.valueMax}`)
