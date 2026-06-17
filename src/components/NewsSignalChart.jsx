import { useMemo, useState } from 'react'
import { scaleTime, scaleLinear } from 'd3-scale'
import { line, curveMonotoneX } from 'd3-shape'
import { extent, max } from 'd3-array'

const W = 380
const H = 200
const MARGIN = { top: 10, right: 10, bottom: 24, left: 8 }
const IW = W - MARGIN.left - MARGIN.right
const IH = H - MARGIN.top - MARGIN.bottom

function parseWeek(str) {
  return new Date(str + 'T00:00:00Z')
}

export default function NewsSignalChart({ points, color, peaks = [], onPeakClick }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const { xScale, xTicks, attentionPath, peakDots } = useMemo(() => {
    const dates = points.map((p) => parseWeek(p.week))
    const xScale = scaleTime().domain(extent(dates)).range([0, IW])

    const attentionValues = points.map((p) => p.attentionShare).filter((v) => v != null)
    const attMax = Math.max(0.05, (max(attentionValues) ?? 0.2) * 1.15)
    const yAttention = scaleLinear().domain([0, attMax]).range([IH, 0])

    const attentionLine = line()
      .x((d) => xScale(parseWeek(d.week)))
      .y((d) => yAttention(d.attentionShare))
      .curve(curveMonotoneX)
      .defined((d) => d.attentionShare != null)

    const peakDots = peaks.map((peak) => {
      const point = points.find((p) => p.week === peak.week)
      if (!point || point.attentionShare == null) return null
      return {
        peak,
        x: xScale(parseWeek(peak.week)),
        y: yAttention(point.attentionShare),
      }
    }).filter(Boolean)

    return {
      xScale,
      xTicks: xScale.ticks(5),
      attentionPath: attentionLine(points),
      peakDots,
    }
  }, [points, peaks])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Nachrichten-Signal: Aufmerksamkeitsanteil über die Zeit"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {xTicks.map((d, i) => (
          <text
            key={i}
            x={xScale(d)} y={IH + 16}
            textAnchor="middle"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fill: 'var(--color-muted)' }}
          >
            {d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}
          </text>
        ))}

        {attentionPath && (
          <path d={attentionPath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}

        {/* Peak-Punkte */}
        {peakDots.map((dot, i) => {
          const isHovered = hoveredIdx === i
          const labelX = dot.x > IW * 0.7 ? dot.x - 6 : dot.x + 6
          const anchor = dot.x > IW * 0.7 ? 'end' : 'start'
          const labelY = dot.y > IH * 0.75 ? dot.y - 10 : dot.y - 10
          return (
            <g key={i}>
              <circle
                cx={dot.x} cy={dot.y} r={10}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => onPeakClick?.(dot.peak)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
              <circle
                cx={dot.x} cy={dot.y}
                r={isHovered ? 5 : 3.5}
                fill={color}
                stroke="var(--color-paper)"
                strokeWidth={1.5}
                pointerEvents="none"
                style={{ transition: 'r 0.1s' }}
              />
              {isHovered && (
                <text
                  x={labelX} y={labelY}
                  textAnchor={anchor}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '8px',
                    fill: 'var(--color-ink)', pointerEvents: 'none',
                  }}
                >
                  {dot.peak.title}
                </text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
