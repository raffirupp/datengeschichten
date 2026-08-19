import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { scaleLinear } from 'd3-scale'
import { area, line, curveMonotoneX } from 'd3-shape'
import data from '../../data/fr-ge.json'
import { colorsFor } from '../../lib/categoryColors.js'
import {
  DE_COLOR, DE_DARK, DE_FILL, DE_FILL_SOFT,
  FR_COLOR, FR_DARK, FR_FILL, FR_FILL_SOFT,
  RULE_SOFT, AXIS_MUTED, LABEL_MUTED, INK, RULE, MUTED, OCKER,
  splitActualForecast, fmtDe,
} from '../../lib/frGeUtils.js'

const catColors = colorsFor('Frankreich & Deutschland im Vergleich')
const LAST_ACTUAL = data.meta.lastActual
const YEARS = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031]

const leben = data.stories.leben.indicators
const geld = data.stories.geld.indicators
const handel = data.stories.handel.indicators
const { ageBands, ageUnit } = data.stories.menschen

function lebenVal(key, country) {
  return leben[key][country][String(LAST_ACTUAL)]
}

function buildSeries(seriesObj) {
  const all = YEARS.map(y => ({ year: y, value: seriesObj[String(y)] }))
  const { actual, forecast } = splitActualForecast(seriesObj, LAST_ACTUAL)
  return { all, actual, forecast }
}

// ── Scroll-Reveal (shared über alle vier Abschnitte) ────────────────────────
function Reveal({ delay = 0, children }) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect() } }, { threshold: 0.15 })
    io.observe(el); return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(10px)',
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

function SectionHeading({ kicker, title }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase',
        letterSpacing: '0.1em', color: catColors.text,
      }}>
        {kicker}
      </span>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 32',
        fontSize: '1.55rem', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.015em',
        color: INK, margin: 0,
      }}>
        {title}
      </h2>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// Abschnitt 1 — Leben
// ══════════════════════════════════════════════════════════════════════════
const LE_MIN = 70
const LE_MAX = 85
const LE_W = 440

function LebenserwartungChart() {
  const fr = lebenVal('lebenserwartung', 'FR')
  const de = lebenVal('lebenserwartung', 'DE')
  const xSc = scaleLinear().domain([LE_MIN, LE_MAX]).range([0, LE_W])

  const W = 560
  const H = 110
  const PL = 80

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="Lebenserwartung Frankreich und Deutschland 2024" style={{ overflow: 'visible' }}>
      <g transform={`translate(${PL},0)`}>
        <line x1={0} y1={78} x2={LE_W} y2={78} stroke={RULE_SOFT} strokeWidth="1" />
        {[70, 75, 80, 85].map(t => (
          <g key={t}>
            <line x1={xSc(t)} y1={74} x2={xSc(t)} y2={80} stroke={RULE_SOFT} strokeWidth="1" />
            <text x={xSc(t)} y={90} textAnchor="middle"
              style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
              {t}
            </text>
          </g>
        ))}
        <text x={LE_W / 2} y={104} textAnchor="middle"
          style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
          Jahre
        </text>

        <text x={-8} y={22} textAnchor="end"
          style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: FR_DARK, fontWeight: 600 }}>
          Frankreich
        </text>
        <rect x={0} y={10} width={xSc(fr)} height={16} rx="3" fill={FR_FILL} opacity="0.9" />
        <rect x={xSc(fr) - 2} y={10} width={2} height={16} rx="1" fill={FR_COLOR} />
        <circle cx={xSc(fr)} cy={18} r="5" fill={FR_COLOR} />
        <text x={xSc(fr) + 10} y={23}
          style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, fill: FR_DARK }}>
          {fmtDe(fr)} J.
        </text>

        <text x={-8} y={58} textAnchor="end"
          style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: DE_DARK, fontWeight: 600 }}>
          Deutschland
        </text>
        <rect x={0} y={46} width={xSc(de)} height={16} rx="3" fill={DE_FILL} opacity="0.9" />
        <rect x={xSc(de) - 2} y={46} width={2} height={16} rx="1" fill={DE_COLOR} />
        <circle cx={xSc(de)} cy={54} r="5" fill={DE_COLOR} />
        <text x={xSc(de) + 10} y={59}
          style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, fill: DE_DARK }}>
          {fmtDe(de)} J.
        </text>
      </g>
    </svg>
  )
}

