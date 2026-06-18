import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import gdeltData from '../../data/gdelt-signal.json'
import pollData from '../../data/polls-bundestag.json'
import { PEAKS } from '../../data/gdelt-peaks.js'
import { colorsFor } from '../../lib/categoryColors.js'
import { partyColor } from '../../lib/partyColors.js'
import NewsSignalChart from '../../components/NewsSignalChart.jsx'
import PollTrendChart from '../../components/PollTrendChart.jsx'

const catColors = colorsFor('Labor')

// ─── Config ──────────────────────────────────────────────────────────────────
const PARTY_TO_DAWUM = {
  CDU: 'CDU/CSU', CSU: 'CDU/CSU', SPD: 'SPD', GRÜNE: 'Grüne',
  FDP: 'FDP', AfD: 'AfD', LINKE: 'Linke', BSW: 'BSW',
}

// Show CDU/CSU merged; others individually
const DISPLAY_PARTIES = [
  { key: 'CDU/CSU', sources: ['CDU', 'CSU'], dawum: 'CDU/CSU', label: 'CDU/CSU' },
  { key: 'SPD',     sources: ['SPD'],         dawum: 'SPD',     label: 'SPD' },
  { key: 'GRÜNE',   sources: ['GRÜNE'],       dawum: 'Grüne',   label: 'Grüne' },
  { key: 'FDP',     sources: ['FDP'],         dawum: 'FDP',     label: 'FDP' },
  { key: 'AfD',     sources: ['AfD'],         dawum: 'AfD',     label: 'AfD' },
  { key: 'LINKE',   sources: ['LINKE'],       dawum: 'Linke',   label: 'Die Linke' },
  { key: 'BSW',     sources: ['BSW'],         dawum: 'BSW',     label: 'BSW' },
]

// ─── Legislative periods ──────────────────────────────────────────────────────
const LEGISLATUREN = [
  { label: '19. WP 2017–21', id: '19', from: '2017-10-24', to: '2021-12-07', desc: 'GroKo · Merkel IV' },
  { label: '20. WP 2021–25', id: '20', from: '2021-12-08', to: '2025-03-24', desc: 'Ampel · Scholz' },
  { label: '21. WP 2025–',   id: '21', from: '2025-03-25', to: '2099-01-01', desc: 'CDU/CSU + SPD · Merz' },
]

function lpFor(week) {
  for (const lp of LEGISLATUREN) {
    if (week >= lp.from && week <= lp.to) return lp.id
  }
  return null
}

// ─── Merge CDU + CSU points ──────────────────────────────────────────────────
function mergePoints(sources) {
  const allWeeks = new Set()
  for (const src of sources) {
    for (const p of (gdeltData.byParty[src] ?? [])) allWeeks.add(p.week)
  }
  return [...allWeeks].sort().map(week => {
    const vals = sources
      .map(src => (gdeltData.byParty[src] ?? []).find(p => p.week === week))
      .filter(Boolean)
    if (!vals.length) return { week, attentionShare: null, mentions: null }
    const share = vals.reduce((s, p) => s + (p.attentionShare ?? 0), 0)
    const ments = vals.reduce((s, p) => s + (p.mentions ?? 0), 0)
    return { week, attentionShare: share || null, mentions: ments || null }
  })
}

// ─── Components ──────────────────────────────────────────────────────────────
function BewertungBadge({ val }) {
  const colors = {
    bestätigt:  { bg: '#d1fae5', text: '#065f46' },
    plausibel:  { bg: '#dbeafe', text: '#1e40af' },
    korrigiert: { bg: '#fef3c7', text: '#92400e' },
    präzisiert: { bg: '#ede9fe', text: '#5b21b6' },
    unsicher:   { bg: '#fee2e2', text: '#991b1b' },
  }
  const c = colors[val] ?? { bg: 'var(--color-rule)', text: 'var(--color-muted)' }
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      padding: '2px 6px', borderRadius: '4px',
      backgroundColor: c.bg, color: c.text,
    }}>
      {val}
    </span>
  )
}

