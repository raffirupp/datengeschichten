import { Link } from 'react-router-dom'
import NavBar from './NavBar.jsx'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF', color: 'var(--color-ink)' }}>
      <NavBar />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          {children}
        </div>
      </main>

      <footer
        className="px-4 py-5 text-xs sm:px-6"
        style={{
          backgroundColor: 'var(--color-hero)',
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255,255,255,0.3)',
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <span>datengeschichten.eu · © 2026</span>
          <Link
            to="/werkstatt"
            style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Werkstatt
          </Link>
        </div>
      </footer>
    </div>
  )
}
