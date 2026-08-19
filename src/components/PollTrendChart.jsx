import { useMemo, useState, useRef, useEffect } from 'react'
import { scaleTime, scaleLinear } from 'd3-scale'
import { line, curveMonotoneX } from 'd3-shape'
import { extent, max } from 'd3-array'
import { partyColor } from '../lib/partyColors.js'
import useIsMobile from '../hooks/useIsMobile.js'

const W = 760
const H = 380
const MARGIN = { top: 16, right: 88, bottom: 36, left: 36 }
const IW = W - MARGIN.left - MARGIN.right
const IH = H - MARGIN.top - MARGIN.bottom

function parseDate(str) { return new Date(str + 'T12:00:00Z') }

// Welche Regierungsperiode war zu einem Datum aktiv?
function activePeriod(date, sortedPeriods) {
  for (const p of sortedPeriods) {
    if (date >= p.start && (p.end == null || date < p.end)) return p
  }
  return null
}

// Punkte, zwischen denen mehr als GAP_DAYS ohne Umfrage liegen, werden nicht
// verbunden — sonst suggeriert die geglättete Linie einen kontinuierlichen Verlauf
// über Monate, in denen schlicht keine Umfrage stattfand (z. B. Bremen zwischen Wahlen).
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

// Verbindet die Lücken zwischen Segmenten mit einer sanften S-Kurve statt einer geraden
// Linie — Kontrollpunkte auf halbem Weg mit horizontaler Tangente an beiden Enden, damit
// die Brücke wie ein ausgeglichener Verlauf wirkt statt wie ein abrupter Knick.
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

// Verteilt Endpunkt-Beschriftungen vertikal neu, wenn Parteiwerte nah beieinander liegen —
// sonst überlappen sich die Textlabels bei knappen Werten.
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
// dicht aufeinanderfolgen (z.B. Koalitionsbruch + Neubildung innerhalb weniger Wochen) —
// sonst überschreiben sich die Kabinettsnamen gegenseitig.
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

