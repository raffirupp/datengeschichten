import { useState, useMemo } from 'react'
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

// Babyboomer-Bänder: werden hervorgehoben
const BOOMER_BANDS = new Set(['55–64', '65–74'])

// ── Chart-Dimensionen ──────────────────────────────────────────────────────
const W = 580
const BAND_H = 32
const GAP = 6
const LABEL_W = 52
const VAL_W = 44
const BAR_AREA_W = (W - LABEL_W - VAL_W * 2 - 24) / 2  // ~195 px pro Seite
const CENTER_X = LABEL_W + VAL_W + BAR_AREA_W
const SVG_H = BANDS.length * (BAND_H + GAP) + 48

const xScLeft  = scaleLinear().domain([0, 14]).range([0, BAR_AREA_W])
const xScRight = scaleLinear().domain([0, 14]).range([0, BAR_AREA_W])

function getBandVal(band, country, year) {
  return ageBands[band]?.[country]?.[String(year)] ?? 0
}

function TornadoChart({ year }) {
  const isForecast = year > LAST_ACTUAL

  return (
    <svg viewBox={`0 0 ${W} ${SVG_H}`} width="100%" role="img"
      aria-label={`Altersstruktur Deutschland und Frankreich ${year}`}
      style={{ overflow: 'visible' }}>

      {/* Spaltenheader */}
      <text x={CENTER_X - 8} y="20" textAnchor="end"
        style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fill: FR_DARK, fontWeight: 700, textTransform: 'uppercase' }}>
        Frankreich
      </text>
      <text x={CENTER_X + 8} y="20"
        style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fill: DE_DARK, fontWeight: 700 }}>
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
            {/* Boomer-Hintergrund-Highlight */}
            {isBoomer && (
              <rect x={0} y={y0 - 2} width={W} height={BAND_H + 4}
                fill={OCKER} opacity="0.08" rx="3" />
            )}

            {/* FR Balken (links vom Zentrum) */}
            <rect
              x={CENTER_X - frW} y={barY}
              width={frW} height={barH} rx="3"
              fill={isBoomer ? FR_FILL : FR_FILL}
              opacity={isForecast ? 0.5 : 0.85}
            />
            {/* FR Linie */}
            <line x1={CENTER_X - frW} y1={barY} x2={CENTER_X - frW} y2={barY + barH}
              stroke={FR_COLOR} strokeWidth={isBoomer ? 2 : 1.5} />

            {/* DE Balken (rechts) */}
            <rect
              x={CENTER_X} y={barY}
              width={deW} height={barH} rx="3"
              fill={DE_FILL}
              opacity={isForecast ? 0.5 : 0.85}
            />
            {/* DE Linie */}
            <line x1={CENTER_X + deW} y1={barY} x2={CENTER_X + deW} y2={barY + barH}
              stroke={DE_COLOR} strokeWidth={isBoomer ? 2 : 1.5} />

            {/* Zentrale Achslinie */}
            <line x1={CENTER_X} y1={y0} x2={CENTER_X} y2={y0 + BAND_H}
              stroke={RULE_SOFT} strokeWidth="1" />

            {/* Band-Label (Mitte) */}
            <text x={CENTER_X} y={y0 + BAND_H / 2 + 5} textAnchor="middle"
              style={{
                fontSize: isBoomer ? 10 : 10,
                fontFamily: 'var(--font-mono)',
                fill: isBoomer ? OCKER : AXIS_MUTED,
                fontWeight: isBoomer ? 700 : 400,
              }}>
              {band}
            </text>

            {/* FR Wert (links) */}
            <text x={CENTER_X - frW - 6} y={y0 + BAND_H / 2 + 5} textAnchor="end"
              style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: FR_DARK }}>
              {frVal.toFixed(1)}
            </text>

            {/* DE Wert (rechts) */}
            <text x={CENTER_X + deW + 6} y={y0 + BAND_H / 2 + 5}
              style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: DE_DARK }}>
              {deVal.toFixed(1)}
            </text>

            {/* Boomer-Annotation bei 55–64 im Jahr 2021 (einmalig) */}
            {isBoomer && band === '65–74' && year >= 2027 && (
              <text x={W - 4} y={y0 + BAND_H / 2 + 5} textAnchor="end"
                style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: OCKER, fontStyle: 'italic' }}>
                ← Babyboomer
              </text>
            )}
          </g>
        )
      })}

      {/* Skala-Markierungen */}
      {[0, 5, 10].map(v => (
        <g key={`left-${v}`}>
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
  const isForecast = year > LAST_ACTUAL

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
          jünger. Bewege den Regler — der Babyboomer-Bauch wandert sichtbar nach oben.
        </p>
      </header>

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

      {/* Jahres-Regler */}
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

      <TornadoChart year={year} />

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
