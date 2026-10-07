/**
 * Ergänzt Baden-Württemberg, Berlin und Mecklenburg-Vorpommern 2026 in laender-election-accuracy.json.
 *
 * Gleiche Methode wie build-sachsen-anhalt-2026-accuracy.mjs: Abweichung = letzte Umfrage je Institut
 * minus Wahlergebnis, eigenständig berechnet (nicht aus marktforschung.de). Die Umfragen kommen
 * aus src/data/polls-laender.json (je Institut die letzte Umfrage vor der Wahl, ab FROM_DATE,
 * damit alte Umfragen anderer Wahlen nicht mitlaufen).
 *
 * Ergebnisse (Zweitstimmen, %): BW amtliches Endergebnis; Wikipedia „Wahl zum Abgeordnetenhaus von Berlin 2026“ bzw.
 * „Landtagswahl in Mecklenburg-Vorpommern 2026“, Abruf 07.10.2026. Für MV sind AfD, SPD und CDU
 * zusätzlich durch Presseberichte bestätigt, Linke/Grüne/BSW nur durch Wikipedia.
 * Vor Veröffentlichung gegen das amtliche Endergebnis der Landeswahlleitungen prüfen.
 * FDP in MV: kein Einzelergebnis ausgewiesen (unter „Sonstige“), daher kein Eintrag.
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dir, '..', 'src', 'data', 'laender-election-accuracy.json')
const POLLS = resolve(__dir, '..', 'src', 'data', 'polls-laender.json')

const WINDOW_DAYS = 60 // nur Umfragen aus den 60 Tagen vor der Wahl, keine alten Umfragen anderer Wahlen
const NOTE =
  'Umfragen: polls-laender.json (Quelle wahlrecht.de u. a.). Ergebnis: Wikipedia, Stand 07.10.2026, ' +
  'noch nicht gegen das amtliche Endergebnis geprüft. Abweichung eigenständig berechnet.'

const ELECTIONS = {
  BW: {
    name: 'Landtagswahl Baden-Württemberg 2026',
    date: '2026-03-08',
    note: 'Umfragen: polls-laender.json (Quelle wahlrecht.de u. a.). Ergebnis: amtliches Endergebnis ' +
      '(Statistisches Landesamt Baden-Württemberg). Abweichung eigenständig berechnet.',
    // amtliches Endergebnis (baden-wuerttemberg.de); BSW nicht einzeln ausgewiesen
    result: { Grüne: 30.2, CDU: 29.7, AfD: 18.8, SPD: 5.5, FDP: 4.4, Linke: 4.4 },
  },
  BE: {
    date: '2026-09-20',
    name: 'Abgeordnetenhauswahl Berlin 2026',
    result: { Linke: 25.7, CDU: 18.8, AfD: 16.3, Grüne: 14.3, SPD: 12.1, BSW: 4.7, FDP: 2.5 },
  },
  MV: {
    date: '2026-09-20',
    name: 'Landtagswahl Mecklenburg-Vorpommern 2026',
    result: { AfD: 38.2, SPD: 35.5, Linke: 6.5, Grüne: 5.7, CDU: 4.9, BSW: 4.8 },
  },
}

const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86_400_000)
const round2 = (n) => Math.round(n * 100) / 100

const data = JSON.parse(readFileSync(OUT, 'utf-8'))
const polls = JSON.parse(readFileSync(POLLS, 'utf-8'))

for (const [code, el] of Object.entries(ELECTIONS)) {
  const st = data.byState[code]
  if (st.meta.elections.some((e) => e.year === '2026')) {
    console.log(`– ${code} 2026 ist schon in der Datei, übersprungen.`)
    continue
  }
  const ELECTION_DATE = el.date
  const FROM_DATE = new Date(new Date(ELECTION_DATE) - WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)
  const lastByInstitute = new Map()
  for (const p of polls.byState[code].polls) {
    if (p.date >= FROM_DATE && p.date < ELECTION_DATE) lastByInstitute.set(p.institute, p)
  }
  const entries = []
  for (const p of lastByInstitute.values()) {
    for (const [party, result] of Object.entries(el.result)) {
      const poll = p.results[party]
      if (poll == null) continue
      entries.push({
        year: '2026', electionDate: ELECTION_DATE, institute: p.institute, party,
        pollDate: p.date, daysBeforeElection: daysBetween(p.date, ELECTION_DATE),
        poll: round2(poll), result: round2(result), deviation: round2(poll - result), note: el.note ?? NOTE,
      })
    }
  }
  st.meta.elections.push({ year: '2026', date: ELECTION_DATE, name: el.name })
  st.meta.elections.sort((a, b) => (a.date < b.date ? -1 : 1))
  st.parties = [...new Set([...st.parties, ...Object.keys(el.result)])].sort()
  st.entries.push(...entries)
  console.log(`✓ ${code}: +${entries.length} Einträge, ${lastByInstitute.size} Institute (${[...lastByInstitute.keys()].join(', ')})`)
}

data.meta.generated = new Date().toISOString().slice(0, 10)
data.meta.sourceNote += ' Baden-Württemberg, Berlin und Mecklenburg-Vorpommern 2026 ergänzt aus polls-laender.json und Wikipedia (eigene Berechnung).'
writeFileSync(OUT, JSON.stringify(data, null, 2), 'utf-8')
