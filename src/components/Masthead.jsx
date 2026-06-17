import { Link } from 'react-router-dom'

const now = new Date()
const monthYear = now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

export default function Masthead() {
  return (
    <header className="mb-10">
      <div className="flex items-baseline justify-between mb-4">
        <span
          className="text-xs tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
        >
          laufend aktualisiert
        </span>
        <span
          className="text-xs"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
        >
          {monthYear}
        </span>
      </div>

      <Link
        to="/"
        className="no-underline block"
      >
        <h1
          className="leading-none mb-2"
          style={{
            fontFamily: 'var(--font-display)',
            fontVariationSettings: '"opsz" 72',
            fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: 'var(--color-ink)',
            lineHeight: 1.05,
          }}
        >
          datengeschichten
        </h1>
      </Link>

      <p
        className="mb-5 text-sm"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
      >
        Karten, Diagramme, Experimente — wir basteln an Geschichten aus Daten.
      </p>

      <div className="flex h-1 rounded-sm overflow-hidden gap-px">
        <div className="flex-[2]" style={{ backgroundColor: 'var(--color-accent)' }} />
        <div className="flex-1" style={{ backgroundColor: 'var(--color-accentWarm)' }} />
        <div className="flex-1" style={{ backgroundColor: 'var(--color-accentGold)' }} />
      </div>
    </header>
  )
}
