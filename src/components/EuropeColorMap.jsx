import layout from '../data/europeTileLayout.js'
import { leftRightColor, textColorFor } from '../lib/leftRightColor.js'

const MAX_COL = Math.max(...Object.values(layout).map(([c]) => c))
const MAX_ROW = Math.max(...Object.values(layout).map(([, r]) => r))

export default function EuropeColorMap({ dataForYear, meta }) {
  const cols = MAX_COL + 1
  const rows = MAX_ROW + 1

  // Build a lookup: "col,row" -> { code, value, bg, fg }
  const cells = {}
  for (const [code, [col, row]] of Object.entries(layout)) {
    const value = dataForYear?.[code]
    const bg = leftRightColor(value ?? null, meta)
    const fg = textColorFor(bg)
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
                  transition: 'background-color 0.4s ease',
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

      {/* Legend */}
      <div className="flex flex-col gap-1 max-w-xs">
        <div
          style={{
            height: '8px',
            borderRadius: '4px',
            background: `linear-gradient(to right, #1C5D57, #EDE7D7, #BE5A3C)`,
          }}
        />
        <div
          className="flex justify-between text-xs"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
        >
          <span>links</span>
          <span>Mitte</span>
          <span>rechts</span>
        </div>
      </div>
    </div>
  )
}
