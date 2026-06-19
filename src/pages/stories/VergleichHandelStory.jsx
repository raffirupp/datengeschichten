import { useState } from 'react'
import { Link } from 'react-router-dom'
import { scaleLinear } from 'd3-scale'
import { area, line, curveMonotoneX } from 'd3-shape'
import data from '../../data/fr-ge.json'
import { colorsFor } from '../../lib/categoryColors.js'
import {
  DE_COLOR, DE_DARK, DE_FILL, DE_FILL_SOFT,
  FR_COLOR, FR_DARK, FR_FILL, FR_FILL_SOFT,
  RULE_SOFT, AXIS_MUTED, LABEL_MUTED, INK, RULE, MUTED,
  splitActualForecast,
} from '../../lib/frGeUtils.js'

const catColors = colorsFor('Frankreich & Deutschland im Vergleich')
const { indicators } = data.stories.handel
const LAST_ACTUAL = data.meta.lastActual
const YEARS = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031]

// ── Chart-Dimensionen ──────────────────────────────────────────────────────
const W = 640
const H = 380
const PAD = { top: 56, right: 88, bottom: 44, left: 52 }
const IW = W - PAD.left - PAD.right
const IH = H - PAD.top - PAD.bottom
const ABS_MAX = 270 // symmetrische y-Skala ±270 Mrd €

const xSc = scaleLinear().domain([YEARS[0], YEARS[YEARS.length - 1]]).range([0, IW])
const ySc = scaleLinear().domain([-ABS_MAX, ABS_MAX]).range([IH, 0])

const areaGen = area()
  .x(d => xSc(d.year))
  .y0(ySc(0))
  .y1(d => ySc(d.value))
  .curve(curveMonotoneX)

const lineGen = line()
  .x(d => xSc(d.year))
  .y(d => ySc(d.value))
  .curve(curveMonotoneX)

function buildSeries(seriesObj) {
  const all = YEARS.map(y => ({ year: y, value: seriesObj[String(y)] }))
  const { actual, forecast } = splitActualForecast(seriesObj, LAST_ACTUAL)
  return { all, actual, forecast }
}

