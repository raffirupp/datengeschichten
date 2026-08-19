import { useMemo, useState, useRef, useEffect } from 'react'
import { scaleTime, scaleLinear } from 'd3-scale'
import { line, curveMonotoneX } from 'd3-shape'
import { extent, max } from 'd3-array'
import useIsMobile from '../hooks/useIsMobile.js'

const W = 760
const H = 320
const MARGIN = { top: 16, right: 100, bottom: 36, left: 36 }
const IW = W - MARGIN.left - MARGIN.right
const IH = H - MARGIN.top - MARGIN.bottom

const GOV_COLOR = '#17150F'   // ink — "an der Macht"
const OPP_COLOR = '#6B6658'   // muted — "auf der Oppositionsbank"

function parseDate(str) { return new Date(str + 'T12:00:00Z') }

// Wie in PollTrendChart.jsx: Umfragelücken > GAP_DAYS werden nicht verbunden, statt eine
// geglättete Linie über Monate ohne Umfrage zu ziehen.
const GAP_DAYS = 150

function splitByGap(points) {
  const segments = []
  let current = []
  let prevDate = null
  for (const p of points) {
    const d = parseDate(p.date)
    if (prevDate && (d - prevDate) / 86_400_000 > GAP_DAYS) {
      if (current.length) segments.push(current)
      current = []
    }
    current.push(p)
    prevDate = d
  }
  if (current.length) segments.push(current)
  return segments
}

// Sanfte S-Kurve statt gerader Linie zwischen Segmenten — Kontrollpunkte auf halbem Weg
// mit horizontaler Tangente an beiden Enden, wirkt wie ein ausgeglichener Verlauf.
function smoothBridge(from, to, xAccessor, yAccessor) {
  const x0 = xAccessor(from), y0 = yAccessor(from)
  const x1 = xAccessor(to),   y1 = yAccessor(to)
  const mx = (x0 + x1) / 2
  return `M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1}`
}

function bridgesBetween(segments, xAccessor, yAccessor) {
  const bridges = []
  for (let i = 0; i < segments.length - 1; i++) {
    const from = segments[i].at(-1)
    const to = segments[i + 1][0]
    bridges.push(smoothBridge(from, to, xAccessor, yAccessor))
  }
  return bridges
}

// Verteilt "Regierung"/"Opposition"-Endlabels vertikal neu, wenn beide Werte nah
// beieinander liegen (z.B. bei knappen Mehrheiten) — sonst überlappen sich die Texte.
function declutterY(items, minGap) {
  const sorted = [...items].sort((a, b) => a.y - b.y)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].y - sorted[i - 1].y < minGap) {
      sorted[i].y = sorted[i - 1].y + minGap
    }
  }
  return sorted
}

// Staffelt Regierungswechsel-Beschriftungen in mehrere Zeilen, wenn Wechsel zeitlich zu
// dicht aufeinanderfolgen (z.B. Koalitionsbruch + Neubildung innerhalb weniger Wochen).
function layoutTransitionLabels(items, xOf, textOf, fontSize) {
  const charWidth = fontSize * 0.62
  const rowEndX = []
  return items.map((item) => {
    const x = xOf(item)
    const w = textOf(item).length * charWidth + 8
    let row = 0
    while (rowEndX[row] != null && x < rowEndX[row] + 6) row++
    rowEndX[row] = x + w
    return { ...item, row }
  })
}

// Normalisiert Parteicodes für den Vergleich: DAWUM-Umfragedaten und die
// Regierungs-/Koalitionsdatensätze schreiben dieselbe Partei teils unterschiedlich
// ("Grüne" vs. "GRÜNE", "Freie Wähler" vs. "FW") — ohne Normalisierung würden
// Koalitionsparteien stillschweigend als Opposition gezählt.
const PARTY_ALIASES = {
  'grüne': 'GRUENE', 'gruene': 'GRUENE',
  'linke': 'LINKE',
  'freie wähler': 'FW', 'freie waehler': 'FW',
  'cdu/csu': 'CDU/CSU',
}
function normalizeParty(key) {
  const k = (key ?? '').toLowerCase().trim()
  return PARTY_ALIASES[k] ?? key.toUpperCase()
}

// Für ein Trend-Datum: welche Regierungsperiode war zu diesem Zeitpunkt aktiv?
function activePeriod(date, periods) {
  for (const p of periods) {
    if (date >= p.start && (p.end == null || date < p.end)) return p
  }
  return null
}

