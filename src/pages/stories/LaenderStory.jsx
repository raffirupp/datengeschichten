import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import rawGovData from '../../data/laender-governments.json'
import laenderBeats from '../../data/laenderBeats.js'
import ScrollMap from '../../components/ScrollMap.jsx'
import YearTimeline from '../../components/YearTimeline.jsx'
import LaenderGeoMap from '../../components/LaenderGeoMap.jsx'
import { colorsFor } from '../../lib/categoryColors.js'

// leftRightColor() interpoliert zwischen valueMin/Mitte/valueMax — die JSON-Daten aus
// Auftrag A enthalten bewusst nur years/codes/mid. valueMin/valueMax wie bei der
// Europa-Karte aus den tatsächlich vorkommenden Werten ableiten (sonst rechnet
// leftRightColor() mit NaN, und ein fixer 0–10-Bereich würde die Farben stark verwaschen,
// da die real vorkommenden Parteiwerte enger beieinander liegen).
const allValues = Object.values(rawGovData.byYear).flatMap((yearData) => Object.values(yearData))
const govData = {
  ...rawGovData,
  meta: { ...rawGovData.meta, valueMin: Math.min(...allValues), valueMax: Math.max(...allValues) },
}

export default function LaenderStory() {
  const [year, setYear] = useState(laenderBeats[0].year)
  const [manualYear, setManualYear] = useState(null)

  // Manuelles Ziehen am Zeitstrahl überschreibt vorübergehend das Scroll-Jahr,
  // bis der nächste Beat beim Scrollen wieder die Führung übernimmt.
  const handleChange = useCallback((v) => {
    setYear((prev) => {
      const next = typeof v === 'function' ? v(prev) : v
      setManualYear(next)
      return next
    })
  }, [])

  const handleActiveBeatChange = useCallback((beat) => {
    if (!beat) return
    setYear(beat.year)
    setManualYear(null)
  }, [])

  return (
    <article className="flex flex-col gap-8 max-w-5xl">
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
          style={{ fontFamily: 'var(--font-mono)', color: colorsFor('Deutschland').color }}
        >
          Deutschland · Länder
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
          Die Länder wechseln die Farbe
        </h1>
        <p
          className="text-base leading-relaxed max-w-prose"
          style={{ color: 'var(--color-muted)' }}
        >
          Welche Parteien regieren die 16 Bundesländer? Beim Scrollen wandert die Karte durch
          25 Jahre Machtwechsel — von Hamburgs Ende der SPD-Ära bis zum ersten grünen
          Ministerpräsidenten. Du kannst auch selbst ein Jahr wählen oder die Karte laufen lassen.
        </p>
      </header>

      <section className="flex flex-col gap-6">
        <ScrollMap
          beats={laenderBeats}
          highlightKey="code"
          manualYear={manualYear}
          onActiveBeatChange={handleActiveBeatChange}
          renderMap={(year, code) => {
            const dataForYear = govData.byYear[String(year)]
            return <LaenderGeoMap dataForYear={dataForYear} meta={govData.meta} highlightCode={code} />
          }}
        />

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
        Quelle: Wikidata (Regierungschefs); Links-rechts-Einordnung der Parteien: eigene Systematik
      </footer>
    </article>
  )
}
