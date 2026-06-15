export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}>
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
          <span>datengeschichten.eu</span>
        </div>
      </footer>
    </div>
  )
}
