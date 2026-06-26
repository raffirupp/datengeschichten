import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { scaleLinear } from 'd3-scale'
import data from '../../data/fr-ge.json'
import { colorsFor } from '../../lib/categoryColors.js'
import {
  DE_COLOR, DE_DARK, DE_FILL,
  FR_COLOR, FR_DARK, FR_FILL,
  RULE_SOFT, AXIS_MUTED, LABEL_MUTED, INK, RULE, MUTED, OCKER,
} from '../../lib/frGeUtils.js'

const catColors = colorsFor('Frankreich & Deutschland im Vergleich')
const { ageBands, ageUnit } = data.stories.menschen
const LAST_ACTUAL = data.meta.lastActual
const YEARS = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031]
const BANDS = ['0–14', '15–24', '25–34', '35–44', '45–54', '55–64', '65–74', '75+']
const BOOMER_BANDS = new Set(['55–64', '65–74'])

const W = 580
const BAND_H = 32
const GAP = 6
const LABEL_W = 52
const VAL_W = 44
const BAR_AREA_W = (W - LABEL_W - VAL_W * 2 - 24) / 2
const CENTER_X = LABEL_W + VAL_W + BAR_AREA_W
const SVG_H = BANDS.length * (BAND_H + GAP) + 48

const xScLeft  = scaleLinear().domain([0, 14]).range([0, BAR_AREA_W])
const xScRight = scaleLinear().domain([0, 14]).range([0, BAR_AREA_W])

function getBandVal(band, country, year) {
  return ageBands[band]?.[country]?.[String(year)] ?? 0
}

// revealStep controls progressive visibility:
// 0 = only axis + band labels + scale
// 1 = + DE bars + DE header
// 2 = + FR bars + FR header
// 3 = + boomer highlight + annotation
function TornadoChart({ year, revealStep = 3 }) {
  const isForecast = year > LAST_ACTUAL
  const showDE = revealStep >= 1
  const showFR = revealStep >= 2
  const showBoomer = revealStep >= 3

  const fadeIn = (visible) => ({ opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease' })

  return (
    <svg viewBox={`0 0 ${W} ${SVG_H}`} width="100%" role="img"
      aria-label={`Altersstruktur Deutschland und Frankreich ${year}`}
      style={{ overflow: 'visible' }}>

      {/* Column headers */}
      <text x={CENTER_X - 8} y="20" textAnchor="end"
        style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fill: FR_DARK, fontWeight: 700, textTransform: 'uppercase', ...fadeIn(showFR) }}>
        Frankreich
      </text>
      <text x={CENTER_X + 8} y="20"
        style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fill: DE_DARK, fontWeight: 700, ...fadeIn(showDE) }}>
        Deutschland
      </text>

      {BANDS.map((band, i) => {
        const deVal = getBandVal(band, 'DE', year)
        const frVal = getBandVal(band, 'FR', year)
        const deW   = xScRight(deVal)
        const frW   = xScLeft(frVal)
        const y0    = 32 + i * (BAND_H + GAP)
        const barY  = y0 + 4
        const barH  = BAND_H - 8
        const isBoomer = BOOMER_BANDS.has(band)

        return (
          <g key={band}>
            {/* Boomer highlight */}
            {isBoomer && (
              <rect x={0} y={y0 - 2} width={W} height={BAND_H + 4}
                fill={OCKER} rx="3"
                style={{ opacity: showBoomer ? 0.08 : 0, transition: 'opacity 0.7s ease' }} />
            )}

            {/* FR bar */}
            <rect
              x={CENTER_X - frW} y={barY}
              width={frW} height={barH} rx="3"
              fill={FR_FILL}
              style={{ opacity: showFR ? (isForecast ? 0.5 : 0.85) : 0, transition: 'opacity 0.7s ease' }}
            />
            <line x1={CENTER_X - frW} y1={barY} x2={CENTER_X - frW} y2={barY + barH}
              stroke={FR_COLOR} strokeWidth={isBoomer ? 2 : 1.5}
              style={{ opacity: showFR ? 1 : 0, transition: 'opacity 0.7s ease' }} />

            {/* DE bar */}
            <rect
              x={CENTER_X} y={barY}
              width={deW} height={barH} rx="3"
              fill={DE_FILL}
              style={{ opacity: showDE ? (isForecast ? 0.5 : 0.85) : 0, transition: 'opacity 0.7s ease' }}
            />
            <line x1={CENTER_X + deW} y1={barY} x2={CENTER_X + deW} y2={barY + barH}
              stroke={DE_COLOR} strokeWidth={isBoomer ? 2 : 1.5}
              style={{ opacity: showDE ? 1 : 0, transition: 'opacity 0.7s ease' }} />

            {/* Center axis — always visible */}
            <line x1={CENTER_X} y1={y0} x2={CENTER_X} y2={y0 + BAND_H}
              stroke={RULE_SOFT} strokeWidth="1" />

            {/* Band label — always visible */}
            <text x={CENTER_X} y={y0 + BAND_H / 2 + 5} textAnchor="middle"
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                fill: isBoomer ? OCKER : AXIS_MUTED,
                fontWeight: isBoomer ? 700 : 400,
              }}>
              {band}
            </text>

            {/* FR value */}
            <text x={CENTER_X - frW - 6} y={y0 + BAND_H / 2 + 5} textAnchor="end"
              style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: FR_DARK, ...fadeIn(showFR) }}>
              {frVal.toFixed(1)}
            </text>

            {/* DE value */}
            <text x={CENTER_X + deW + 6} y={y0 + BAND_H / 2 + 5}
              style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: DE_DARK, ...fadeIn(showDE) }}>
              {deVal.toFixed(1)}
            </text>

            {/* Boomer annotation */}
            {isBoomer && band === '65–74' && year >= 2027 && (
              <text x={W - 4} y={y0 + BAND_H / 2 + 5} textAnchor="end"
                style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: OCKER, fontStyle: 'italic', ...fadeIn(showBoomer) }}>
                ← Babyboomer
              </text>
            )}
          </g>
        )
      })}

      {/* Scale labels — always visible */}
      {[0, 5, 10].map(v => (
        <g key={`scale-${v}`}>
          <text x={CENTER_X - xScLeft(v)} y={SVG_H - 4} textAnchor="middle"
            style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
            {v}
          </text>
          <text x={CENTER_X + xScRight(v)} y={SVG_H - 4} textAnchor="middle"
            style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
            {v}
          </text>
        </g>
      ))}
      <text x={CENTER_X} y={SVG_H - 4} textAnchor="middle"
        style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
        Mio.
      </text>
    </svg>
  )
}

