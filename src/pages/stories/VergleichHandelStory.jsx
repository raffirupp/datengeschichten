import { useState } from 'react'
import { Link } from 'react-router-dom'
import data from '../../data/fr-ge.json'
import { colorsFor } from '../../lib/categoryColors.js'
import { DE_COLOR, FR_COLOR, splitActualForecast } from '../../lib/frGeUtils.js'

const catColors = colorsFor('Frankreich & Deutschland im Vergleich')
const { indicators } = data.stories.handel
const LAST_ACTUAL = data.meta.lastActual

const W = 560
const H = 300
const PAD = { top: 30, right: 60, bottom: 36, left: 60 }
const IW = W - PAD.left - PAD.right
const IH = H - PAD.top - PAD.bottom

const YEARS = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031]

// Symmetric y-scale around 0
const ABS_MAX = 250

function xScale(year) {
  return PAD.left + ((year - YEARS[0]) / (YEARS[YEARS.length - 1] - YEARS[0])) * IW
}
function yScale(value) {
  // 0 is center
  const center = PAD.top + IH / 2
  return center - (value / ABS_MAX) * (IH / 2)
}

function makePath(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.year).toFixed(1)} ${yScale(p.value).toFixed(1)}`).join(' ')
}

function makeAreaPath(points, baseline) {
  if (points.length === 0) return ''
  const linePart = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.year).toFixed(1)} ${yScale(p.value).toFixed(1)}`).join(' ')
  const closePart = points.slice().reverse().map(p => `L${xScale(p.year).toFixed(1)} ${yScale(baseline).toFixed(1)}`).join(' ')
  return `${linePart} ${closePart} Z`
}

function TradeChart() {
  const { actual: deAct, forecast: deFc } = splitActualForecast(indicators.handelsbilanz.DE, LAST_ACTUAL)
  const { actual: frAct, forecast: frFc } = splitActualForecast(indicators.handelsbilanz.FR, LAST_ACTUAL)

  const zeroY = yScale(0)
  const yTicks = [-200, -100, 0, 100, 200]

  const de2024 = indicators.handelsbilanz.DE['2024']
  const fr2024 = indicators.handelsbilanz.FR['2024']

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: W }}
      role="img"
      aria-label="Warenhandelsbilanz Deutschland und Frankreich 2021–2031"
    >
      {/* Y-Gitter + Achse */}
      {yTicks.map(t => (
        <g key={t}>
          <line x1={PAD.left} y1={yScale(t)} x2={PAD.left + IW} y2={yScale(t)} stroke={t === 0 ? '#9A9286' : '#E8E4D8'} strokeWidth={t === 0 ? 1.5 : 0.5} />
          <text x={PAD.left - 6} y={yScale(t) + 4} textAnchor="end" style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: '#9A9286' }}>
            {t > 0 ? `+${t}` : t}
          </text>
        </g>
      ))}

      {/* Null-Linie Label */}
      <text x={PAD.left + 4} y={zeroY - 5} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: '#9A9286' }}>
        ausgeglichen
      </text>

      {/* X-Achse Labels */}
      {[2021, 2024, 2027, 2031].map(y => (
        <text key={y} x={xScale(y)} y={PAD.top + IH + 16} textAnchor="middle" style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: '#9A9286' }}>
          {y}
        </text>
      ))}

      {/* Y-Label */}
      <text x={14} y={PAD.top + IH / 2} textAnchor="middle" transform={`rotate(-90, 14, ${PAD.top + IH / 2})`} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: '#9A9286' }}>
        Mrd €
      </text>

      {/* Prognose-Trennlinie */}
      <line x1={xScale(LAST_ACTUAL)} y1={PAD.top - 10} x2={xScale(LAST_ACTUAL)} y2={PAD.top + IH} stroke="#D8D2C4" strokeWidth="1" strokeDasharray="3 3" />
      <text x={xScale(LAST_ACTUAL) + 4} y={PAD.top - 2} style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: '#9A9286' }}>ab 2025: Prognose</text>

      {/* DE Fläche: Ist (über Null) */}
      <path d={makeAreaPath(deAct, 0)} fill={DE_COLOR} opacity="0.18" />
      {/* DE Fläche: Prognose */}
      <path d={makeAreaPath(deFc, 0)} fill={DE_COLOR} opacity="0.08" />

      {/* FR Fläche: Ist (unter Null) */}
      <path d={makeAreaPath(frAct, 0)} fill={FR_COLOR} opacity="0.18" />
      {/* FR Fläche: Prognose */}
      <path d={makeAreaPath(frFc, 0)} fill={FR_COLOR} opacity="0.08" />

      {/* DE Linie: Ist */}
      <path d={makePath(deAct)} fill="none" stroke={DE_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* DE Linie: Prognose */}
      <path d={makePath(deFc)} fill="none" stroke={DE_COLOR} strokeWidth="2" strokeDasharray="5 4" opacity="0.75" />

      {/* FR Linie: Ist */}
      <path d={makePath(frAct)} fill="none" stroke={FR_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* FR Linie: Prognose */}
      <path d={makePath(frFc)} fill="none" stroke={FR_COLOR} strokeWidth="2" strokeDasharray="5 4" opacity="0.75" />

      {/* Annotation 2024 */}
      <g>
        <circle cx={xScale(2024)} cy={yScale(de2024)} r="3.5" fill={DE_COLOR} />
        <text x={xScale(2024) - 6} y={yScale(de2024) - 8} textAnchor="end" style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: DE_COLOR, fontWeight: 600 }}>
          DE +{Math.round(de2024)} Mrd €
        </text>
      </g>
      <g>
        <circle cx={xScale(2024)} cy={yScale(fr2024)} r="3.5" fill={FR_COLOR} />
        <text x={xScale(2024) + 6} y={yScale(fr2024) + 14} textAnchor="start" style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: FR_COLOR, fontWeight: 600 }}>
          FR {Math.round(fr2024)} Mrd €
        </text>
      </g>
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
            — {indicators.handelsbilanz.note}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6B6658', margin: 0, lineHeight: 1.6 }}>
            — {data.meta.verified}
          </p>
        </div>
      )}
    </div>
  )
}

export default function VergleichHandelStory() {
  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '720px' }}>
      <div>
        <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#6B6658', textDecoration: 'none' }}>
          ← Zurück
        </Link>
      </div>

      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: catColors.text }}>
          Vergleich · Handel
        </span>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 48',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 600,
          lineHeight: 1.1, letterSpacing: '-0.02em', color: '#17150F', margin: 0,
        }}>
          Gleiches Bild, anderes Vorzeichen
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#6B6658', margin: 0, maxWidth: '60ch' }}>
          Deutschland verkauft der Welt mehr, als es einkauft — Frankreich genau umgekehrt.
          Beide Flächen spreizen sich weiter auf: der Überschuss dort, das Defizit hier.
        </p>
      </header>

      {/* Legende */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {[{ label: 'Deutschland — Überschuss', color: DE_COLOR }, { label: 'Frankreich — Defizit', color: FR_COLOR }].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: '2px', backgroundColor: color, display: 'inline-block', opacity: 0.7 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B6658' }}>{label}</span>
          </div>
        ))}
      </div>

      <TradeChart />

      <footer style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #D8D2C4', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B6658' }}>
        <span>Quelle: {data.meta.source}</span>
        <span style={{ opacity: 0.7 }}>{data.meta.forecastNote}</span>
      </footer>

      <Methodik />
    </article>
  )
}