// ── Methodik-Expander (shared) ─────────────────────────────────────────────
function Methodik({ notes }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: '1rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', color: MUTED, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
      >
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

// ── Das Chart ─────────────────────────────────────────────────────────────
function HandelChart() {
  const de = buildSeries(indicators.handelsbilanz.DE)
  const fr = buildSeries(indicators.handelsbilanz.FR)

  const de2024 = indicators.handelsbilanz.DE['2024']
  const fr2024 = indicators.handelsbilanz.FR['2024']
  const de2031 = indicators.handelsbilanz.DE['2031']
  const fr2031 = indicators.handelsbilanz.FR['2031']

  const x2024 = xSc(2024)
  const x2031 = xSc(2031)
  const yZero = ySc(0)

  const yTicks = [-200, -100, 0, 100, 200]
  const xTickYears = [2021, 2023, 2025, 2027, 2029, 2031]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Warenhandelsbilanz Deutschland und Frankreich 2021–2031, gespiegelt um die Null-Linie"
      style={{ overflow: 'visible' }}
    >
      <g transform={`translate(${PAD.left},${PAD.top})`}>

        {/* Horizontale Gridlines */}
        {yTicks.filter(t => t !== 0).map(t => (
          <line key={t} x1={0} y1={ySc(t)} x2={IW} y2={ySc(t)} stroke={RULE_SOFT} strokeWidth="0.5" />
        ))}

        {/* Y-Achse Labels */}
        {yTicks.map(t => (
          <text key={t} x={-8} y={ySc(t) + 4} textAnchor="end"
            style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
            {t > 0 ? `+${t}` : t}
          </text>
        ))}

        {/* Y-Achsen-Label */}
        <text x={-44} y={IH / 2} textAnchor="middle"
          transform={`rotate(-90,-44,${IH / 2})`}
          style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
          Mrd €
        </text>

        {/* X-Achse Labels */}
        {xTickYears.map(y => (
          <text key={y} x={xSc(y)} y={IH + 18} textAnchor="middle"
            style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
            {y}
          </text>
        ))}

        {/* Prognose-Trennlinie bei 2024 */}
        <line x1={x2024} y1={-20} x2={x2024} y2={IH + 8}
          stroke={RULE} strokeWidth="1" strokeDasharray="3 3" />
        <text x={x2024 - 6} y={-24} textAnchor="end"
          style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
          bis 2024: Ist
        </text>
        <text x={x2024 + 6} y={-24}
          style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
          ab 2025: Prognose
        </text>

        {/* ── DE: Flächen ── */}
        {/* Ist-Fläche DE */}
        <path d={areaGen(de.actual)} fill={DE_FILL} opacity="0.75" />
        {/* Prognose-Fläche DE */}
        <path d={areaGen(de.forecast)} fill={DE_FILL_SOFT} opacity="0.6" />

        {/* ── FR: Flächen ── */}
        {/* Ist-Fläche FR */}
        <path d={areaGen(fr.actual)} fill={FR_FILL} opacity="0.75" />
        {/* Prognose-Fläche FR */}
        <path d={areaGen(fr.forecast)} fill={FR_FILL_SOFT} opacity="0.6" />

        {/* ── Null-Linie (nach den Flächen, damit sie obendrauf liegt) ── */}
        <line x1={0} y1={yZero} x2={IW} y2={yZero} stroke={INK} strokeWidth="1.5" />

        {/* ── DE: Linien ── */}
        <path d={lineGen(de.actual)} fill="none" stroke={DE_COLOR} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d={lineGen(de.forecast)} fill="none" stroke={DE_COLOR} strokeWidth="2"
          strokeDasharray="6 4" strokeLinecap="round" opacity="0.8" />

        {/* ── FR: Linien ── */}
        <path d={lineGen(fr.actual)} fill="none" stroke={FR_COLOR} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d={lineGen(fr.forecast)} fill="none" stroke={FR_COLOR} strokeWidth="2"
          strokeDasharray="6 4" strokeLinecap="round" opacity="0.8" />

        {/* Direkte Labels in den Flächen */}
        <text x={xSc(2022)} y={ySc(80)}
          style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: DE_DARK, fontWeight: 600 }}>
          Deutschland — Überschuss
        </text>
        <text x={xSc(2022)} y={ySc(-155)}
          style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: FR_DARK, fontWeight: 600 }}>
          Frankreich — Defizit
        </text>

        {/* ── Endpunkt-Marker 2024 (groß) ── */}
        <circle cx={x2024} cy={ySc(de2024)} r="5" fill={DE_COLOR} />
        <text x={x2024 - 10} y={ySc(de2024) - 14} textAnchor="end"
          style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, fill: DE_DARK }}>
          +{Math.round(de2024)} Mrd €
        </text>

        <circle cx={x2024} cy={ySc(fr2024)} r="5" fill={FR_COLOR} />
        <text x={x2024 - 10} y={ySc(fr2024) + 28} textAnchor="end"
          style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, fill: FR_DARK }}>
          {Math.round(fr2024)} Mrd €
        </text>

        {/* ── Endpunkt-Marker 2031 (klein, Prognose) ── */}
        <circle cx={x2031} cy={ySc(de2031)} r="3.5" fill={DE_COLOR} opacity="0.7" />
        <text x={x2031 + 8} y={ySc(de2031) + 4}
          style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: DE_DARK, opacity: 0.8 }}>
          +{Math.round(de2031)} Mrd €
        </text>

        <circle cx={x2031} cy={ySc(fr2031)} r="3.5" fill={FR_COLOR} opacity="0.7" />
        <text x={x2031 + 8} y={ySc(fr2031) + 4}
          style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: FR_DARK, opacity: 0.8 }}>
          {Math.round(fr2031)} Mrd €
        </text>

      </g>
    </svg>
  )
}

export default function VergleichHandelStory() {
  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '720px' }}>
      <div>
        <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: MUTED, textDecoration: 'none' }}>
          ← Zurück
        </Link>
      </div>

      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: catColors.text }}>
          Vergleich · Handel
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
          Gleiches Bild, anderes{' '}
          <strong style={{ fontWeight: 700 }}>Vorzeichen</strong>
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, color: MUTED, margin: 0, maxWidth: '62ch' }}>
          Deutschland verkauft der Welt mehr, als es einkauft — Frankreich genau umgekehrt.
          Beide Flächen spreizen sich aus: der Überschuss wächst, das Defizit auch.
        </p>
      </header>

      <HandelChart />

      <footer style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '1rem', borderTop: `1px solid ${RULE}`, fontFamily: 'var(--font-mono)', fontSize: '11px', color: MUTED }}>
        <span>Quelle: {data.meta.source}</span>
        <span style={{ opacity: 0.7 }}>{data.meta.forecastNote}</span>
      </footer>

      <Methodik notes={[
        indicators.handelsbilanz.note,
        data.meta.verified,
      ]} />
    </article>
  )
}
