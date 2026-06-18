import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import data from '../../data/fr-ge.json'
import { colorsFor } from '../../lib/categoryColors.js'
import { DE_COLOR, FR_COLOR } from '../../lib/frGeUtils.js'

const catColors = colorsFor('Frankreich & Deutschland im Vergleich')
const { indicators } = data.stories.leben
const LAST = 2024

function val(indicator, country) {
  return indicators[indicator][country][String(LAST)]
}

// ── Glyph 1: Lebensband ────────────────────────────────────────────────────
function Lebensband({ value, color }) {
  const MIN = 70
  const MAX = 85
  const pct = ((value - MIN) / (MAX - MIN)) * 100
  return (
    <svg viewBox="0 0 200 36" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 200 }} aria-hidden="true">
      {/* axis */}
      <line x1="0" y1="28" x2="200" y2="28" stroke="#D8D2C4" strokeWidth="1" />
      <text x="0" y="35" style={{ fontSize: 7, fontFamily: 'var(--font-mono)', fill: '#6B6658' }}>70</text>
      <text x="190" y="35" textAnchor="end" style={{ fontSize: 7, fontFamily: 'var(--font-mono)', fill: '#6B6658' }}>85</text>
      {/* band */}
      <rect x="0" y="18" width={`${pct}%`} height="8" rx="2" fill={color} />
      {/* value label */}
      <text x={`${Math.min(pct, 92)}%`} y="13" style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: color, fontWeight: 600 }}>
        {value.toFixed(1)} J.
      </text>
    </svg>
  )
}

// ── Glyph 2: Zigarette ────────────────────────────────────────────────────
function Zigarette({ value, color }) {
  // Zigarette = 200px gesamt. Abgebrannter Teil (Asche+Glut) ∝ value%
  const W = 200
  const burnedW = Math.round((value / 100) * W)
  const tipR = 4
  return (
    <svg viewBox={`0 0 ${W + 10} 24`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 210 }} aria-hidden="true">
      {/* Filter (weißer Körper) */}
      <rect x={burnedW} y="8" width={W - burnedW - tipR} height="8" rx="1" fill="#E8E4D8" stroke="#D8D2C4" strokeWidth="0.8" />
      {/* Abgebrannter Teil (Asche) */}
      {burnedW > tipR && (
        <rect x={tipR} y="9" width={burnedW - tipR} height="6" rx="1" fill="#9A9286" />
      )}
      {/* Glühende Spitze */}
      <circle cx={tipR} cy="12" r={tipR} fill={color} />
      {/* Rauch-Andeutung */}
      <path d={`M${tipR} 6 Q${tipR - 2} 2 ${tipR + 1} 0`} stroke="#D8D2C4" strokeWidth="0.8" fill="none" />
      {/* Wert */}
      <text x={W + 6} y="15" style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: color, fontWeight: 600 }}>
        {value.toFixed(0)}%
      </text>
    </svg>
  )
}

// ── Glyph 3: Punktraster ────────────────────────────────────────────────────
function Punktraster({ value, color }) {
  const filled = Math.round(value)
  const dots = Array.from({ length: 100 }, (_, i) => i < filled)
  const COLS = 10
  const R = 5
  const GAP = 12
  return (
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style={{ width: 120, height: 120 }} aria-hidden="true">
      {dots.map((isFilled, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        return (
          <circle
            key={i}
            cx={col * GAP + R + 1}
            cy={row * GAP + R + 1}
            r={R}
            fill={isFilled ? color : '#E8E4D8'}
          />
        )
      })}
      <text x="60" y="115" textAnchor="middle" style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: color, fontWeight: 600 }}>
        {value.toFixed(0)} von 100
      </text>
    </svg>
  )
}

// ── Glyph 4: Glas ────────────────────────────────────────────────────────
// DE = Bierglas-Form, FR = Weinglas-Form
function Glas({ value, isDE, color }) {
  const MAX = 13
  const fillPct = value / MAX
  const H = 60 // Innenhöhe
  const filledH = Math.round(fillPct * H)
  const label = isDE ? 'Bierglas' : 'Weinglas'

  if (isDE) {
    // Rechteckiges Bierglas
    return (
      <svg viewBox="0 0 52 90" xmlns="http://www.w3.org/2000/svg" style={{ width: 52, height: 90 }} aria-label={`${label}: ${value.toFixed(1)} L`}>
        {/* Glas-Körper */}
        <rect x="6" y="14" width="36" height="62" rx="2" fill="none" stroke="#D8D2C4" strokeWidth="1.5" />
        {/* Henkel */}
        <path d="M42 24 Q54 24 54 38 Q54 52 42 52" fill="none" stroke="#D8D2C4" strokeWidth="1.5" />
        {/* Füllung */}
        <rect x="7" y={14 + (H - filledH) + 2} width="34" height={filledH} fill={color} opacity="0.75" />
        {/* Wert */}
        <text x="24" y="86" textAnchor="middle" style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: color, fontWeight: 600 }}>{value.toFixed(1)} L</text>
      </svg>
    )
  }

  // Weinglas (Kelch-Form)
  return (
    <svg viewBox="0 0 52 90" xmlns="http://www.w3.org/2000/svg" style={{ width: 52, height: 90 }} aria-label={`${label}: ${value.toFixed(1)} L`}>
      {/* Kelch-Außen */}
      <path d="M8 6 L10 52 Q14 62 26 64 Q38 62 42 52 L44 6 Z" fill="none" stroke="#D8D2C4" strokeWidth="1.5" />
      {/* Stiel + Fuß */}
      <line x1="26" y1="64" x2="26" y2="80" stroke="#D8D2C4" strokeWidth="1.5" />
      <line x1="12" y1="80" x2="40" y2="80" stroke="#D8D2C4" strokeWidth="1.5" />
      {/* Füllung (Clip: rechteck, approximiert Kelch) */}
      <clipPath id={`wineclip-${isDE ? 'de' : 'fr'}`}>
        <path d="M9 6 L11 52 Q15 62 26 64 Q37 62 41 52 L43 6 Z" />
      </clipPath>
      <rect
        x="9" y={6 + (H - filledH)}
        width="34" height={filledH + 30}
        fill={color} opacity="0.7"
        clipPath={`url(#wineclip-${isDE ? 'de' : 'fr'})`}
      />
      <text x="26" y="88" textAnchor="middle" style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: color, fontWeight: 600 }}>{value.toFixed(1)} L</text>
    </svg>
  )
}