function EventCard({ peak, color }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        borderLeft: `3px solid ${color}`,
        paddingLeft: '14px',
        cursor: 'pointer',
        paddingTop: '4px', paddingBottom: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)' }}>
          {peak.week}
        </span>
        <BewertungBadge val={peak.bewertung} />
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 16', fontSize: '1rem', fontWeight: 600, color: 'var(--color-ink)', margin: '4px 0 0' }}>
        {peak.title}
      </p>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.65, color: 'var(--color-muted)', margin: 0 }}>
            {peak.text}
          </p>
          {peak.kommentar && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: 1.5, color: 'var(--color-muted)', margin: 0, opacity: 0.8 }}>
              Einschätzung: {peak.kommentar}
            </p>
          )}
          {peak.quellen?.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {peak.quellen.map((url, i) => {
                let domain = url
                try { domain = new URL(url).hostname.replace('www.', '') } catch {}
                return (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', textDecoration: 'underline' }}>
                    {domain}
                  </a>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LPSection({ lp, peaks, color }) {
  if (!peaks.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '0.04em' }}>
          {lp.label}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)' }}>
          {lp.desc}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)' }}>
          {peaks.length} annotierte Peaks
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {peaks.map((peak, i) => <EventCard key={i} peak={peak} color={color} />)}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function NachrichtenSignalStory() {
  const [partyKey, setPartyKey] = useState('CDU/CSU')
  const [selectedPeak, setSelectedPeak] = useState(null)

  const party = DISPLAY_PARTIES.find(p => p.key === partyKey) ?? DISPLAY_PARTIES[0]
  const color = partyColor(party.dawum)

  const points = useMemo(() => mergePoints(party.sources), [party])

  // All peaks for this display party (any of its sources)
  const myPeaks = useMemo(
    () => PEAKS.filter(p => party.sources.includes(p.party)).sort((a, b) => a.week.localeCompare(b.week)),
    [party]
  )

  // Group by legislative period
  const byLP = useMemo(() => {
    const groups = {}
    for (const lp of LEGISLATUREN) groups[lp.id] = []
    for (const peak of myPeaks) {
      const id = lpFor(peak.week)
      if (id) groups[id].push(peak)
    }
    return groups
  }, [myPeaks])

  return (
    <article className="flex flex-col gap-10 max-w-4xl">
      <div>
        <Link to="/" className="no-underline text-sm" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
          ← Zurück
        </Link>
      </div>

      <div className="flex flex-col gap-1.5 p-4" style={{ border: '1.5px dashed var(--color-muted)', borderRadius: '8px' }}>
        <span className="text-xs tracking-[.14em] uppercase" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', fontWeight: 600 }}>
          Experiment · in Arbeit
        </span>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          Kein fertiges Ergebnis — ich schaue, was GDELT über die Medienpräsenz der Parteien erzählt.
          Annotierte Peaks lassen sich anklicken. Nicht alle Ausschläge sind erklärt.
        </p>
      </div>

      <header className="flex flex-col gap-3">
        <span className="text-xs tracking-[.12em] uppercase" style={{ fontFamily: 'var(--font-mono)', color: catColors.text }}>
          Labor · Nachrichten
        </span>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 48',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 600,
          lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--color-ink)', margin: 0,
        }}>
          Was die Medien über die Parteien erzählen
        </h1>
        <p className="text-base leading-relaxed max-w-prose" style={{ color: 'var(--color-muted)' }}>
          GDELT zählt, wie oft eine Partei im freien Netz erwähnt wird. Ich habe die
          Ausschläge annotiert — was steckt dahinter? Wähle eine Partei und klick dich
          durch ihre Mediengeschichte seit 2020.
        </p>
      </header>

      {/* Party tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {DISPLAY_PARTIES.map(p => {
          const c = partyColor(p.dawum)
          const active = p.key === partyKey
          return (
            <button
              key={p.key}
              onClick={() => setPartyKey(p.key)}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: active ? 700 : 400,
                padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                border: `2px solid ${active ? c : 'var(--color-rule)'}`,
                backgroundColor: active ? c + '18' : 'transparent',
                color: active ? c : 'var(--color-muted)',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Signal chart */}
      <section className="flex flex-col gap-3">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            Nachrichten-Signal · {party.label} · 2020–2026
          </span>
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', margin: 0 }}>
          Aufmerksamkeitsanteil der Partei an allen 8 beobachteten Parteien. Farbige Rauten = annotierte Peaks — anklicken.
        </p>
        <NewsSignalChart
          points={points}
          color={color}
          peaks={myPeaks}
          onPeakClick={setSelectedPeak}
        />
      </section>

      {/* Clicked peak detail */}
      {selectedPeak && (
        <div style={{
          padding: '16px', border: `1.5px solid ${color}30`,
          borderLeft: `4px solid ${color}`, borderRadius: '8px',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)' }}>
                {selectedPeak.week}
              </span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 20', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
                {selectedPeak.title}
              </h3>
            </div>
            <button
              onClick={() => setSelectedPeak(null)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.65, color: 'var(--color-muted)', margin: 0 }}>
            {selectedPeak.text}
          </p>
          {selectedPeak.kommentar && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', margin: 0, opacity: 0.75 }}>
              {selectedPeak.kommentar}
            </p>
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <BewertungBadge val={selectedPeak.bewertung} />
            {selectedPeak.quellen?.map((url, i) => {
              let domain = url
              try { domain = new URL(url).hostname.replace('www.', '') } catch {}
              return (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', textDecoration: 'underline' }}>
                  {domain}
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Umfragetrend */}
      <section className="flex flex-col gap-3">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
          Umfragetrend — {party.label}
        </span>
        <PollTrendChart
          polls={pollData.polls}
          trend={pollData.trend}
          parties={[{ key: party.dawum, name: party.label }]}
        />
      </section>

      {/* Deep dive: annotierte Peaks nach Legislaturperiode */}
      {myPeaks.length > 0 && (
        <section className="flex flex-col gap-8">
          <div style={{ borderTop: '1px solid var(--color-rule)', paddingTop: '24px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
              Was steckt hinter den Ausschlägen? · {myPeaks.length} annotierte Events
            </span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', margin: '6px 0 0' }}>
              Klicke auf einen Eintrag für Details und Quellen.
            </p>
          </div>
          {LEGISLATUREN.filter(lp => byLP[lp.id]?.length > 0).map(lp => (
            <LPSection key={lp.id} lp={lp} peaks={byLP[lp.id]} color={color} />
          ))}
        </section>
      )}

      {myPeaks.length === 0 && (
        <div style={{ padding: '24px', border: '1px dashed var(--color-rule)', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-muted)', margin: 0 }}>
            Für {party.label} sind noch keine Peaks annotiert.
          </p>
        </div>
      )}

      <footer className="text-xs pt-4 flex flex-col gap-1" style={{ borderTop: '1px solid var(--color-rule)', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
        <span>Quellen: GDELT Web NGrams 3.0 via BigQuery (Nachrichten, deutschsprachig, 2020–2026); DAWUM/ODbL (Umfragen)</span>
        <span style={{ opacity: 0.7 }}>GDELT crawlt nur frei zugängliche Inhalte. Qualitätsmedien hinter Paywalls fehlen größtenteils.</span>
      </footer>
    </article>
  )
}
