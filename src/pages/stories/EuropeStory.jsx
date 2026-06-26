import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import govData from '../../data/europe-governments.json'
import europeBeats from '../../data/europeBeats.js'
import ScrollMap from '../../components/ScrollMap.jsx'
import YearTimeline from '../../components/YearTimeline.jsx'
import EuropeGeoMap from '../../components/EuropeGeoMap.jsx'
import { colorsFor } from '../../lib/categoryColors.js'

function ColorModeToggle({ mode, onChange }) {
  const btn = (id, label) => (
    <button
      key={id}
      onClick={() => onChange(id)}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: '11px',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '4px 14px', borderRadius: '99px', border: 'none',
        cursor: 'pointer', transition: 'background-color 0.15s, color 0.15s',
        backgroundColor: mode === id ? 'var(--color-accent)' : 'transparent',
        color: mode === id ? 'var(--color-paper)' : 'var(--color-muted)',
      }}
    >
      {label}
    </button>
  )
  return (
    <div style={{
      display: 'inline-flex', gap: '2px', padding: '3px',
      borderRadius: '99px', border: '1px solid var(--color-rule)',
      backgroundColor: '#FFFFFF',
    }}>
      {btn('family', 'Parteienfamilien')}
      {btn('spectrum', 'Links–Rechts')}
    </div>
  )
}

export default function EuropeStory() {
  const [year, setYear] = useState(europeBeats[0].year)
  const [colorMode, setColorMode] = useState('family')
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
            style={{ fontFamily: 'var(--font-mono)', color: colorsFor('Europa').text }}
          >
            Europa
          </span>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 48',
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 600,
            lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--color-ink)', margin: 0,
          }}>
            Europa wechselt die Farbe
          </h1>
          <p className="text-base leading-relaxed max-w-prose" style={{ color: 'var(--color-muted)' }}>
            Welche Parteifamilien regieren Europa? 25 Jahre prägender Regierungswechsel —
            von Schwarz-Blau in Österreich bis zum aktuellen deutschen Kabinett.
          </p>
        </header>

        <section className="flex flex-col gap-5">
          <ColorModeToggle mode={colorMode} onChange={setColorMode} />
          <ScrollMap
            beats={europeBeats}
            highlightKey="iso3"
            manualYear={manualYear}
            onActiveBeatChange={handleActiveBeatChange}
            renderMap={(yr, iso3) => {
              const dataForYear = govData.byYear[String(yr)]
              return (
                <EuropeGeoMap
                  dataForYear={dataForYear}
                  meta={govData.meta}
                  highlightIso3={iso3}
                  colorMode={colorMode}
                />
              )
            }}
          />
        </section>

        <footer className="text-xs pt-4" style={{
          borderTop: '1px solid var(--color-rule)',
          fontFamily: 'var(--font-mono)', color: 'var(--color-muted)',
        }}>
          Quelle: ParlGov · Döring &amp; Manow; jüngste Wechsel manuell ergänzt
        </footer>
      </article>

      {/* YearTimeline — fixed am unteren Bildschirmrand */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid #EEEEEE',
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0.75rem 1.5rem' }}>
          <YearTimeline years={govData.meta.years} year={year} onChange={handleChange} />
        </div>
      </div>
    </>
  )
}
