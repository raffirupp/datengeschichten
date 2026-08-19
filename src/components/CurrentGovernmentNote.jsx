// Zeigt am Anfang eines Abschnitts kompakt, wer aktuell im Amt ist — Kontext, der beim
// Scrollen durch einzelne Abschnitte sonst verloren geht (jeder Abschnitt kann isoliert
// gelesen werden, ohne erst zu Abschnitt 01 zurückscrollen zu müssen).
export default function CurrentGovernmentNote({ periods }) {
  if (!periods || periods.length === 0) return null

  const sorted = [...periods].sort((a, b) => (a.start < b.start ? -1 : 1))
  const current = sorted.find((p) => p.end == null) ?? sorted.at(-1)
  if (!current) return null

  const since = new Date(current.start + 'T12:00:00Z')
    .toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <p style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      color: 'var(--color-muted)',
      margin: 0,
    }}>
      Aktuell im Amt: <strong style={{ color: 'var(--color-ink)' }}>{current.cabinet}</strong>
      {' '}({current.parties.join(' + ')}) — seit {since}
    </p>
  )
}
