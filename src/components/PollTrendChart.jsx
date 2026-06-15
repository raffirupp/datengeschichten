import { useMemo, useState, useRef } from 'react'
import { scaleTime, scaleLinear } from 'd3-scale'
import { line, curveMonotoneX } from 'd3-shape'
import { extent, max } from 'd3-array'
import { partyColor } from '../lib/partyColors.js'

const W = 760
const H = 380
const MARGIN = { top: 16, right: 88, bottom: 36, left: 36 }
const IW = W - MARGIN.left - MARGIN.right
const IH = H - MARGIN.top - MARGIN.bottom

function parseDate(str) { return new Date(str + 'T12:00:00Z') }

export default function PollTrendChart({ polls, trend, parties }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

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
      return { key, color: partyColor(key), d: lineGen(points), points }
    })

    const yTicks = yScale.ticks(6)
    const xTicks = xScale.ticks(6)

    return { xScale, yScale, partyLines, yTicks, xTicks }
  }, [polls, trend, parties])

  function handleMouseMove(e) {
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

  const tooltipX = tooltip ? MARGIN.left + tooltip.x : 0

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Verlauf der Wahlumfragen"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ cursor: 'crosshair', overflow: 'visible' }}
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
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fill: 'var(--color-muted)' }}
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
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fill: 'var(--color-muted)' }}
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

          {/* Trend lines */}
          {partyLines.map(({ key, color, d }) => d && (
            <path
              key={key}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={2.2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* End labels */}
          {partyLines.map(({ key, color, points }) => {
            if (points.length === 0) return null
            const last = points[points.length - 1]
            return (
              <g key={key} transform={`translate(${xScale(parseDate(last.date))},${yScale(last.value)})`}>
                <text
                  x={8} y={0}
                  dominantBaseline="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fill: color, fontWeight: 600 }}
                >
                  {key} {last.value.toFixed(1)}
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
