import { useState, useMemo } from 'react'
import { scaleLinear } from 'd3-scale'

const CORAL  = [190, 90, 60]
const PETROL = [28, 93, 87]
const MUTED  = [107, 102, 88]

// Parteien, die in die Gesamt-Fehlerberechnung eingehen
const CORE_PARTIES = ['CDU/CSU', 'SPD', 'Grüne', 'AfD', 'FDP', 'Linke']

function dotColor(dev) {
  if (dev == null) return `rgb(${MUTED.join(',')})`
  return dev > 0 ? `rgb(${CORAL.join(',')})` : `rgb(${PETROL.join(',')})`
}

// Farbe für die Ranking-Balken: gut = Petrol, schlecht = Coral
function rankColor(rmse, minR, maxR) {
  const t = (rmse - minR) / Math.max(maxR - minR, 0.01)
  const rgb = [
    Math.round(PETROL[0] + (CORAL[0] - PETROL[0]) * t),
    Math.round(PETROL[1] + (CORAL[1] - PETROL[1]) * t),
    Math.round(PETROL[2] + (CORAL[2] - PETROL[2]) * t),
  ]
  return `rgb(${rgb.join(',')})`
}

// ── Gesamt-Ranking für ein Jahr ─────────────────────────────────────────────
function OverviewRanking({ year, entries }) {
  const [tooltip, setTooltip] = useState(null)

  const stats = useMemo(() => {
    const insts = [...new Set(entries.filter(e => e.year === year).map(e => e.institute))]
    return insts.map(inst => {
      const rows = entries.filter(e =>
        e.year === year && e.institute === inst && CORE_PARTIES.includes(e.party)
      )
      if (!rows.length) return null
      const mae  = rows.reduce((s, r) => s + Math.abs(r.deviation), 0) / rows.length
      const rmse = Math.sqrt(rows.reduce((s, r) => s + r.deviation ** 2, 0) / rows.length)
      return { institute: inst, mae, rmse, n: rows.length }
    })
      .filter(Boolean)
      .sort((a, b) => a.rmse - b.rmse)
  }, [year, entries])

  if (!stats.length) return null

  const minR = stats[0].rmse
  const maxR = stats[stats.length - 1].rmse
  const barMax = maxR * 1.05
  const barSc  = scaleLinear().domain([0, barMax]).range([0, 440])

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'var(--color-muted)', marginBottom: 8,
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        Rangfolge nach mittlerem Fehler (RMSE über {CORE_PARTIES.length} Parteien)
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {stats.map((s, rank) => (
          <div key={s.institute}
            onMouseEnter={() => setTooltip(s)}
            onMouseLeave={() => setTooltip(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'default' }}>
            {/* Rang */}
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--color-muted)', width: 16, textAlign: 'right', flexShrink: 0,
            }}>
              {rank + 1}
            </span>
            {/* Institut-Name */}
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--color-ink)', width: 172, flexShrink: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {s.institute}
            </span>
            {/* Balken */}
            <div style={{ flex: 1, position: 'relative', height: 16 }}>
              <div style={{
                width: `${(barSc(s.rmse) / 440) * 100}%`,
                height: '100%',
                background: rankColor(s.rmse, minR, maxR),
                borderRadius: 2,
                transition: 'width 0.2s',
              }} />
            </div>
            {/* Wert */}
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: rankColor(s.rmse, minR, maxR), width: 36, flexShrink: 0,
            }}>
              {s.rmse.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: 'var(--color-paper)',
          border: '1px solid var(--color-rule)',
          borderRadius: 6, padding: '10px 12px',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          minWidth: 200, pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{tooltip.institute}</div>
          <div style={{ color: 'var(--color-muted)', lineHeight: 1.8 }}>
            <div>RMSE: <span style={{ color: 'var(--color-ink)' }}>{tooltip.rmse.toFixed(2)} PP</span></div>
            <div>MAE: <span style={{ color: 'var(--color-ink)' }}>{tooltip.mae.toFixed(2)} PP</span></div>
            <div style={{ marginTop: 6, fontSize: 10 }}>
              RMSE = typischer Fehler über alle Parteien, gewichtet für große Ausreißer.
              MAE = einfacher Durchschnitt der Abweichungen.
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)',
        marginTop: 8, paddingLeft: 196,
      }}>
        <span>genauer</span>
        <span>weniger genau</span>
      </div>
    </div>
  )
}

// ── Detail-Panel: ein Wahljahr, eine Partei ──────────────────────────────────
const DP_W  = 680
const DP_ML = 175
const DP_MR = 48
const DP_IW = DP_W - DP_ML - DP_MR
const ROW_H = 26

