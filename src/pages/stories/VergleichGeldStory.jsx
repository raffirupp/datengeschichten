import { useState } from 'react'
import { Link } from 'react-router-dom'
import data from '../../data/fr-ge.json'
import { colorsFor } from '../../lib/categoryColors.js'
import { DE_COLOR, FR_COLOR, splitActualForecast } from '../../lib/frGeUtils.js'

const catColors = colorsFor('Frankreich & Deutschland im Vergleich')
const { indicators } = data.stories.geld
const LAST_ACTUAL = data.meta.lastActual

// SVG-Liniendiagramm
const W = 560
const H = 280
const PAD = { top: 30, right: 60, bottom: 36, left: 52 }
const IW = W - PAD.left - PAD.right
const IH = H - PAD.top - PAD.bottom

const YEARS = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031]
const Y_MIN = 0
const Y_MAX = 145
const MAASTRICHT = 60

function xScale(year) {
  return PAD.left + ((year - YEARS[0]) / (YEARS[YEARS.length - 1] - YEARS[0])) * IW
}
function yScale(value) {
  return PAD.top + IH - ((value - Y_MIN) / (Y_MAX - Y_MIN)) * IH
}

function makePath(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.year).toFixed(1)} ${yScale(p.value).toFixed(1)}`).join(' ')
}

function DebtChart() {
  const deAll = YEARS.map(y => ({ year: y, value: indicators.schuldenquote.DE[String(y)] }))
  const frAll = YEARS.map(y => ({ year: y, value: indicators.schuldenquote.FR[String(y)] }))
  const { actual: deAct, forecast: deFc } = splitActualForecast(indicators.schuldenquote.DE, LAST_ACTUAL)
  const { actual: frAct, forecast: frFc } = splitActualForecast(indicators.schuldenquote.FR, LAST_ACTUAL)

  // Schattierte Lücke zwischen den Linien (FR oben, DE unten)
  const gapPoints = [
    ...frAll.map(p => `${xScale(p.year).toFixed(1)},${yScale(p.value).toFixed(1)}`),
    ...deAll.slice().reverse().map(p => `${xScale(p.year).toFixed(1)},${yScale(p.value).toFixed(1)}`),
  ].join(' ')

  const yTicks = [0, 30, 60, 90, 120]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: W }}
      role="img"
      aria-label="Staatsverschuldung Deutschland und Frankreich 2021–2031"
    >
      {/* Lücke zwischen Linien */}
      <polygon points={gapPoints} fill={FR_COLOR} opacity="0.08" />

      {/* Maastricht-Linie */}
      <line
        x1={PAD.left} y1={yScale(MAASTRICHT)}
        x2={PAD.left + IW} y2={yScale(MAASTRICHT)}
        stroke="#6B6658" strokeWidth="1" strokeDasharray="4 4"
      />
      <text
        x={PAD.left + IW + 4} y={yScale(MAASTRICHT) + 4}
        style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: '#6B6658' }}
      >
        60%
      </text>
      <text
        x={PAD.left + IW + 4} y={yScale(MAASTRICHT) - 4}
        style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: '#9A9286' }}
      >
        Maastricht
      </text>

      {/* Prognose-Trennlinie */}
      <line
        x1={xScale(LAST_ACTUAL)} y1={PAD.top - 10}
        x2={xScale(LAST_ACTUAL)} y2={PAD.top + IH}
        stroke="#D8D2C4" strokeWidth="1" strokeDasharray="3 3"
      />
      <text
        x={xScale(LAST_ACTUAL) + 4} y={PAD.top - 2}
        style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: '#9A9286' }}
      >
        ab 2025: Prognose
      </text>

      {/* Y-Achse */}
      {yTicks.map(t => (
        <g key={t}>
          <line x1={PAD.left - 4} y1={yScale(t)} x2={PAD.left + IW} y2={yScale(t)} stroke="#E8E4D8" strokeWidth="0.5" />
          <text x={PAD.left - 6} y={yScale(t) + 4} textAnchor="end" style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: '#9A9286' }}>
            {t}
          </text>
        </g>
      ))}

      {/* X-Achse Labels */}
      {[2021, 2024, 2027, 2031].map(y => (
        <text key={y} x={xScale(y)} y={PAD.top + IH + 16} textAnchor="middle" style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: '#9A9286' }}>
          {y}
        </text>
      ))}

      {/* Y-Achsen-Label */}
      <text
        x={14} y={PAD.top + IH / 2}
        textAnchor="middle"
        transform={`rotate(-90, 14, ${PAD.top + IH / 2})`}
        style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: '#9A9286' }}
      >
        % des BIP
      </text>

      {/* FR Linie: Ist */}
      <path d={makePath(frAct)} fill="none" stroke={FR_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* FR Linie: Prognose */}
      <path d={makePath(frFc)} fill="none" stroke={FR_COLOR} strokeWidth="2" strokeDasharray="5 4" opacity="0.7" strokeLinecap="round" />

      {/* DE Linie: Ist */}
      <path d={makePath(deAct)} fill="none" stroke={DE_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* DE Linie: Prognose */}
      <path d={makePath(deFc)} fill="none" stroke={DE_COLOR} strokeWidth="2" strokeDasharray="5 4" opacity="0.7" strokeLinecap="round" />

      {/* Annotationen 2024 */}
      {[
        { country: 'DE', year: 2024, value: indicators.schuldenquote.DE['2024'], color: DE_COLOR, anchor: 'end', dx: -6 },
        { country: 'FR', year: 2024, value: indicators.schuldenquote.FR['2024'], color: FR_COLOR, anchor: 'end', dx: -6 },
      ].map(({ country, year, value, color, anchor, dx }) => (
        <g key={country}>
          <circle cx={xScale(year)} cy={yScale(value)} r="3.5" fill={color} />
          <text
            x={xScale(year) + dx} y={yScale(value) - 7}
            textAnchor={anchor}
            style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: color, fontWeight: 600 }}
          >
            {country} {value.toFixed(0)}%
          </text>
        </g>
      ))}

      {/* Annotation 2030 */}
      {[
        { country: 'DE', year: 2030, value: indicators.schuldenquote.DE['2030'], color: DE_COLOR },
        { country: 'FR', year: 2030, value: indicators.schuldenquote.FR['2030'], color: FR_COLOR },
      ].map(({ country, year, value, color }) => (
        <g key={`${country}-30`}>
          <circle cx={xScale(year)} cy={yScale(value)} r="3" fill={color} opacity="0.6" />
          <text
            x={xScale(year)} y={yScale(value) - 7}
            textAnchor="middle"
            style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: color, opacity: 0.85 }}
          >
            {value.toFixed(0)}%
          </text>
        </g>
      ))}
    </svg>
  )
}

function Methodik() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: '1px solid #D8D2C4', paddingTop: '1rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B6658', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <span style={{ fontSize: '10px' }}>{open ? '▾' : '▸'}</span>
        Methodik & Grenzen
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6B6658', margin: 0, lineHeight: 1.6 }}>
            — {indicators.schuldenquote.note}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6B6658', margin: 0, lineHeight: 1.6 }}>
            — {indicators.staatsausgaben.note}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6B6658', margin: 0, lineHeight: 1.6 }}>
            — {data.meta.verified}
          </p>
        </div>
      )}
    </div>
  )
}

export default function VergleichGeldStory() {
  // Defizit 2024: Ausgaben − Einnahmen (% BIP)
  const deDefizit = (indicators.staatsausgaben.DE['2024'] - indicators.staatseinnahmen.DE['2024']).toFixed(1)
  const frDefizit = (indicators.staatsausgaben.FR['2024'] - indicators.staatseinnahmen.FR['2024']).toFixed(1)

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '720px' }}>
      <div>
        <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#6B6658', textDecoration: 'none' }}>
          ← Zurück
        </Link>
      </div>

      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: catColors.text }}>
          Vergleich · Geld
        </span>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 48',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 600,
          lineHeight: 1.1, letterSpacing: '-0.02em', color: '#17150F', margin: 0,
        }}>
          Das Schulden-Rennen
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#6B6658', margin: 0, maxWidth: '60ch' }}>
          Zwei Nachbarn, zwei Richtungen: Deutschland hält seine Schuldenquote, Frankreich zieht
          davon. Die Prognosen ab 2025 zeigen, wie weit die Schere noch aufgeht.
        </p>
      </header>

      {/* Legende */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {[{ label: 'Frankreich', color: FR_COLOR }, { label: 'Deutschland', color: DE_COLOR }].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg width="24" height="10" aria-hidden="true">
              <line x1="0" y1="5" x2="24" y2="5" stroke={color} strokeWidth="2.5" />
            </svg>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B6658' }}>{label} (Ist)</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <svg width="24" height="10" aria-hidden="true">
            <line x1="0" y1="5" x2="24" y2="5" stroke="#9A9286" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B6658' }}>Prognose</span>
        </div>
      </div>

      <DebtChart />

      {/* Defizit-Satellit */}
      <div style={{
        padding: '1rem 1.25rem',
        border: '1px solid #D8D2C4',
        borderRadius: '8px',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6B6658', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Defizit 2024 (Staatsausgaben minus Staatseinnahmen, % BIP)
        </span>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 600, color: FR_COLOR }}>{frDefizit} %</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6B6658' }}>Frankreich</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 600, color: DE_COLOR }}>{deDefizit} %</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6B6658' }}>Deutschland</span>
          </div>
        </div>
      </div>

      <footer style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #D8D2C4', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B6658' }}>
        <span>Quelle: {data.meta.source}</span>
        <span style={{ opacity: 0.7 }}>{data.meta.forecastNote}</span>
      </footer>

      <Methodik />
    </article>
  )
}