function DumbbellRow({ label, unit, frVal, deVal, domainMax, note }) {
  const W = 540
  const PL = 80
  const BAR_W = W - PL - 60
  const xSc = scaleLinear().domain([0, domainMax]).range([0, BAR_W])
  const frX = xSc(frVal)
  const deX = xSc(deVal)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: LABEL_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </span>
      <svg viewBox={`0 0 ${W} 52`} width="100%" role="img" aria-label={`${label}: Frankreich ${frVal}, Deutschland ${deVal}`} style={{ overflow: 'visible' }}>
        <g transform={`translate(${PL},0)`}>
          <line x1={0} y1={28} x2={BAR_W} y2={28} stroke={RULE_SOFT} strokeWidth="0.8" />
          {[0, domainMax / 2, domainMax].map(t => (
            <text key={t} x={xSc(t)} y={42} textAnchor="middle"
              style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
              {t}
            </text>
          ))}
          <text x={BAR_W + 4} y={42}
            style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
            {unit}
          </text>

          <line x1={Math.min(frX, deX)} y1={22} x2={Math.max(frX, deX)} y2={22}
            stroke={RULE_SOFT} strokeWidth="1.5" />

          <circle cx={frX} cy={22} r="6.5" fill={FR_COLOR} />
          <text x={frX} y={26} textAnchor="middle"
            style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: 'white', fontWeight: 700 }}>
            FR
          </text>
          <text x={frX} y={12} textAnchor="middle"
            style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, fill: FR_DARK }}>
            {fmtDe(frVal)}
          </text>

          <circle cx={deX} cy={22} r="6.5" fill={DE_COLOR} />
          <text x={deX} y={26} textAnchor="middle"
            style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: 'white', fontWeight: 700 }}>
            DE
          </text>
          <text x={deX} y={12} textAnchor="middle"
            style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, fill: DE_DARK }}>
            {fmtDe(deVal)}
          </text>
        </g>
      </svg>
      {note && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', color: AXIS_MUTED, margin: 0, lineHeight: 1.6 }}>
          {note}
        </p>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// Abschnitt 2 — Geld
// ══════════════════════════════════════════════════════════════════════════
const GELD_W = 640
const GELD_H = 360
const GELD_PAD = { top: 56, right: 100, bottom: 44, left: 48 }
const GELD_IW = GELD_W - GELD_PAD.left - GELD_PAD.right
const GELD_IH = GELD_H - GELD_PAD.top - GELD_PAD.bottom
const GELD_Y_MIN = 0
const GELD_Y_MAX = 135
const GELD_MAASTRICHT = 60

const geldXSc = scaleLinear().domain([YEARS[0], YEARS[YEARS.length - 1]]).range([0, GELD_IW])
const geldYSc = scaleLinear().domain([GELD_Y_MIN, GELD_Y_MAX]).range([GELD_IH, 0])
const geldLineGen = line().x(d => geldXSc(d.year)).y(d => geldYSc(d.value)).curve(curveMonotoneX)

function geldGapPath(deAll, frAll) {
  const top = frAll.map((p, i) => `${i === 0 ? 'M' : 'L'}${geldXSc(p.year).toFixed(1)},${geldYSc(p.value).toFixed(1)}`).join(' ')
  const bottom = deAll.slice().reverse().map(p => `L${geldXSc(p.year).toFixed(1)},${geldYSc(p.value).toFixed(1)}`).join(' ')
  return `${top} ${bottom} Z`
}

function GeldChart() {
  const de = buildSeries(geld.schuldenquote.DE)
  const fr = buildSeries(geld.schuldenquote.FR)

  const de2024 = geld.schuldenquote.DE['2024']
  const fr2024 = geld.schuldenquote.FR['2024']
  const de2030 = geld.schuldenquote.DE['2030']
  const fr2030 = geld.schuldenquote.FR['2030']

  const x2024 = geldXSc(2024)
  const x2030 = geldXSc(2030)
  const x2031 = geldXSc(2031)

  const yTicks = [0, 30, 60, 90, 120]
  const xTickYears = [2021, 2024, 2027, 2031]

  return (
    <svg viewBox={`0 0 ${GELD_W} ${GELD_H}`} width="100%" role="img"
      aria-label="Staatsverschuldung Deutschland und Frankreich 2021–2031"
      style={{ overflow: 'visible' }}>
      <g transform={`translate(${GELD_PAD.left},${GELD_PAD.top})`}>

        {yTicks.map(t => (
          <line key={t} x1={0} y1={geldYSc(t)} x2={GELD_IW} y2={geldYSc(t)}
            stroke={RULE_SOFT} strokeWidth="0.5" />
        ))}

        <path d={geldGapPath(de.all, fr.all)} fill={OCKER} opacity="0.08" />

        <line x1={0} y1={geldYSc(GELD_MAASTRICHT)} x2={GELD_IW} y2={geldYSc(GELD_MAASTRICHT)}
          stroke={MUTED} strokeWidth="1.2" strokeDasharray="4 4" />
        <text x={GELD_IW + 6} y={geldYSc(GELD_MAASTRICHT) + 4}
          style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: MUTED }}>
          60 %
        </text>
        <text x={GELD_IW + 6} y={geldYSc(GELD_MAASTRICHT) - 5}
          style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
          Maastricht
        </text>

        <line x1={x2024} y1={-20} x2={x2024} y2={GELD_IH + 8}
          stroke={RULE} strokeWidth="1" strokeDasharray="3 3" />
        <text x={x2024 - 6} y={-24} textAnchor="end"
          style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>bis 2024: Ist</text>
        <text x={x2024 + 6} y={-24}
          style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>ab 2025: Prognose</text>

        {yTicks.map(t => (
          <text key={t} x={-8} y={geldYSc(t) + 4} textAnchor="end"
            style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
            {t} %
          </text>
        ))}

        {xTickYears.map(y => (
          <text key={y} x={geldXSc(y)} y={GELD_IH + 18} textAnchor="middle"
            style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
            {y}
          </text>
        ))}

        <path d={geldLineGen(de.actual)} fill="none" stroke={DE_COLOR} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d={geldLineGen(de.forecast)} fill="none" stroke={DE_COLOR} strokeWidth="2"
          strokeDasharray="6 4" strokeLinecap="round" opacity="0.8" />

        <path d={geldLineGen(fr.actual)} fill="none" stroke={FR_COLOR} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d={geldLineGen(fr.forecast)} fill="none" stroke={FR_COLOR} strokeWidth="2"
          strokeDasharray="6 4" strokeLinecap="round" opacity="0.8" />

        <text x={x2031 + 8} y={geldYSc(geld.schuldenquote.DE['2031']) + 4}
          style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: DE_DARK, fontWeight: 600 }}>
          Deutschland
        </text>
        <text x={x2031 + 8} y={geldYSc(geld.schuldenquote.FR['2031']) + 4}
          style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: FR_DARK, fontWeight: 600 }}>
          Frankreich
        </text>

        <circle cx={x2024} cy={geldYSc(de2024)} r="5" fill={DE_COLOR} />
        <text x={x2024 - 10} y={geldYSc(de2024) - 14} textAnchor="end"
          style={{ fontSize: 19, fontFamily: 'var(--font-display)', fontWeight: 700, fill: DE_DARK }}>
          {de2024.toFixed(0)} %
        </text>

        <circle cx={x2024} cy={geldYSc(fr2024)} r="5" fill={FR_COLOR} />
        <text x={x2024 - 10} y={geldYSc(fr2024) - 14} textAnchor="end"
          style={{ fontSize: 19, fontFamily: 'var(--font-display)', fontWeight: 700, fill: FR_DARK }}>
          {fr2024.toFixed(0)} %
        </text>

        <circle cx={x2030} cy={geldYSc(de2030)} r="3.5" fill={DE_COLOR} opacity="0.7" />
        <circle cx={x2030} cy={geldYSc(fr2030)} r="3.5" fill={FR_COLOR} opacity="0.7" />

        {(() => {
          const midX = (x2024 + x2030) / 2
          const midYDe = geldYSc((de2024 + de2030) / 2)
          const midYFr = geldYSc((fr2024 + fr2030) / 2)
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

// ══════════════════════════════════════════════════════════════════════════
// Abschnitt 3 — Handel
// ══════════════════════════════════════════════════════════════════════════
const HANDEL_W = 640
const HANDEL_H = 380
const HANDEL_PAD = { top: 56, right: 88, bottom: 44, left: 52 }
const HANDEL_IW = HANDEL_W - HANDEL_PAD.left - HANDEL_PAD.right
const HANDEL_IH = HANDEL_H - HANDEL_PAD.top - HANDEL_PAD.bottom
const HANDEL_ABS_MAX = 270

const handelXSc = scaleLinear().domain([YEARS[0], YEARS[YEARS.length - 1]]).range([0, HANDEL_IW])
const handelYSc = scaleLinear().domain([-HANDEL_ABS_MAX, HANDEL_ABS_MAX]).range([HANDEL_IH, 0])
const handelAreaGen = area()
  .x(d => handelXSc(d.year))
  .y0(handelYSc(0))
  .y1(d => handelYSc(d.value))
  .curve(curveMonotoneX)
const handelLineGen = line().x(d => handelXSc(d.year)).y(d => handelYSc(d.value)).curve(curveMonotoneX)

function HandelChart() {
  const de = buildSeries(handel.handelsbilanz.DE)
  const fr = buildSeries(handel.handelsbilanz.FR)

  const de2024 = handel.handelsbilanz.DE['2024']
  const fr2024 = handel.handelsbilanz.FR['2024']
  const de2031 = handel.handelsbilanz.DE['2031']
  const fr2031 = handel.handelsbilanz.FR['2031']

  const x2024 = handelXSc(2024)
  const x2031 = handelXSc(2031)
  const yZero = handelYSc(0)

  const yTicks = [-200, -100, 0, 100, 200]
  const xTickYears = [2021, 2023, 2025, 2027, 2029, 2031]

  return (
    <svg
      viewBox={`0 0 ${HANDEL_W} ${HANDEL_H}`}
      width="100%"
      role="img"
      aria-label="Warenhandelsbilanz Deutschland und Frankreich 2021–2031, gespiegelt um die Null-Linie"
      style={{ overflow: 'visible' }}
    >
      <g transform={`translate(${HANDEL_PAD.left},${HANDEL_PAD.top})`}>

        {yTicks.filter(t => t !== 0).map(t => (
          <line key={t} x1={0} y1={handelYSc(t)} x2={HANDEL_IW} y2={handelYSc(t)} stroke={RULE_SOFT} strokeWidth="0.5" />
        ))}

        {yTicks.map(t => (
          <text key={t} x={-8} y={handelYSc(t) + 4} textAnchor="end"
            style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
            {t > 0 ? `+${t}` : t}
          </text>
        ))}

        <text x={-44} y={HANDEL_IH / 2} textAnchor="middle"
          transform={`rotate(-90,-44,${HANDEL_IH / 2})`}
          style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
          Mrd €
        </text>

        {xTickYears.map(y => (
          <text key={y} x={handelXSc(y)} y={HANDEL_IH + 18} textAnchor="middle"
            style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
            {y}
          </text>
        ))}

        <line x1={x2024} y1={-20} x2={x2024} y2={HANDEL_IH + 8}
          stroke={RULE} strokeWidth="1" strokeDasharray="3 3" />
        <text x={x2024 - 6} y={-24} textAnchor="end"
          style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
          bis 2024: Ist
        </text>
        <text x={x2024 + 6} y={-24}
          style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
          ab 2025: Prognose
        </text>

        <path d={handelAreaGen(de.actual)} fill={DE_FILL} opacity="0.75" />
        <path d={handelAreaGen(de.forecast)} fill={DE_FILL_SOFT} opacity="0.6" />

        <path d={handelAreaGen(fr.actual)} fill={FR_FILL} opacity="0.75" />
        <path d={handelAreaGen(fr.forecast)} fill={FR_FILL_SOFT} opacity="0.6" />

        <line x1={0} y1={yZero} x2={HANDEL_IW} y2={yZero} stroke={INK} strokeWidth="1.5" />

        <path d={handelLineGen(de.actual)} fill="none" stroke={DE_COLOR} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d={handelLineGen(de.forecast)} fill="none" stroke={DE_COLOR} strokeWidth="2"
          strokeDasharray="6 4" strokeLinecap="round" opacity="0.8" />

        <path d={handelLineGen(fr.actual)} fill="none" stroke={FR_COLOR} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d={handelLineGen(fr.forecast)} fill="none" stroke={FR_COLOR} strokeWidth="2"
          strokeDasharray="6 4" strokeLinecap="round" opacity="0.8" />

        <text x={handelXSc(2022)} y={handelYSc(80)}
          style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: DE_DARK, fontWeight: 600 }}>
          Deutschland — Überschuss
        </text>
        <text x={handelXSc(2022)} y={handelYSc(-155)}
          style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: FR_DARK, fontWeight: 600 }}>
          Frankreich — Defizit
        </text>

        <circle cx={x2024} cy={handelYSc(de2024)} r="5" fill={DE_COLOR} />
        <text x={x2024 - 10} y={handelYSc(de2024) - 14} textAnchor="end"
          style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, fill: DE_DARK }}>
          +{Math.round(de2024)} Mrd €
        </text>

        <circle cx={x2024} cy={handelYSc(fr2024)} r="5" fill={FR_COLOR} />
        <text x={x2024 - 10} y={handelYSc(fr2024) + 28} textAnchor="end"
          style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, fill: FR_DARK }}>
          {Math.round(fr2024)} Mrd €
        </text>

        <circle cx={x2031} cy={handelYSc(de2031)} r="3.5" fill={DE_COLOR} opacity="0.7" />
        <text x={x2031 + 8} y={handelYSc(de2031) + 4}
          style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: DE_DARK, opacity: 0.8 }}>
          +{Math.round(de2031)} Mrd €
        </text>

        <circle cx={x2031} cy={handelYSc(fr2031)} r="3.5" fill={FR_COLOR} opacity="0.7" />
        <text x={x2031 + 8} y={handelYSc(fr2031) + 4}
          style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: FR_DARK, opacity: 0.8 }}>
          {Math.round(fr2031)} Mrd €
        </text>

      </g>
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// Abschnitt 4 — Menschen
// ══════════════════════════════════════════════════════════════════════════
const BANDS = ['0–14', '15–24', '25–34', '35–44', '45–54', '55–64', '65–74', '75+']
const BOOMER_BANDS = new Set(['55–64', '65–74'])

