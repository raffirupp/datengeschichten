import { useState } from 'react'
import { Link } from 'react-router-dom'
import pollsLaender     from '../../data/polls-laender.json'
import coalitions       from '../../data/laender-coalitions.json'
import houseEffects     from '../../data/laender-house-effects.json'
import leadLag          from '../../data/laender-lead-lag.json'
import granger          from '../../data/laender-granger.json'
import electionAccuracy from '../../data/laender-election-accuracy.json'
import PollSnapshot          from '../../components/PollSnapshot.jsx'
import PollTrendChart        from '../../components/PollTrendChart.jsx'
import GovOppositionChart    from '../../components/GovOppositionChart.jsx'
import HouseEffectsChart     from '../../components/HouseEffectsChart.jsx'
import ElectionAccuracyChart from '../../components/ElectionAccuracyChart.jsx'
import LeadLagChart          from '../../components/LeadLagChart.jsx'
import GrangerChart          from '../../components/GrangerChart.jsx'
import CurrentGovernmentNote from '../../components/CurrentGovernmentNote.jsx'
import CoalitionHistory      from '../../components/CoalitionHistory.jsx'
import { colorsFor } from '../../lib/categoryColors.js'

const catColors = colorsFor('Deutschland')

// Ländercode (polls-laender.json / laender-coalitions.json) <-> DAWUM-Parlamentsname
// (laender-house-effects.json) <-> DAWUM-Shortcut (laender-lead-lag.json / laender-granger.json).
// Drei verschiedene Schlüssel für dieselben 16 Länder, weil die Datensätze zu
// unterschiedlichen Zeitpunkten mit unterschiedlichen Konventionen gebaut wurden.
const STATES = [
  { code: 'BW', name: 'Baden-Württemberg', parliamentName: 'Landtag von Baden-Württemberg', shortcut: 'Baden-Württemberg' },
  { code: 'BY', name: 'Bayern', parliamentName: 'Bayerischer Landtag', shortcut: 'Bayern' },
  { code: 'BE', name: 'Berlin', parliamentName: 'Berliner Abgeordnetenhaus', shortcut: 'Berlin' },
  { code: 'BB', name: 'Brandenburg', parliamentName: 'Brandenburgischer Landtag', shortcut: 'Brandenburg' },
  { code: 'HB', name: 'Bremen', parliamentName: 'Bremische Bürgerschaft', shortcut: 'Bremen' },
  { code: 'HH', name: 'Hamburg', parliamentName: 'Hamburgische Bürgerschaft', shortcut: 'Hamburg' },
  { code: 'HE', name: 'Hessen', parliamentName: 'Hessischer Landtag', shortcut: 'Hessen' },
  { code: 'MV', name: 'Mecklenburg-Vorpommern', parliamentName: 'Landtag von Mecklenburg-Vorpommern', shortcut: 'Mecklenburg-Vorpommern' },
  { code: 'NI', name: 'Niedersachsen', parliamentName: 'Niedersächsischer Landtag', shortcut: 'Niedersachsen' },
  { code: 'NW', name: 'Nordrhein-Westfalen', parliamentName: 'Landtag von Nordrhein-Westfalen', shortcut: 'Nordrhein-Westfalen (NRW)' },
  { code: 'RP', name: 'Rheinland-Pfalz', parliamentName: 'Landtag von Rheinland-Pfalz', shortcut: 'Rheinland-Pfalz' },
  { code: 'SL', name: 'Saarland', parliamentName: 'Saarländischer Landtag', shortcut: 'Saarland' },
  { code: 'SN', name: 'Sachsen', parliamentName: 'Sächsischer Landtag', shortcut: 'Sachsen' },
  { code: 'ST', name: 'Sachsen-Anhalt', parliamentName: 'Landtag von Sachsen-Anhalt', shortcut: 'Sachsen-Anhalt' },
  { code: 'SH', name: 'Schleswig-Holstein', parliamentName: 'Landtag von Schleswig-Holstein', shortcut: 'Schleswig-Holstein' },
  { code: 'TH', name: 'Thüringen', parliamentName: 'Thüringischer Landtag', shortcut: 'Thüringen' },
]

const Divider = () => (
  <hr style={{ border: 'none', borderTop: '1px solid var(--color-rule)', margin: 0 }} />
)

const SectionLabel = ({ number, children }) => (
  <h2 style={{
    fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--color-muted)', margin: 0,
  }}>
    {number && <span style={{ color: catColors.text, fontWeight: 600 }}>{number} · </span>}
    {children}
  </h2>
)