export default function PollTrendChart({ polls, trend, parties, markerDate, governmentPeriods = [] }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)
  const isMobile = useIsMobile()
  const labelFontSize = isMobile ? '13px' : '10px'

  const transitions = useMemo(() => {
    const trendStart = trend[0]?.date
    const trendEnd = trend.at(-1)?.date
    if (!trendStart || !trendEnd) return []
    const sorted = [...governmentPeriods].sort((a, b) => (a.start < b.start ? -1 : 1))
    const withinRange = sorted.filter((p) => p.start >= trendStart && p.start <= trendEnd)

    // Regierung, die schon im Amt war, als die sichtbaren Daten beginnen — an den
    // linken Rand gesetzt, sonst fehlt am Anfang jeder Hinweis, wer zu dem Zeitpunkt regierte.
    const initial = activePeriod(trendStart, sorted)
    if (initial && !withinRange.includes(initial)) {
      return [{ ...initial, start: trendStart }, ...withinRange]
    }
    return withinRange
  }, [governmentPeriods, trend])

  const { xScale, yScale, partyLines, yTicks, xTicks } = useMemo(() => {
    const allDates = trend.map(d => parseDate(d.date))
    const allValues = trend.flatMap(d => Object.values(d.values))
    const pollDates = polls.map(p => parseDate(p.date))

    const xDomain = extent([...allDates, ...pollDates])
    const yMax = Math.ceil((max(allValues) ?? 40) / 5) * 5 + 2

    const xScale = scaleTime().domain(xDomain).range([0, IW])
    const yScale = scaleLinear().domain([0, yMax]).range([IH, 0])

    const lineGen = line()
      .x(d => xScale(parseDate(d.date)))
      .y(d => yScale(d.value))
      .curve(curveMonotoneX)
      .defined(d => d.value != null)

    const partyLines = parties.map(({ key }) => {
      const points = trend
        .filter(d => d.values[key] != null)
        .map(d => ({ date: d.date, value: d.values[key] }))
      const rawSegments = splitByGap(points)
      const segments = rawSegments.map(seg => lineGen(seg))
      const bridges = bridgesBetween(
        rawSegments,
        d => xScale(parseDate(d.date)),
        d => yScale(d.value),
      )
      return { key, color: partyColor(key), segments, bridges, points }
    })

    const yTicks = yScale.ticks(6)
    const xTicks = xScale.ticks(isMobile ? 3 : 6)

    return { xScale, yScale, partyLines, yTicks, xTicks }
  }, [polls, trend, parties, isMobile])

  function handlePointerMove(e) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const svgX = (e.clientX - rect.left) * (W / rect.width) - MARGIN.left
    if (svgX < 0 || svgX > IW) { setTooltip(null); return }

    const date = xScale.invert(svgX)
    // Find nearest trend date
    const nearest = trend.reduce((best, d) => {
      const diff = Math.abs(parseDate(d.date) - date)
      return diff < best.diff ? { d, diff } : best
    }, { d: null, diff: Infinity })

    if (!nearest.d) return
    setTooltip({ date: nearest.d.date, values: nearest.d.values, x: svgX })
  }

  // Tap outside the chart dismisses the tooltip (native hover/leave doesn't fire on touch)
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
    partyLines
      .filter(({ points }) => points.length > 0)
      .map(({ key, color, points }) => {
        const last = points[points.length - 1]
        return { key, color, value: last.value, x: xScale(parseDate(last.date)), y: yScale(last.value) }
      }),
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
        aria-label="Verlauf der Wahlumfragen"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        onPointerLeave={() => { if (!isMobile) setTooltip(null) }}
        style={{ cursor: 'crosshair', overflow: 'visible', touchAction: 'pan-y' }}
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* y grid lines */}
          {yTicks.map(v => (
            <line
              key={v}
              x1={0} x2={IW} y1={yScale(v)} y2={yScale(v)}
              stroke="var(--color-rule)" strokeWidth={0.8}
            />
          ))}
          {/* y axis labels */}
          {yTicks.map(v => (
            <text
              key={v}
              x={-6} y={yScale(v)}
              textAnchor="end" dominantBaseline="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: labelFontSize, fill: 'var(--color-muted)' }}
            >
              {v}%
            </text>
          ))}
          {/* x axis labels */}
          {xTicks.map((d, i) => (
            <text
              key={i}
              x={xScale(d)} y={IH + 20}
              textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: labelFontSize, fill: 'var(--color-muted)' }}
            >
              {d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}
            </text>
          ))}

          {/* Individual poll dots */}
          {parties.map(({ key }) =>
            polls.map((poll, i) => {
              const v = poll.results[key]
              if (v == null) return null
              return (
                <circle
                  key={`${key}-${i}`}
                  cx={xScale(parseDate(poll.date))}
                  cy={yScale(v)}
                  r={2}
                  fill={partyColor(key)}
                  opacity={0.22}
                />
              )
            })
          )}

          {/* Brücken über Umfragelücken: gestrichelt, dünn, gedämpfte Farbe */}
          {partyLines.map(({ key, color, bridges }) =>
            bridges.map((d, i) => d && (
              <path
                key={`${key}-bridge-${i}`}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={1.3}
                strokeDasharray="4,3"
                opacity={0.45}
                strokeLinecap="round"
              />
            ))
          )}

          {/* Trend lines (echte Umfragedaten, in Segmente gebrochen wo Lücken > GAP_DAYS liegen) */}
          {partyLines.map(({ key, color, segments }) =>
            segments.map((d, i) => d && (
              <path
                key={`${key}-${i}`}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={2.2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))
          )}

          {/* End labels (vertikal entzerrt, wenn Werte nah beieinander liegen) */}
          {endLabels.map(({ key, color, value, x, y }) => (
            <g key={key} transform={`translate(${x},${y})`}>
              <text
                x={8} y={0}
                dominantBaseline="middle"
                style={{ fontFamily: 'var(--font-mono)', fontSize: labelFontSize, fill: color, fontWeight: 600 }}
              >
                {key} {value.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Ereignis-Marker */}
          {markerDate && (() => {
            const mx = xScale(parseDate(markerDate))
            if (mx < 0 || mx > IW) return null
            return (
              <g pointerEvents="none">
                <line x1={mx} x2={mx} y1={0} y2={IH} stroke="var(--color-ink)" strokeWidth={1.5} strokeDasharray="4,3" opacity={0.5} />
                <text x={mx + 5} y={10} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fill: 'var(--color-muted)' }}>
                  Ereignis
                </text>
              </g>
            )
          })()}

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

          {/* Tooltip hairline */}
          {tooltip && (
            <line
              x1={tooltip.x} x2={tooltip.x}
              y1={0} y2={IH}
              stroke="var(--color-ink)"
              strokeWidth={0.8}
              opacity={0.4}
              pointerEvents="none"
            />
          )}
        </g>
      </svg>

      {/* Tooltip box */}
      {tooltip && (
        <div
          style={{
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
            minWidth: '130px',
          }}
        >
          <div style={{ color: 'var(--color-muted)', marginBottom: '6px' }}>
            {new Date(tooltip.date + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          {parties
            .filter(({ key }) => tooltip.values[key] != null)
            .sort((a, b) => (tooltip.values[b.key] ?? 0) - (tooltip.values[a.key] ?? 0))
            .map(({ key }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: '1.8' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: partyColor(key), flexShrink: 0, display: 'inline-block' }} />
                <span style={{ color: 'var(--color-ink)' }}>{key}</span>
                <span style={{ marginLeft: 'auto', color: partyColor(key), fontWeight: 600 }}>
                  {tooltip.values[key]?.toFixed(1)}%
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
