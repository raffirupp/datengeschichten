/**
 * Ergänzt Sachsen-Anhalt 2026 in laender-election-accuracy.json.
 *
 * Andere Provenienz als der Rest der Datei: Der Hauptbestand (build-laender-election-accuracy.mjs)
 * kommt aus marktforschung.de-Artikeln. Für diese Wahl haben wir bewusst NICHT den (paywallgeschützten)
 * marktforschung.de-Artikel "Ein trauriger Sonntag für die Demoskopie in Sachsen-Anhalt" ausgewertet,
 * sondern die letzte Umfrage jedes Instituts direkt aus wahlrecht.de (öffentlich) bzw. Civeys eigener
 * Veröffentlichung nachgerechnet. Deviation = eigene Berechnung (poll - result), keine aus einem
 * Artikel übernommene Kennzahl.
 *
 * Quellen: https://www.wahlrecht.de/umfragen/landtage/sachsen-anhalt.htm
 *          Civey-Grafik (19.08.-02.09.2026, n=1.500, Fehlermarge ±4,8%)
 *          Ergebnis: https://de.wikipedia.org/wiki/Landtagswahl_in_Sachsen-Anhalt_2026 (vorläufiges Ergebnis)
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dir, '..', 'src', 'data', 'laender-election-accuracy.json')

const ELECTION_DATE = '2026-09-06'
const SOURCE_NOTE =
  'Umfragedaten: wahlrecht.de; Civey (eigene Veröffentlichung). Ergebnis: vorläufiges Ergebnis ' +
  'lt. Statistischem Landesamt Sachsen-Anhalt (Stand Wahlabend). Abweichung eigenständig berechnet ' +
  '— nicht aus marktforschung.de übernommen (Artikel ist kostenpflichtig).'
const NOTE =
  'Wahlergebnis vorläufig (Wahlabend-Stand), nicht das amtliche Endergebnis. ' + SOURCE_NOTE

// amtliches/vorläufiges Ergebnis je Partei (%)
const RESULT = {
  CDU: 17.2, AfD: 43.8, SPD: 9.3, Grüne: 8.9, Linke: 8.6, FDP: 2.6, BSW: 5.3,
}

// letzte Umfrage je Institut vor der Wahl (fieldwork_end = fieldwork-Ende bzw. Civey-Erhebungsende)
const POLLS = [
  { institute: 'Forschungsgruppe Wahlen', pollDate: '2026-09-03',
    values: { CDU: 23, AfD: 41, SPD: 8.5, Grüne: 6, Linke: 11.5, FDP: 3, BSW: 4 } },
  { institute: 'INSA', pollDate: '2026-09-01',
    values: { CDU: 22, AfD: 43, SPD: 7, Grüne: 5, Linke: 12, FDP: 3, BSW: 4 } },
  { institute: 'Infratest dimap', pollDate: '2026-08-25',
    // AfD=42, nicht 40: automatisierte Tabellen-Extraktion von wahlrecht.de hatte sich
    // wiederholt (40, 40, 40, dann 43) in der eng gepackten Institutstabelle vertan;
    // 42 manuell auf wahlrecht.de bestätigt und gegen WELT/dpa-Artikel (41-43%-Spanne
    // für CDU/AfD/Infratest dimap) gegengeprüft.
    values: { CDU: 23, AfD: 42, SPD: 9, Grüne: 6, Linke: 13, FDP: 3, BSW: 3 } },
  { institute: 'pollytix', pollDate: '2026-08-08',
    values: { CDU: 22, AfD: 42, SPD: 8, Grüne: 6, Linke: 11, FDP: 3, BSW: 4 } },
  { institute: 'Civey', pollDate: '2026-09-02',
    values: { CDU: 23, AfD: 41, SPD: 9, Grüne: 6, Linke: 12, FDP: 2, BSW: 4 } },
]

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86_400_000)
}

const round2 = (n) => Math.round(n * 100) / 100

const newEntries = []
for (const p of POLLS) {
  for (const [party, poll] of Object.entries(p.values)) {
    const result = RESULT[party]
    newEntries.push({
      year: '2026',
      electionDate: ELECTION_DATE,
      institute: p.institute,
      party,
      pollDate: p.pollDate,
      daysBeforeElection: daysBetween(p.pollDate, ELECTION_DATE),
      poll: round2(poll),
      result: round2(result),
      deviation: round2(poll - result),
      note: NOTE,
    })
  }
}

const data = JSON.parse(readFileSync(OUT, 'utf-8'))
const st = data.byState.ST

if (st.meta.elections.some((e) => e.year === '2026')) {
  console.error('✗ Sachsen-Anhalt 2026 ist schon in der Datei. Abbruch, nichts verändert.')
  process.exit(1)
}

st.meta.elections.push({ year: '2026', date: ELECTION_DATE, name: 'Landtagswahl Sachsen-Anhalt 2026' })
st.meta.elections.sort((a, b) => (a.date < b.date ? -1 : 1))

st.parties = [...new Set([...st.parties, ...Object.keys(RESULT)])].sort()
st.entries.push(...newEntries)

data.meta.generated = new Date().toISOString().slice(0, 10)
data.meta.sourceNote =
  'marktforschung.de, aufbereitet (Batch 1 + Ergänzung) — 16 Länder; ' +
  'Sachsen-Anhalt 2026 zusätzlich ergänzt aus öffentlichen Quellen (wahlrecht.de, Civey), ' +
  'eigenständig berechnet statt aus marktforschung.de übernommen.'

writeFileSync(OUT, JSON.stringify(data, null, 2), 'utf-8')
console.log(`✓ ${OUT}`)
console.log(`  Sachsen-Anhalt: ${st.meta.elections.map((e) => e.year).join('/')}, ${st.entries.length} Einträge total (+${newEntries.length} neu), Parteien: ${st.parties.join(', ')}`)
