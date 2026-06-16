import { Link } from 'react-router-dom'

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="no-underline"
      style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}
    >
      {children}
    </Link>
  )
}

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}>
      <div
        className="px-6 py-3"
        style={{ borderBottom: '1px solid var(--color-rule)' }}
      >
        <nav className="max-w-5xl mx-auto flex items-center gap-5">
          <NavLink to="/">Geschichten</NavLink>
          <NavLink to="/werkstatt">Werkstatt</NavLink>
        </nav>
      </div>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      <footer
        className="px-6 py-6 text-xs"
        style={{
          borderTop: '1px solid var(--color-rule)',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-muted)',
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <span>Quelle: —</span>
          <div className="flex items-center gap-4">
            <NavLink to="/werkstatt">Werkstatt</NavLink>
            <span>datengeschichten.eu</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
