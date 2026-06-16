import { useMemo } from 'react'
import { scaleTime, scaleLinear } from 'd3-scale'
import { line, curveMonotoneX } from 'd3-shape'
import { extent, max, min } from 'd3-array'

const W = 380
const H = 200
const MARGIN = { top: 10, right: 10, bottom: 24, left: 8 }
const IW = W - MARGIN.left - MARGIN.right
const IH = H - MARGIN.top - MARGIN.bottom

function parseWeek(str) {
  return new Date(str + 'T00:00:00Z')
}

export default function NewsSignalChart({ points, color }) {
  const { xScale, yTone, xTicks, attentionPath, tonePath } = useMemo(() => {
    const dates = points.map((p) => parseWeek(p.week))
    const xScale = scaleTime().domain(extent(dates)).range([0, IW])

    const attentionValues = points.map((p) => p.attentionShare).filter((v) => v != null)
    const attMax = Math.max(0.05, (max(attentionValues) ?? 0.2) * 1.15)
    const yAttention = scaleLinear().domain([0, attMax]).range([IH, 0])

    const toneValues = points.map((p) => p.tone).filter((v) => v != null)
    const toneAbsMax = Math.max(1, Math.abs(min(toneValues) ?? 0), Math.abs(max(toneValues) ?? 0))
    const yTone = scaleLinear().domain([-toneAbsMax, toneAbsMax]).range([IH, 0])

    const attentionLine = line()
      .x((d) => xScale(parseWeek(d.week)))
      .y((d) => yAttention(d.attentionShare))
      .curve(curveMonotoneX)
      .defined((d) => d.attentionShare != null)

    const toneLine = line()
      .x((d) => xScale(parseWeek(d.week)))
      .y((d) => yTone(d.tone))
      .curve(curveMonotoneX)
      .defined((d) => d.tone != null)

    return {
      xScale,
      yTone,
      xTicks: xScale.ticks(3),
      attentionPath: attentionLine(points),
      tonePath: toneLine(points),
    }
  }, [points])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Nachrichten-Signal: Aufmerksamkeitsanteil und Ton über die Zeit"
      style={{ display: 'block' }}
    >
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* Nulllinie für den Ton */}
        <line
          x1={0} x2={IW} y1={yTone(0)} y2={yTone(0)}
          stroke="var(--color-rule)" strokeWidth={0.8} strokeDasharray="2,2"
        />
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
        {tonePath && (
          <path d={tonePath} fill="none" stroke="var(--color-muted)" strokeWidth={1.2} strokeDasharray="3,2" opacity={0.65} />
        )}
        {attentionPath && (
          <path d={attentionPath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}
      </g>
    </svg>
  )
}