const MEN_W = 580
const MEN_BAND_H = 32
const MEN_GAP = 6
const MEN_LABEL_W = 52
const MEN_VAL_W = 44
const MEN_BAR_AREA_W = (MEN_W - MEN_LABEL_W - MEN_VAL_W * 2 - 24) / 2
const MEN_CENTER_X = MEN_LABEL_W + MEN_VAL_W + MEN_BAR_AREA_W
const MEN_SVG_H = BANDS.length * (MEN_BAND_H + MEN_GAP) + 48

const menXScLeft = scaleLinear().domain([0, 14]).range([0, MEN_BAR_AREA_W])
const menXScRight = scaleLinear().domain([0, 14]).range([0, MEN_BAR_AREA_W])

function getBandVal(band, country, year) {
  return ageBands[band]?.[country]?.[String(year)] ?? 0
}

function TornadoChart({ year, revealStep = 3 }) {
  const isForecast = year > LAST_ACTUAL
  const showDE = revealStep >= 1
  const showFR = revealStep >= 2
  const showBoomer = revealStep >= 3

  const fadeIn = (visible) => ({ opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease' })

  return (
    <svg viewBox={`0 0 ${MEN_W} ${MEN_SVG_H}`} width="100%" role="img"
      aria-label={`Altersstruktur Deutschland und Frankreich ${year}`}
      style={{ overflow: 'visible' }}>

      <text x={MEN_CENTER_X - 8} y="20" textAnchor="end"
        style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fill: FR_DARK, fontWeight: 700, textTransform: 'uppercase', ...fadeIn(showFR) }}>
        Frankreich
      </text>
      <text x={MEN_CENTER_X + 8} y="20"
        style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fill: DE_DARK, fontWeight: 700, ...fadeIn(showDE) }}>
        Deutschland
      </text>

      {BANDS.map((band, i) => {
        const deVal = getBandVal(band, 'DE', year)
        const frVal = getBandVal(band, 'FR', year)
        const deW   = menXScRight(deVal)
        const frW   = menXScLeft(frVal)
        const y0    = 32 + i * (MEN_BAND_H + MEN_GAP)
        const barY  = y0 + 4
        const barH  = MEN_BAND_H - 8
        const isBoomer = BOOMER_BANDS.has(band)

        return (
          <g key={band}>
            {isBoomer && (
              <rect x={0} y={y0 - 2} width={MEN_W} height={MEN_BAND_H + 4}
                fill={OCKER} rx="3"
                style={{ opacity: showBoomer ? 0.08 : 0, transition: 'opacity 0.7s ease' }} />
            )}

            <rect
              x={MEN_CENTER_X - frW} y={barY}
              width={frW} height={barH} rx="3"
              fill={FR_FILL}
              style={{ opacity: showFR ? (isForecast ? 0.5 : 0.85) : 0, transition: 'opacity 0.7s ease' }}
            />
            <line x1={MEN_CENTER_X - frW} y1={barY} x2={MEN_CENTER_X - frW} y2={barY + barH}
              stroke={FR_COLOR} strokeWidth={isBoomer ? 2 : 1.5}
              style={{ opacity: showFR ? 1 : 0, transition: 'opacity 0.7s ease' }} />

            <rect
              x={MEN_CENTER_X} y={barY}
              width={deW} height={barH} rx="3"
              fill={DE_FILL}
              style={{ opacity: showDE ? (isForecast ? 0.5 : 0.85) : 0, transition: 'opacity 0.7s ease' }}
            />
            <line x1={MEN_CENTER_X + deW} y1={barY} x2={MEN_CENTER_X + deW} y2={barY + barH}
              stroke={DE_COLOR} strokeWidth={isBoomer ? 2 : 1.5}
              style={{ opacity: showDE ? 1 : 0, transition: 'opacity 0.7s ease' }} />

            <line x1={MEN_CENTER_X} y1={y0} x2={MEN_CENTER_X} y2={y0 + MEN_BAND_H}
              stroke={RULE_SOFT} strokeWidth="1" />

            <text x={MEN_CENTER_X} y={y0 + MEN_BAND_H / 2 + 5} textAnchor="middle"
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                fill: isBoomer ? OCKER : AXIS_MUTED,
                fontWeight: isBoomer ? 700 : 400,
              }}>
              {band}
            </text>

            <text x={MEN_CENTER_X - frW - 6} y={y0 + MEN_BAND_H / 2 + 5} textAnchor="end"
              style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: FR_DARK, ...fadeIn(showFR) }}>
              {frVal.toFixed(1)}
            </text>

            <text x={MEN_CENTER_X + deW + 6} y={y0 + MEN_BAND_H / 2 + 5}
              style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: DE_DARK, ...fadeIn(showDE) }}>
              {deVal.toFixed(1)}
            </text>

            {isBoomer && band === '65–74' && year >= 2027 && (
              <text x={MEN_W - 4} y={y0 + MEN_BAND_H / 2 + 5} textAnchor="end"
                style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: OCKER, fontStyle: 'italic', ...fadeIn(showBoomer) }}>
                ← Babyboomer
              </text>
            )}
          </g>
        )
      })}

      {[0, 5, 10].map(v => (
        <g key={`scale-${v}`}>
          <text x={MEN_CENTER_X - menXScLeft(v)} y={MEN_SVG_H - 4} textAnchor="middle"
            style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
            {v}
          </text>
          <text x={MEN_CENTER_X + menXScRight(v)} y={MEN_SVG_H - 4} textAnchor="middle"
            style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
            {v}
          </text>
        </g>
      ))}
      <text x={MEN_CENTER_X} y={MEN_SVG_H - 4} textAnchor="middle"
        style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
        Mio.
      </text>
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// Methodik (gebündelt über alle vier Abschnitte)
// ══════════════════════════════════════════════════════════════════════════
function Methodik({ groups }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: '1rem' }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', color: MUTED, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '10px' }}>{open ? '▾' : '▸'}</span>
        Methodik & Grenzen
      </button>
      {open && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {groups.map(({ section, notes }) => (
            <div key={section} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, color: LABEL_MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {section}
              </span>
              {notes.map((n, i) => (
                <p key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: MUTED, margin: 0, lineHeight: 1.6 }}>— {n}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// Seite
// ══════════════════════════════════════════════════════════════════════════
export default function VergleichFrankreichDeutschlandStory() {
  const [year, setYear] = useState(2024)
  const isForecast = year > LAST_ACTUAL

  const deDefizit = (geld.staatsausgaben.DE['2024'] - geld.staatseinnahmen.DE['2024']).toFixed(1)
  const frDefizit = (geld.staatsausgaben.FR['2024'] - geld.staatseinnahmen.FR['2024']).toFixed(1)

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div>
        <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: MUTED, textDecoration: 'none' }}>
          ← Zurück
        </Link>
      </div>

      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: catColors.text }}>
          Vergleich · Frankreich &amp; Deutschland
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
          Gleiche Nachbarschaft, andere <strong style={{ fontWeight: 700 }}>Wege</strong>
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, color: MUTED, margin: 0, maxWidth: '62ch' }}>
          Frankreich und Deutschland sind direkte Nachbarn — und doch zeigen vier
          Kennzahlen-Vergleiche, wie unterschiedlich sie sich entwickeln: wie sie leben,
          wie sie mit Schulden umgehen, wie sie mit der Welt handeln und wie ihre
          Bevölkerungen altern.
        </p>
      </header>

      {/* ── Leben ─────────────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <SectionHeading kicker="Wie sie leben" title="Zwei Arten zu leben" />
        <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: MUTED, margin: 0, maxWidth: '62ch' }}>
          Frankreich raucht mehr, Deutschland ist häufiger übergewichtig — und trotzdem
          leben die Nachbarn länger. Vier Kennzahlen für 2024.
        </p>

        <Reveal delay={0}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: LABEL_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Lebenserwartung (Jahre, 2024) · Achse 70–85
            </span>
            <LebenserwartungChart />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', color: AXIS_MUTED, margin: 0, lineHeight: 1.6 }}>
              {leben.lebenserwartung.note}
            </p>
          </div>
        </Reveal>

        <div style={{ borderTop: `1px solid ${RULE}` }} />

        <Reveal delay={80}>
          <DumbbellRow
            label="Raucheranteil (% der Erwachsenen)"
            unit="%"
            frVal={lebenVal('rauchen', 'FR')}
            deVal={lebenVal('rauchen', 'DE')}
            domainMax={40}
            note={leben.rauchen.note}
          />
        </Reveal>

        <Reveal delay={160}>
          <DumbbellRow
            label="Adipositas, selbstberichtet (% der Erwachsenen)"
            unit="%"
            frVal={lebenVal('uebergewicht', 'FR')}
            deVal={lebenVal('uebergewicht', 'DE')}
            domainMax={25}
            note={leben.uebergewicht.note}
          />
        </Reveal>

        <Reveal delay={240}>
          <DumbbellRow
            label="Alkohol pro Kopf (Liter reiner Alkohol/Jahr)"
            unit="L"
            frVal={lebenVal('alkohol', 'FR')}
            deVal={lebenVal('alkohol', 'DE')}
            domainMax={14}
            note={leben.alkohol.note}
          />
        </Reveal>

        <Reveal delay={300}>
          <div style={{ padding: '0.85rem 1rem', border: `1px dashed ${RULE}`, borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: LABEL_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Das Paradox</span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: MUTED, margin: 0, lineHeight: 1.65 }}>
              Frankreich raucht deutlich mehr und trinkt ähnlich viel — lebt aber trotzdem länger.
              Mögliche Erklärungen: Ernährungsgewohnheiten (Mittelmeer-nahe Kost), Gesundheitsversorgung
              und Vorsorgekultur. Die Daten zeigen eine Korrelation, keine Kausalität.
            </p>
          </div>
        </Reveal>
      </section>

      <div style={{ borderTop: `1px solid ${RULE}` }} />

      {/* ── Geld ──────────────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <SectionHeading kicker="Wie sie wirtschaften" title="Das Schulden-Rennen" />
        <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: MUTED, margin: 0, maxWidth: '62ch' }}>
          Genauso unterschiedlich handhaben beide Länder ihre Staatsfinanzen: Deutschland
          hält seine Schuldenquote, Frankreich zieht davon. Die Prognose ab 2025 zeigt,
          wie weit die Schere noch aufgeht.
        </p>

        <Reveal>
          <GeldChart />
        </Reveal>

        <Reveal>
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
        </Reveal>
      </section>

      <div style={{ borderTop: `1px solid ${RULE}` }} />

      {/* ── Handel ────────────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <SectionHeading kicker="Wie sie handeln" title="Gleiches Bild, anderes Vorzeichen" />
        <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: MUTED, margin: 0, maxWidth: '62ch' }}>
          Diese fiskalische Kluft hat ein Spiegelbild im Außenhandel — nur mit vertauschten
          Vorzeichen. Deutschland verkauft der Welt mehr, als es einkauft — Frankreich genau
          umgekehrt. Beide Flächen spreizen sich aus: der Überschuss wächst, das Defizit auch.
        </p>

        <Reveal>
          <HandelChart />
        </Reveal>
      </section>

      <div style={{ borderTop: `1px solid ${RULE}` }} />

      {/* ── Menschen ──────────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <SectionHeading kicker="Wie sie altern" title="Die Welle, die durch Deutschland rollt" />
        <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: MUTED, margin: 0, maxWidth: '62ch' }}>
          Ein Teil der Erklärung für die wachsende Schere liegt in der Bevölkerungsstruktur
          beider Länder. Acht Altersgruppen, von 0–14 bis 75+: Deutschland hat einen
          deutlichen Bauch in den mittleren Jahrgängen — die Babyboomer-Generation, geboren
          zwischen 1955 und 1969, heute 55 bis 74 Jahre alt. Frankreich ist gleichmäßiger
          verteilt und an der Basis breiter — ein strukturell jüngeres Land.
        </p>

        <Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: LABEL_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Stand: 2024 · Ist-Daten
            </span>
            <TornadoChart year={2024} revealStep={3} />
          </div>
        </Reveal>

        {/* Erkunde selbst */}
        <div style={{ borderTop: '1px solid #EEEEEE', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontVariationSettings: '"opsz" 24',
              fontSize: '1.2rem',
              fontWeight: 600,
              color: INK,
              margin: '0 0 0.4rem',
              letterSpacing: '-0.01em',
            }}>
              Erkunde selbst
            </h3>
            <p style={{ fontSize: '0.875rem', color: MUTED, margin: 0 }}>
              Bewege den Regler — der Babyboomer-Bauch wandert bis 2031 sichtbar nach oben.
            </p>
          </div>

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
        </div>
      </section>

      <footer style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '1rem', borderTop: `1px solid ${RULE}`, fontFamily: 'var(--font-mono)', fontSize: '11px', color: MUTED }}>
        <span>Quelle: {data.meta.source}</span>
        <span style={{ opacity: 0.7 }}>{data.meta.forecastNote}</span>
      </footer>

      <Methodik groups={[
        { section: 'Leben', notes: [leben.rauchen.note, leben.uebergewicht.note, leben.alkohol.note] },
        { section: 'Geld', notes: [geld.schuldenquote.note, geld.staatsausgaben.note] },
        { section: 'Handel', notes: [handel.handelsbilanz.note] },
        {
          section: 'Menschen', notes: [
            'Beide Geschlechter zusammengefasst. Die Datenlage erlaubt keine Geschlechteraufteilung pro Altersband — daher kein klassisches Bevölkerungsdiagramm nach Geschlecht.',
            `Werte bis ${LAST_ACTUAL}: Ist-Daten. Ab ${LAST_ACTUAL + 1}: Prognose (Balken transparent dargestellt).`,
          ],
        },
        { section: 'Alle Themen', notes: [data.meta.verified] },
      ]} />
    </article>
  )
}