function partyInPeriod(key, period) {
  const normKey = normalizeParty(key)
  return period.parties.some((p) => normalizeParty(p) === normKey)
}

export default function GovOppositionChart({ trend, governmentPeriods, parties }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)
  const isMobile = useIsMobile()
  const labelFontSize = isMobile ? '13px' : '10px'

  const partyKeys = useMemo(() => parties.map((p) => p.key), [parties])

  const series = useMemo(() => {
    const sortedPeriods = [...governmentPeriods].sort((a, b) => (a.start < b.start ? -1 : 1))
    return trend.map((d) => {
      const period = activePeriod(d.date, sortedPeriods)
      let gov = 0
      let opp = 0
      for (const key of partyKeys) {
        const v = d.values[key]
        if (v == null) continue
        if (period && partyInPeriod(key, period)) gov += v
        else opp += v
      }
      return { date: d.date, gov, opp, period }
    })
  }, [trend, governmentPeriods, partyKeys])

  const transitions = useMemo(() => {
    const sortedPeriods = [...governmentPeriods].sort((a, b) => (a.start < b.start ? -1 : 1))
    const trendStart = trend[0]?.date
    const trendEnd = trend.at(-1)?.date
    if (!trendStart || !trendEnd) return []
    const withinRange = sortedPeriods.filter((p) => p.start >= trendStart && p.start <= trendEnd)

    // Regierung, die schon im Amt war, als die sichtbaren Daten beginnen — an den
    // linken Rand gesetzt, sonst fehlt am Anfang jeder Hinweis, wer zu dem Zeitpunkt regierte.
    const initial = activePeriod(trendStart, sortedPeriods)
    if (initial && !withinRange.includes(initial)) {
      return [{ ...initial, start: trendStart }, ...withinRange]
    }
    return withinRange
  }, [governmentPeriods, trend])

  const { xScale, yScale, govLineSegments, oppLineSegments, govBridges, oppBridges, yTicks, xTicks } = useMemo(() => {
    const dates = series.map((d) => parseDate(d.date))
    const xDomain = extent(dates)
    const yMax = Math.ceil((max(series, (d) => Math.max(d.gov, d.opp)) ?? 60) / 10) * 10 + 5

    const xScale = scaleTime().domain(xDomain).range([0, IW])
    const yScale = scaleLinear().domain([0, yMax]).range([IH, 0])

    const govGen = line().x((d) => xScale(parseDate(d.date))).y((d) => yScale(d.gov)).curve(curveMonotoneX)
    const oppGen = line().x((d) => xScale(parseDate(d.date))).y((d) => yScale(d.opp)).curve(curveMonotoneX)
    const segments = splitByGap(series)

    return {
      xScale, yScale,
      govLineSegments: segments.map((seg) => govGen(seg)),
      oppLineSegments: segments.map((seg) => oppGen(seg)),
      govBridges: bridgesBetween(segments, d => xScale(parseDate(d.date)), d => yScale(d.gov)),
      oppBridges: bridgesBetween(segments, d => xScale(parseDate(d.date)), d => yScale(d.opp)),
      yTicks: yScale.ticks(5),
      xTicks: xScale.ticks(6),
    }
  }, [series])

  function handlePointerMove(e) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const svgX = (e.clientX - rect.left) * (W / rect.width) - MARGIN.left
    if (svgX < 0 || svgX > IW) { setTooltip(null); return }

    const date = xScale.invert(svgX)
    const nearest = series.reduce((best, d) => {
      const diff = Math.abs(parseDate(d.date) - date)
      return diff < best.diff ? { d, diff } : best
    }, { d: null, diff: Infinity })

    if (!nearest.d) return
    setTooltip({ ...nearest.d, x: xScale(parseDate(nearest.d.date)) })
  }

  useEffect(() => {
    if (!tooltip) return
    function handleOutside(e) {
      if (svgRef.current && !svgRef.current.contains(e.target)) setTooltip(null)
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [tooltip])

  const tooltipX = tooltip ? MARGIN.left + tooltip.x : 0

  const endLabels = declutterY(
    [
      { key: 'gov', label: 'Regierung', color: GOV_COLOR, y: yScale(series.at(-1)?.gov ?? 0) },
      { key: 'opp', label: 'Opposition', color: OPP_COLOR, y: yScale(series.at(-1)?.opp ?? 0) },
    ],
    isMobile ? 16 : 13,
  )

  const transitionLabels = layoutTransitionLabels(
    transitions,
    (p) => xScale(parseDate(p.start)),
    (p) => p.cabinet,
    9,
  )

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Summierte Umfragewerte der Regierungsparteien gegen die Oppositionsparteien im Zeitverlauf"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        onPointerLeave={() => { if (!isMobile) setTooltip(null) }}
        style={{ cursor: 'crosshair', overflow: 'visible', touchAction: 'pan-y' }}
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {yTicks.map((v) => (
            <line key={v} x1={0} x2={IW} y1={yScale(v)} y2={yScale(v)} stroke="var(--color-rule)" strokeWidth={0.8} />
          ))}
          {yTicks.map((v) => (
            <text key={v} x={-6} y={yScale(v)} textAnchor="end" dominantBaseline="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: labelFontSize, fill: 'var(--color-muted)' }}>
              {v}%
            </text>
          ))}
          {xTicks.map((d, i) => (
            <text key={i} x={xScale(d)} y={IH + 20} textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: labelFontSize, fill: 'var(--color-muted)' }}>
              {d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}
            </text>
          ))}

          {/* Regierungswechsel-Markierungen (Beschriftung in mehreren Zeilen gestaffelt,
              wenn Wechsel zeitlich zu dicht aufeinanderfolgen) */}
          {transitionLabels.map((p) => {
            const x = xScale(parseDate(p.start))
            if (x < 0 || x > IW) return null
            return (
              <g key={p.start} pointerEvents="none">
                <line x1={x} x2={x} y1={0} y2={IH} stroke="var(--color-ink)" strokeWidth={1} strokeDasharray="3,3" opacity={0.35} />
                <text x={x + 4} y={10 + p.row * 11} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fill: 'var(--color-muted)' }}>
                  {p.cabinet}
                </text>
              </g>
            )
          })}

          {oppBridges.map((d, i) => (
            <path key={`opp-bridge-${i}`} d={d} fill="none" stroke={OPP_COLOR} strokeWidth={1.3} strokeDasharray="4,3" opacity={0.45} strokeLinecap="round" />
          ))}
          {govBridges.map((d, i) => (
            <path key={`gov-bridge-${i}`} d={d} fill="none" stroke={GOV_COLOR} strokeWidth={1.3} strokeDasharray="4,3" opacity={0.45} strokeLinecap="round" />
          ))}
          {oppLineSegments.map((d, i) => (
            <path key={`opp-${i}`} d={d} fill="none" stroke={OPP_COLOR} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {govLineSegments.map((d, i) => (
            <path key={`gov-${i}`} d={d} fill="none" stroke={GOV_COLOR} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
          ))}

          {endLabels.map(({ key, label, color, y }) => (
            <text key={key} x={IW + 8} y={y} dominantBaseline="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: labelFontSize, fill: color, fontWeight: 600 }}>
              {label}
            </text>
          ))}

          {tooltip && (
            <line x1={tooltip.x} x2={tooltip.x} y1={0} y2={IH} stroke="var(--color-ink)" strokeWidth={0.8} opacity={0.4} pointerEvents="none" />
          )}
        </g>
      </svg>

      {tooltip && (
        <div style={{
          position: 'absolute',
          left: `${(tooltipX / W) * 100}%`,
          top: MARGIN.top,
          transform: tooltipX > W * 0.6 ? 'translateX(-110%)' : 'translateX(8px)',
          backgroundColor: 'var(--color-paper)',
          border: '1px solid var(--color-rule)',
          borderRadius: '6px',
          padding: '8px 10px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          pointerEvents: 'none',
          zIndex: 10,
          minWidth: '160px',
        }}>
          <div style={{ color: 'var(--color-muted)', marginBottom: '6px' }}>
            {new Date(tooltip.date + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          {tooltip.period && (
            <div style={{ color: 'var(--color-muted)', marginBottom: '6px', fontSize: '10px' }}>
              Regierung: {tooltip.period.cabinet} ({tooltip.period.parties.join(' + ')})
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: '1.8' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: GOV_COLOR, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ color: 'var(--color-ink)' }}>Regierung</span>
            <span style={{ marginLeft: 'auto', color: GOV_COLOR, fontWeight: 600 }}>{tooltip.gov.toFixed(1)}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: '1.8' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: OPP_COLOR, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ color: 'var(--color-ink)' }}>Opposition</span>
            <span style={{ marginLeft: 'auto', color: OPP_COLOR, fontWeight: 600 }}>{tooltip.opp.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
