import { useState } from 'react'
import { Link } from 'react-router-dom'
import TopicTrendChart from '../../components/TopicTrendChart.jsx'
import topicsRaw from '../../data/bundestag-sprache-topics.json'
import seriesRaw from '../../data/bundestag-sprache-series.json'
import { colorsFor } from '../../lib/categoryColors.js'

// 2013 (nur 179 Reden, WP-Start) und 2026 (Jan-Schnappschuss) ausblenden
const series = seriesRaw.filter(d => d.year >= 2014 && d.year <= 2025)
const topics = topicsRaw

const catColors = colorsFor('Deutschland')

const HIGHLIGHTS = [
  {
    year: 2015,
    topic: 'migration',
    label: '2015 — Flüchtlingskrise',
    text: 'Migration und Asyl erreichen ihren Höchstwert — die Ankunft von über einer Million Geflüchteter dominiert den Bundestag.',
  },
  {
    year: 2020,
    topic: 'gesundheit',
    label: '2020–2021 — Pandemie',
    text: 'Gesundheitsthemen verdoppeln sich 2020 und steigen 2021 nochmals — Corona, Impfpflicht und Krankenhauskapazitäten prägen die Debatten.',
  },
  {
    year: 2022,
    topic: 'klima',
    label: '2022 — Energie und Klima',
    text: 'Klima und Energie erreichen ihren Höhepunkt: Russlands Angriff auf die Ukraine beschleunigt Debatten über Energiewende und Versorgungssicherheit.',
  },
]

export default function BundestagSpracheStory() {
  const [highlighted, setHighlighted] = useState([])

  function toggleTopic(key) {
    setHighlighted(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

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
          Deutschland · Sprache
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
          Worüber Deutschland spricht
        </h1>
        <p
          className="text-base leading-relaxed max-w-prose"
          style={{ color: 'var(--color-muted)' }}
        >
          Über 75.000 Bundestagsreden aus zwölf Jahren — welche Themen wann die Plenardebatte prägen.
          Ich habe Keyword-Listen gebaut, die Reden damit durchsucht und gezählt, wie oft ein Thema
          auftaucht — relativ zur Menge der Reden im jeweiligen Jahr.
          So wird sichtbar: Wann kam Migration hoch? Wann verschwand Klima wieder?
        </p>
      </header>

      {/* Chart */}
      <section className="flex flex-col gap-3">
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
          Thementrend 2014–2025 · Erwähnungen/Mio. Tokens
        </h2>
        <TopicTrendChart series={series} topics={topics} highlighted={highlighted} />
      </section>

      {/* Topic filter pills */}
      <section className="flex flex-col gap-3">
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
          Themen filtern
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {topics.map(({ key, label, color }) => {
            const active = highlighted.length === 0 || highlighted.includes(key)
            return (
              <button
                key={key}
                onClick={() => toggleTopic(key)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  border: `1.5px solid ${color}`,
                  backgroundColor: active ? color : 'transparent',
                  color: active ? '#fff' : color,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            )
          })}
          {highlighted.length > 0 && (
            <button
              onClick={() => setHighlighted([])}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '100px',
                border: '1.5px solid var(--color-rule)',
                backgroundColor: 'transparent',
                color: 'var(--color-muted)',
                cursor: 'pointer',
              }}
            >
              Alle anzeigen
            </button>
          )}
        </div>
      </section>

      {/* Editorial highlights */}
      <section className="flex flex-col gap-4">
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
          Was die Ausschläge bedeuten
        </h2>
        <div className="flex flex-col gap-4">
          {HIGHLIGHTS.map(({ year, topic, label, text }) => {
            const t = topics.find(t => t.key === topic)
            return (
              <div
                key={year}
                style={{
                  borderLeft: `3px solid ${t?.color ?? 'var(--color-rule)'}`,
                  paddingLeft: '14px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: t?.color ?? 'var(--color-muted)',
                    marginBottom: '4px',
                  }}
                >
                  {label}
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-ink)', margin: 0 }}
                >
                  {text}
                </p>
              </div>
            )
          })}
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
          href="https://codeberg.org/seanfobbe/cpp-bt"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-muted)', textDecoration: 'underline' }}
        >
          CPP-BT (Sean Fobbe)
        </a>
        {' / '}
        <a
          href="https://zenodo.org/records/15462956"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-muted)', textDecoration: 'underline' }}
        >
          Zenodo
        </a>
        , Lizenz: gemeinfrei · Wahlperioden 18–21 (2014–2025) ·
        Keyword-basierte Häufigkeitsanalyse, keine automatische Sprachverarbeitung
      </footer>
    </article>
  )
}
