import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import govData from '../../data/europe-governments.json'
import europeBeats from '../../data/europeBeats.js'
import ScrollMap from '../../components/ScrollMap.jsx'
import YearTimeline from '../../components/YearTimeline.jsx'
import EuropeGeoMap from '../../components/EuropeGeoMap.jsx'
import EuropeColorMap from '../../components/EuropeColorMap.jsx'

const SLIDE_DURATION = 7000  // ms per beat in play mode

function ViewToggle({ view, onChange }) {
  const btn = (id, label) => (
    <button
      key={id}
      onClick={() => onChange(id)}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: '11px',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '4px 12px', borderRadius: '99px', border: 'none',
        cursor: 'pointer', transition: 'background-color 0.15s, color 0.15s',
        backgroundColor: view === id ? 'var(--color-accent)' : 'transparent',
        color: view === id ? 'var(--color-paper)' : 'var(--color-muted)',
      }}
    >
      {label}
    </button>
  )
  return (
    <div style={{
      display: 'inline-flex', gap: '2px', padding: '3px',
      borderRadius: '99px', border: '1px solid var(--color-rule)',
      backgroundColor: 'var(--color-paper)',
    }}>
      {btn('geo', 'geografisch')}
      {btn('tiles', 'Kacheln')}
    </div>
  )
}

