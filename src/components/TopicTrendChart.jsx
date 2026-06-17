import { useMemo, useState, useRef } from 'react'
import { scaleLinear } from 'd3-scale'
import { line, curveMonotoneX } from 'd3-shape'
import { max } from 'd3-array'

const W = 760
const H = 400
const MARGIN = { top: 16, right: 128, bottom: 36, left: 52 }
const IW = W - MARGIN.left - MARGIN.right
const IH = H - MARGIN.top - MARGIN.bottom

export default function TopicTrendChart({ series, topics, highlighted }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  const { xScale, yScale, topicLines, yTicks, xTicks } = useMemo(() => {
    const xMin = series[0].year
    const xMax = series[series.length - 1].year
    const allValues = series.flatMap(d => topics.map(t => d[t.key] ?? 0))
    const yMax = Math.ceil((max(allValues) ?? 100) / 500) * 500 + 200

    const xScale = scaleLinear().domain([xMin, xMax]).range([0, IW])
    const yScale = scaleLinear().domain([0, yMax]).range([IH, 0])

    const lineGen = line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.value))
      .curve(curveMonotoneX)
      .defined(d => d.value != null)

    const topicLines = topics.map(({ key, label, color }) => {
      const points = series.map(d => ({ year: d.year, value: d[key] }))
      return { key, label, color, d: lineGen(points), points }
    })

    const yTicks = yScale.ticks(5)
    const xTicks = series.map(d => d.year)

    return { xScale, yScale, topicLines, yTicks, xTicks }
  }, [series, topics])

  function handleMouseMove(e) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const svgX = (e.clientX - rect.left) * (W / rect.width) - MARGIN.left
    if (svgX < 0 || svgX > IW) { setTooltip(null); return }

    const year = Math.round(xScale.invert(svgX))
    const d = series.find(s => s.year === year)
    if (!d) return
    setTooltip({ year, values: d, x: xScale(year) })
  }

  const isHighlighted = key => !highlighted || highlighted.length === 0 || highlighted.includes(key)

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Thementrends in Bundestagsreden 2014–2025"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ cursor: 'crosshair', overflow: 'visible' }}
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* y grid */}
          {yTicks.map(v => (
            <line
              key={v}
              x1={0} x2={IW} y1={yScale(v)} y2={yScale(v)}
              stroke="var(--color-rule)" strokeWidth={0.8}
            />
          ))}
          {/* y labels */}
          {yTicks.map(v => (
            <text
              key={v}
              x={-8} y={yScale(v)}
              textAnchor="end" dominantBaseline="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fill: 'var(--color-muted)' }}
            >
              {v.toLocaleString('de-DE')}
            </text>
          ))}
          {/* y axis label */}
          <text
            x={-44} y={IH / 2}
            textAnchor="middle"
            transform={`rotate(-90, -44, ${IH / 2})`}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fill: 'var(--color-muted)' }}
          >
            Erwähnungen / Mio. Tokens
          </text>
          {/* x labels */}
          {xTicks.map(yr => (
            <text
              key={yr}
              x={xScale(yr)} y={IH + 20}
              textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fill: 'var(--color-muted)' }}
            >
              {yr}
            </text>
          ))}

          {/* Lines */}
          {topicLines.map(({ key, color, d }) => (
            <path
              key={key}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={isHighlighted(key) ? 2.2 : 0.8}
              opacity={isHighlighted(key) ? 1 : 0.25}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* End labels */}
          {topicLines.map(({ key, label, color, points }) => {
            if (!isHighlighted(key)) return null
            const last = points[points.length - 1]
            return (
              <text
                key={key}
                x={IW + 8}
                y={yScale(last.value)}
                dominantBaseline="middle"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fill: color, fontWeight: 600 }}
              >
                {label}
              </text>
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
            left: `${((MARGIN.left + tooltip.x) / W) * 100}%`,
            top: MARGIN.top,
            transform: tooltip.x > IW * 0.6 ? 'translateX(-110%)' : 'translateX(8px)',
            backgroundColor: 'var(--color-paper)',
            border: '1px solid var(--color-rule)',
            borderRadius: '6px',
            padding: '8px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: '200px',
          }}
        >
          <div style={{ color: 'var(--color-muted)', marginBottom: '6px', fontWeight: 600 }}>
            {tooltip.year}
          </div>
          {[...topics]
            .sort((a, b) => (tooltip.values[b.key] ?? 0) - (tooltip.values[a.key] ?? 0))
            .map(({ key, label, color }) => (
              <div
                key={key}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: '1.8' }}
              >
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: color, flexShrink: 0, display: 'inline-block',
                }} />
                <span style={{ color: 'var(--color-ink)', flex: 1 }}>{label}</span>
                <span style={{ color, fontWeight: 600 }}>
                  {tooltip.values[key]?.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
