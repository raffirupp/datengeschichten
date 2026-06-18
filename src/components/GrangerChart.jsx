import { useState, useMemo } from 'react'
import { scaleLinear } from 'd3-scale'

const ALPHA  = 0.10
const PETROL = '#1a6b6b'
const CORAL  = '#c45c3a'
const GRAY   = '#9ca3af'

const DP_W  = 680
const ML    = 190   // label column
const BAR_H = 10
const ROW_H = 38
const MT    = 44
const MB    = 24
const COL_GAP = 8   // gap between the two bars

// Breite für jede Balken-Spalte
const BAR_COL = Math.floor((DP_W - ML - COL_GAP) / 2)

function pLabel(p) {
  if (p < 0.001) return 'p<0.001'
  if (p < 0.01)  return `p=${p.toFixed(3)}`
  return `p=${p.toFixed(2)}`
}

function classification(e) {
  if (e.leadsConsensus)    return { label: 'führt Konsens', color: PETROL }
  if (e.followsConsensus)  return { label: 'folgt Konsens', color: CORAL }
  if (e.bidirectional)     return { label: 'bidirektional', color: '#7c6da0' }
  return                          { label: 'kein Signal',   color: GRAY }
}

export default function GrangerChart({ data }) {
  const [party, setParty] = useState(data.parties[0])
  const [tooltip, setTooltip] = useState(null)

  const entries = useMemo(() => data.results[party] ?? [], [data, party])

  const maxF = useMemo(() =>
    Math.max(10, ...entries.flatMap(e => [e.instToLoo.f, e.looToInst.f])),
    [entries]
  )

  const sc = useMemo(() =>
    scaleLinear().domain([0, maxF]).range([0, BAR_COL - 48]),
    [maxF]
  )

  const svgH = MT + entries.length * ROW_H + MB

  return (
    <div className="flex flex-col gap-4">
      {/* Party pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {data.parties.map(p => (
          <button
            key={p}
            onClick={() => setParty(p)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px',
              padding: '3px 10px', borderRadius: '100px', cursor: 'pointer',
              border: `1.5px solid ${party === p ? 'var(--color-ink)' : 'var(--color-rule)'}`,
              backgroundColor: party === p ? 'var(--color-ink)' : 'transparent',
              color: party === p ? 'var(--color-paper)' : 'var(--color-muted)',
              transition: 'all 0.15s',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ overflowX: 'auto' }}>
        <svg
          width={DP_W}
          height={svgH}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', display: 'block' }}
        >
          {/* Column headers */}
          <text x={ML} y={16} fill={PETROL} fontSize={10} fontWeight={600} letterSpacing="0.08em" textAnchor="start">
            INSTITUT → KONSENS
          </text>
          <text x={ML + BAR_COL + COL_GAP} y={16} fill={CORAL} fontSize={10} fontWeight={600} letterSpacing="0.08em" textAnchor="start">
            KONSENS → INSTITUT
          </text>
          <text x={ML} y={30} fill="var(--color-muted)" fontSize={9} textAnchor="start">
            Vorlauf-Signal
          </text>
          <text x={ML + BAR_COL + COL_GAP} y={30} fill="var(--color-muted)" fontSize={9} textAnchor="start">
            Institut folgt Konsens
          </text>

          {/* Rows */}
          {entries.map((e, i) => {
            const y = MT + i * ROW_H
            const cls = classification(e)
            const wInst = sc(e.instToLoo.f)
            const wLoo  = sc(e.looToInst.f)
            const sigInst = e.instToLoo.p < ALPHA
            const sigLoo  = e.looToInst.p < ALPHA
            const isHovered = tooltip?.institute === e.institute && tooltip?.party === party

            return (
              <g
                key={e.institute}
                onMouseEnter={() => setTooltip({ ...e, party })}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'default' }}
              >
                {/* Row background on hover */}
                {isHovered && (
                  <rect
                    x={0} y={y - 4}
                    width={DP_W} height={ROW_H - 2}
                    fill="var(--color-rule)" opacity={0.4} rx={3}
                  />
                )}

                {/* Institute label + classification dot */}
                <circle cx={8} cy={y + ROW_H / 2 - 2} r={4} fill={cls.color} />
                <text
                  x={18} y={y + ROW_H / 2 + 4}
                  fill="var(--color-ink)" fontSize={12} fontWeight={500}
                >
                  {e.institute}
                </text>

                {/* inst→loo bar */}
                <rect
                  x={ML} y={y + ROW_H / 2 - BAR_H / 2 - 3}
                  width={wInst} height={BAR_H}
                  fill={sigInst ? PETROL : 'var(--color-rule)'}
                  rx={2}
                />
                <text
                  x={ML + wInst + 4}
                  y={y + ROW_H / 2 + 2}
                  fill={sigInst ? PETROL : 'var(--color-muted)'}
                  fontSize={9}
                >
                  {sigInst ? `F=${e.instToLoo.f}` : pLabel(e.instToLoo.p)}
                </text>

                {/* loo→inst bar */}
                <rect
                  x={ML + BAR_COL + COL_GAP}
                  y={y + ROW_H / 2 - BAR_H / 2 - 3}
                  width={wLoo} height={BAR_H}
                  fill={sigLoo ? CORAL : 'var(--color-rule)'}
                  rx={2}
                />
                <text
                  x={ML + BAR_COL + COL_GAP + wLoo + 4}
                  y={y + ROW_H / 2 + 2}
                  fill={sigLoo ? CORAL : 'var(--color-muted)'}
                  fontSize={9}
                >
                  {sigLoo ? `F=${e.looToInst.f}` : pLabel(e.looToInst.p)}
                </text>

                {/* Separator line */}
                {i < entries.length - 1 && (
                  <line
                    x1={0} x2={DP_W}
                    y1={y + ROW_H - 1} y2={y + ROW_H - 1}
                    stroke="var(--color-rule)" strokeWidth={1}
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {[
          { color: PETROL,   label: 'führt Konsens — Institut → Konsens sig., umgekehrt nicht' },
          { color: CORAL,    label: 'folgt Konsens — Konsens → Institut sig., umgekehrt nicht' },
          { color: '#7c6da0',label: 'bidirektional — beide Richtungen sig.' },
          { color: GRAY,     label: 'kein Signal — keine Richtung sig.' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Tooltip / Detail */}
      {tooltip && (
        <div style={{
          padding: '12px 16px',
          border: '1px solid var(--color-rule)',
          borderRadius: '8px',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)' }}>
              {tooltip.institute}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)' }}>
              {tooltip.n} Wochen mit Datenpunkten · {party}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ padding: '8px', backgroundColor: `${PETROL}10`, borderRadius: '4px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: PETROL, fontWeight: 600, marginBottom: '2px' }}>
                Institut → Konsens
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-ink)' }}>
                F({tooltip.instToLoo.df1},{tooltip.instToLoo.df2}) = {tooltip.instToLoo.f}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: tooltip.instToLoo.p < ALPHA ? PETROL : 'var(--color-muted)', marginTop: '2px' }}>
                {pLabel(tooltip.instToLoo.p)} {tooltip.instToLoo.p < ALPHA ? '— signifikant' : '— nicht signifikant'}
              </div>
            </div>
            <div style={{ padding: '8px', backgroundColor: `${CORAL}10`, borderRadius: '4px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: CORAL, fontWeight: 600, marginBottom: '2px' }}>
                Konsens → Institut
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-ink)' }}>
                F({tooltip.looToInst.df1},{tooltip.looToInst.df2}) = {tooltip.looToInst.f}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: tooltip.looToInst.p < ALPHA ? CORAL : 'var(--color-muted)', marginTop: '2px' }}>
                {pLabel(tooltip.looToInst.p)} {tooltip.looToInst.p < ALPHA ? '— signifikant' : '— nicht signifikant'}
              </div>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', marginTop: '2px' }}>
            {classification(tooltip).label === 'führt Konsens'
              ? `${tooltip.institute} bewegt den Konsens: vergangene Werte sagen den künftigen Konsens vorher — nicht umgekehrt.`
              : classification(tooltip).label === 'folgt Konsens'
              ? `${tooltip.institute} folgt dem Konsens: der Konsens sagt das Institut vorher, nicht anders herum.`
              : classification(tooltip).label === 'bidirektional'
              ? `${tooltip.institute} ist bidirektional verknüpft: das Institut beeinflusst den Konsens und wird von ihm beeinflusst.`
              : `Kein statistisch messbarer Zusammenhang zwischen ${tooltip.institute} und dem Konsens für ${party}.`
            }
          </div>
        </div>
      )}
    </div>
  )
}