const SCROLL_STEPS = [
  {
    headline: 'Acht Altersgruppen',
    body: 'Von 0–14 bis 75+, in Millionen Personen. In der Mitte die Trennlinie — links wird Frankreich erscheinen, rechts Deutschland.',
  },
  {
    headline: 'Deutschlands Profil',
    body: 'Ein deutlicher Bauch in den mittleren Jahrgängen. Die Babyboomer-Generation, geboren zwischen 1955 und 1969, ist heute 55–74 Jahre alt — und gut sichtbar.',
  },
  {
    headline: 'Frankreich dazu',
    body: 'Frankreich sieht anders aus: jünger, gleichmäßiger verteilt. Die Basis — die unter 15-Jährigen — ist breiter. Ein strukturell anderes Land.',
  },
  {
    headline: 'Die Welle',
    body: 'Die goldenen Bänder markieren die Babyboomer-Jahrgänge 55–64 und 65–74. Schiebe den Regler weiter unten — bis 2031 wandert dieser Bauch sichtbar nach oben.',
  },
]

function Methodik({ notes }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: '1rem' }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', color: MUTED, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '10px' }}>{open ? '▾' : '▸'}</span>
        Methodik & Grenzen
      </button>
      {open && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {notes.map((n, i) => (
            <p key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: MUTED, margin: 0, lineHeight: 1.6 }}>— {n}</p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VergleichMenschenStory() {
  const [year, setYear] = useState(2024)
  const [activeStep, setActiveStep] = useState(0)
  const isForecast = year > LAST_ACTUAL

  // Refs for scroll steps
  const stepRefs = useRef([])

  useEffect(() => {
    const observers = SCROLL_STEPS.map((_, i) => {
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveStep(i) },
        { rootMargin: '-30% 0px -30% 0px' }
      )
      if (stepRefs.current[i]) obs.observe(stepRefs.current[i])
      return obs
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: MUTED, textDecoration: 'none' }}>
          ← Zurück
        </Link>
      </div>

      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: catColors.text }}>
          Vergleich · Menschen
        </span>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontVariationSettings: '"opsz" 48',
          fontSize: 'clamp(1.9rem, 4.5vw, 2.75rem)',
          fontWeight: 400,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: INK,
          margin: 0,
        }}>
          Die <strong style={{ fontWeight: 700 }}>Welle</strong>, die durch Deutschland rollt
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, color: MUTED, margin: 0, maxWidth: '62ch' }}>
          Deutschlands geburtenstarke Jahrgänge nähern sich der Rente, Frankreich bleibt
          jünger. Scrolle durch die Geschichte — oder bewege den Regler am Ende.
        </p>
      </header>

      {/* ── Scroll reveal section ────────────────────────────────── */}
      <section style={{ position: 'relative' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)',
          gap: '2rem',
          alignItems: 'start',
        }}>
          {/* Text steps column */}
          <div>
            {SCROLL_STEPS.map((step, i) => (
              <div
                key={i}
                ref={el => stepRefs.current[i] = el}
                style={{
                  minHeight: '65vh',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '2rem 0',
                  gap: '0.75rem',
                  opacity: activeStep === i ? 1 : 0.35,
                  transition: 'opacity 0.4s ease',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: catColors.text,
                }}>
                  {i + 1} / {SCROLL_STEPS.length}
                </span>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontVariationSettings: '"opsz" 24',
                  fontSize: '1.4rem',
                  fontWeight: 600,
                  color: INK,
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}>
                  {step.headline}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.7,
                  color: MUTED,
                  margin: 0,
                  maxWidth: '38ch',
                }}>
                  {step.body}
                </p>
              </div>
            ))}
            {/* Spacer so last step can reach center before section ends */}
            <div style={{ height: '40vh' }} />
          </div>

          {/* Sticky chart column */}
          <div style={{ position: 'sticky', top: '5rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: LABEL_MUTED,
            }}>
              <span>Stand: 2024 · Ist-Daten</span>
            </div>
            <TornadoChart year={2024} revealStep={activeStep} />
          </div>
        </div>
      </section>

      {/* ── Interactive section ──────────────────────────────────── */}
      <section style={{ borderTop: `1px solid #EEEEEE`, paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontVariationSettings: '"opsz" 24',
            fontSize: '1.2rem',
            fontWeight: 600,
            color: INK,
            margin: '0 0 0.4rem',
            letterSpacing: '-0.01em',
          }}>
            Erkunde selbst
          </h2>
          <p style={{ fontSize: '0.875rem', color: MUTED, margin: 0 }}>
            Bewege den Regler — der Babyboomer-Bauch wandert bis 2031 sichtbar nach oben.
          </p>
        </div>

        {/* Metahinweis */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: LABEL_MUTED, border: `1px solid ${RULE}`, borderRadius: '4px', padding: '0.2rem 0.55rem' }}>
            Beide Geschlechter zusammengefasst · {ageUnit}
          </span>
          {isForecast && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: OCKER, border: `1px solid ${OCKER}`, borderRadius: '4px', padding: '0.2rem 0.55rem' }}>
              Prognose
            </span>
          )}
        </div>

        {/* Year slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontVariationSettings: '"opsz" 36',
              fontSize: '2.2rem',
              fontWeight: 700,
              color: isForecast ? AXIS_MUTED : INK,
            }}>
              {year}
            </span>
          </div>
          <input
            type="range"
            min={YEARS[0]} max={YEARS[YEARS.length - 1]} step={1}
            value={year}
            onChange={e => setYear(+e.target.value)}
            style={{ width: '100%', maxWidth: 400, accentColor: DE_COLOR }}
            aria-label="Jahr auswählen"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 400, fontFamily: 'var(--font-mono)', fontSize: '9px', color: AXIS_MUTED }}>
            <span>{YEARS[0]}</span>
            <span style={{ color: RULE }}>·</span>
            <span>2024 (Ist)</span>
            <span style={{ color: RULE }}>·</span>
            <span>{YEARS[YEARS.length - 1]}</span>
          </div>
        </div>

        <TornadoChart year={year} revealStep={3} />
      </section>

      <footer style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '1rem', borderTop: `1px solid ${RULE}`, fontFamily: 'var(--font-mono)', fontSize: '11px', color: MUTED }}>
        <span>Quelle: {data.meta.source}</span>
        <span style={{ opacity: 0.7 }}>{data.meta.forecastNote}</span>
      </footer>

      <Methodik notes={[
        'Beide Geschlechter zusammengefasst. Die Datenlage erlaubt keine Geschlechteraufteilung pro Altersband — daher kein klassisches Bevölkerungsdiagramm nach Geschlecht.',
        `Werte bis ${LAST_ACTUAL}: Ist-Daten. Ab ${LAST_ACTUAL + 1}: Prognose (Balken transparent dargestellt).`,
        data.meta.verified,
      ]} />
    </article>
  )
}
