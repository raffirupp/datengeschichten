import { Link } from 'react-router-dom'
import werkstatt from '../data/werkstatt.js'

function Label({ children }) {
  return (
    <span
      className="text-xs tracking-[.12em] uppercase"
      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
    >
      {children}
    </span>
  )
}

function Entry({ entry }) {
  return (
    <section className="flex flex-col gap-4 py-8" style={{ borderTop: '1px solid var(--color-rule)' }}>
      <div className="flex flex-col gap-2">
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontVariationSettings: '"opsz" 32',
            fontSize: '1.6rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          {entry.title}
        </h2>
        {entry.storyKey && (
          <Link
            to={`/story/${entry.storyKey}`}
            className="text-sm no-underline"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}
          >
            → Zur Geschichte
          </Link>
        )}
        <p className="text-base leading-relaxed max-w-prose" style={{ color: 'var(--color-muted)' }}>
          {entry.summary}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Quellen</Label>
        <ul className="flex flex-col gap-1">
          {entry.sources.map((source) => (
            <li key={source.name} className="text-sm">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-ink)' }}
              >
                {source.name}
              </a>
              <span style={{ color: 'var(--color-muted)' }}> — {source.license}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <Label>So entstehen die Daten</Label>
        <ol className="flex flex-col gap-1.5 list-decimal pl-5">
          {entry.steps.map((step, i) => (
            <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--color-ink)' }}>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div
        className="flex flex-col gap-2 pl-4"
        style={{ borderLeft: '2px solid var(--color-accent)' }}
      >
        <Label>Entscheidungen &amp; Vorbehalte</Label>
        <ul className="flex flex-col gap-1.5">
          {entry.caveats.map((caveat, i) => (
            <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {caveat}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default function WerkstattPage() {
  return (
    <div className="flex flex-col gap-2 max-w-3xl">
      <header className="flex flex-col gap-2">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontVariationSettings: '"opsz" 48',
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          Werkstatt
        </h1>
        <p className="text-base leading-relaxed max-w-prose" style={{ color: 'var(--color-muted)' }}>
          Was hinter den Geschichten steckt: woher die Daten kommen, wie wir sie verarbeitet haben
          — und wo wir Entscheidungen getroffen haben, die man auch anders hätte treffen können.
        </p>
      </header>

      {werkstatt.map((entry) => (
        <Entry key={entry.id} entry={entry} />
      ))}
    </div>
  )
}
