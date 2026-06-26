import { Link } from 'react-router-dom'
import stories from '../data/stories/index.js'
import categoryMap, { colorsFor } from '../lib/categoryColors.js'
import NavBar from '../components/NavBar.jsx'
import StoryCard from '../components/StoryCard.jsx'

function groupByCategory(items) {
  const order = Object.keys(categoryMap)
  const groups = new Map()
  for (const item of items) {
    if (!groups.has(item.category)) groups.set(item.category, [])
    groups.get(item.category).push(item)
  }
  return [...groups.entries()].sort(
    (a, b) => order.indexOf(a[0]) - order.indexOf(b[0])
  )
}

export default function Gallery() {
  const featured = stories.find((s) => s.featured)
  const rest = stories.filter((s) => !s.featured)
  const groups = groupByCategory(rest)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', color: 'var(--color-ink)' }}>
      <NavBar />

      {/* Dark hero section */}
      <div style={{ backgroundColor: 'var(--color-hero)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '4.5rem 1.5rem 5rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontVariationSettings: '"opsz" 72',
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1.0,
            letterSpacing: '-0.04em',
            margin: 0,
          }}>
            Karten.<br />
            Diagramme.<br />
            Datengeschichten.
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.38)',
            marginTop: '2rem',
            maxWidth: '44ch',
            lineHeight: 1.7,
          }}>
            Ich versuche gerne Dinge mit Daten — Politik, Meinungsforschung, Europa.
          </p>
        </div>
      </div>

      {/* Content area */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3.5rem 1.5rem 5rem' }}>

        {/* Featured story */}
        {featured && (
          <div style={{ marginBottom: '4rem' }}>
            <StoryCard story={featured} variant="lead" />
          </div>
        )}

        {/* Category groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          {groups.map(([category, items]) => {
            const colors = colorsFor(category)
            return (
              <div key={category}>
                {/* Section header */}
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid #EEEEEE' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '4px',
                      height: '1.75rem',
                      borderRadius: '2px',
                      backgroundColor: colors.color,
                      flexShrink: 0,
                    }} />
                    <div>
                      <p style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: colors.text,
                        margin: '0 0 0.2rem',
                      }}>
                        {items.length} {items.length === 1 ? 'Geschichte' : 'Geschichten'}
                      </p>
                      <h2 style={{
                        fontFamily: 'var(--font-display)',
                        fontVariationSettings: '"opsz" 24',
                        fontSize: '1.35rem',
                        fontWeight: 600,
                        color: 'var(--color-ink)',
                        letterSpacing: '-0.02em',
                        margin: 0,
                        lineHeight: 1.2,
                      }}>
                        {category}
                      </h2>
                    </div>
                  </div>
                </div>
                {/* Cards grid — max 2 columns */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.25rem',
                }}>
                  {items.map((story) => (
                    <StoryCard key={story.key} story={story} variant="small" />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* About section */}
        <div style={{ marginTop: '5rem', paddingTop: '2.5rem', borderTop: '1px solid #EEEEEE' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '52ch' }}>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.75, color: 'var(--color-muted)', margin: 0 }}>
              Hi, ich bin Raffael — ich versuche gerne Dinge mit Daten. Alles hier sind Experimente:
              Ich versuche etwas herauszufinden, lerne dabei und hoffe, dass am Ende eine Geschichte
              steht, aus der wir beide etwas mitnehmen.
            </p>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.75, color: 'var(--color-muted)', margin: 0 }}>
              Wenn du die Arbeit unterstützen möchtest:{' '}
              <a
                href="https://ko-fi.com/wer_wird_diplomatin"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-ink)', textDecoration: 'underline' }}
              >
                ko-fi.com/wer_wird_diplomatin
              </a>
            </p>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.75, color: 'var(--color-muted)', margin: 0 }}>
              Anfragen zur Zusammenarbeit — freiberuflich für Daten- und KI-Projekte — gerne per Mail.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'var(--color-hero)',
        padding: '1.25rem 1.5rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.28)',
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>datengeschichten.eu · © 2026</span>
          <Link to="/werkstatt" style={{ color: 'rgba(255,255,255,0.28)', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Werkstatt
          </Link>
        </div>
      </footer>
    </div>
  )
}
