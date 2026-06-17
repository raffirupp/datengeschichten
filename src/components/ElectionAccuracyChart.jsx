import { useState } from 'react'
import { scaleLinear } from 'd3-scale'

const CORAL  = [190, 90, 60]
const PETROL = [28, 93, 87]
const MUTED  = [107, 102, 88]

function dotColor(dev) {
  if (dev == null) return `rgb(${MUTED.join(',')})`
  return dev > 0 ? `rgb(${CORAL.join(',')})` : `rgb(${PETROL.join(',')})`
}

const DP_W  = 680
const DP_ML = 175
const DP_MR = 48
const DP_MT = 28
const DP_MB = 28
const DP_IW = DP_W - DP_ML - DP_MR
const ROW_H = 26

function ElectionPanel({ year, entries, party, meta }) {
  const [tooltip, setTooltip] = useState(null)

  const rows = entries
    .filter(e => e.year === year && e.party === party)
    .sort((a, b) => b.deviation - a.deviation)

  if (rows.length === 0) return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', padding: '8px 0' }}>
      Keine Daten für {year}
    </div>
  )

  const election = meta.elections.find(e => e.year === year)
  const H = rows.length * ROW_H + DP_MT + DP_MB

  // Symmetric x-axis around 0, max ±4 PP
  const maxAbs = Math.max(4, ...rows.map(r => Math.abs(r.deviation)))
  const xDom   = [-Math.min(maxAbs, 5), Math.min(maxAbs, 5)]
  const xSc    = scaleLinear().domain(xDom).range([0, DP_IW])
  const x0     = xSc(0)
  const ticks  = xSc.ticks(6)

  const noDate = rows.every(r => !r.pollDate)

  return (
    <div style={{ position: 'relative' }}>
      {/* Jahres-Label */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
        marginBottom: 4,
        paddingLeft: DP_ML,
      }}>
        BTW {year}
        {election?.date && (
          <span style={{ marginLeft: 8, opacity: 0.6 }}>
            ({new Date(election.date + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })})
          </span>
        )}
        {noDate && <span style={{ marginLeft: 8, opacity: 0.5 }}> · Umfragedaten ohne genaues Datum</span>}
      </div>

      <svg viewBox={`0 0 ${DP_W} ${H}`} width="100%" aria-label={`Wahlgenauigkeit ${year} – ${party}`}>
        <g transform={`translate(${DP_ML},${DP_MT})`}>
          {/* Grid */}
          {ticks.map(v => (
            <line key={v} x1={xSc(v)} x2={xSc(v)} y1={0} y2={rows.length * ROW_H}
              stroke="var(--color-rule)" strokeWidth={0.8} />
          ))}
          {/* Zero line */}
          <line x1={x0} x2={x0} y1={0} y2={rows.length * ROW_H}
            stroke="var(--color-ink)" strokeWidth={1.2} opacity={0.4} />

          {/* x-Achse */}
          {ticks.map(v => (
            <text key={v} x={xSc(v)} y={rows.length * ROW_H + 16}
              textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-muted)' }}>
              {v > 0 ? '+' : ''}{v}
            </text>
          ))}

          {/* Punkte */}
          {rows.map((row, i) => {
            const y   = i * ROW_H + ROW_H / 2
            const cx  = xSc(row.deviation)
            const col = dotColor(row.deviation)
            return (
              <g key={row.institute}
                onMouseEnter={() => setTooltip(row)}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'default' }}>
                {/* Institut-Label */}
                <text x={-8} y={y} textAnchor="end" dominantBaseline="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--color-ink)' }}>
                  {row.institute}
                </text>
                {/* Linie zu Null */}
                <line x1={Math.min(x0, cx)} x2={Math.max(x0, cx)} y1={y} y2={y}
                  stroke={col} strokeWidth={1.5} opacity={0.35} />
                {/* Punkt */}
                <circle cx={cx} cy={y} r={5} fill={col} />
                {/* Wert-Label */}
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
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{tooltip.institute} · {year}</div>
          <div style={{ color: 'var(--color-muted)', lineHeight: 1.8 }}>
            <div>Umfrage: <span style={{ color: 'var(--color-ink)' }}>{tooltip.poll}%</span></div>
            <div>Ergebnis: <span style={{ color: 'var(--color-ink)' }}>{tooltip.result}%</span></div>
            <div>Abweichung: <span style={{ color: dotColor(tooltip.deviation), fontWeight: 600 }}>
              {tooltip.deviation > 0 ? '+' : ''}{tooltip.deviation.toFixed(1)} PP
            </span></div>
            {tooltip.daysBeforeElection && (
              <div>{tooltip.daysBeforeElection} Tage vor der Wahl</div>
            )}
            {tooltip.note && <div style={{ marginTop: 4, fontSize: 10 }}>{tooltip.note}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ElectionAccuracyChart({ data }) {
  const [party, setParty] = useState('CDU/CSU')
  const { meta, parties, entries } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Partei-Auswahl */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
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

      {/* Drei Panels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {meta.elections.map(e => (
          <ElectionPanel key={e.year} year={e.year} entries={entries} party={party} meta={meta} />
        ))}
      </div>

      {/* Legende */}
      <div style={{
        display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'var(--color-muted)', marginTop: 8, paddingLeft: DP_ML,
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
        <span style={{ opacity: 0.6 }}>Werte in PP (letzte Umfrage vor der Wahl minus Wahlergebnis)</span>
      </div>
    </div>
  )
}
