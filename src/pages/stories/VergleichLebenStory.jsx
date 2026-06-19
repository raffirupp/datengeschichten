import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { scaleLinear } from 'd3-scale'
import data from '../../data/fr-ge.json'
import { colorsFor } from '../../lib/categoryColors.js'
import {
  DE_COLOR, DE_DARK, DE_FILL,
  FR_COLOR, FR_DARK, FR_FILL,
  RULE_SOFT, AXIS_MUTED, LABEL_MUTED, INK, RULE, MUTED,
  fmtDe,
} from '../../lib/frGeUtils.js'

const catColors = colorsFor('Frankreich & Deutschland im Vergleich')
const { indicators } = data.stories.leben
const LAST = 2024

function v(key, country) {
  return indicators[key][country][String(LAST)]
}

// ── Scroll-Reveal ──────────────────────────────────────────────────────────
function Reveal({ delay = 0, children }) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect() } }, { threshold: 0.15 })
    io.observe(el); return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(10px)',
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

// ── Held: Lebenserwartung als horizontale Balken ───────────────────────────
const LE_MIN = 70
const LE_MAX = 85
const LE_W = 440  // px Balken-Breite (SVG-Einheiten)

function LebenserwartungChart() {
  const fr = v('lebenserwartung', 'FR')  // 82.95
  const de = v('lebenserwartung', 'DE')  // 80.6
  const xSc = scaleLinear().domain([LE_MIN, LE_MAX]).range([0, LE_W])

  const W = 560
  const H = 110
  const PL = 80  // Platz für Länderlabel links

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="Lebenserwartung Frankreich und Deutschland 2024" style={{ overflow: 'visible' }}>
      <g transform={`translate(${PL},0)`}>
        {/* Achse */}
        <line x1={0} y1={78} x2={LE_W} y2={78} stroke={RULE_SOFT} strokeWidth="1" />
        {[70, 75, 80, 85].map(t => (
          <g key={t}>
            <line x1={xSc(t)} y1={74} x2={xSc(t)} y2={80} stroke={RULE_SOFT} strokeWidth="1" />
            <text x={xSc(t)} y={90} textAnchor="middle"
              style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
              {t}
            </text>
          </g>
        ))}
        <text x={LE_W / 2} y={104} textAnchor="middle"
          style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
          Jahre
        </text>

        {/* FR Balken */}
        <text x={-8} y={22} textAnchor="end"
          style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: FR_DARK, fontWeight: 600 }}>
          Frankreich
        </text>
        <rect x={0} y={10} width={xSc(fr)} height={16} rx="3" fill={FR_FILL} opacity="0.9" />
        <rect x={xSc(fr) - 2} y={10} width={2} height={16} rx="1" fill={FR_COLOR} />
        <circle cx={xSc(fr)} cy={18} r="5" fill={FR_COLOR} />
        <text x={xSc(fr) + 10} y={23}
          style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, fill: FR_DARK }}>
          {fmtDe(fr)} J.
        </text>

        {/* DE Balken */}
        <text x={-8} y={58} textAnchor="end"
          style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: DE_DARK, fontWeight: 600 }}>
          Deutschland
        </text>
        <rect x={0} y={46} width={xSc(de)} height={16} rx="3" fill={DE_FILL} opacity="0.9" />
        <rect x={xSc(de) - 2} y={46} width={2} height={16} rx="1" fill={DE_COLOR} />
        <circle cx={xSc(de)} cy={54} r="5" fill={DE_COLOR} />
        <text x={xSc(de) + 10} y={59}
          style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, fill: DE_DARK }}>
          {fmtDe(de)} J.
        </text>
      </g>
    </svg>
  )
}

// ── Dumbbell Row ───────────────────────────────────────────────────────────
function DumbbellRow({ label, unit, frVal, deVal, domainMax, note }) {
  const W = 540
  const PL = 80
  const BAR_W = W - PL - 60
  const xSc = scaleLinear().domain([0, domainMax]).range([0, BAR_W])
  const frX = xSc(frVal)
  const deX = xSc(deVal)
  const midX = (frX + deX) / 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: LABEL_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </span>
      <svg viewBox={`0 0 ${W} 52`} width="100%" role="img" aria-label={`${label}: Frankreich ${frVal}, Deutschland ${deVal}`} style={{ overflow: 'visible' }}>
        <g transform={`translate(${PL},0)`}>
          {/* Achse */}
          <line x1={0} y1={28} x2={BAR_W} y2={28} stroke={RULE_SOFT} strokeWidth="0.8" />
          {[0, domainMax / 2, domainMax].map(t => (
            <text key={t} x={xSc(t)} y={42} textAnchor="middle"
              style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
              {t}
            </text>
          ))}
          <text x={BAR_W + 4} y={42}
            style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: AXIS_MUTED }}>
            {unit}
          </text>

          {/* Verbindungslinie */}
          <line x1={Math.min(frX, deX)} y1={22} x2={Math.max(frX, deX)} y2={22}
            stroke={RULE_SOFT} strokeWidth="1.5" />

          {/* FR Punkt */}
          <circle cx={frX} cy={22} r="6.5" fill={FR_COLOR} />
          <text x={frX} y={26} textAnchor="middle"
            style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: 'white', fontWeight: 700 }}>
            FR
          </text>
          <text x={frX} y={12} textAnchor="middle"
            style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, fill: FR_DARK }}>
            {fmtDe(frVal)}
          </text>

          {/* DE Punkt */}
          <circle cx={deX} cy={22} r="6.5" fill={DE_COLOR} />
          <text x={deX} y={26} textAnchor="middle"
            style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fill: 'white', fontWeight: 700 }}>
            DE
          </text>
          <text x={deX} y={12} textAnchor="middle"
            style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, fill: DE_DARK }}>
            {fmtDe(deVal)}
          </text>
        </g>
      </svg>
      {note && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', color: AXIS_MUTED, margin: 0, lineHeight: 1.6 }}>
          {note}
        </p>
      )}
    </div>
  )
}

