import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import govData from '../../data/europe-governments.json'
import EuropeColorMap from '../../components/EuropeColorMap.jsx'
import YearTimeline from '../../components/YearTimeline.jsx'

export default function EuropeStory() {
  const [year, setYear] = useState(govData.meta.years[0])
  const handleChange = useCallback((v) => setYear(v), [])

  const dataForYear = govData.byYear[String(year)]

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
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}
        >
          Europa
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
          Europa wechselt die Farbe
        </h1>
        <p
          className="text-base leading-relaxed max-w-prose"
          style={{ color: 'var(--color-muted)' }}
        >
          Welche Parteifamilien regieren Europa? Diese Karte zeigt für jedes Land die
          politische Ausrichtung der Regierung — von links nach rechts auf der ParlGov-Skala,
          gewichtet nach Sitzanteilen der Koalitionspartner. Wähle ein Jahr oder lass die
          Karte laufen.
        </p>
      </header>

      <section className="flex flex-col gap-6">
        <EuropeColorMap dataForYear={dataForYear} meta={govData.meta} />
        <YearTimeline
          years={govData.meta.years}
          year={year}
          onChange={handleChange}
        />
      </section>

      <footer
        className="text-xs pt-4"
        style={{
          borderTop: '1px solid var(--color-rule)',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-muted)',
        }}
      >
        Quelle: ParlGov · Döring &amp; Manow (parlgov.org) · Daten: view_cabinet, Stand 2025
      </footer>
    </article>
  )
}
