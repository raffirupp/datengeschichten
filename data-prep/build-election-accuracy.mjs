import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import pkg from 'xlsx'
const { readFile, utils } = pkg

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dir, '..')
const XLS   = resolve(__dir, 'raw', 'gdelt-ngrams', 'wahlrecht-institute-genauigkeit-2017-2021-2025.xlsx')

// Excel-Seriendatum → ISO-String
function excelDateToIso(serial) {
  if (typeof serial !== 'number') return null
  const ms = (serial - 25569) * 86400 * 1000
  return new Date(ms).toISOString().slice(0, 10)
}

// Parteinamen: Excel → DAWUM-Keys
const PARTY_NORM = {
  'CDU/CSU': 'CDU/CSU',
  'SPD':     'SPD',
  'GRÜNE':   'Grüne',
  'FDP':     'FDP',
  'LINKE':   'Linke',
  'AfD':     'AfD',
  'BSW':     'BSW',
  // Sonstige wird nicht übernommen
}

// Institutnamen: normalisiert (aus Excel-Spalte B) → DAWUM-Key
const INST_NORM = {
  'Infratest dimap':                                  'Infratest dimap',
  'Verian (ehem. Emnid/TNS Emnid/Kantar Emnid)':     'Verian (Emnid)',
  'INSA':                                             'INSA',
  'Forsa':                                            'Forsa',
  'Allensbach':                                       'Allensbach',
  'GMS':                                              'GMS',
  'YouGov':                                           'YouGov',
  'Civey':                                            'Civey',
  'Forschungsgruppe Wahlen':                          'Forschungsgruppe Wahlen',
  'Ipsos':                                            'Ipsos',
  'Pollytix':                                         'pollytix',
  // Folgende können nicht auf DAWUM-Institute abgebildet werden → überspringen
  'INSA/YouGov (gemeinsames Produkt, historisch)':    null,
  'SPON-Wahltrend/Civey (gemeinsames Produkt, historisch)': null,
  'YouGov (MRP-Modell)':                              null,
}

const ELECTIONS = [
  { year: 2017, sheet: '2017' },
  { year: 2021, sheet: '2021' },
  { year: 2025, sheet: '2025' },
]

const PARTIES = ['CDU/CSU', 'SPD', 'Grüne', 'AfD', 'FDP', 'Linke', 'BSW']

const wb = readFile(XLS)
const entries = []
const electionDates = {}

for (const { year, sheet } of ELECTIONS) {
  const ws = wb.Sheets[sheet]
  if (!ws) { console.warn(`Sheet ${sheet} nicht gefunden`); continue }

  const rows = []
  const raw = utils.sheet_to_json(ws, { header: 1, defval: '' })

  // Wahldatum aus Zeile 1 (Spalte B, Excel-Serial)
  const electionSerial = raw[1]?.[1]
  const electionDate   = excelDateToIso(electionSerial) ?? `${year}-unknown`
  electionDates[year]  = electionDate

  // Detailzeilen: ab der Zeile nach dem Header "Institut (Original)"
  const headerIdx = raw.findIndex(r => r[0] === 'Institut (Original)')
  if (headerIdx < 0) { console.warn(`Kein Header in Sheet ${sheet}`); continue }

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i]
    const instRaw  = String(row[0] ?? '').trim()
    const instNorm = String(row[1] ?? '').trim()
    const partyRaw = String(row[2] ?? '').trim()
    const dateRaw  = row[3]
    const daysB4   = typeof row[4] === 'number' ? row[4] : null
    const pollPct  = typeof row[5] === 'number' ? row[5] : null
    const resPct   = typeof row[6] === 'number' ? row[6] : null
    const devPct   = typeof row[7] === 'number' ? row[7] : null
    const note     = String(row[8] ?? '').trim()

    if (!instRaw || pollPct === null || resPct === null) continue

    const dawumInst = INST_NORM[instNorm]
    if (dawumInst === null) continue          // joint products überspringen
    if (dawumInst === undefined) {
      console.warn(`Unbekanntes Institut: "${instNorm}"`)
      continue
    }

    const party = PARTY_NORM[partyRaw]
    if (!party) continue                      // Sonstige überspringen

    const pollDate = typeof dateRaw === 'number' ? excelDateToIso(dateRaw) : null

    entries.push({
      year,
      electionDate,
      institute:         dawumInst,
      party,
      pollDate,
      daysBeforeElection: daysB4,
      poll:    Math.round(pollPct * 100) / 100,
      result:  Math.round(resPct  * 100) / 100,
      // deviation = poll - result (positiv = Institut lag zu hoch)
      deviation: Math.round((pollPct - resPct) * 100) / 100,
      note:    note || null,
    })
  }

  console.log(`${year}: ${entries.filter(e => e.year === year).length} Einträge, Wahltag ${electionDate}`)
}

// Übersicht
const instYears = {}
for (const e of entries) {
  const k = e.institute
  if (!instYears[k]) instYears[k] = new Set()
  instYears[k].add(e.year)
}
console.log('\nInstitute × Wahljahre:')
Object.entries(instYears)
  .sort((a,b) => b[1].size - a[1].size)
  .forEach(([inst, yrs]) => console.log(`  ${inst.padEnd(30)} ${[...yrs].sort().join(', ')}`))

const out = {
  meta: {
    generated:   new Date().toISOString().slice(0, 10),
    elections:   ELECTIONS.map(e => ({ year: e.year, date: electionDates[e.year] })),
    parties:     PARTIES,
    note:        'Abweichung = letzte Umfrage vor der Wahl minus amtliches Wahlergebnis in Prozentpunkten. Positiv = Institut lag zu hoch.',
    caveat2017:  'Für 2017 lagen keine genauen Umfragedaten vor — Abweichungen sind vorhanden, Umfragedaten jedoch unbekannt.',
    sourceNote:  'wahlrecht.de / marktforschung.de (aufbereitet)',
  },
  parties: PARTIES,
  entries,
}

const outPath = resolve(ROOT, 'src', 'data', 'election-accuracy.json')
writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8')
console.log(`\n✓ ${outPath}  (${entries.length} Einträge)`)