const SectionHeading = ({ children }) => (
  <h2 style={{
    fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 32',
    fontSize: 'clamp(1.3rem, 3vw, 1.9rem)', fontWeight: 600, lineHeight: 1.2,
    letterSpacing: '-0.01em', color: 'var(--color-ink)', margin: 0,
  }}>
    {children}
  </h2>
)

function NoDataNote({ children }) {
  return (
    <div style={{
      padding: '0.85rem 1rem', border: '1px dashed var(--color-rule)', borderRadius: '8px',
      fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.6,
    }}>
      {children}
    </div>
  )
}

function StateSelector({ selected, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {STATES.map((s) => (
        <button
          key={s.code}
          onClick={() => onChange(s.code)}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '12px',
            padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
            border: `1px solid ${s.code === selected ? 'var(--color-ink)' : 'var(--color-rule)'}`,
            backgroundColor: s.code === selected ? 'var(--color-ink)' : 'transparent',
            color: s.code === selected ? 'var(--color-paper)' : 'var(--color-muted)',
            transition: 'background-color 0.15s, color 0.15s',
          }}
        >
          {s.name}
        </button>
      ))}
    </div>
  )
}

export default function WahltrendLaenderStory() {
  const [stateCode, setStateCode] = useState('BY')
  const state = STATES.find((s) => s.code === stateCode)

  const pollData = pollsLaender.byState[stateCode]
  const govPeriods = coalitions.byState[stateCode] ?? []
  const houseData = houseEffects.states[state.parliamentName]
  const leadLagState = leadLag.states[state.shortcut]
  const grangerState = granger.states[state.shortcut]
  const accuracyState = electionAccuracy.byState[stateCode]

  const { meta, polls, trend } = pollData

  return (
    <article className="flex flex-col gap-12 max-w-3xl">
      <div>
        <Link to="/" className="no-underline text-sm"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
          ← Zurück
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <span className="text-xs tracking-[.12em] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: catColors.text }}>
          Wahltrends · Länder
        </span>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 48',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 600, lineHeight: 1.1,
          letterSpacing: '-0.02em', color: 'var(--color-ink)', margin: 0,
        }}>
          Untersuchung der Wahltrends in den Ländern
        </h1>
        <p className="text-base leading-relaxed max-w-prose" style={{ color: 'var(--color-muted)' }}>
          Dieselbe Untersuchung wie im Bund — für alle 16 Landtage. Nicht jede Analyse
          ist für jedes Bundesland gleich belastbar: die Umfragenlage reicht von 22
          (Bremen) bis 186 (Bayern) Umfragen seit 2017. Wo die Daten nicht reichen,
          steht das explizit da, statt es zu verstecken.
        </p>
      </header>

      <StateSelector selected={stateCode} onChange={setStateCode} />

      {/* ── 1: Sonntagsfrage ── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <SectionLabel number="01">Aktuell · {state.name}</SectionLabel>
          <CurrentGovernmentNote periods={govPeriods} />
          <PollSnapshot key={stateCode} trend={trend} parties={meta.parties} />
        </div>
        <div className="flex flex-col gap-3">
          <SectionLabel>Verlauf</SectionLabel>
          <PollTrendChart key={stateCode} polls={polls} trend={trend} parties={meta.parties} governmentPeriods={govPeriods} />
        </div>
      </section>

      <Divider />

      {/* ── 2: Regierung vs. Opposition ── */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <SectionLabel number="02">Regierung vs. Opposition</SectionLabel>
          <SectionHeading>Wie schneiden Regierungs- und Oppositionsparteien in Summe ab?</SectionHeading>
          <p className="text-sm leading-relaxed max-w-prose" style={{ color: 'var(--color-muted)' }}>
            Für jeden Zeitpunkt summiert: die Umfragewerte der zu diesem Datum amtierenden
            Koalitionsparteien in {state.name} gegen alle anderen. Basiert auf der vollständigen
            Koalitionszusammensetzung (nicht nur der Regierungschef-Partei).
          </p>
          <CoalitionHistory periods={govPeriods} />
        </header>
        {govPeriods.length > 0 ? (
          <GovOppositionChart key={stateCode} trend={trend} governmentPeriods={govPeriods} parties={meta.parties} />
        ) : (
          <NoDataNote>Für {state.name} liegen noch keine Koalitionsdaten vor.</NoDataNote>
        )}
      </section>

      <Divider />

      {/* ── 3: Wahlgenauigkeit ── */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <SectionLabel number="03">Vergleich mit echten Wahlergebnissen</SectionLabel>
          <SectionHeading>Wie nah lagen die Institute bei der Wahl?</SectionHeading>
          <p className="text-sm leading-relaxed max-w-prose" style={{ color: 'var(--color-muted)' }}>
            Letzte Umfrage je Institut vor der Landtagswahl gegen das Wahlergebnis. Anders
            als im Bund aus marktforschung.de-Artikeln aufbereitet, nicht aus wahlrecht.de
            (für drei Länder ohne passenden Artikel ersatzweise aus wahlrecht.de/DAWUM
            rekonstruiert). Berlin zeigt zwei Wahlen: die wegen Organisationspannen
            annullierte 2021er-Wahl und ihre Wiederholung 2023.
          </p>
        </header>
        {accuracyState ? (
          <ElectionAccuracyChart key={stateCode} data={accuracyState} />
        ) : (
          <NoDataNote>
            Für {state.name} liegt noch keine Wahlgenauigkeits-Auswertung vor.
          </NoDataNote>
        )}
      </section>

      <Divider />

      {/* ── 4: House Effects ── */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <SectionLabel number="04">Institute im Vergleich</SectionLabel>
          <SectionHeading>Wer schätzt wen wie ein?</SectionHeading>
          <p className="text-sm leading-relaxed max-w-prose" style={{ color: 'var(--color-muted)' }}>
            Abweichung jedes Instituts vom gleichzeitigen Durchschnitt der anderen, in
            Prozentpunkten. Anders als im Bund gibt es hier keine Perioden-Aufschlüsselung —
            dafür reicht die Datenlage in keinem Bundesland.
          </p>
        </header>
        {houseData ? (
          <HouseEffectsChart key={stateCode} data={{ meta: houseEffects.meta, ...houseData }} />
        ) : (
          <NoDataNote>
            Für {state.name} liegen nicht genug Umfragen von mindestens zwei Instituten vor,
            um Institute systematisch zu vergleichen.
          </NoDataNote>
        )}
      </section>

      <Divider />

      {/* ── 5: Reaktionsgeschwindigkeit ── */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <SectionLabel number="05">Reaktionsgeschwindigkeit · Methode 1</SectionLabel>
          <SectionHeading>Wer reagiert zuerst auf Stimmungsänderungen?</SectionHeading>
          <p className="text-sm leading-relaxed max-w-prose" style={{ color: 'var(--color-muted)' }}>
            Cross-Korrelation der wöchentlichen Erstdifferenzen zwischen Institut und
            Leave-One-Out-Konsens. Schwellenwerte niedriger angesetzt als im Bund, da die
            Landtags-Umfragenlage dünner ist — die Reliabilitäts-Markierung pro Punkt bleibt.
          </p>
        </header>
        {leadLagState ? (
          <LeadLagChart key={stateCode} data={{ meta: leadLag.meta, ...leadLagState }} />
        ) : (
          <NoDataNote>Für {state.name} reicht die Datenlage nicht für eine Lead-Lag-Analyse.</NoDataNote>
        )}
      </section>

      <Divider />

      {/* ── 4b: Granger ── */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <SectionLabel>Reaktionsgeschwindigkeit · Methode 2</SectionLabel>
          <SectionHeading>Welches Institut bewegt den Konsens — und welches folgt ihm?</SectionHeading>
          <p className="text-sm leading-relaxed max-w-prose" style={{ color: 'var(--color-muted)' }}>
            Granger-Kausalität, gleiche Methode wie im Bund: sagen die vergangenen Werte
            eines Instituts den künftigen Konsens vorher, über das hinaus, was der Konsens
            selbst vorhersagt?
          </p>
        </header>
        {grangerState ? (
          <GrangerChart key={stateCode} data={{ meta: granger.meta, ...grangerState }} />
        ) : (
          <NoDataNote>
            Für {state.name} reicht die Datenlage nicht für einen Granger-Test (braucht
            deutlich mehr Beobachtungen als die Lead-Lag-Analyse).
          </NoDataNote>
        )}
      </section>

      <footer className="text-xs pt-4" style={{
        borderTop: '1px solid var(--color-rule)', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)',
      }}>
        Quellen:{' '}
        <a href="https://dawum.de" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--color-muted)', textDecoration: 'underline' }}>
          DAWUM (dawum.de)
        </a>
        {' '}(ODbL){' · '}
        <a href="https://www.marktforschung.de" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--color-muted)', textDecoration: 'underline' }}>
          marktforschung.de
        </a>
      </footer>
    </article>
  )
}
