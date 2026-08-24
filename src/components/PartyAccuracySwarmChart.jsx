import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { partyColor } from '../lib/partyColors.js'

const MIN_N = 5
const RADIUS = 3.2
const COL_W  = 68
const W_MARGIN = { top: 16, right: 20, bottom: 34, left: 40 }

// CDU und CSU teilen sich ohnehin dieselbe Markenfarbe (partyColors.js) und treten nie im
// selben Bundesland an — für die Gesamtschau über alle Länder zusammengefasst, sonst würde
// Bayern (nur CSU) die CDU-Spalte künstlich verkleinern und umgekehrt.
const MERGE = { CSU: 'CDU/CSU', CDU: 'CDU/CSU' }

// Reihenfolge grob wie im SPIEGEL-Vorbild (CDU–SPD–Grüne–FDP–AfD–Linke), BSW und
// Freie Wähler als zusätzliche Spalten angehängt, wo unsere Daten das hergeben.
const PARTY_ORDER = ['CDU/CSU', 'SPD', 'Grüne', 'FDP', 'AfD', 'Linke', 'BSW', 'Freie Wähler']

// Einfacher Greedy-Beeswarm: Punkte nach y sortiert, jeder sucht den nächstgelegenen
// x-Versatz zur Spaltenmitte, der keine Überlappung mit bereits platzierten Punkten
// erzeugt. Kein d3-force im Projekt — das reicht für die paar Dutzend Punkte pro Spalte.
function layoutSwarm(points) {
  const sorted = [...points].sort((a, b) => a.py - b.py)
  const placed = []
  const maxDx = COL_W / 2 - RADIUS
  for (const p of sorted) {
    let dx = 0
    let dir = 1
    let step = 1
    while (true) {
      const collide = placed.some(q => {
        const ddx = q.dx - dx
        const ddy = q.py - p.py
        return Math.sqrt(ddx * ddx + ddy * ddy) < RADIUS * 2 * 0.94
      })
      if (!collide) break
      dx = dir * Math.ceil(step / 2) * (RADIUS * 1.05)
      dir *= -1
      step++
      if (Math.abs(dx) > maxDx) { dx = Math.sign(dx || 1) * maxDx; break }
    }
    placed.push({ ...p, dx })
  }
  return placed
}

function median(values) {
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export default function PartyAccuracySwarmChart({ data, stateNames }) {
  const [hovered, setHovered] = useState(null)

  const byParty = useMemo(() => {
    const groups = new Map()
    for (const [code, state] of Object.entries(data.byState)) {
      for (const e of state.entries) {
        const party = MERGE[e.party] ?? e.party
        if (!groups.has(party)) groups.set(party, [])
        groups.get(party).push({ ...e, state: code, party })
      }
    }
    return groups
  }, [data])

  const parties = PARTY_ORDER.filter(p => (byParty.get(p)?.length ?? 0) >= MIN_N)

  const allDeviations = parties.flatMap(p => byParty.get(p).map(e => e.deviation))
  const maxAbs = Math.max(10, ...allDeviations.map(Math.abs))

  const innerW = parties.length * COL_W
  const W = innerW + W_MARGIN.left + W_MARGIN.right
  const innerH = 320
  const H = innerH + W_MARGIN.top + W_MARGIN.bottom

  const yScale = scaleLinear().domain([-maxAbs, maxAbs]).range([innerH, 0])
  const yTicks = yScale.ticks(6)

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label="Abweichung der letzten Institutsumfrage vom Wahlergebnis, je Partei, über alle Bundesländer">
        <g transform={`translate(${W_MARGIN.left},${W_MARGIN.top})`}>
          {/* Gridlines */}
          {yTicks.map(v => (
            <line key={v} x1={0} x2={innerW} y1={yScale(v)} y2={yScale(v)}
              stroke="var(--color-rule)" strokeWidth={0.8} />
          ))}
          <line x1={0} x2={innerW} y1={yScale(0)} y2={yScale(0)}
            stroke="var(--color-ink)" strokeWidth={1.2} opacity={0.5} />

          {yTicks.map(v => (
            <text key={v} x={-8} y={yScale(v)} textAnchor="end" dominantBaseline="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-muted)' }}>
              {v > 0 ? '+' : ''}{v}
            </text>
          ))}

          {parties.map((party, i) => {
            const entries = byParty.get(party)
            const cx = i * COL_W + COL_W / 2
            const points = layoutSwarm(entries.map(e => ({ ...e, py: yScale(e.deviation) })))
            const med = median(entries.map(e => e.deviation))
            const color = partyColor(party)

            return (
              <g key={party}>
                {/* Median-Linie */}
                <line x1={cx - COL_W / 2 + 6} x2={cx + COL_W / 2 - 6}
                  y1={yScale(med)} y2={yScale(med)}
                  stroke={color} strokeWidth={2} opacity={0.9} />

                {points.map((p, j) => {
                  const isHovered = hovered && hovered.__key === `${party}-${j}`
                  return (
                    <circle
                      key={j}
                      cx={cx + p.dx} cy={p.py} r={isHovered ? RADIUS * 1.6 : RADIUS}
                      fill={color}
                      opacity={isHovered ? 1 : 0.55}
                      stroke={isHovered ? 'var(--color-ink)' : 'none'}
                      strokeWidth={isHovered ? 1 : 0}
                      style={{ cursor: 'default', transition: 'r 0.1s' }}
                      onMouseEnter={() => setHovered({ ...p, __key: `${party}-${j}` })}
                      onMouseLeave={() => setHovered(null)}
                    />
                  )
                })}

                {/* Partei-Label */}
                <text x={cx} y={innerH + 18} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--color-ink)', fontWeight: 600 }}>
                  {party}
                </text>
                <text x={cx} y={innerH + 30} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--color-muted)' }}>
                  n={entries.length}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {hovered && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: 'var(--color-paper)',
          border: '1px solid var(--color-rule)',
          borderRadius: 6, padding: '10px 12px',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          minWidth: 210, pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--color-ink)' }}>
            {hovered.institute} · {stateNames?.[hovered.state] ?? hovered.state} {hovered.year}
          </div>
          <div style={{ color: 'var(--color-muted)', lineHeight: 1.8 }}>
            <div>Umfrage: <span style={{ color: 'var(--color-ink)' }}>{hovered.poll}%</span></div>
            <div>Ergebnis: <span style={{ color: 'var(--color-ink)' }}>{hovered.result}%</span></div>
            <div>Abweichung: <span style={{ color: partyColor(hovered.party), fontWeight: 600 }}>
              {hovered.deviation > 0 ? '+' : ''}{hovered.deviation.toFixed(1)} PP
            </span></div>
            {hovered.pollDate && <div style={{ marginTop: 4 }}>Umfrage vom {hovered.pollDate}</div>}
          </div>
        </div>
      )}

      <div style={{
        display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'var(--color-muted)', marginTop: 12, flexWrap: 'wrap',
      }}>
        <span>Punkt = letzte Institutsumfrage vor einer Landtagswahl, Balken = Median</span>
        <span style={{ opacity: 0.6 }}>y-Achse: Umfrage minus Wahlergebnis in Prozentpunkten</span>
      </div>
    </div>
  )
}
