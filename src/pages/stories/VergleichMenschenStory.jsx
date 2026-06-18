import { useState } from 'react'
import { Link } from 'react-router-dom'
import data from '../../data/fr-ge.json'
import { colorsFor } from '../../lib/categoryColors.js'
import { DE_COLOR, FR_COLOR } from '../../lib/frGeUtils.js'

const catColors = colorsFor('Frankreich & Deutschland im Vergleich')
const { ageBands, ageUnit } = data.stories.menschen
const LAST_ACTUAL = data.meta.lastActual

const BANDS = ['0–14', '15–24', '25–34', '35–44', '45–54', '55–64', '65–74', '75+']
const YEARS = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031]

// Babyboomer-Band: 55–64 wandert zu 65–74
const BOOMER_BANDS = ['55–64', '65–74']

function getBandValue(band, country, year) {
  return ageBands[band][country][String(year)] ?? 0
}

function TornadoChart({ year }) {
  const MAX_VAL = 14 // Mio.
  const BAR_H = 26
  const GAP = 6
  const LABEL_W = 50
  const BAR_MAX_W = 180
  const SVG_W = LABEL_W + BAR_MAX_W * 2 + 24
  const SVG_H = BANDS.length * (BAR_H + GAP) + 20

  const isBoomer = (band) => BOOMER_BANDS.includes(band)

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: SVG_W }}
      role="img"
      aria-label={`Altersstruktur Deutschland und Frankreich ${year}`}
    >
      {/* Spalten-Header */}
      <text x={LABEL_W / 2 + BAR_MAX_W} y="10" textAnchor="middle" style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: FR_COLOR, fontWeight: 600, textTransform: 'uppercase' }}>
        FR
      </text>
      <text x={LABEL_W / 2 + BAR_MAX_W + 24} y="10" textAnchor="middle" style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: DE_COLOR, fontWeight: 600 }}>
        DE
      </text>

      {BANDS.map((band, i) => {
        const deVal = getBandValue(band, 'DE', year)
        const frVal = getBandValue(band, 'FR', year)
        const deW = (deVal / MAX_VAL) * BAR_MAX_W
        const frW = (frVal / MAX_VAL) * BAR_MAX_W
        const y = 16 + i * (BAR_H + GAP)
        const centerX = LABEL_W / 2 + BAR_MAX_W + 12
        const boomer = isBoomer(band)

        return (
          <g key={band}>
            {/* Boomer-Highlight */}
            {boomer && (
              <rect
                x={0} y={y - 2}
                width={SVG_W} height={BAR_H + 4}
                fill="#C08A1E" opacity="0.06" rx="2"
              />
            )}

            {/* FR Balken (links) */}
            <rect
              x={centerX - frW} y={y + 2}
              width={frW} height={BAR_H - 4}
              rx="2" fill={FR_COLOR}
              opacity={year > LAST_ACTUAL ? 0.5 : 0.8}
            />

            {/* DE Balken (rechts) */}
            <rect
              x={centerX} y={y + 2}
              width={deW} height={BAR_H - 4}
              rx="2" fill={DE_COLOR}
              opacity={year > LAST_ACTUAL ? 0.5 : 0.8}
            />

            {/* Mittelachse */}
            <line x1={centerX} y1={y} x2={centerX} y2={y + BAR_H} stroke="#D8D2C4" strokeWidth="1" />

            {/* Band-Label */}
            <text x={centerX} y={y + BAR_H / 2 + 4} textAnchor="middle" style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: boomer ? '#A8771A' : '#17150F', fontWeight: boomer ? 700 : 400 }}>
              {band}
            </text>

            {/* FR Wert */}
            <text x={centerX - frW - 4} y={y + BAR_H / 2 + 4} textAnchor="end" style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: FR_COLOR }}>
              {frVal.toFixed(1)}
            </text>

            {/* DE Wert */}
            <text x={centerX + deW + 4} y={y + BAR_H / 2 + 4} style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: DE_COLOR }}>
              {deVal.toFixed(1)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function Methodik() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: '1px solid #D8D2C4', paddingTop: '1rem' }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B6658', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '10px' }}>{open ? '▾' : '▸'}</span>
        Methodik & Grenzen
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6B6658', margin: 0, lineHeight: 1.6 }}>
            — Beide Geschlechter zusammengefasst. Die Datenlage erlaubt keine Geschlechteraufteilung pro Altersband, daher kein klassisches Bevölkerungsdiagramm nach Geschlecht.
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6B6658', margin: 0, lineHeight: 1.6 }}>
            — Werte bis {LAST_ACTUAL}: Ist-Daten. Ab {LAST_ACTUAL + 1}: Prognose (Balken heller dargestellt).
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6B6658', margin: 0, lineHeight: 1.6 }}>
            — {data.meta.verified}
          </p>
        </div>
      )}
    </div>
  )
}

export default function VergleichMenschenStory() {
  const [year, setYear] = useState(2024)
  const isForecast = year > LAST_ACTUAL

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '720px' }}>
      <div>
        <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#6B6658', textDecoration: 'none' }}>
          ← Zurück
        </Link>
      </div>

      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: catColors.text }}>
          Vergleich · Menschen
        </span>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 48',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 600,
          lineHeight: 1.1, letterSpacing: '-0.02em', color: '#17150F', margin: 0,
        }}>
          Die Welle, die durch Deutschland rollt
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#6B6658', margin: 0, maxWidth: '60ch' }}>
          Deutschlands geburtenstarke Jahrgänge nähern sich der Rente, Frankreich bleibt
          jünger. Bewege den Regler und sieh, wie der Babyboomer-Bauch von 55–64 in Richtung
          65–74 wandert.
        </p>
      </header>

      {/* Legende + Hinweis */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[{ label: 'Frankreich', color: FR_COLOR }, { label: 'Deutschland', color: DE_COLOR }].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: '2px', backgroundColor: color, display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B6658' }}>{label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: '2px', backgroundColor: '#C08A1E', display: 'inline-block', opacity: 0.4 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B6658' }}>Babyboomer-Bänder (55–64, 65–74)</span>
          </div>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#9A9286' }}>
          Beide Geschlechter zusammengefasst · {ageUnit}
        </span>
      </div>

      {/* Jahres-Regler */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 36',
            fontSize: '2rem', fontWeight: 600, color: isForecast ? '#9A9286' : '#17150F',
            minWidth: '4.5rem',
          }}>
            {year}
          </span>
          {isForecast && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#C08A1E', border: '1px solid #C08A1E', borderRadius: '4px', padding: '0.15rem 0.5rem' }}>
              Prognose
            </span>
          )}
        </div>
        <input
          type="range"
          min={YEARS[0]}
          max={YEARS[YEARS.length - 1]}
          step={1}
          value={year}
          onChange={e => setYear(+e.target.value)}
          style={{ width: '100%', maxWidth: 400, accentColor: DE_COLOR }}
          aria-label="Jahr auswählen"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 400, fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#9A9286' }}>
          <span>{YEARS[0]}</span>
          <span>{YEARS[Math.floor(YEARS.length / 2)]}</span>
          <span>{YEARS[YEARS.length - 1]}</span>
        </div>
      </div>

      <TornadoChart year={year} />

      <footer style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #D8D2C4', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B6658' }}>
        <span>Quelle: {data.meta.source}</span>
        <span style={{ opacity: 0.7 }}>{data.meta.forecastNote}</span>
      </footer>

      <Methodik />
    </article>
  )
}
