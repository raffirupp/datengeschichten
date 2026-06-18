import { useState } from 'react'
import { Link } from 'react-router-dom'
import gdeltData from '../../data/gdelt-signal.json'
import pollData from '../../data/polls-bundestag.json'
import { PEAKS } from '../../data/gdelt-peaks.js'
import { colorsFor } from '../../lib/categoryColors.js'
import { partyColor } from '../../lib/partyColors.js'
import NewsSignalChart from '../../components/NewsSignalChart.jsx'
import NewsSignalOverviewChart from '../../components/NewsSignalOverviewChart.jsx'
import PeakPanel from '../../components/PeakPanel.jsx'
import PollTrendChart from '../../components/PollTrendChart.jsx'

const catColors = colorsFor('Labor')

// GDELT führt CDU und CSU getrennt, DAWUM erhebt sie gemeinsam als „CDU/CSU".
const PARTY_TO_DAWUM = {
  CDU: 'CDU/CSU',
  CSU: 'CDU/CSU',
  SPD: 'SPD',
  GRÜNE: 'Grüne',
  FDP: 'FDP',
  AfD: 'AfD',
  LINKE: 'Linke',
  BSW: 'BSW',
}

function ExperimentNotice() {
  return (
    <div
      className="flex flex-col gap-1.5 p-4"
      style={{ border: '1.5px dashed var(--color-muted)', borderRadius: '8px' }}
    >
      <span
        className="text-xs tracking-[.14em] uppercase"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', fontWeight: 600 }}
      >
        Experiment · in Arbeit
      </span>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        Kein fertiges Ergebnis, kein Modell — ich schaue, was der Datensatz hergibt. Die Punkte auf den Charts lassen sich anklicken.
      </p>
    </div>
  )
}

function PartyPanel({ party, onPeakClick }) {
  const points = gdeltData.byParty[party] ?? []
  const dawumKey = PARTY_TO_DAWUM[party]
  const color = partyColor(dawumKey)
  const hasSignal = points.some((p) => p.attentionShare != null)
  const partyPeaks = PEAKS.filter((p) => p.party === party)

  return (
    <div className="flex flex-col gap-3 py-6" style={{ borderTop: '1px solid var(--color-rule)' }}>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontVariationSettings: '"opsz" 24',
            fontSize: '1.2rem',
            fontWeight: 600,
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          {party}
        </h3>
        {(party === 'CDU' || party === 'CSU') && (
          <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
            — Umfragewert gemeinsam mit {party === 'CDU' ? 'CSU' : 'CDU'} als „CDU/CSU"
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <span
            className="text-xs tracking-[.1em] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
          >
            Nachrichten-Signal (GDELT) · Punkte anklicken
          </span>
          {hasSignal
            ? <NewsSignalChart points={points} color={color} peaks={partyPeaks} onPeakClick={onPeakClick} />
            : (
              <p className="text-sm italic" style={{ color: 'var(--color-muted)' }}>
                Kein verwertbares Signal für diese Partei.
              </p>
            )
          }
        </div>
        <div className="flex flex-col gap-1.5">
          <span
            className="text-xs tracking-[.1em] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
          >
            Umfragetrend (DAWUM)
          </span>
          <PollTrendChart
            polls={pollData.polls}
            trend={pollData.trend}
            parties={[{ key: dawumKey, name: dawumKey }]}
          />
        </div>
      </div>
    </div>
  )
}

export default function NachrichtenSignalStory() {
  const [selectedPeak, setSelectedPeak] = useState(null)

  return (
    <article className="flex flex-col gap-8 max-w-4xl">
      <div>
        <Link
          to="/"
          className="no-underline text-sm"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
        >
          ← Zurück
        </Link>
      </div>

      <ExperimentNotice />

      <header className="flex flex-col gap-3">
        <span
          className="text-xs tracking-[.12em] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: catColors.text }}
        >
          Labor · Experiment
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontVariationSettings: '"opsz" 48',
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          Nachrichten-Signal
        </h1>
        <p className="text-base leading-relaxed max-w-prose" style={{ color: 'var(--color-muted)' }}>
          GDELT durchsucht laufend das freie Web und zählt, wie oft eine Partei in
          Nachrichtentexten auftaucht. Ich habe diese Häufigkeit neben die DAWUM-Umfragedaten
          gestellt — und markiert, wo die Ausschläge auf reale Ereignisse zurückgehen.
          Die Frage dahinter: Bewegt sich Medienpräsenz mit den Umfragen — oder läuft sie ihnen voraus?
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <span
          className="text-xs tracking-[.1em] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
        >
          Aufmerksamkeitsanteil im Vergleich — alle Parteien
        </span>
        <NewsSignalOverviewChart
          byParty={gdeltData.byParty}
          parties={gdeltData.meta.parties}
        />
        <PeakPanel
          peak={selectedPeak}
          polls={pollData.polls}
          trend={pollData.trend}
          onClose={() => setSelectedPeak(null)}
        />
      </section>

      <section className="flex flex-col">
        {gdeltData.meta.parties.map((party) => (
          <PartyPanel key={party} party={party} onPeakClick={setSelectedPeak} />
        ))}
      </section>

      <div
        className="flex flex-col gap-2 pl-4 py-2"
        style={{ borderLeft: '2px solid var(--color-muted)' }}
      >
        <span
          className="text-xs tracking-[.12em] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
        >
          Einschränkungen, die ich kenne
        </span>
        <ul className="flex flex-col gap-1.5">
          <li className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Der Aufmerksamkeitsanteil ist relativ: Er misst den Anteil einer Partei an allen acht beobachteten — steigt eine, fallen automatisch andere. Nicht jeder Ausschlag ist ein echter Ausschlag.
          </li>
          <li className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            GDELT erfasst nur frei zugängliche Seiten. Paywalled Qualitätsmedien fehlen größtenteils — was zählt, stammt also eher aus dem offenen Nachrichtennetz als aus Spiegel oder SZ.
          </li>
          <li className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Ob Medienpräsenz den Umfragen vorausläuft, bleibt offen. Das wäre der nächste Schritt — ein echtes Modell, das sich testen lässt. Noch bin ich beim Hinschauen.
          </li>
        </ul>
      </div>

      <footer
        className="text-xs pt-4"
        style={{
          borderTop: '1px solid var(--color-rule)',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-muted)',
        }}
      >
        Quellen: GDELT Web NGrams 3.0 via BigQuery (Nachrichten, deutschsprachig, 2020–2026); DAWUM/ODbL (Umfragen)
      </footer>
    </article>
  )
}
