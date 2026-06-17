import { useState } from 'react'
import { scaleLinear } from 'd3-scale'

const CORAL  = [190, 90, 60]
const PETROL = [28, 93, 87]

const DP_W  = 680
const DP_ML = 178
const DP_MR = 20
const DP_MT = 28
const DP_MB = 36
const DP_IW = DP_W - DP_ML - DP_MR
const ROW_H = 30

export default function LeadLagChart({ data }) {
  const [party,   setParty]   = useState('AfD')
  const [tooltip, setTooltip] = useState(null)

  const { meta, institutes, parties, cells } = data

  const partyRows = institutes
    .map(inst => cells.find(c => c.institute === inst && c.party === party))
    .filter(Boolean)
    .sort((a, b) => b.lagWeeks - a.lagWeeks)

  const H   = partyRows.length * ROW_H + DP_MT + DP_MB
  const xSc = scaleLinear().domain([-meta.lagRange[1], meta.lagRange[1]]).range([0, DP_IW])
  const x0  = xSc(0)
  const ticks = xSc.ticks(7)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Partei-Wahl */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {parties.map(p => (
          <button key={p} onClick={() => setParty(p)} style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
            border: `1px solid ${p === party ? 'var(--color-ink)' : 'var(--color-rule)'}`,
            background: p === party ? 'var(--color-ink)' : 'transparent',
            color: p === party ? 'var(--color-paper)' : 'var(--color-muted)',
          }}>
            {p}
          </button>
        ))}
      </div>

      {/* Dot Plot */}
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${DP_W} ${H}`} width="100%"
          aria-label={`Reaktionsgeschwindigkeit der Institute – ${party}`}>
          <g transform={`translate(${DP_ML},${DP_MT})`}>
            {/* Grid */}
            {ticks.map(v => (
              <line key={v} x1={xSc(v)} x2={xSc(v)} y1={0} y2={partyRows.length * ROW_H}
                stroke="var(--color-rule)" strokeWidth={0.8} />
            ))}
            {/* Zero line */}
            <line x1={x0} x2={x0} y1={0} y2={partyRows.length * ROW_H}
              stroke="var(--color-ink)" strokeWidth={1.5} opacity={0.4} />

            {/* Bereichs-Labels */}
            <text x={x0 - 8} y={-10} textAnchor="end"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: `rgb(${PETROL.join(',')})` }}>
              reagiert später
            </text>
            <text x={x0 + 8} y={-10} textAnchor="start"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: `rgb(${CORAL.join(',')})` }}>
              reagiert früher
            </text>

            {/* x-Achse */}
            {ticks.map(v => (
              <text key={v} x={xSc(v)} y={partyRows.length * ROW_H + 16}
                textAnchor="middle"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-muted)' }}>
                {v > 0 ? '+' : ''}{v}w
              </text>
            ))}
            <text x={x0} y={partyRows.length * ROW_H + 28}
              textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--color-muted)' }}>
              Wochen vor/nach dem Konsens
            </text>

            {/* Punkte */}
            {partyRows.map((cell, i) => {
              const y   = i * ROW_H + ROW_H / 2
              const cx  = xSc(cell.lagWeeks)
              const col = cell.lagWeeks > 0
                ? `rgb(${CORAL.join(',')})`
                : cell.lagWeeks < 0
                  ? `rgb(${PETROL.join(',')})`
                  : 'var(--color-muted)'
              const reliable = cell.reliable
              const opacity  = reliable ? 1 : 0.35
              const r        = reliable ? 5.5 : 3.5

              return (
                <g key={cell.institute}
                  onMouseEnter={() => setTooltip(cell)}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: 'default' }}>
                  {/* Institut-Label */}
                  <text x={-8} y={y} textAnchor="end" dominantBaseline="middle"
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11,
                      fill: reliable ? 'var(--color-ink)' : 'var(--color-rule)',
                    }}>
                    {cell.institute}
                  </text>

                  {/* Linie zu 0 (nur bei reliable) */}
                  {reliable && (
                    <line
                      x1={Math.min(x0, cx)} x2={Math.max(x0, cx)} y1={y} y2={y}
                      stroke={col} strokeWidth={1.5} opacity={0.3}
                    />
                  )}

                  {/* Punkt */}
                  <circle cx={cx} cy={y} r={r}
                    fill={reliable ? col : 'none'}
                    stroke={col}
                    strokeWidth={reliable ? 0 : 1.5}
                    opacity={opacity}
                  />

                  {/* Wert-Label (nur reliable) */}
                  {reliable && (
                    <text
                      x={cell.lagWeeks >= 0 ? cx + 9 : cx - 9} y={y}
                      textAnchor={cell.lagWeeks >= 0 ? 'start' : 'end'}
                      dominantBaseline="middle"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-muted)' }}>
                      {cell.lagWeeks > 0 ? '+' : ''}{cell.lagWeeks}w
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            background: 'var(--color-paper)',
            border: '1px solid var(--color-rule)',
            borderRadius: 6, padding: '10px 12px',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            minWidth: 210, pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{tooltip.institute}</div>
            {tooltip.reliable ? (
              <div style={{ color: 'var(--color-muted)', lineHeight: 1.8 }}>
                <div>Optimaler Lag: <span style={{ color: 'var(--color-ink)' }}>
                  {tooltip.lagWeeks > 0 ? '+' : ''}{tooltip.lagWeeks} Wochen
                </span></div>
                <div>Korrelation: <span style={{ color: 'var(--color-ink)' }}>r = {tooltip.maxCorr}</span></div>
                <div>Datenpunkte: <span style={{ color: 'var(--color-ink)' }}>{tooltip.n} Wochen</span></div>
                <div style={{ marginTop: 6, fontSize: 10 }}>
                  {tooltip.lagWeeks > 0
                    ? `Dieses Institut erfasst Bewegungen bei ${tooltip.party} im Schnitt ca. ${tooltip.lagWeeks} Woche${tooltip.lagWeeks > 1 ? 'n' : ''} früher als die anderen.`
                    : tooltip.lagWeeks < 0
                      ? `Dieses Institut folgt dem Konsens bei ${tooltip.party} mit ca. ${Math.abs(tooltip.lagWeeks)} Woche${Math.abs(tooltip.lagWeeks) > 1 ? 'n' : ''} Verzögerung.`
                      : `Kein systematischer Zeitversatz gegenüber dem Konsens.`
                  }
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--color-muted)', fontSize: 10, lineHeight: 1.6 }}>
                Zu wenige gemeinsame Datenpunkte oder zu schwache Korrelation für eine verlässliche Aussage.
                <div>n = {tooltip.n}, r = {tooltip.maxCorr}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legende */}
      <div style={{
        display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'var(--color-muted)', paddingLeft: DP_ML,
      }}>
        <span>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: `rgb(${CORAL.join(',')})`, marginRight: 4, verticalAlign: 'middle' }} />
          früher als Konsens
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: `rgb(${PETROL.join(',')})`, marginRight: 4, verticalAlign: 'middle' }} />
          später als Konsens
        </span>
        <span style={{ opacity: 0.6 }}>Umrisse = wenig belegt</span>
      </div>
    </div>
  )
}
