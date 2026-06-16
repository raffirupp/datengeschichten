import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT    = resolve(__dir, '..')
const RAW_DIR = resolve(__dir, 'raw')
const RAW_GEO = resolve(RAW_DIR, 'laender.geojson')
const OUT_GEO = resolve(ROOT, 'src', 'data', 'laender-geo.json')

const PRIMARY_URL = 'https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_20M_2021_3035.geojson'
const INDEX_URL    = 'https://gisco-services.ec.europa.eu/distribution/v2/nuts/nuts-2021-files.json'

// NUTS-1-ID -> unser Ländercode
const NUTS_TO_CODE = {
  DE1: 'BW', DE2: 'BY', DE3: 'BE', DE4: 'BB', DE5: 'HB',
  DE6: 'HH', DE7: 'HE', DE8: 'MV', DE9: 'NI', DEA: 'NW',
  DEB: 'RP', DEC: 'SL', DED: 'SN', DEE: 'ST', DEF: 'SH', DEG: 'TH',
}

// ---- Download helper ----
async function download(url) {
  let res
  try { res = await fetch(url) } catch (e) {
    console.error(`Netzwerkfehler (${url}): ${e.message}`)
    process.exit(1)
  }
  if (!res.ok) {
    console.error(`HTTP ${res.status} für ${url}`)
    return null
  }
  return res.text()
}

// ---- Step 1: get raw GeoJSON ----
if (!existsSync(RAW_DIR)) mkdirSync(RAW_DIR, { recursive: true })

if (!existsSync(RAW_GEO)) {
  console.log('Lade GISCO-NUTS-Geometrien …')
  let text = await download(PRIMARY_URL)

  if (!text) {
    console.log('Primär-URL nicht erreichbar, suche im Index …')
    const indexText = await download(INDEX_URL)
    if (!indexText) {
      console.error('Index ebenfalls nicht erreichbar. Bitte Datei manuell laden:')
      console.error(`  ${PRIMARY_URL}`)
      console.error(`  → speichern als: data-prep/raw/laender.geojson`)
      process.exit(1)
    }
    const index = JSON.parse(indexText)
    const entry = Object.values(index).find(e =>
      e.id && e.id.includes('RG') && e.id.includes('20M') && e.id.includes('3035') && e.format === 'geojson'
    )
    if (!entry?.url) {
      console.error('Kein passender Eintrag im Index gefunden.')
      process.exit(1)
    }
    text = await download(entry.url)
    if (!text) {
      console.error('Fallback-URL ebenfalls fehlgeschlagen.')
      process.exit(1)
    }
  }

  writeFileSync(RAW_GEO, text, 'utf-8')
  console.log(`Gespeichert: ${RAW_GEO}`)
} else {
  console.log('Geo-Datei vorhanden, kein Download nötig.')
}

// ---- Step 2: parse & filter ----
const raw = JSON.parse(readFileSync(RAW_GEO, 'utf-8'))
console.log(`Features gesamt: ${raw.features.length}`)

const features = []
for (const feat of raw.features) {
  const props = feat.properties ?? {}
  const levlCode = String(props.LEVL_CODE)
  const cntrCode = props.CNTR_CODE
  const nutsId = props.NUTS_ID
  if (cntrCode !== 'DE' || levlCode !== '1') continue

  const code = NUTS_TO_CODE[nutsId]
  if (!code) continue

  const name = props.NUTS_NAME || props.NAME_LATN || nutsId

  features.push({
    type: 'Feature',
    properties: { code, name },
    geometry: feat.geometry,
  })
}

// ---- Step 3: check completeness ----
const found = new Set(features.map(f => f.properties.code))
let allOk = true
for (const code of Object.values(NUTS_TO_CODE)) {
  if (!found.has(code)) {
    console.warn(`⚠ WARNUNG: ${code} fehlt im Quelldatensatz`)
    allOk = false
  }
}
if (allOk) console.log(`✓ Alle ${found.size} Länder vorhanden`)

// ---- Step 4: write ----
const output = { type: 'FeatureCollection', features }
writeFileSync(OUT_GEO, JSON.stringify(output), 'utf-8')
console.log(`\n✓ Ausgabe: ${OUT_GEO}`)
console.log(`  Länder: ${features.length}`)
