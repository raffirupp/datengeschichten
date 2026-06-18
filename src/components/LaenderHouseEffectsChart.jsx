import { useState, useMemo } from 'react'

const CORAL  = [190, 90, 60]
const PETROL = [28, 93, 87]
const PAPER  = [247, 244, 236]
const MAX_ABS = 2.0

function lerpRgb(a, b, t) {
  return [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * t))
}

function cellBg(mean) {
  if (mean == null) return `rgb(${PAPER.join(',')})`
  const t = Math.min(Math.abs(mean) / MAX_ABS, 1)
  const col = mean > 0 ? lerpRgb(PAPER, CORAL, t) : lerpRgb(PAPER, PETROL, t)
  return `rgb(${col.join(',')})`
}

function cellFg(mean) {
  if (mean == null) return `rgb(107,102,88)`
  const t = Math.min(Math.abs(mean) / MAX_ABS, 1)
  return t > 0.5 ? 'white' : 'var(--color-ink)'
}

// Kurzname für Bundesländer
const STATE_SHORT = {
  'Bayerischer Landtag':               'Bayern',
  'Berliner Abgeordnetenhaus':          'Berlin',
  'Landtag von Nordrhein-Westfalen':    'NRW',
  'Thüringischer Landtag':             'Thüringen',
  'Landtag von Baden-Württemberg':      'Baden-Württemberg',
  'Hessischer Landtag':                'Hessen',
  'Niedersächsischer Landtag':         'Niedersachsen',
  'Sächsischer Landtag':              'Sachsen',
  'Brandenburgischer Landtag':         'Brandenburg',
  'Landtag von Rheinland-Pfalz':       'Rheinland-Pfalz',
}

export default function LaenderHouseEffectsChart({ data }) {
  const stateNames = Object.keys(data.states)
  const [state, setState] = useState(
    stateNames.find(s => s.includes('Bayerisch')) || stateNames[0]
  )
  const [tooltip, setTooltip] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const stateData = data.states[state]

  const { cellMap, institutes, parties } = useMemo(() => {
    if (!stateData) return { cellMap: {}, institutes: [], parties: [] }
    const map = {}
    for (const c of stateData.cells) {
      map[`${c.institute}|${c.party}`] = c
    }
    return {
      cellMap:    map,
      institutes: stateData.institutes,
      parties:    stateData.parties,
    }
  }, [stateData])

  if (!stateData) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Bundesland-Selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {stateNames.map(s => (
          <button key={s} onClick={() => setState(s)} style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
            border: `1px solid ${s === state ? 'var(--color-ink)' : 'var(--color-rule)'}`,
            background: s === state ? 'var(--color-ink)' : 'transparent',
            color: s === state ? 'var(--color-paper)' : 'var(--color-muted)',
          }}>
            {STATE_SHORT[s] || s}
          </button>
        ))}
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)' }}>
        {stateData.n} Umfragen · {institutes.length} Institute · {stateData.cells.length} Zellen mit n ≥ {data.meta.minN}
      </div>

      {/* Heatmap */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          minWidth: 400,
        }}>
          <thead>
            <tr>
              <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 400, color: 'var(--color-muted)', whiteSpace: 'nowrap' }} />
              {parties.map(p => (
                <th key={p} style={{
                  padding: '4px 8px', textAlign: 'center',
                  fontWeight: 500, color: 'var(--color-ink)',
                  fontSize: 10, whiteSpace: 'nowrap',
                }}>
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {institutes.map(inst => (
              <tr key={inst}>
                <td style={{
                  padding: '4px 8px', whiteSpace: 'nowrap',
                  color: 'var(--color-muted)', fontWeight: 400,
                  maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {inst}
                </td>
                {parties.map(party => {
                  const cell = cellMap[`${inst}|${party}`]
                  const bg   = cellBg(cell?.mean)
                  const fg   = cellFg(cell?.mean)
                  return (
                    <td key={party}
                      onMouseEnter={(e) => {
                        if (cell) {
                          setTooltip({ inst, party, ...cell })
                          const r = e.currentTarget.getBoundingClientRect()
                          setTooltipPos({ x: r.left, y: r.bottom })
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        padding: '4px 6px', textAlign: 'center',
                        background: bg, color: fg,
                        borderRadius: 3, cursor: cell ? 'default' : 'default',
                        fontSize: 10, minWidth: 48, height: 28,
                        opacity: cell ? 1 : 0.25,
                      }}>
                      {cell
                        ? `${cell.mean > 0 ? '+' : ''}${cell.mean.toFixed(1)}`
                        : '—'
                      }
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inline Tooltip */}
      {tooltip && (
        <div style={{
          background: 'var(--color-paper)',
          border: '1px solid var(--color-rule)',
          borderRadius: 6, padding: '10px 12px',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          maxWidth: 280,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{tooltip.inst} · {tooltip.party}</div>
          <div style={{ color: 'var(--color-muted)', lineHeight: 1.8 }}>
            <div>vs. andere Institute: <span style={{
              color: tooltip.mean > 0 ? `rgb(${CORAL.join(',')})` : `rgb(${PETROL.join(',')})`,
              fontWeight: 600,
            }}>
              {tooltip.mean > 0 ? '+' : ''}{tooltip.mean.toFixed(1)} PP
            </span></div>
            <div>Standardfehler: ±{tooltip.se.toFixed(2)} PP</div>
            <div>Stichproben: n = {tooltip.n}</div>
          </div>
        </div>
      )}

      {/* Farbskala */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-muted)' }}>
          niedriger als andere
        </span>
        <div style={{
          width: 120, height: 10, borderRadius: 2,
          background: `linear-gradient(to right, rgb(${PETROL.join(',')}), rgb(${PAPER.join(',')}), rgb(${CORAL.join(',')}))`,
        }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-muted)' }}>
          höher als andere
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-muted)', marginLeft: 8, opacity: 0.6 }}>
          max ±{MAX_ABS} PP
        </span>
      </div>
    </div>
  )
}