function DetailPanel({ year, party, entries, meta }) {
  const [tooltip, setTooltip] = useState(null)

  const rows = entries
    .filter(e => e.year === year && e.party === party)
    .sort((a, b) => b.deviation - a.deviation)

  const election = meta.elections.find(e => e.year === year)
  const noDate   = rows.every(r => !r.pollDate)

  if (!rows.length) return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>
      Keine Daten für {year}
    </div>
  )

  const H   = rows.length * ROW_H + 28 + 28
  const xSc = scaleLinear().domain([-5, 5]).range([0, DP_IW])
  const x0  = xSc(0)
  const ticks = xSc.ticks(6)

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--color-muted)', marginBottom: 4,
        paddingLeft: DP_ML,
      }}>
        BTW {year}
        {election?.date && (
          <span style={{ marginLeft: 8, opacity: 0.6 }}>
            ({new Date(election.date + 'T12:00:00Z')
              .toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })})
          </span>
        )}
        {noDate && <span style={{ marginLeft: 8, opacity: 0.5 }}> · kein genaues Umfragedatum bekannt</span>}
      </div>

      <svg viewBox={`0 0 ${DP_W} ${H}`} width="100%">
        <g transform={`translate(${DP_ML},28)`}>
          {ticks.map(v => (
            <line key={v} x1={xSc(v)} x2={xSc(v)} y1={0} y2={rows.length * ROW_H}
              stroke="var(--color-rule)" strokeWidth={0.8} />
          ))}
          <line x1={x0} x2={x0} y1={0} y2={rows.length * ROW_H}
            stroke="var(--color-ink)" strokeWidth={1.2} opacity={0.4} />

          {ticks.map(v => (
            <text key={v} x={xSc(v)} y={rows.length * ROW_H + 16}
              textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-muted)' }}>
              {v > 0 ? '+' : ''}{v}
            </text>
          ))}

          {rows.map((row, i) => {
            const y   = i * ROW_H + ROW_H / 2
            const cx  = xSc(row.deviation)
            const col = dotColor(row.deviation)
            return (
              <g key={row.institute}
                onMouseEnter={() => setTooltip(row)}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'default' }}>
                <text x={-8} y={y} textAnchor="end" dominantBaseline="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--color-ink)' }}>
                  {row.institute}
                </text>
                <line x1={Math.min(x0, cx)} x2={Math.max(x0, cx)} y1={y} y2={y}
                  stroke={col} strokeWidth={1.5} opacity={0.3} />
                <circle cx={cx} cy={y} r={5} fill={col} />
                <text
                  x={row.deviation >= 0 ? cx + 9 : cx - 9} y={y}
                  textAnchor={row.deviation >= 0 ? 'start' : 'end'}
                  dominantBaseline="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-muted)' }}>
                  {row.deviation > 0 ? '+' : ''}{row.deviation.toFixed(1)}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {tooltip && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: 'var(--color-paper)',
          border: '1px solid var(--color-rule)',
          borderRadius: 6, padding: '10px 12px',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          minWidth: 200, pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{tooltip.institute} · {year}</div>
          <div style={{ color: 'var(--color-muted)', lineHeight: 1.8 }}>
            <div>Umfrage: <span style={{ color: 'var(--color-ink)' }}>{tooltip.poll}%</span></div>
            <div>Ergebnis: <span style={{ color: 'var(--color-ink)' }}>{tooltip.result}%</span></div>
            <div>Abweichung: <span style={{ color: dotColor(tooltip.deviation), fontWeight: 600 }}>
              {tooltip.deviation > 0 ? '+' : ''}{tooltip.deviation.toFixed(1)} PP
            </span></div>
            {tooltip.daysBeforeElection && <div>{tooltip.daysBeforeElection} Tage vor der Wahl</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function ElectionAccuracyChart({ data }) {
  const { meta, parties, entries } = data
  const years  = meta.elections.map(e => e.year)
  const [year,  setYear]  = useState(2025)
  const [party, setParty] = useState('CDU/CSU')
  const [view,  setView]  = useState('overview')  // 'overview' | 'detail'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Jahr-Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-rule)' }}>
        {years.map(y => (
          <button key={y} onClick={() => setYear(y)} style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            padding: '6px 18px',
            border: 'none',
            borderBottom: y === year ? '2px solid var(--color-ink)' : '2px solid transparent',
            background: 'transparent',
            color: y === year ? 'var(--color-ink)' : 'var(--color-muted)',
            cursor: 'pointer', fontWeight: y === year ? 700 : 400,
            marginBottom: -1,
          }}>
            BTW {y}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {/* Ansichts-Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 6 }}>
          {['overview', 'detail'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${v === view ? 'var(--color-ink)' : 'var(--color-rule)'}`,
              background: v === view ? 'var(--color-ink)' : 'transparent',
              color: v === view ? 'var(--color-paper)' : 'var(--color-muted)',
            }}>
              {v === 'overview' ? 'Überblick' : 'Nach Partei'}
            </button>
          ))}
        </div>
      </div>

      {/* Überblick-Ansicht */}
      {view === 'overview' && (
        <OverviewRanking year={year} entries={entries} />
      )}

      {/* Detail-Ansicht */}
      {view === 'detail' && (
        <>
          {/* Partei-Auswahl */}
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

          <DetailPanel year={year} party={party} entries={entries} meta={meta} />
        </>
      )}

      {/* Legende */}
      <div style={{
        display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'var(--color-muted)',
      }}>
        <span>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: `rgb(${CORAL.join(',')})`, marginRight: 4, verticalAlign: 'middle' }} />
          zu hoch geschätzt
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: `rgb(${PETROL.join(',')})`, marginRight: 4, verticalAlign: 'middle' }} />
          zu niedrig geschätzt
        </span>
        <span style={{ opacity: 0.6 }}>letzte Umfrage vor der Wahl minus Wahlergebnis in PP</span>
      </div>
    </div>
  )
}
