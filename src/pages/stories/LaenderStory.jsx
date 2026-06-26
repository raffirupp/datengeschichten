import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import rawGovData from '../../data/laender-governments.json'
import laenderBeats from '../../data/laenderBeats.js'
import ScrollMap from '../../components/ScrollMap.jsx'
import YearTimeline from '../../components/YearTimeline.jsx'
import LaenderGeoMap from '../../components/LaenderGeoMap.jsx'
import { colorsFor } from '../../lib/categoryColors.js'

const allValues = Object.values(rawGovData.byYear).flatMap((yearData) => Object.values(yearData))
const govData = {
  ...rawGovData,
  meta: { ...rawGovData.meta, valueMin: Math.min(...allValues), valueMax: Math.max(...allValues) },
}

export default function LaenderStory() {
  const [year, setYear] = useState(laenderBeats[0].year)
  const [manualYear, setManualYear] = useState(null)

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
    <>
      <article className="flex flex-col gap-8" style={{ paddingBottom: '130px' }}>
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
            renderMap={(effectiveYear, code) => {
              const baseData = govData.byYear[String(effectiveYear)] ?? {}
              // Thüringen 2020: Kemmerich (FDP) war kurz Ministerpräsident
              const dataForYear = (effectiveYear === 2020 && code === 'TH')
                ? { ...baseData, TH: 6.3 }
                : baseData
              return <LaenderGeoMap dataForYear={dataForYear} highlightCode={code} />
            }}
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

      {/* YearTimeline — fixed am unteren Bildschirmrand */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid #EEEEEE',
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0.75rem 1.5rem' }}>
          <YearTimeline
            years={govData.meta.years}
            year={year}
            onChange={handleChange}
          />
        </div>
      </div>
    </>
  )
}
