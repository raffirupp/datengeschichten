import { useMemo, useState } from 'react'
import { scaleTime, scaleLinear } from 'd3-scale'
import { line, curveMonotoneX } from 'd3-shape'
import { extent, max } from 'd3-array'
import { partyColor } from '../lib/partyColors.js'

const W = 800
const H = 280
const MARGIN = { top: 12, right: 16, bottom: 28, left: 32 }
const IW = W - MARGIN.left - MARGIN.right
const IH = H - MARGIN.top - MARGIN.bottom

const PARTY_TO_DAWUM = {
  CDU: 'CDU/CSU', CSU: 'CDU/CSU', SPD: 'SPD',
  GRÜNE: 'Grüne', FDP: 'FDP', AfD: 'AfD', LINKE: 'Linke', BSW: 'BSW',
}

const PARTY_LABELS = {
  CDU: 'CDU', CSU: 'CSU', SPD: 'SPD',
  GRÜNE: 'Grüne', FDP: 'FDP', AfD: 'AfD', LINKE: 'Linke', BSW: 'BSW',
}

function parseWeek(str) {
  return new Date(str + 'T00:00:00Z')
}

export default function NewsSignalOverviewChart({ byParty, parties, peaks = [], onPeakClick }) {
  const [hoveredPeak, setHoveredPeak] = useState(null)

  const { xScale, yScale, paths, xTicks, yTicks, peakDots } = useMemo(() => {
    const allPoints = parties.flatMap((p) => byParty[p] ?? [])
    const allDates = allPoints.map((p) => parseWeek(p.week))
    const xScale = scaleTime().domain(extent(allDates)).range([0, IW])

    const allShares = allPoints.map((p) => p.attentionShare).filter((v) => v != null)
    const yMax = Math.min((max(allShares) ?? 0.5) * 1.1, 1)
    const yScale = scaleLinear().domain([0, yMax]).range([IH, 0])

    const makeLine = line()
      .x((d) => xScale(parseWeek(d.week)))
      .y((d) => yScale(d.attentionShare))
      .curve(curveMonotoneX)
      .defined((d) => d.attentionShare != null)

    const paths = {}
    for (const party of parties) {
      paths[party] = makeLine(byParty[party] ?? [])
    }

    const peakDots = peaks.map((peak) => {
      const point = (byParty[peak.party] ?? []).find((p) => p.week === peak.week)
      if (!point || point.attentionShare == null) return null
      return {
        peak,
        x: xScale(parseWeek(peak.week)),
        y: yScale(point.attentionShare),
        color: partyColor(PARTY_TO_DAWUM[peak.party]),
      }
    }).filter(Boolean)

    return { xScale, yScale, paths, xTicks: xScale.ticks(6), yTicks: yScale.ticks(4), peakDots }
  }, [byParty, parties, peaks])

  return (
    <div className="flex flex-col gap-4">
      <div style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label="Aufmerksamkeitsanteil aller Parteien im Vergleich"
          style={{ display: 'block', overflow: 'visible' }}
        >
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {/* Y-Gitterlinien */}
            {yTicks.map((v, i) => (
              <g key={i}>
                <line x1={0} x2={IW} y1={yScale(v)} y2={yScale(v)} stroke="var(--color-rule)" strokeWidth={0.6} />
                <text
                  x={-6} y={yScale(v)} textAnchor="end" dominantBaseline="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fill: 'var(--color-muted)' }}
                >
                  {Math.round(v * 100)}%
                </text>
              </g>
            ))}

            {/* X-Achse */}
            {xTicks.map((d, i) => (
              <text
                key={i} x={xScale(d)} y={IH + 18} textAnchor="middle"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fill: 'var(--color-muted)' }}
              >
                {d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}
              </text>
            ))}

            {/* Parteienlinien */}
            {[...parties].reverse().map((party) => (
              <path
                key={party} d={paths[party]} fill="none"
                stroke={partyColor(PARTY_TO_DAWUM[party])}
                strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" opacity={0.85}
              />
            ))}

            {/* Peak-Punkte */}
            {peakDots.map((dot, i) => {
              const isHovered = hoveredPeak === i
              return (
                <g key={i}>
                  {/* Klickfläche (größer als sichtbarer Punkt) */}
                  <circle
                    cx={dot.x} cy={dot.y} r={10}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onPeakClick?.(dot.peak)}
                    onMouseEnter={() => setHoveredPeak(i)}
                    onMouseLeave={() => setHoveredPeak(null)}
                  />
                  {/* Sichtbarer Punkt */}
                  <circle
                    cx={dot.x} cy={dot.y}
                    r={isHovered ? 5.5 : 4}
                    fill={dot.color}
                    stroke="var(--color-paper)"
                    strokeWidth={1.5}
                    style={{ cursor: 'pointer', transition: 'r 0.1s' }}
                    pointerEvents="none"
                  />
                </g>
              )
            })}

            {/* Tooltip beim Hovern */}
            {hoveredPeak !== null && peakDots[hoveredPeak] && (() => {
              const dot = peakDots[hoveredPeak]
              const labelX = dot.x + (dot.x > IW * 0.7 ? -8 : 8)
              const anchor = dot.x > IW * 0.7 ? 'end' : 'start'
              const labelY = dot.y > IH * 0.8 ? dot.y - 10 : dot.y - 12
              return (
                <text
                  x={labelX} y={labelY} textAnchor={anchor}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '9px',
                    fill: 'var(--color-ink)', pointerEvents: 'none',
                  }}
                >
                  {dot.peak.title}
                </text>
              )
            })()}
          </g>
        </svg>
      </div>

      {/* Legende */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {parties.map((party) => (
          <div key={party} className="flex items-center gap-1.5">
            <span
              className="w-5 shrink-0"
              style={{ height: '2px', backgroundColor: partyColor(PARTY_TO_DAWUM[party]), display: 'inline-block', borderRadius: '1px' }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)' }}>
              {PARTY_LABELS[party]}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--color-ink)', opacity: 0.4 }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)' }}>
            Ereignis — klicken
          </span>
        </div>
      </div>
    </div>
  )
}
