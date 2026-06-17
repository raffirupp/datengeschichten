import { useEffect } from 'react'
import { partyColor } from '../lib/partyColors.js'
import PollTrendChart from './PollTrendChart.jsx'

const PARTY_LABELS = {
  CDU: 'CDU', CSU: 'CSU', SPD: 'SPD',
  GRÜNE: 'Grüne', FDP: 'FDP', AfD: 'AfD',
  LINKE: 'Linke', BSW: 'BSW',
}

function formatWeek(weekStr) {
  const d = new Date(weekStr + 'T12:00:00Z')
  return d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
}

export default function PeakPanel({ peak, polls, trend, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!peak) return null

  const color = partyColor(peak.dawumParty)
  const peakDate = new Date(peak.week + 'T12:00:00Z')
  const rangeStart = new Date(peakDate)
  rangeStart.setMonth(rangeStart.getMonth() - 4)
  const rangeEnd = new Date(peakDate)
  rangeEnd.setMonth(rangeEnd.getMonth() + 4)

  const dawumParties = peak.party === 'CDU' || peak.party === 'CSU'
    ? [{ key: 'CDU/CSU', name: 'CDU/CSU' }]
    : [{ key: peak.dawumParty, name: PARTY_LABELS[peak.party] }]

  const filteredTrend = trend.filter(d => {
    const date = new Date(d.date + 'T12:00:00Z')
    return date >= rangeStart && date <= rangeEnd
  })
  const filteredPolls = polls.filter(p => {
    const date = new Date(p.date + 'T12:00:00Z')
    return date >= rangeStart && date <= rangeEnd
  })

  const hasData = filteredTrend.length > 1

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.25rem',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-paper)',
          border: '1px solid var(--color-rule)',
          borderRadius: '14px',
          maxWidth: '780px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{
                width: '12px', height: '12px', borderRadius: '50%',
                backgroundColor: color, flexShrink: 0, display: 'inline-block',
              }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '12px',
                color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                {PARTY_LABELS[peak.party]} · {formatWeek(peak.week)}
              </span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontVariationSettings: '"opsz" 28',
              fontSize: '1.5rem', fontWeight: 600,
              color: 'var(--color-ink)', margin: 0, lineHeight: 1.2,
            }}>
              {peak.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--color-rule)',
              borderRadius: '6px', cursor: 'pointer',
              color: 'var(--color-muted)', fontSize: '1rem',
              lineHeight: 1, padding: '0.3rem 0.6rem', flexShrink: 0,
              fontFamily: 'var(--font-mono)',
            }}
            aria-label="Schließen"
          >
            esc
          </button>
        </div>

        {/* Trennlinie */}
        <div style={{ borderTop: '1px solid var(--color-rule)' }} />

        {/* Erklärtext */}
        <p style={{
          color: 'var(--color-ink)', fontSize: '1.05rem',
          lineHeight: 1.7, margin: 0,
        }}>
          {peak.text}
        </p>

        {/* DAWUM-Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px',
              color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Umfragetrend {PARTY_LABELS[peak.party]} · ±4 Monate um das Ereignis
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px',
              color: 'var(--color-muted)',
            }}>
              Gestrichelter Strich = Zeitpunkt des Peaks in der Nachrichtenberichterstattung
            </span>
          </div>

          {hasData ? (
            <PollTrendChart
              polls={filteredPolls}
              trend={filteredTrend}
              parties={dawumParties}
              markerDate={peak.week}
            />
          ) : (
            <div style={{
              padding: '1.5rem',
              border: '1px dashed var(--color-rule)',
              borderRadius: '8px',
              display: 'flex', flexDirection: 'column', gap: '0.4rem',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-muted)' }}>
                Keine DAWUM-Umfragedaten für diesen Zeitraum verfügbar.
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', opacity: 0.7 }}>
                DAWUM-Daten beginnen ab Mitte 2019. Dieses Ereignis liegt außerhalb des erfassten Zeitraums.
              </span>
            </div>
          )}
        </div>

        {/* Quellenlinks */}
        {peak.quellen?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Belege
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {peak.quellen.map((url, i) => {
                const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
                return (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{
                    fontFamily: 'var(--font-mono)', fontSize: '11px',
                    color: 'var(--color-muted)', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}>
                    <span style={{ opacity: 0.5 }}>↗</span>
                    <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--color-rule)' }}>{domain}</span>
                  </a>
                )
              })}
            </div>
            {peak.bewertung && peak.bewertung !== 'bestätigt' && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', opacity: 0.7 }}>
                Bewertung: {peak.bewertung}{peak.sicherheit === 'niedrig' ? ' · Sicherheit niedrig' : ''}
                {peak.kommentar ? ` — ${peak.kommentar}` : ''}
              </span>
            )}
          </div>
        )}

        {/* Methodischer Hinweis */}
        <div style={{
          padding: '0.9rem 1rem',
          backgroundColor: 'var(--color-rule)',
          borderRadius: '8px',
          display: 'flex', flexDirection: 'column', gap: '0.3rem',
          opacity: 0.9,
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Methodischer Hinweis
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.55 }}>
            Der Nachrichtenanteil ist relativ: Er misst den Anteil der Partei an allen acht beobachteten Parteien — kein absolutes Maß. Ein Peak bedeutet mehr Aufmerksamkeit als sonst, nicht mehr Nachrichten insgesamt. Ob und wie sich Medienpräsenz auf Umfragewerte auswirkt, ist hier nicht gemessen.
          </span>
        </div>
      </div>
    </div>
  )
}
