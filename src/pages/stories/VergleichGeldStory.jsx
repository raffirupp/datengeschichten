import { useState } from 'react'
import { Link } from 'react-router-dom'
import { scaleLinear } from 'd3-scale'
import { area, line, curveMonotoneX } from 'd3-shape'
import data from '../../data/fr-ge.json'
import { colorsFor } from '../../lib/categoryColors.js'
import {
  DE_COLOR, DE_DARK, DE_FILL, DE_FILL_SOFT,
  FR_COLOR, FR_DARK, FR_FILL, FR_FILL_SOFT,
  RULE_SOFT, AXIS_MUTED, LABEL_MUTED, INK, RULE, MUTED, OCKER,
  splitActualForecast,
} from '../../lib/frGeUtils.js'

const catColors = colorsFor('Frankreich & Deutschland im Vergleich')
const { indicators } = data.stories.geld
const LAST_ACTUAL = data.meta.lastActual
const YEARS = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031]

const W = 640
const H = 360
const PAD = { top: 56, right: 100, bottom: 44, left: 48 }
const IW = W - PAD.left - PAD.right
const IH = H - PAD.top - PAD.bottom

const Y_MIN = 0
const Y_MAX = 135
const MAASTRICHT = 60

const xSc = scaleLinear().domain([YEARS[0], YEARS[YEARS.length - 1]]).range([0, IW])
const ySc = scaleLinear().domain([Y_MIN, Y_MAX]).range([IH, 0])

const lineGen = line()
  .x(d => xSc(d.year))
  .y(d => ySc(d.value))
  .curve(curveMonotoneX)

// Lücken-Fläche zwischen beiden Linien (FR oben, DE unten)
function gapPath(deAll, frAll) {
  const top = frAll.map((p, i) => `${i === 0 ? 'M' : 'L'}${xSc(p.year).toFixed(1)},${ySc(p.value).toFixed(1)}`).join(' ')
  const bottom = deAll.slice().reverse().map(p => `L${xSc(p.year).toFixed(1)},${ySc(p.value).toFixed(1)}`).join(' ')
  return `${top} ${bottom} Z`
}