// ── Methodik ─────────────────────────────────────────────────────────────
function Methodik() {
  const [open, setOpen] = useState(false)
  const notes = [
    indicators.rauchen.note,
    indicators.uebergewicht.note,
    indicators.alkohol.note,
    data.meta.verified,
  ]
  return (
    <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: '1rem' }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', color: MUTED, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '10px' }}>{open ? '▾' : '▸'}</span>
        Methodik & Grenzen
      </button>
      {open && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {notes.map((n, i) => (
            <p key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: MUTED, margin: 0, lineHeight: 1.6 }}>— {n}</p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VergleichLebenStory() {
  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '720px' }}>
      <div>
        <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: MUTED, textDecoration: 'none' }}>
          ← Zurück
        </Link>
      </div>

      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: catColors.text }}>
          Vergleich · Leben
        </span>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontVariationSettings: '"opsz" 48',
          fontSize: 'clamp(1.9rem, 4.5vw, 2.75rem)',
          fontWeight: 400,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: INK,
          margin: 0,
        }}>
          Zwei Arten zu <strong style={{ fontWeight: 700 }}>leben</strong>
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, color: MUTED, margin: 0, maxWidth: '62ch' }}>
          Frankreich raucht mehr, Deutschland ist häufiger übergewichtig — und trotzdem
          leben die Nachbarn länger. Vier Kennzahlen für 2024.
        </p>
      </header>

      {/* ── Held: Lebenserwartung ── */}
      <Reveal delay={0}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: LABEL_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Lebenserwartung (Jahre, 2024) · Achse 70–85
          </span>
          <LebenserwartungChart />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', color: AXIS_MUTED, margin: 0, lineHeight: 1.6 }}>
            {indicators.lebenserwartung.note}
          </p>
        </div>
      </Reveal>

      {/* ── Trennlinie ── */}
      <div style={{ borderTop: `1px solid ${RULE}` }} />

      {/* ── Risikofaktoren als Dumbbell ── */}
      <Reveal delay={80}>
        <DumbbellRow
          label="Raucheranteil (% der Erwachsenen)"
          unit="%"
          frVal={v('rauchen', 'FR')}
          deVal={v('rauchen', 'DE')}
          domainMax={40}
          note={indicators.rauchen.note}
        />
      </Reveal>

      <Reveal delay={160}>
        <DumbbellRow
          label="Adipositas, selbstberichtet (% der Erwachsenen)"
          unit="%"
          frVal={v('uebergewicht', 'FR')}
          deVal={v('uebergewicht', 'DE')}
          domainMax={25}
          note={indicators.uebergewicht.note}
        />
      </Reveal>

      <Reveal delay={240}>
        <DumbbellRow
          label="Alkohol pro Kopf (Liter reiner Alkohol/Jahr)"
          unit="L"
          frVal={v('alkohol', 'FR')}
          deVal={v('alkohol', 'DE')}
          domainMax={14}
          note={indicators.alkohol.note}
        />
      </Reveal>

      {/* ── Paradox-Hinweis ── */}
      <Reveal delay={300}>
        <div style={{ padding: '0.85rem 1rem', border: `1px dashed ${RULE}`, borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: LABEL_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Das Paradox</span>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: MUTED, margin: 0, lineHeight: 1.65 }}>
            Frankreich raucht deutlich mehr und trinkt ähnlich viel — lebt aber trotzdem länger.
            Mögliche Erklärungen: Ernährungsgewohnheiten (Mittelmeer-nahe Kost), Gesundheitsversorgung
            und Vorsorgekultur. Die Daten zeigen eine Korrelation, keine Kausalität.
          </p>
        </div>
      </Reveal>

      <footer style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '1rem', borderTop: `1px solid ${RULE}`, fontFamily: 'var(--font-mono)', fontSize: '11px', color: MUTED }}>
        <span>Quelle: {data.meta.source}</span>
        <span style={{ opacity: 0.7 }}>Werte für {LAST}. {data.meta.forecastNote}</span>
      </footer>

      <Methodik />
    </article>
  )
}
