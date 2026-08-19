/**
 * Bundesregierungs-Koalitionen 1998–heute, aus der bereits vorhandenen ParlGov-CSV
 * (data-prep/raw/view_cabinet.csv, gleiche Quelle wie build-europe-governments.mjs).
 * Anders als dort wird hier nicht ein gewichteter Links-Rechts-Mittelwert gebildet,
 * sondern die tatsächliche Parteizusammensetzung jeder Koalition erhalten — analog zu
 * src/data/laender-coalitions.json (volle Koalition, nicht nur Regierungschef-Partei).
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '..')
const RAW_CSV = resolve(__dir, 'raw', 'view_cabinet.csv')
const OUT_JSON = resolve(ROOT, 'src', 'data', 'bundestag-governments.json')

// ParlGov party_name_short → Projekt-Parteicode. Bewusst identisch zur Schreibweise der
// DAWUM-Parteikürzel in polls-bundestag.json (nicht zu partyLeftRight.js/laender-coalitions.json,
// die "GRÜNE"/"LINKE" großschreiben) — GovOppositionChart summiert Umfragewerte direkt über
// diese Codes, ein Schreibweisen-Mismatch würde Koalitionsparteien stillschweigend als
// Opposition zählen.
const PARTY_MAP = {
  'CDU+CSU': 'CDU/CSU',
  'SPD': 'SPD',
  'FDP': 'FDP',
  'B90/Gru': 'Grüne',
  'PDS|Li': 'Linke',
  'AfD': 'AfD',
  'SSW': 'SSW',
}

const csvText = readFileSync(RAW_CSV, 'utf-8')
const { data: rows } = Papa.parse(csvText, { header: true, dynamicTyping: false, skipEmptyLines: true })

const deuRows = rows.filter((r) => r.country_name_short === 'DEU' && r.start_date >= '1998-01-01')

// Gruppieren nach cabinet_id
const cabinetMap = new Map()
for (const row of deuRows) {
  const id = row.cabinet_id
  if (!cabinetMap.has(id)) {
    cabinetMap.set(id, {
      cabinetId: id,
      cabinetName: row.cabinet_name,
      startDate: row.start_date,
      caretaker: row.caretaker === '1',
      parties: new Set(),
      headOfGovernmentParty: null,
    })
  }
  const cab = cabinetMap.get(id)
  if (row.cabinet_party === '1') {
    const code = PARTY_MAP[row.party_name_short]
    if (!code) {
      console.warn(`⚠ Unbekannte Partei "${row.party_name_short}" in Kabinett ${row.cabinet_name} — übersprungen`)
      continue
    }
    cab.parties.add(code)
    if (row.prime_minister === '1') cab.headOfGovernmentParty = code
  }
}

// Chronologisch sortieren, 1-Tages-Caretaker-Kabinette (ParlGov-Artefakt für die
// geschäftsführende Regierung zwischen Wahl und Koalitionsbildung) auslassen, statt als
// eigene Periode zu führen — die vorangehende Koalition gilt bis zur nächsten echten an.
const cabinets = [...cabinetMap.values()]
  .filter((c) => !c.caretaker && c.parties.size > 0)
  .sort((a, b) => (a.startDate < b.startDate ? -1 : 1))

function personNameFromCabinet(cabinetName) {
  // "Merkel V" -> "Merkel", "Scholz" -> "Scholz" (ParlGov führt nur Nachnamen)
  return cabinetName.replace(/\s+[IVX]+$/, '').trim()
}

const governments = cabinets.map((cab, i) => ({
  cabinet: cab.cabinetName,
  headOfGovernment: personNameFromCabinet(cab.cabinetName),
  start: cab.startDate,
  end: cabinets[i + 1]?.startDate ?? null,
  parties: [...cab.parties].sort(),
  datePrecision: 'day',
}))

// Manuell ergänzt: Merz-Kabinett 2025, in ParlGov (Stand dieser CSV) noch nicht enthalten.
// Gleiches Vorgehen wie data-prep/raw/europe-recent-changes.json für die Europa-Karte.
governments.push({
  cabinet: 'Merz',
  headOfGovernment: 'Merz',
  start: '2025-05-06',
  end: null,
  parties: ['CDU/CSU', 'SPD'],
  datePrecision: 'day',
})
// Vorherige Regierung bekommt dadurch ein Enddatum
if (governments.length >= 2) {
  governments[governments.length - 2].end = '2025-05-06'
}

const output = {
  meta: {
    title: 'Bundesregierungen seit 1998',
    description: 'Für jede Bundesregierung: Amtszeit und vollständige Koalition (alle Regierungsparteien, nicht nur die Partei der Kanzlerin/des Kanzlers).',
    compiledDate: new Date().toISOString().slice(0, 10),
    partyCodesUsed: [...new Set(governments.flatMap((g) => g.parties))].sort(),
    partyNamingNotes: [
      'Kürzel passend zu partyColors.js: "CDU/CSU" als kombinierter Code (ParlGov führt CDU/CSU auf Bundesebene nie getrennt, anders als die Länder-Daten).',
    ],
    sources: [
      'ParlGov (Döring & Manow), data-prep/raw/view_cabinet.csv — für Kabinette bis Scholz (Dez. 2021).',
      'Kabinett Merz (2025) manuell ergänzt, da nicht in dieser ParlGov-Version enthalten — analog zu data-prep/raw/europe-recent-changes.json.',
    ],
  },
  governments,
}

writeFileSync(OUT_JSON, JSON.stringify(output, null, 2), 'utf-8')
console.log(`✓ ${OUT_JSON}`)
console.log(`  ${governments.length} Regierungen, ${governments[0].start} – heute`)
for (const g of governments) {
  console.log(`  ${g.start} – ${g.end ?? 'heute'}  ${g.cabinet.padEnd(12)} ${g.parties.join(' + ')}`)
}
