import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TopicTrendChart from '../../components/TopicTrendChart.jsx'
import LandtagThemenGeoMap from '../../components/LandtagThemenGeoMap.jsx'
import YearTimeline from '../../components/YearTimeline.jsx'
import topics from '../../data/landtag-sprache-topics.json'
import nationalSeries from '../../data/landtag-sprache-national.json'
import statesSeries from '../../data/landtag-sprache-states.json'
import { colorsFor } from '../../lib/categoryColors.js'

const catColors = colorsFor('Deutschland')

const HIGHLIGHTS = [
  {
    year: 2015,
    topic: 'migration',
    label: '2015 — Flüchtlingskrise',
    text: 'Migration und Integration verdoppeln sich gegenüber dem Vorjahr und erreichen den höchsten Wert im gesamten Zeitraum — die Ankunft von über einer Million Geflüchteter prägt die Landtage genauso wie den Bundestag.',
  },
  {
    year: 2018,
    topic: 'digital',
    label: '2018 — Digitalisierung auf dem Höhepunkt',
    text: 'Verwaltungsdigitalisierung und Schul-IT erreichen ihren bisherigen Höchstwert — im Jahr des Onlinezugangsgesetzes des Bundes, das Länder und Kommunen zur digitalen Verwaltung verpflichtet.',
  },
  {
    year: 2020,
    topic: 'gesundheit',
    label: '2020 — Pandemie',
    text: 'Gesundheitsthemen springen von 71 auf 106 Erwähnungen/Mio. Tokens — und bleiben seither spürbar höher als vor Corona, getragen von Krankenhausreform und Pflegenotstand.',
  },
  {
    year: 2022,
    topic: 'klima',
    label: '2022 — Energiekrise',
    text: 'Klima und Energie erreichen ihren Höchststand: Russlands Angriff auf die Ukraine beschleunigt Debatten über Windkraftflächen und Versorgungssicherheit auch auf Landesebene.',
  },
]

const YEARS = nationalSeries.map((d) => d.year)

export default function LandtagSpracheStory() {
  const [highlighted, setHighlighted] = useState([])
  const [mapTopic, setMapTopic] = useState('bildung')
  const [mapYear, setMapYear] = useState(YEARS[YEARS.length - 1])

  function toggleTopic(key) {
    setHighlighted((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const maxByTopic = useMemo(() => {
    const max = {}
    for (const { key } of topics) {
      max[key] = Math.max(...statesSeries.map((d) => d[key] ?? 0))
    }
    return max
  }, [])

  const dataForMapYear = useMemo(() => {
    const map = {}
    for (const row of statesSeries) {
      if (row.year !== mapYear) continue
      map[row.state] = row[mapTopic] ?? null
    }
    return map
  }, [mapYear, mapTopic])

  const activeTopic = topics.find((t) => t.key === mapTopic)

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
          Worüber die Landtage sprechen
        </h1>
        <p
          className="text-base leading-relaxed max-w-prose"
          style={{ color: 'var(--color-muted)' }}
        >
          Fast 9 Millionen Redeabschnitte aus 16 Landesparlamenten, 2000 bis 2025 — welche Themen
          wann die Landespolitik prägen. Anders als der Bundestag verhandeln Landtage vor allem
          Bildung, Innere Sicherheit und Kommunales — Themen, über die der Bund gar nicht
          entscheiden kann.
        </p>
      </header>

      {/* Bundesweiter Thementrend */}
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
          Thementrend 2000–2025 · Erwähnungen/Mio. Tokens, alle 16 Landtage zusammen
        </h2>
        <TopicTrendChart series={nationalSeries} topics={topics} highlighted={highlighted} />
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

      {/* Karte: ein Thema, 16 Länder, ein wählbares Jahr */}
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
          Ein Thema, 16 Länder
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {topics.map(({ key, label, color }) => {
            const active = key === mapTopic
            return (
              <button
                key={key}
                onClick={() => setMapTopic(key)}
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
        </div>
        <LandtagThemenGeoMap
          dataForYear={dataForMapYear}
          topicLabel={activeTopic?.label ?? ''}
          topicColor={activeTopic?.color ?? 'var(--color-accent)'}
          maxValue={maxByTopic[mapTopic]}
        />
        <YearTimeline years={YEARS} year={mapYear} onChange={setMapYear} />
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
            const t = topics.find((t) => t.key === topic)
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
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink)', margin: 0 }}>
                  {text}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Methodik & Grenzen */}
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
          Methodik & Grenzen
        </h2>
        <ul className="flex flex-col gap-2 text-sm leading-relaxed" style={{ color: 'var(--color-muted)', paddingLeft: '1.1rem' }}>
          <li>
            Keyword-Suche, keine Sprachverarbeitung — wie bei der Bundestags-Story zählt nur, dass
            ein Thema vorkommt, nicht welche Position dazu vertreten wird.
          </li>
          <li>
            Regieanweisungen (Beifall, Zwischenrufe) und Wortmeldungen der Sitzungsleitung sind
            herausgefiltert — sie enthalten keine inhaltliche Aussage zum Thema.
          </li>
          <li>
            Die Länder sind unterschiedlich lang erfasst: Hessen erst ab April 2003, Saarland erst
            ab Oktober 2007, Hamburg endet im Dezember 2024. Frühe bzw. fehlende Jahre dieser
            Länder fehlen entsprechend in der Karte.
          </li>
          <li>
            Ein zehn Themen breites Lexikon, redaktionell auf Länderkompetenzen zugeschnitten
            (Bildung, Innere Sicherheit, Kommunales statt Bundeswehr oder EU-Ratspolitik) — andere
            Zuschnitte wären möglich, die Auswahl ist keine linguistische Norm.
          </li>
        </ul>
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
          href="https://doi.org/10.7802/3062"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-muted)', textDecoration: 'underline' }}
        >
          Beltermann, E., Souris, A., Nguyen, C., &amp; Kropp, S. (2026). StateParl (Version 3.0.0) [Data set]. GESIS, Cologne.
        </a>{' '}
        · Keyword-basierte Häufigkeitsanalyse, keine automatische Sprachverarbeitung
      </footer>
    </article>
  )
}
