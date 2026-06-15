import { Link } from 'react-router-dom'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="border-b border-rule px-6 py-5">
        <div className="max-w-5xl mx-auto flex flex-col gap-1">
          <Link
            to="/"
            className="font-display text-2xl font-semibold tracking-tight text-ink hover:text-accent transition-colors no-underline"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            datengeschichten
          </Link>
          <p className="text-sm text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
            Storytelling mit Daten&nbsp;&middot;&nbsp;data stories&nbsp;&middot;&nbsp;histoires de données
          </p>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      <footer className="border-t border-rule px-6 py-6 text-sm text-muted">
        <div className="max-w-5xl mx-auto flex flex-col gap-1">
          <p>Quelle: <span className="text-ink">—</span></p>
          <p>Impressum &middot; Datenschutz</p>
        </div>
      </footer>
    </div>
  )
}
