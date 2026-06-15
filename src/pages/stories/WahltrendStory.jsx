import { Link } from 'react-router-dom'
import pollData from '../../data/polls-bundestag.json'
import PollSnapshot from '../../components/PollSnapshot.jsx'
import PollTrendChart from '../../components/PollTrendChart.jsx'
import { colorsFor } from '../../lib/categoryColors.js'

const { meta, polls, trend } = pollData
const catColors = colorsFor('Deutschland')

export default function WahltrendStory() {
  return (
    <article className="flex flex-col gap-8 max-w-3xl">
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
          Alle Umfragen auf einen Blick — geglättet zu einem transparenten Trend.
          Die Punkte zeigen die Einzelumfragen, die Linien den gewichteten Mittelwert
          der jeweils letzten drei Wochen. Stand: {meta.lastUpdated}.
        </p>
      </header>

      <section className="flex flex-col gap-8">
        {/* Snapshot */}
        <div className="flex flex-col gap-3">
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
            Aktuell
          </h2>
          <PollSnapshot trend={trend} parties={meta.parties} />
        </div>

        {/* Trend chart */}
        <div className="flex flex-col gap-3">
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
            Verlauf · 3 Jahre
          </h2>
          <PollTrendChart polls={polls} trend={trend} parties={meta.parties} />
        </div>
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
