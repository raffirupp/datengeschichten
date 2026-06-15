import { partyColor } from '../lib/partyColors.js'

export default function PollSnapshot({ trend, parties }) {
  // Last trend point
  const last = trend[trend.length - 1]
  if (!last) return null

  const items = parties
    .map(({ key, name }) => ({ key, name, value: last.values[key] }))
    .filter(d => d.value != null)
    .sort((a, b) => b.value - a.value)

  const maxVal = items[0]?.value ?? 1

  return (
    <div className="flex flex-col gap-2">
      {items.map(({ key, value }) => (
        <div key={key} style={{ display: 'grid', gridTemplateColumns: '72px 1fr 40px', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: partyColor(key),
              fontWeight: 600,
              textAlign: 'right',
            }}
          >
            {key}
          </span>
          <div style={{ position: 'relative', height: '10px', backgroundColor: 'var(--color-rule)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                left: 0, top: 0, bottom: 0,
                width: `${(value / maxVal) * 100}%`,
                backgroundColor: partyColor(key),
                borderRadius: '3px',
              }}
            />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-ink)',
              fontWeight: 600,
            }}
          >
            {value.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}