function buildSeries(seriesObj) {
  const all = YEARS.map(y => ({ year: y, value: seriesObj[String(y)] }))
  const { actual, forecast } = splitActualForecast(seriesObj, LAST_ACTUAL)
  return { all, actual, forecast }
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

function GeldChart() {
  const de = buildSeries(indicators.schuldenquote.DE)
  const fr = buildSeries(indicators.schuldenquote.FR)

  const de2024 = indicators.schuldenquote.DE['2024']
  const fr2024 = indicators.schuldenquote.FR['2024']
  const de2030 = indicators.schuldenquote.DE['2030']
  const fr2030 = indicators.schuldenquote.FR['2030']

  const x2024 = xSc(2024)
  const x2030 = xSc(2030)
  const x2031 = xSc(2031)

  const yTicks = [0, 30, 60, 90, 120]
  const xTickYears = [2021, 2024, 2027, 2031]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="Staatsverschuldung Deutschland und Frankreich 2021–2031"
      style={{ overflow: 'visible' }}>
      <g transform={`translate(${PAD.left},${PAD.top})`}>

        {/* Gridlines */}
        {yTicks.map(t => (
          <line key={t} x1={0} y1={ySc(t)} x2={IW} y2={ySc(t)}
            stroke={RULE_SOFT} strokeWidth="0.5" />
        ))}

        {/* Lücken-Füllung zwischen DE und FR */}
        <path d={gapPath(de.all, fr.all)} fill={OCKER} opacity="0.08" />

        {/* Maastricht-Linie */}
        <line x1={0} y1={ySc(MAASTRICHT)} x2={IW} y2={ySc(MAASTRICHT)}
          stroke={MUTED} strokeWidth="1.2" strokeDasharray="4 4" />
        <text x={IW + 6} y={ySc(MAASTRICHT) + 4}
          style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: MUTED }}>
          60 %
        </text>
        <text x={IW + 6} y={ySc(MAASTRICHT) - 5}
          style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
          Maastricht
        </text>

        {/* Prognose-Trennlinie */}
        <line x1={x2024} y1={-20} x2={x2024} y2={IH + 8}
          stroke={RULE} strokeWidth="1" strokeDasharray="3 3" />
        <text x={x2024 - 6} y={-24} textAnchor="end"
          style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>bis 2024: Ist</text>
        <text x={x2024 + 6} y={-24}
          style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>ab 2025: Prognose</text>

        {/* Y-Achse Labels */}
        {yTicks.map(t => (
          <text key={t} x={-8} y={ySc(t) + 4} textAnchor="end"
            style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
            {t} %
          </text>
        ))}

        {/* X-Achse Labels */}
        {xTickYears.map(y => (
          <text key={y} x={xSc(y)} y={IH + 18} textAnchor="middle"
            style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
            {y}
          </text>
        ))}

        {/* DE: Ist-Linie */}
        <path d={lineGen(de.actual)} fill="none" stroke={DE_COLOR} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        {/* DE: Prognose-Linie */}
        <path d={lineGen(de.forecast)} fill="none" stroke={DE_COLOR} strokeWidth="2"
          strokeDasharray="6 4" strokeLinecap="round" opacity="0.8" />

        {/* FR: Ist-Linie */}
        <path d={lineGen(fr.actual)} fill="none" stroke={FR_COLOR} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        {/* FR: Prognose-Linie */}
        <path d={lineGen(fr.forecast)} fill="none" stroke={FR_COLOR} strokeWidth="2"
          strokeDasharray="6 4" strokeLinecap="round" opacity="0.8" />

        {/* Direkte Labels rechts am Prognose-Ende */}
        <text x={x2031 + 8} y={ySc(indicators.schuldenquote.DE['2031']) + 4}
          style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: DE_DARK, fontWeight: 600 }}>
          Deutschland
        </text>
        <text x={x2031 + 8} y={ySc(indicators.schuldenquote.FR['2031']) + 4}
          style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: FR_DARK, fontWeight: 600 }}>
          Frankreich
        </text>

        {/* Endpunkt-Marker 2024 (groß) */}
        <circle cx={x2024} cy={ySc(de2024)} r="5" fill={DE_COLOR} />
        <text x={x2024 - 10} y={ySc(de2024) - 14} textAnchor="end"
          style={{ fontSize: 19, fontFamily: 'var(--font-display)', fontWeight: 700, fill: DE_DARK }}>
          {de2024.toFixed(0)} %
        </text>

        <circle cx={x2024} cy={ySc(fr2024)} r="5" fill={FR_COLOR} />
        <text x={x2024 - 10} y={ySc(fr2024) - 14} textAnchor="end"
          style={{ fontSize: 19, fontFamily: 'var(--font-display)', fontWeight: 700, fill: FR_DARK }}>
          {fr2024.toFixed(0)} %
        </text>

        {/* Endpunkt-Marker 2030 (klein, Prognose) */}
        <circle cx={x2030} cy={ySc(de2030)} r="3.5" fill={DE_COLOR} opacity="0.7" />
        <circle cx={x2030} cy={ySc(fr2030)} r="3.5" fill={FR_COLOR} opacity="0.7" />

        {/* Annotation: Die Schere öffnet sich */}
        {(() => {
          const midX = (x2024 + x2030) / 2
          const midYDe = ySc((de2024 + de2030) / 2)
          const midYFr = ySc((fr2024 + fr2030) / 2)
          const annotY = (midYDe + midYFr) / 2
          return (
            <g>
              <path d={`M${midX},${midYFr + 8} Q${midX + 20},${annotY} ${midX + 30},${annotY + 10}`}
                fill="none" stroke={AXIS_MUTED} strokeWidth="1" />
              <text x={midX + 34} y={annotY + 14}
                style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED, fontStyle: 'italic' }}>
                Die Schere
              </text>
              <text x={midX + 34} y={annotY + 26}
                style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED, fontStyle: 'italic' }}>
                öffnet sich
              </text>
            </g>
          )
        })()}

      </g>
    </svg>
  )
}

export default function VergleichGeldStory() {
  const deDefizit = (indicators.staatsausgaben.DE['2024'] - indicators.staatseinnahmen.DE['2024']).toFixed(1)
  const frDefizit = (indicators.staatsausgaben.FR['2024'] - indicators.staatseinnahmen.FR['2024']).toFixed(1)

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '720px' }}>
      <div>
        <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: MUTED, textDecoration: 'none' }}>
          ← Zurück
        </Link>
      </div>

      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: catColors.text }}>
          Vergleich · Geld
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
          Das <strong style={{ fontWeight: 700 }}>Schulden</strong>-Rennen
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, color: MUTED, margin: 0, maxWidth: '62ch' }}>
          Zwei Nachbarn, zwei Richtungen: Deutschland hält seine Schuldenquote, Frankreich
          zieht davon. Die Prognose ab 2025 zeigt, wie weit die Schere noch aufgeht.
        </p>
      </header>

      <GeldChart />

      {/* Defizit-Satellit */}
      <div style={{ padding: '0.9rem 1.1rem', border: `1px solid ${RULE}`, borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: LABEL_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Defizit 2024 · Staatsausgaben minus Staatseinnahmen (% BIP)
        </span>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: FR_DARK }}>
            {frDefizit} % <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 400, color: MUTED }}>Frankreich</span>
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: DE_DARK }}>
            {deDefizit} % <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 400, color: MUTED }}>Deutschland</span>
          </span>
        </div>
      </div>

      <footer style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '1rem', borderTop: `1px solid ${RULE}`, fontFamily: 'var(--font-mono)', fontSize: '11px', color: MUTED }}>
        <span>Quelle: {data.meta.source}</span>
        <span style={{ opacity: 0.7 }}>{data.meta.forecastNote}</span>
      </footer>

      <Methodik notes={[
        indicators.schuldenquote.note,
        indicators.staatsausgaben.note,
        data.meta.verified,
      ]} />
    </article>
  )
}
