import { Link } from 'react-router-dom'
import gdeltData from '../../data/gdelt-signal.json'
import pollData from '../../data/polls-bundestag.json'
import { colorsFor } from '../../lib/categoryColors.js'
import { partyColor } from '../../lib/partyColors.js'
import NewsSignalChart from '../../components/NewsSignalChart.jsx'
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
        Experiment
      </span>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        Dies ist ein offenes Experiment. Gezeigt wird ein rohes Nachrichten-Signal neben den
        Umfragen — KEINE Vorhersage und kein validiertes Modell. Stand der Forschung, kein Ergebnis.
      </p>
    </div>
  )
}

function PartyPanel({ party }) {
  const points = gdeltData.byParty[party] ?? []
  const dawumKey = PARTY_TO_DAWUM[party]
  const color = partyColor(dawumKey)
  const hasSignal = points.some((p) => p.attentionShare != null)

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
            Nachrichten-Signal (GDELT)
          </span>
          {hasSignal
            ? <NewsSignalChart points={points} color={color} />
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
          Stimmung in den Nachrichten
        </h1>
        <p className="text-base leading-relaxed max-w-prose" style={{ color: 'var(--color-muted)' }}>
          GDELT durchsucht weltweit Nachrichtenseiten und misst zweierlei: wie viel über eine
          Partei berichtet wird (Aufmerksamkeit) und in welchem Ton (positiv oder negativ).
          DAWUM misst dagegen, wen die Menschen tatsächlich wählen würden. Die offene Frage,
          die wir hier untersuchen: Atmet das Nachrichten-Signal mit den Umfragen mit — und
          läuft es ihnen vielleicht sogar voraus?
        </p>
      </header>

      <section className="flex flex-col">
        {gdeltData.meta.parties.map((party) => (
          <PartyPanel key={party} party={party} />
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
          Was das ist — und was es (noch) nicht ist
        </span>
        <ul className="flex flex-col gap-1.5">
          <li className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Ein rohes Signal aus Nachrichtenartikeln, sonst nichts — keine Bereinigung, keine
            Gewichtung nach Quellen, kein Modell.
          </li>
          <li className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Ton ist keine Richtungsangabe: negative Berichterstattung über eine Partei kann auch
            Berichte über deren Kritik an anderen meinen.
          </li>
          <li className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Ob das Signal den Umfragen vorausläuft, ist nicht geprüft — das wäre ein validiertes
            Modell mit Out-of-Sample-Vergleich gegen eine einfache Basislinie. Das ist der
            nächste Schritt, nicht dieser hier.
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
        Quellen: GDELT DOC 2.0 API (Nachrichten); DAWUM/ODbL (Umfragen)
      </footer>
    </article>
  )
}
