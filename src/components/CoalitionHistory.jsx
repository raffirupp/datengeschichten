// Kompakte Referenzliste aller Regierungsperioden mit Koalitionszusammensetzung —
// steht direkt vor dem Regierung/Opposition-Chart, damit klar ist, welches Kabinett
// welche Parteien umfasste, ohne jede Markierung im Chart einzeln antippen zu müssen.
function formatRange(period) {
  const startYear = period.start.slice(0, 4)
  if (!period.end) return `seit ${startYear}`
  const endYear = period.end.slice(0, 4)
  return startYear === endYear ? startYear : `${startYear}–${endYear}`
}

export default function CoalitionHistory({ periods }) {
  if (!periods || periods.length === 0) return null
  const sorted = [...periods].sort((a, b) => (a.start < b.start ? -1 : 1))

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px 18px',
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      color: 'var(--color-muted)',
      lineHeight: 1.6,
    }}>
      {sorted.map((period) => (
        <span key={period.cabinet}>
          <strong style={{ color: 'var(--color-ink)' }}>{period.cabinet}</strong>
          {' '}({formatRange(period)}): {period.parties.join(' + ')}
        </span>
      ))}
    </div>
  )
}
