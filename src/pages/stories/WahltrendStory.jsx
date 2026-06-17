import { Link } from 'react-router-dom'
import pollData from '../../data/polls-bundestag.json'
import houseData from '../../data/house-effects.json'
import PollSnapshot from '../../components/PollSnapshot.jsx'
import PollTrendChart from '../../components/PollTrendChart.jsx'
import HouseEffectsChart from '../../components/HouseEffectsChart.jsx'
import { colorsFor } from '../../lib/categoryColors.js'

const { meta, polls, trend } = pollData
const catColors = colorsFor('Deutschland')

const SectionLabel = ({ children }) => (
  <h2
    style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--color-muted)',
      margin: 0,
    }}
  >
    {children}
  </h2>
)

export default function WahltrendStory() {
  return (
    <article className="flex flex-col gap-12 max-w-3xl">
      <div>
        <Link
          to="/"
          className="no-underline text-sm"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
        >
          ← Zurück
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <span
          className="text-xs tracking-[.12em] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: catColors.text }}
        >
          Wahltrend · Bundestag
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
          Wahltrend zur Bundestagswahl
        </h1>
        <p
          className="text-base leading-relaxed max-w-prose"
          style={{ color: 'var(--color-muted)' }}
        >
          Alle Umfragen auf einen Blick — geglättet zu einem Trend. Und darunter:
          Schätzen die Institute bestimmte Parteien systematisch höher oder niedriger
          als der Rest? Stand: {meta.lastUpdated}.
        </p>
      </header>

      {/* ── Teil 1: Sonntagsfrage ── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <SectionLabel>Aktuell</SectionLabel>
          <PollSnapshot trend={trend} parties={meta.parties} />
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel>Verlauf · 7 Jahre</SectionLabel>
          <PollTrendChart polls={polls} trend={trend} parties={meta.parties} />
        </div>
      </section>

      {/* ── Trennlinie ── */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--color-rule)', margin: 0 }} />

      {/* ── Teil 2: House Effects ── */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <SectionLabel>Systematische Abweichungen der Institute</SectionLabel>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontVariationSettings: '"opsz" 32',
              fontSize: 'clamp(1.3rem, 3vw, 1.9rem)',
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            Wer schätzt wen wie ein?
          </h2>
          <p
            className="text-sm leading-relaxed max-w-prose"
            style={{ color: 'var(--color-muted)' }}
          >
            Manche Institute lagen in der Vergangenheit im Vergleich zu den anderen
            systematisch höher oder niedriger — das nennt man House-Effects. Wir haben
            das für alle Institute und alle Parteien ausgerechnet. Jeder Wert zeigt,
            um wie viele Prozentpunkte ein Institut im Schnitt vom gleichzeitigen
            Durchschnitt der anderen Institute abweicht. Was das <em>nicht</em> bedeutet:
            dass ein Institut näher an der Wahrheit liegt. Ob der Konsens der Institute
            stimmt, lässt sich nur an echten Wahlergebnissen prüfen — und nur dann.
          </p>
        </header>

        <HouseEffectsChart data={houseData} />
      </section>

      <footer
        className="text-xs pt-4"
        style={{
          borderTop: '1px solid var(--color-rule)',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-muted)',
        }}
      >
        Quelle:{' '}
        <a
          href="https://dawum.de"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-muted)', textDecoration: 'underline' }}
        >
          DAWUM (dawum.de)
        </a>
        , Lizenz:{' '}
        <a
          href="https://opendatacommons.org/licenses/odbl/1-0/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-muted)', textDecoration: 'underline' }}
        >
          ODbL
        </a>
      </footer>
    </article>
  )
}
