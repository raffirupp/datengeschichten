import { useState, useRef } from 'react'
import { scaleLinear } from 'd3-scale'

const MIN_N   = 5
const MAX_ABS = 2.5  // Farbskala: ±2.5 PP

const PAPER  = [247, 244, 236]
const PETROL = [28, 93, 87]
const CORAL  = [190, 90, 60]

function lerpRgb(a, b, t) {
  const c = Math.max(0, Math.min(1, t))
  return [
    Math.round(a[0] + (b[0] - a[0]) * c),
    Math.round(a[1] + (b[1] - a[1]) * c),
    Math.round(a[2] + (b[2] - a[2]) * c),
  ]
}

function cellBg(mean) {
  if (mean == null) return `rgb(${PAPER.join(',')})`
  const t = Math.min(Math.max(mean / MAX_ABS, -1), 1)
  const rgb = t >= 0 ? lerpRgb(PAPER, CORAL, t) : lerpRgb(PETROL, PAPER, t + 1)
  return `rgb(${rgb.join(',')})`
}

function cellFg(mean) {
  if (mean == null) return 'var(--color-muted)'
  return Math.abs(mean) / MAX_ABS > 0.55 ? 'var(--color-paper)' : 'var(--color-ink)'
}

function fmt(v, digits = 1) {
  if (v == null) return '–'
  return (v > 0 ? '+' : '') + v.toFixed(digits)
}

// ── Heatmap tooltip ─────────────────────────────────────────────────────────