// ── Scroll-reveal row ────────────────────────────────────────────────────────
function RevealRow({ delay = 0, children }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect() } },
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── Mirror row ────────────────────────────────────────────────────────────────
function MirrorRow({ label, note, frGlyph, deGlyph }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6B6658', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: FR_COLOR, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Frankreich</span>
          {frGlyph}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: DE_COLOR, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Deutschland</span>
          {deGlyph}
        </div>
      </div>
      {note && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6B6658', margin: 0, lineHeight: 1.5 }}>
          {note}
        </p>
      )}
    </div>
  )
}

// ── Methodik ──────────────────────────────────────────────────────────────────
function Methodik() {
  const [open, setOpen] = useState(false)
  const notes = Object.values(indicators)
    .map(ind => ind.note)
    .filter(Boolean)

  return (
    <div style={{ borderTop: '1px solid #D8D2C4', paddingTop: '1rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B6658',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
        }}
      >
        <span style={{ fontSize: '10px' }}>{open ? '▾' : '▸'}</span>
        Methodik & Grenzen
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
          {notes.map((n, i) => (
            <p key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6B6658', margin: 0, lineHeight: 1.6 }}>
              — {n}
            </p>
          ))}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6B6658', margin: 0, lineHeight: 1.6 }}>
            — {data.meta.verified}
          </p>
        </div>
      )}
    </div>
  )
}

export default function VergleichLebenStory() {
  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '720px' }}>
      <div>
        <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#6B6658', textDecoration: 'none' }}>
          ← Zurück
        </Link>
      </div>

      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: catColors.text }}>
          Vergleich · Leben
        </span>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 48',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 600,
          lineHeight: 1.1, letterSpacing: '-0.02em', color: '#17150F', margin: 0,
        }}>
          Zwei Arten zu leben
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#6B6658', margin: 0, maxWidth: '60ch' }}>
          Frankreich raucht mehr, Deutschland hat häufiger Übergewicht — und trotzdem leben die
          Nachbarn länger. Vier Kennzahlen für 2024, die gängige Annahmen infrage stellen.
        </p>
      </header>

      {/* Legende */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: FR_COLOR, display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B6658' }}>Frankreich</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: DE_COLOR, display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B6658' }}>Deutschland</span>
        </div>
      </div>

      {/* Die vier Glyphen */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

        <RevealRow delay={0}>
          <MirrorRow
            label="Lebenserwartung (Jahre, 2024)"
            note={indicators.lebenserwartung.note}
            frGlyph={<Lebensband value={val('lebenserwartung', 'FR')} color={FR_COLOR} />}
            deGlyph={<Lebensband value={val('lebenserwartung', 'DE')} color={DE_COLOR} />}
          />
        </RevealRow>

        <RevealRow delay={100}>
          <MirrorRow
            label="Raucheranteil (% der Erwachsenen, 2024)"
            note={indicators.rauchen.note}
            frGlyph={<Zigarette value={val('rauchen', 'FR')} color={FR_COLOR} />}
            deGlyph={<Zigarette value={val('rauchen', 'DE')} color={DE_COLOR} />}
          />
        </RevealRow>

        <RevealRow delay={200}>
          <MirrorRow
            label="Adipositas (% der Erwachsenen, selbstberichtet, 2024) — je Punkt = 1 %"
            note={indicators.uebergewicht.note}
            frGlyph={<Punktraster value={val('uebergewicht', 'FR')} color={FR_COLOR} />}
            deGlyph={<Punktraster value={val('uebergewicht', 'DE')} color={DE_COLOR} />}
          />
        </RevealRow>

        <RevealRow delay={300}>
          <MirrorRow
            label="Alkohol pro Kopf (Liter reiner Alkohol/Jahr, 2024) — Skala 0–13 L"
            note={indicators.alkohol.note}
            frGlyph={<Glas value={val('alkohol', 'FR')} isDE={false} color={FR_COLOR} />}
            deGlyph={<Glas value={val('alkohol', 'DE')} isDE={true} color={DE_COLOR} />}
          />
        </RevealRow>

      </div>

      <footer style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #D8D2C4', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B6658' }}>
        <span>Quelle: {data.meta.source}</span>
        <span style={{ opacity: 0.7 }}>Werte für {LAST}. {data.meta.forecastNote}</span>
      </footer>

      <Methodik />
    </article>
  )
}
