import { useState } from 'react'
import { scaleLinear } from 'd3-scale'

const CORAL  = [190, 90, 60]
const PETROL = [28, 93, 87]
const MUTED  = [107, 102, 88]

const DP_W  = 680
const DP_ML = 178
const DP_MR = 20
const DP_MT = 28
const DP_MB = 36
const DP_IW = DP_W - DP_ML - DP_MR
const ROW_H = 28

export default function FirstMoverChart({ data }) {
  const [party,   setParty]   = useState(data.parties[0])
  const [tooltip, setTooltip] = useState(null)

  const { meta, parties, results } = data
  const partyData = results[party]

  if (!partyData) return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>
      Nicht genug Daten für {party}
    </div>
  )

  const rows = [...partyData.institutes].sort((a, b) => b.leadMedian - a.leadMedian)
  const MAX_LAG = 5

  const H   = rows.length * ROW_H + DP_MT + DP_MB
  const xSc = scaleLinear().domain([-MAX_LAG, MAX_LAG]).range([0, DP_IW])
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

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)' }}>
        {partyData.events} Trendwenden erkannt (|Δ{meta.lookback}w Konsens| ≥ {meta.threshold} PP)
      </div>

      {/* Dot Plot */}
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${DP_W} ${H}`} width="100%"
          aria-label={`Vorreiter-Analyse – ${party}`}>
          <g transform={`translate(${DP_ML},${DP_MT})`}>
            {/* Grid */}
            {ticks.map(v => (
              <line key={v} x1={xSc(v)} x2={xSc(v)} y1={0} y2={rows.length * ROW_H}
                stroke="var(--color-rule)" strokeWidth={0.8} />
            ))}
            {/* Zero line */}
            <line x1={x0} x2={x0} y1={0} y2={rows.length * ROW_H}
              stroke="var(--color-ink)" strokeWidth={1.5} opacity={0.4} />

            {/* Bereichs-Labels */}
            <text x={x0 - 8} y={-10} textAnchor="end"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: `rgb(${PETROL.join(',')})` }}>
              erfasst später
            </text>
            <text x={x0 + 8} y={-10} textAnchor="start"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: `rgb(${CORAL.join(',')})` }}>
              erfasst früher
            </text>

            {/* x-Achse */}
            {ticks.map(v => (
              <text key={v} x={xSc(v)} y={rows.length * ROW_H + 16}
                textAnchor="middle"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-muted)' }}>
                {v > 0 ? '+' : ''}{v}w
              </text>
            ))}
            <text x={x0} y={rows.length * ROW_H + 28}
              textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--color-muted)' }}>
              Wochen vor/nach Trendwende im Gesamt-Konsens
            </text>

            {/* Punkte */}
            {rows.map((row, i) => {
              const y   = i * ROW_H + ROW_H / 2
              const val = row.leadMedian
              const cx  = xSc(Math.max(-MAX_LAG, Math.min(MAX_LAG, val)))
              const col = val > 0
                ? `rgb(${CORAL.join(',')})`
                : val < 0
                  ? `rgb(${PETROL.join(',')})`
                  : `rgb(${MUTED.join(',')})`

              return (
                <g key={row.institute}
                  onMouseEnter={() => setTooltip(row)}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: 'default' }}>
                  <text x={-8} y={y} textAnchor="end" dominantBaseline="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--color-ink)' }}>
                    {row.institute}
                  </text>
                  <line
                    x1={Math.min(x0, cx)} x2={Math.max(x0, cx)} y1={y} y2={y}
                    stroke={col} strokeWidth={1.5} opacity={0.25}
                  />
                  <circle cx={cx} cy={y} r={5} fill={col} />
                  <text
                    x={val >= 0 ? cx + 9 : cx - 9} y={y}
                    textAnchor={val >= 0 ? 'start' : 'end'}
                    dominantBaseline="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-muted)' }}>
                    {val > 0 ? '+' : ''}{val}w
                  </text>
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
            minWidth: 220, pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{tooltip.institute}</div>
            <div style={{ color: 'var(--color-muted)', lineHeight: 1.8 }}>
              <div>Median Lead: <span style={{ color: 'var(--color-ink)' }}>
                {tooltip.leadMedian > 0 ? '+' : ''}{tooltip.leadMedian} Wochen
              </span></div>
              <div>Mittelwert: <span style={{ color: 'var(--color-ink)' }}>
                {tooltip.leadMean > 0 ? '+' : ''}{tooltip.leadMean} Wochen
              </span></div>
              <div>Events: <span style={{ color: 'var(--color-ink)' }}>{tooltip.n}</span></div>
              <div style={{ marginTop: 6, fontSize: 10, lineHeight: 1.5 }}>
                {tooltip.leadMedian > 0
                  ? `Dieses Institut erfasste Trendwenden bei ${party} im Schnitt ${tooltip.leadMedian} Woche${tooltip.leadMedian > 1 ? 'n' : ''} früher als der Gesamt-Konsens.`
                  : tooltip.leadMedian < 0
                    ? `Dieses Institut folgte Trendwenden bei ${party} mit ${Math.abs(tooltip.leadMedian)} Woche${Math.abs(tooltip.leadMedian) > 1 ? 'n' : ''} Verzögerung.`
                    : `Kein systematischer Zeitversatz bei ${party}.`
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legende + Caveat */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)' }}>
          <span>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: `rgb(${CORAL.join(',')})`, marginRight: 4, verticalAlign: 'middle' }} />
            erfasst früher
          </span>
          <span>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: `rgb(${PETROL.join(',')})`, marginRight: 4, verticalAlign: 'middle' }} />
            erfasst später
          </span>
          <span style={{ opacity: 0.6 }}>Medianwert über {partyData.events} Trendwenden</span>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--color-muted)', opacity: 0.7,
          maxWidth: 540,
        }}>
          Hinweis: Institute mit häufigerer Publikation (z.B. Forsa, INSA) haben methodisch Vorteile,
          da der Gesamt-Konsens deren Signal mit einschließt und damit zeitlich hinterher läuft.
          Diese Analyse misst Frequenz und Reaktionszeit zusammen.
        </div>
      </div>
    </div>
  )
}