// ─── Presentation mode ────────────────────────────────────────────────────────
// slide -1 = welcome screen, slides 0..n-1 = beats
function PlayPanel({ beats, view, onView, onStop }) {
  const [slide, setSlide] = useState(-1)     // -1 = welcome
  const [playing, setPlaying] = useState(false)
  const [visible, setVisible] = useState(true)
  const timerRef = useRef(null)

  const totalSlides = beats.length           // not counting welcome

  function advance() {
    setVisible(false)
    setTimeout(() => {
      setSlide(s => {
        const next = s + 1
        if (next >= totalSlides) {
          setPlaying(false)
          return totalSlides - 1
        }
        return next
      })
      setVisible(true)
    }, 350)
  }

  function retreat() {
    setVisible(false)
    setTimeout(() => {
      setSlide(s => Math.max(-1, s - 1))
      setVisible(true)
    }, 350)
  }

  useEffect(() => {
    if (playing) {
      timerRef.current = setTimeout(advance, SLIDE_DURATION)
    }
    return () => clearTimeout(timerRef.current)
  }, [playing, slide])

  function handleStart() {
    setSlide(0)
    setVisible(false)
    setTimeout(() => { setVisible(true); setPlaying(true) }, 350)
  }

  function handlePlayPause() {
    setPlaying(p => !p)
  }

  const beat = slide >= 0 ? beats[slide] : null
  const year  = beat?.year ?? beats[0].year
  const dataForYear = govData.byYear[String(year)]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Map */}
      <div>
        <ViewToggle view={view} onChange={onView} />
        <div style={{ marginTop: '12px' }}>
          {view === 'tiles'
            ? <EuropeColorMap dataForYear={dataForYear} meta={govData.meta} highlightIso3={beat?.iso3 ?? null} />
            : <EuropeGeoMap   dataForYear={dataForYear} meta={govData.meta} highlightIso3={beat?.iso3 ?? null} />
          }
        </div>
      </div>

      {/* Slide content */}
      <div
        style={{
          minHeight: '220px',
          display: 'flex', flexDirection: 'column', gap: '12px',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
      >
        {slide === -1 ? (
          /* Welcome screen */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', flex: 1 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
              Europa · 25 Jahre
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 36', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--color-ink)', margin: 0 }}>
              Herzlich willkommen
            </h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.65, color: 'var(--color-muted)', maxWidth: '480px', margin: 0 }}>
              25 Jahre europäischer Demokratiegeschichte — von Schwarz-Blau in Wien bis zur Zeitenwende
              in Berlin. Jede Station erzählt, was sich politisch verschoben hat und warum.
            </p>
            <button
              onClick={handleStart}
              style={{
                alignSelf: 'flex-start',
                fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.06em',
                padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)',
                fontWeight: 600,
              }}
            >
              ▶ Starten — Jahr 2000
            </button>
          </div>
        ) : (
          /* Beat content */
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.05em' }}>
                {beat.year}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', letterSpacing: '0.08em' }}>
                {beat.iso3}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)' }}>
                {slide + 1} / {totalSlides}
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 28', fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'var(--color-ink)', margin: 0 }}>
              {beat.headline}
            </h3>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.7, color: 'var(--color-muted)', maxWidth: '520px', margin: 0 }}>
              {beat.text}
            </p>

            {/* Progress bar */}
            {playing && (
              <div style={{ height: '2px', backgroundColor: 'var(--color-rule)', borderRadius: '1px', overflow: 'hidden', maxWidth: '320px' }}>
                <div
                  key={`${slide}-${playing}`}
                  style={{
                    height: '100%',
                    backgroundColor: 'var(--color-accent)',
                    borderRadius: '1px',
                    animation: `progressBar ${SLIDE_DURATION}ms linear forwards`,
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={retreat}
          disabled={slide <= -1}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px',
            padding: '6px 12px', borderRadius: '6px', cursor: slide <= -1 ? 'default' : 'pointer',
            border: '1px solid var(--color-rule)', backgroundColor: 'transparent',
            color: slide <= -1 ? 'var(--color-rule)' : 'var(--color-muted)',
          }}
        >
          ← Zurück
        </button>

        {slide >= 0 && (
          <button
            onClick={handlePlayPause}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600,
              padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
              border: '1px solid var(--color-accent)',
              backgroundColor: playing ? 'transparent' : 'var(--color-accent)',
              color: playing ? 'var(--color-accent)' : 'var(--color-paper)',
            }}
          >
            {playing ? '⏸ Pause' : '▶ Weiter'}
          </button>
        )}

        {slide >= 0 && slide < totalSlides - 1 && (
          <button
            onClick={advance}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px',
              padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
              border: '1px solid var(--color-rule)', backgroundColor: 'transparent',
              color: 'var(--color-muted)',
            }}
          >
            Weiter →
          </button>
        )}

        <button
          onClick={onStop}
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)', fontSize: '11px',
            padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
            border: '1px solid var(--color-rule)', backgroundColor: 'transparent',
            color: 'var(--color-muted)',
          }}
        >
          Zum Scrollen wechseln
        </button>
      </div>

      {/* Dot progress */}
      {slide >= 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {beats.map((_, i) => (
            <button
              key={i}
              onClick={() => { setVisible(false); setTimeout(() => { setSlide(i); setVisible(true) }, 200) }}
              style={{
                width: i === slide ? '18px' : '6px',
                height: '6px',
                borderRadius: '3px',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                backgroundColor: i === slide ? 'var(--color-accent)' : 'var(--color-rule)',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes progressBar {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EuropeStory() {
  const [year, setYear] = useState(europeBeats[0].year)
  const [view, setView] = useState('geo')
  const [manualYear, setManualYear] = useState(null)
  const [mode, setMode] = useState('scroll')  // 'scroll' | 'play'

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
        <Link to="/" className="no-underline text-sm" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
          ← Zurück
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <span className="text-xs tracking-[.12em] uppercase" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {mode === 'scroll' ? (
            <button
              onClick={() => setMode('play')}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.06em',
                padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)', fontWeight: 600,
              }}
            >
              ▶ Präsentation starten
            </button>
          ) : (
            <button
              onClick={() => setMode('scroll')}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '12px',
                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                border: '1px solid var(--color-rule)', backgroundColor: 'transparent',
                color: 'var(--color-muted)',
              }}
            >
              ← Scrollen
            </button>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-6">
        {mode === 'play' ? (
          <PlayPanel
            beats={europeBeats}
            view={view}
            onView={setView}
            onStop={() => setMode('scroll')}
          />
        ) : (
          <>
            <ScrollMap
              beats={europeBeats}
              highlightKey="iso3"
              manualYear={manualYear}
              onActiveBeatChange={handleActiveBeatChange}
              renderMap={(year, iso3) => {
                const dataForYear = govData.byYear[String(year)]
                return (
                  <div className="flex flex-col gap-4">
                    <ViewToggle view={view} onChange={setView} />
                    {view === 'tiles'
                      ? <EuropeColorMap dataForYear={dataForYear} meta={govData.meta} highlightIso3={iso3} />
                      : <EuropeGeoMap   dataForYear={dataForYear} meta={govData.meta} highlightIso3={iso3} />
                    }
                  </div>
                )
              }}
            />
            <YearTimeline years={govData.meta.years} year={year} onChange={handleChange} />
          </>
        )}
      </section>

      <footer className="text-xs pt-4" style={{
        borderTop: '1px solid var(--color-rule)',
        fontFamily: 'var(--font-mono)', color: 'var(--color-muted)',
      }}>
        Quelle: ParlGov · Döring &amp; Manow; jüngste Wechsel manuell ergänzt
      </footer>
    </article>
  )
}