function CellTooltip({ cell, meta, rect }) {
  if (!cell || !rect) return null
  const validPeriods = cell.periods.filter(p => p.n >= MIN_N && p.mean !== null)
  const style = {
    position: 'fixed',
    top:  rect.bottom + 6,
    left: rect.left + rect.width / 2,
    transform: 'translateX(-50%)',
    zIndex: 50,
    background: 'var(--color-paper)',
    border: '1px solid var(--color-rule)',
    borderRadius: 6,
    padding: '10px 12px',
    minWidth: 200,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    pointerEvents: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  }
  return (
    <div style={style}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--color-ink)' }}>
        {cell.institute} · {cell.party}
      </div>
      {cell.n < MIN_N ? (
        <div style={{ color: 'var(--color-muted)' }}>
          Zu wenige Umfragen ({cell.n}) für eine verlässliche Aussage.
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 8, color: 'var(--color-ink)' }}>
            vs. andere Institute: <strong>{fmt(cell.mean)} PP</strong>
            <span style={{ color: 'var(--color-muted)', marginLeft: 4 }}>
              (±{cell.se.toFixed(2)}, n={cell.n})
            </span>
          </div>
          {validPeriods.length >= 2 && (
            <>
              <div style={{ color: 'var(--color-muted)', marginBottom: 4 }}>
                Nach Zeitabschnitt:
              </div>
              {meta.periods.map(pd => {
                const p = cell.periods.find(x => x.id === pd.id)
                if (!p || p.n === 0) return null
                return (
                  <div key={pd.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, lineHeight: 1.6 }}>
                    <span style={{ color: 'var(--color-muted)' }}>{pd.label}</span>
                    <span style={{
                      color: p.n < MIN_N ? 'var(--color-muted)' : 'var(--color-ink)',
                      fontStyle: p.n < MIN_N ? 'italic' : 'normal',
                    }}>
                      {p.n < MIN_N ? `n=${p.n}, zu wenig` : `${fmt(p.mean)} PP (n=${p.n})`}
                    </span>
                  </div>
                )
              })}
              {!cell.stable && (
                <div style={{ marginTop: 6, color: '#BE5A3C', fontSize: 10 }}>
                  Richtung wechselt über Zeitabschnitte — mit Vorsicht lesen.
                </div>
              )}
            </>
          )}
          {validPeriods.length < 2 && (
            <div style={{ color: 'var(--color-muted)', fontSize: 10 }}>
              Zu wenige Daten für Perioden-Vergleich.
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Dot-Plot (SVG) ───────────────────────────────────────────────────────────

const DP_W  = 680
const DP_ML = 178
const DP_MR = 20
const DP_MT = 24
const DP_MB = 36
const DP_IW = DP_W - DP_ML - DP_MR
const ROW_H = 30

function DotPlot({ cells, institutes, party, meta }) {
  const [tooltip, setTooltip] = useState(null)

  const rows = institutes
    .map(inst => cells.find(c => c.institute === inst && c.party === party))
    .filter(Boolean)
    .sort((a, b) => b.mean - a.mean)

  const means  = rows.filter(r => r.n >= MIN_N).map(r => r.mean)
  const extent = means.length
    ? [Math.min(...means) - 1, Math.max(...means) + 1]
    : [-3, 3]
  const xDomain = [
    Math.min(extent[0], -MAX_ABS),
    Math.max(extent[1],  MAX_ABS),
  ]

  const H   = rows.length * ROW_H + DP_MT + DP_MB
  const xSc = scaleLinear().domain(xDomain).range([0, DP_IW])
  const x0  = xSc(0)
  const ticks = xSc.ticks(6)

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${DP_W} ${H}`}
        width="100%"
        aria-label={`Abweichungen der Institute für ${party}`}
      >
        <g transform={`translate(${DP_ML},${DP_MT})`}>
          {/* grid lines */}
          {ticks.map(v => (
            <line
              key={v}
              x1={xSc(v)} x2={xSc(v)} y1={0} y2={rows.length * ROW_H}
              stroke="var(--color-rule)" strokeWidth={0.8}
            />
          ))}
          {/* zero line */}
          <line x1={x0} x2={x0} y1={0} y2={rows.length * ROW_H}
            stroke="var(--color-ink)" strokeWidth={1.2} opacity={0.5} />

          {/* x axis labels */}
          {ticks.map(v => (
            <text
              key={v}
              x={xSc(v)} y={rows.length * ROW_H + 18}
              textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-muted)' }}
            >
              {v > 0 ? '+' : ''}{v}
            </text>
          ))}
          <text
            x={xSc(0)} y={rows.length * ROW_H + 30}
            textAnchor="middle"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--color-muted)' }}
          >
            PP Abweichung vom Konsens
          </text>

          {/* rows */}
          {rows.map((cell, i) => {
            const y    = i * ROW_H + ROW_H / 2
            const thin = cell.n < MIN_N
            const cx   = thin ? x0 : xSc(cell.mean)
            const color = thin ? 'var(--color-rule)' : cell.mean >= 0 ? `rgb(${CORAL.join(',')})` : `rgb(${PETROL.join(',')})`
            const seLeft  = thin ? cx : xSc(cell.mean - cell.se)
            const seRight = thin ? cx : xSc(cell.mean + cell.se)

            return (
              <g key={cell.institute}
                onMouseEnter={() => setTooltip(cell)}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'default' }}
              >
                {/* institute label */}
                <text
                  x={-8} y={y}
                  textAnchor="end" dominantBaseline="middle"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fill: thin ? 'var(--color-rule)' : 'var(--color-ink)',
                  }}
                >
                  {cell.institute}
                </text>

                {!thin && (
                  <>
                    {/* error bar */}
                    <line
                      x1={seLeft} x2={seRight} y1={y} y2={y}
                      stroke={color} strokeWidth={1.5} opacity={0.5}
                    />
                    <line x1={seLeft}  x2={seLeft}  y1={y - 4} y2={y + 4} stroke={color} strokeWidth={1} opacity={0.5} />
                    <line x1={seRight} x2={seRight} y1={y - 4} y2={y + 4} stroke={color} strokeWidth={1} opacity={0.5} />
                  </>
                )}

                {/* dot */}
                <circle
                  cx={cx} cy={y} r={thin ? 4 : 5.5}
                  fill={thin ? 'none' : color}
                  stroke={thin ? 'var(--color-rule)' : color}
                  strokeWidth={thin ? 1.5 : 0}
                  opacity={thin ? 0.5 : 1}
                />

                {/* unstable marker */}
                {!thin && !cell.stable && (
                  <text
                    x={cx + 9} y={y}
                    dominantBaseline="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: '#BE5A3C' }}
                  >
                    ~
                  </text>
                )}

                {/* value label */}
                {!thin && (
                  <text
                    x={cell.mean >= 0 ? seRight + 6 : seLeft - 6} y={y}
                    textAnchor={cell.mean >= 0 ? 'start' : 'end'}
                    dominantBaseline="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-muted)' }}
                  >
                    {fmt(cell.mean)}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Dot plot tooltip */}
      {tooltip && tooltip.n >= MIN_N && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: 'var(--color-paper)',
          border: '1px solid var(--color-rule)',
          borderRadius: 6,
          padding: '10px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          minWidth: 190,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--color-ink)' }}>
            {tooltip.institute}
          </div>
          <div style={{ marginBottom: 6, color: 'var(--color-ink)' }}>
            vs. andere: <strong>{fmt(tooltip.mean)} PP</strong>
            <span style={{ color: 'var(--color-muted)', marginLeft: 4 }}>
              ±{tooltip.se.toFixed(2)}, n={tooltip.n}
            </span>
          </div>
          {meta.periods.map(pd => {
            const p = tooltip.periods.find(x => x.id === pd.id)
            if (!p || p.n === 0) return null
            return (
              <div key={pd.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                <span>{pd.label}</span>
                <span style={{ color: p.n < MIN_N ? 'var(--color-rule)' : 'var(--color-ink)' }}>
                  {p.n < MIN_N ? `n=${p.n}` : fmt(p.mean) + ' PP'}
                </span>
              </div>
            )
          })}
          {!tooltip.stable && (
            <div style={{ marginTop: 6, fontSize: 10, color: '#BE5A3C' }}>
              Richtung nicht stabil über alle Perioden
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: 16,
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-muted)',
        marginTop: 4,
        paddingLeft: DP_ML,
      }}>
        <span>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: `rgb(${CORAL.join(',')})`, marginRight: 4, verticalAlign: 'middle' }} />
          liegt höher als andere Institute
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: `rgb(${PETROL.join(',')})`, marginRight: 4, verticalAlign: 'middle' }} />
          liegt niedriger als andere Institute
        </span>
        <span>~ = Richtung wechselt je nach Zeitraum</span>
      </div>
    </div>
  )
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────

export default function HouseEffectsChart({ data }) {
  const [selectedParty, setSelectedParty] = useState('CDU/CSU')
  const [hoveredCell, setHoveredCell]     = useState(null)
  const [cellRect,    setCellRect]        = useState(null)
  const cellRefs = useRef({})

  const { meta, institutes, parties, cells } = data

  function handleCellEnter(cell, key) {
    setHoveredCell(cell)
    const el = cellRefs.current[key]
    if (el) setCellRect(el.getBoundingClientRect())
  }

  function handleCellLeave() {
    setHoveredCell(null)
    setCellRect(null)
  }

  function getCell(inst, party) {
    return cells.find(c => c.institute === inst && c.party === party) ?? null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Heatmap */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          width: '100%',
          minWidth: 580,
        }}>
          <thead>
            <tr>
              <th style={{ width: 160, textAlign: 'left', fontWeight: 400, color: 'var(--color-muted)', padding: '0 8px 8px 0' }} />
              {parties.map(party => (
                <th
                  key={party}
                  onClick={() => setSelectedParty(party === selectedParty ? null : party)}
                  style={{
                    padding: '4px 4px 10px',
                    textAlign: 'center',
                    fontWeight: selectedParty === party ? 700 : 400,
                    color: selectedParty === party ? 'var(--color-ink)' : 'var(--color-muted)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    borderBottom: selectedParty === party
                      ? '2px solid var(--color-ink)'
                      : '2px solid transparent',
                    transition: 'color 0.15s',
                  }}
                >
                  {party}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {institutes.map(inst => (
              <tr key={inst}>
                <td style={{
                  padding: '2px 8px 2px 0',
                  color: 'var(--color-ink)',
                  whiteSpace: 'nowrap',
                  fontSize: 11,
                }}>
                  {inst}
                </td>
                {parties.map(party => {
                  const cell = getCell(inst, party)
                  const key  = `${inst}__${party}`
                  const thin = !cell || cell.n < MIN_N
                  const bg   = thin ? 'var(--color-paper)' : cellBg(cell.mean)
                  const fg   = thin ? 'var(--color-rule)' : cellFg(cell.mean)
                  const isSelected = selectedParty === party

                  return (
                    <td
                      key={key}
                      ref={el => { cellRefs.current[key] = el }}
                      onClick={() => {
                        setSelectedParty(party === selectedParty ? null : party)
                      }}
                      onMouseEnter={() => handleCellEnter(cell, key)}
                      onMouseLeave={handleCellLeave}
                      style={{
                        background: bg,
                        color: fg,
                        padding: '5px 4px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        outline: isSelected ? '2px solid var(--color-ink)' : '1px solid var(--color-paper)',
                        outlineOffset: -1,
                        transition: 'outline 0.1s',
                        minWidth: 60,
                        lineHeight: 1,
                      }}
                    >
                      {thin ? (
                        <span style={{ opacity: 0.3, fontSize: 9 }}>n&lt;{MIN_N}</span>
                      ) : (
                        <span style={{ fontWeight: Math.abs(cell.mean) > 0.8 ? 700 : 400 }}>
                          {fmt(cell.mean)}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Farbskala-Legende */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)' }}>
        <span>niedriger als andere Institute</span>
        <div style={{
          width: 160,
          height: 8,
          borderRadius: 4,
          background: `linear-gradient(to right, rgb(${PETROL.join(',')}), rgb(${PAPER.join(',')}), rgb(${CORAL.join(',')}))`,
        }} />
        <span>höher als andere Institute</span>
        <span style={{ marginLeft: 8, opacity: 0.5 }}>max ±{MAX_ABS} PP</span>
      </div>

      {/* Hinweis */}
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>
        Zahlen in Prozentpunkten. Parteinamen anklicken für Detailansicht. Zellen mit n&lt;{MIN_N} sind ausgeblendet.
      </p>

      {/* Dot Plot */}
      {selectedParty && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {parties.map(p => (
              <button
                key={p}
                onClick={() => setSelectedParty(p === selectedParty ? null : p)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 20,
                  border: `1px solid ${p === selectedParty ? 'var(--color-ink)' : 'var(--color-rule)'}`,
                  background: p === selectedParty ? 'var(--color-ink)' : 'transparent',
                  color: p === selectedParty ? 'var(--color-paper)' : 'var(--color-muted)',
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <DotPlot
            cells={cells}
            institutes={institutes}
            party={selectedParty}
            meta={meta}
          />
        </div>
      )}

      {/* Tooltip (Portal-ähnlich via fixed) */}
      <CellTooltip cell={hoveredCell} meta={meta} rect={cellRect} />
    </div>
  )
}
