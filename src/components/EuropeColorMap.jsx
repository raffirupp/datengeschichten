import layout from '../data/europeTileLayout.js'
import { partyFamilyColor, partyFamilyTextColor } from '../lib/leftRightColor.js'
import MapLegend from './MapLegend.jsx'

const MAX_COL = Math.max(...Object.values(layout).map(([c]) => c))
const MAX_ROW = Math.max(...Object.values(layout).map(([, r]) => r))

export default function EuropeColorMap({ dataForYear, meta, highlightIso3 = null }) {
  const cols = MAX_COL + 1
  const rows = MAX_ROW + 1

  // Build a lookup: "col,row" -> { code, value, bg, fg }
  const cells = {}
  for (const [code, [col, row]] of Object.entries(layout)) {
    const value = dataForYear?.[code]
    const bg = partyFamilyColor(value ?? null)
    const fg = partyFamilyTextColor(value ?? null)
    cells[`${col},${row}`] = { code, value, bg, fg }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: '3px',
        }}
      >
        {Array.from({ length: rows }).map((_, row) =>
          Array.from({ length: cols }).map((_, col) => {
            const cell = cells[`${col},${row}`]
            if (!cell) {
              return <div key={`${col},${row}`} style={{ aspectRatio: '1' }} />
            }
            const isHighlighted = highlightIso3 === cell.code
            const isDimmed = highlightIso3 && !isHighlighted
            return (
              <div
                key={cell.code}
                title={`${cell.code}${cell.value != null ? `: ${cell.value.toFixed(1)}` : ''}`}
                style={{
                  aspectRatio: '1',
                  backgroundColor: cell.bg,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isHighlighted ? '2px solid var(--color-ink)' : '2px solid transparent',
                  opacity: isDimmed ? 0.45 : 1,
                  transform: isHighlighted ? 'scale(1.08)' : 'scale(1)',
                  transition: 'background-color 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.5s ease',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    lineHeight: 1,
                    color: cell.fg,
                    letterSpacing: '-0.01em',
                    userSelect: 'none',
                  }}
                >
                  {cell.code}
                </span>
              </div>
            )
          })
        )}
      </div>

      <MapLegend />
    </div>
  )
}
