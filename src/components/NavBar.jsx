import { Link } from 'react-router-dom'

export default function NavBar() {
  return (
    <header style={{ backgroundColor: 'var(--color-hero)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '0 1.5rem',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            letterSpacing: '0.06em',
            color: '#FFFFFF',
            textDecoration: 'none',
          }}
        >
          datengeschichten
        </Link>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          {[['/', 'Geschichten'], ['/werkstatt', 'Werkstatt']].map(([to, label]) => (
            <Link
              key={to}
              to={to}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.45)',
                textDecoration: 'none',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
