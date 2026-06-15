import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT    = resolve(__dir, '..')
const RAW_DIR = resolve(__dir, 'raw')
const RAW_GEO = resolve(RAW_DIR, 'cntr-rg-20m-3035.geojson')
const OUT_GEO = resolve(ROOT, 'src', 'data', 'europe-geo.json')

const PRIMARY_URL = 'https://gisco-services.ec.europa.eu/distribution/v2/countries/geojson/CNTR_RG_20M_2020_3035.geojson'
const INDEX_URL   = 'https://gisco-services.ec.europa.eu/distribution/v2/countries/countries-2020-files.json'

// ISO3 (ParlGov) -> Eurostat 2-letter
const iso3ToEu2 = {
  ISL:'IS', NOR:'NO', SWE:'SE', FIN:'FI',
  GBR:'UK', DNK:'DK', EST:'EE',
  IRL:'IE', NLD:'NL', DEU:'DE', POL:'PL', LVA:'LV',
  BEL:'BE', LUX:'LU', CZE:'CZ', LTU:'LT',
  FRA:'FR', CHE:'CH', AUT:'AT', SVK:'SK',
  PRT:'PT', ESP:'ES', ITA:'IT', SVN:'SI', HUN:'HU', ROU:'RO',
  HRV:'HR', BGR:'BG',
  MLT:'MT', GRC:'EL', CYP:'CY',
}
const eu2ToIso3 = Object.fromEntries(Object.entries(iso3ToEu2).map(([k,v]) => [v,k]))
const WHITELIST_EU2 = new Set(Object.values(iso3ToEu2))

// ---- bbox (EPSG:3035 / LAEA Europe, metres) ----
// Wide enough to include Iceland (x~1900000) and Cyprus (y~1400000),
// while still cutting French Guiana, Azores, Canarias etc.
// Azores: x~1100000 → outside xMin:1_200_000 ✓
// Iceland west: x~1900000 → inside xMin:1_200_000 ✓
const BBOX = { xMin:1_200_000, yMin:1_200_000, xMax:6_900_000, yMax:5_900_000 }

function inBbox([x, y]) {
  return x >= BBOX.xMin && x <= BBOX.xMax && y >= BBOX.yMin && y <= BBOX.yMax
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
  console.log('Lade GISCO-Ländergeometrien …')
  let text = await download(PRIMARY_URL)

  if (!text) {
    console.log('Primär-URL nicht erreichbar, suche im Index …')
    const indexText = await download(INDEX_URL)
    if (!indexText) {
      console.error('Index ebenfalls nicht erreichbar. Bitte Datei manuell laden:')
      console.error(`  ${PRIMARY_URL}`)
      console.error(`  → speichern als: data-prep/raw/cntr-rg-20m-3035.geojson`)
      process.exit(1)
    }
    const index = JSON.parse(indexText)
    // Finde Eintrag: RG + 20M + 3035 + GeoJSON
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
  const eu2 = feat.properties?.CNTR_ID
  if (!eu2 || !WHITELIST_EU2.has(eu2)) continue

  const iso3 = eu2ToIso3[eu2]
  const name = feat.properties.NAME_ENGL || feat.properties.NAME_LATN || eu2
  const geom = feat.geometry

  let filteredGeom = null

  if (geom.type === 'Polygon') {
    // Keep only if first outer-ring coordinate is inside bbox
    const firstPt = geom.coordinates[0][0]
    if (inBbox(firstPt)) filteredGeom = geom
  } else if (geom.type === 'MultiPolygon') {
    // Keep sub-polygons whose first outer-ring coordinate is inside bbox
    const kept = geom.coordinates.filter(poly => inBbox(poly[0][0]))
    if (kept.length > 0) {
      filteredGeom = kept.length === 1
        ? { type: 'Polygon', coordinates: kept[0] }
        : { type: 'MultiPolygon', coordinates: kept }
    }
  }

  if (!filteredGeom) continue

  features.push({
    type: 'Feature',
    properties: { iso3, name },
    geometry: filteredGeom,
  })
}

// ---- Step 3: check completeness ----
const found = new Set(features.map(f => f.properties.iso3))
let allOk = true
for (const iso3 of Object.keys(iso3ToEu2)) {
  if (!found.has(iso3)) {
    console.warn(`⚠ WARNUNG: ${iso3} (${iso3ToEu2[iso3]}) fehlt — bbox zu eng oder nicht im Quelldatensatz`)
    allOk = false
  }
}
if (allOk) console.log(`✓ Alle ${found.size} Länder vorhanden`)

// ---- Step 4: write ----
const output = { type: 'FeatureCollection', features }
writeFileSync(OUT_GEO, JSON.stringify(output), 'utf-8')
console.log(`\n✓ Ausgabe: ${OUT_GEO}`)
console.log(`  Länder: ${features.length}`)
