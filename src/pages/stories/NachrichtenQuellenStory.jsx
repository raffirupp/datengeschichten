import { useState } from 'react'
import { Link } from 'react-router-dom'
import sourcesData from '../../data/gdelt-sources.json'
import { colorsFor } from '../../lib/categoryColors.js'
import { partyColor } from '../../lib/partyColors.js'

const catColors = colorsFor('Labor')

const PARTY_LABELS = {
  AfD: 'AfD', SPD: 'SPD', CDU: 'CDU', CSU: 'CSU',
  FDP: 'FDP', BSW: 'BSW', GRÜNE: 'Grüne', LINKE: 'Linke',
}
const DAWUM_KEY = {
  AfD: 'AfD', SPD: 'SPD', CDU: 'CDU/CSU', CSU: 'CDU/CSU',
  FDP: 'FDP', BSW: 'BSW', GRÜNE: 'Grüne', LINKE: 'Linke',
}
const PARTIES = sourcesData.meta.parties

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: '12px',
        padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer',
        border: '1px solid var(--color-rule)',
        backgroundColor: active ? 'var(--color-ink)' : 'transparent',
        color: active ? 'var(--color-paper)' : 'var(--color-muted)',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function IppenNote() {
  return (
    <div style={{
      padding: '0.85rem 1rem',
      border: '1px dashed var(--color-rule)',
      borderRadius: '8px',
      display: 'flex', flexDirection: 'column', gap: '0.25rem',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Methodischer Hinweis
      </span>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', margin: 0, lineHeight: 1.6 }}>
        Mehrere der häufigsten Domains (merkur.de, hna.de, kreiszeitung.de, az-online.de u.a.) gehören zur <strong>Ippen Digital Mediengruppe</strong> und teilen redaktionellen Content. Ihre hohen Zahlen spiegeln die Größe der Gruppe, nicht journalistische Einzelrelevanz. Gezeigt wird rohe Erwähnungshäufigkeit — kein Qualitätsurteil.
      </p>
    </div>
  )
}

// Horizontaler Balken
function Bar({ value, max, color, label, total, group }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minHeight: '28px' }}>
      <div style={{ width: '140px', flexShrink: 0, textAlign: 'right' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-ink)' }}>
          {label}
        </span>
        {group && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-muted)', display: 'block' }}>
            {group}
          </span>
        )}
      </div>
      <div style={{ flex: 1, backgroundColor: 'var(--color-rule)', borderRadius: '3px', height: '14px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', width: '60px', flexShrink: 0 }}>
        {total.toLocaleString('de-DE')}
      </span>
    </div>
  )
}

// Gestapelter Balken für Parteianteile pro Domain
function StackedPartyBar({ domain }) {
  const entry = sourcesData.byDomain[domain]
  if (!entry) return null
  const total = entry.total
  const segments = PARTIES
    .map(p => ({ party: p, value: entry.parties[p]?.total ?? 0 }))
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ height: '24px', display: 'flex', borderRadius: '4px', overflow: 'hidden' }}>
        {segments.map(({ party, value }) => {
          const pct = (value / total) * 100
          const color = partyColor(DAWUM_KEY[party])
          return (
            <div
              key={party}
              title={`${PARTY_LABELS[party]}: ${value.toLocaleString('de-DE')}`}
              style={{ width: `${pct}%`, backgroundColor: color, flexShrink: 0 }}
            />
          )
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
        {segments.map(({ party, value }) => (
          <div key={party} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: partyColor(DAWUM_KEY[party]), display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)' }}>
              {PARTY_LABELS[party]} {Math.round((value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Ansicht 1: Top-Quellen pro Partei
function ByPartyView() {
  const [party, setParty] = useState('AfD')
  const sources = sourcesData.byParty[party] ?? []
  const maxVal = sources[0]?.total ?? 1
  const color = partyColor(DAWUM_KEY[party])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Partei-Auswahl */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {PARTIES.map(p => (
          <button
            key={p}
            onClick={() => setParty(p)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px',
              padding: '0.3rem 0.7rem', borderRadius: '20px', cursor: 'pointer',
              border: `1.5px solid ${party === p ? partyColor(DAWUM_KEY[p]) : 'var(--color-rule)'}`,
              backgroundColor: party === p ? partyColor(DAWUM_KEY[p]) + '18' : 'transparent',
              color: party === p ? partyColor(DAWUM_KEY[p]) : 'var(--color-muted)',
            }}
          >
            {PARTY_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Balkendiagramm */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Top 10 Quellen · {PARTY_LABELS[party]} · Jan 2025–Jun 2026 · Erwähnungen gesamt
        </span>
        {sources.map((s) => (
          <Bar
            key={s.domain}
            label={s.domain}
            value={s.total}
            max={maxVal}
            color={color}
            total={s.total}
            group={s.group}
          />
        ))}
      </div>

      <IppenNote />
    </div>
  )
}

// Ansicht 2: Pro Domain, Parteianteile
function ByDomainView() {
  const [domain, setDomain] = useState(sourcesData.meta.top30Domains[0])
  const entry = sourcesData.byDomain[domain]

  // Top 15 domains (ohne zu kleine) für die Auswahl
  const selectableDomains = sourcesData.meta.top30Domains.slice(0, 20)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Domain-Auswahl */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Quelle auswählen (Top 20 nach Gesamterwähnungen)
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {selectableDomains.map(d => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px',
                padding: '0.25rem 0.6rem', borderRadius: '4px', cursor: 'pointer',
                border: '1px solid var(--color-rule)',
                backgroundColor: domain === d ? 'var(--color-ink)' : 'transparent',
                color: domain === d ? 'var(--color-paper)' : 'var(--color-muted)',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Domain-Info */}
      {entry && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 24', fontSize: '1.3rem', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
              {domain}
            </h3>
            {entry.group && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)' }}>
                {entry.group}
              </span>
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)' }}>
              {entry.total.toLocaleString('de-DE')} Erwähnungen gesamt
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Parteianteile an der Berichterstattung
            </span>
            <StackedPartyBar domain={domain} />
          </div>

          {/* Partei-Balken einzeln */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {PARTIES
              .map(p => ({ party: p, total: entry.parties[p]?.total ?? 0 }))
              .filter(s => s.total > 0)
              .sort((a, b) => b.total - a.total)
              .map(({ party, total }) => (
                <Bar
                  key={party}
                  label={PARTY_LABELS[party]}
                  value={total}
                  max={Object.values(entry.parties).reduce((m, p) => Math.max(m, p.total), 0)}
                  color={partyColor(DAWUM_KEY[party])}
                  total={total}
                />
              ))
            }
          </div>
        </div>
      )}

      <IppenNote />
    </div>
  )
}

export default function NachrichtenQuellenStory() {
  const [tab, setTab] = useState('partei')

  return (
    <article className="flex flex-col gap-8 max-w-4xl">
      <div>
        <Link to="/" className="no-underline text-sm" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
          ← Zurück
        </Link>
      </div>

      <div className="flex flex-col gap-1.5 p-4" style={{ border: '1.5px dashed var(--color-muted)', borderRadius: '8px' }}>
        <span className="text-xs tracking-[.14em] uppercase" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', fontWeight: 600 }}>
          Labor · Datensatz-Showcase
        </span>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          Ich habe versucht, mit GDELT zu rekonstruieren, wer über welche Partei berichtet. Was ich dabei über den Datensatz gelernt habe, ist mindestens so interessant wie die Ergebnisse selbst.
        </p>
      </div>

      <header className="flex flex-col gap-3">
        <span className="text-xs tracking-[.12em] uppercase" style={{ fontFamily: 'var(--font-mono)', color: catColors.text }}>
          Labor · Medien
        </span>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontVariationSettings: '"opsz" 48',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 600,
          lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--color-ink)', margin: 0,
        }}>
          Wer schreibt worüber?
        </h1>
        <p className="text-base leading-relaxed max-w-prose" style={{ color: 'var(--color-muted)' }}>
          Der Versuch: Mit dem offenen GDELT-Datensatz herausfinden, welche deutschen Nachrichtenanbieter wie oft über welche Partei berichten. Das Ergebnis ist unvollständig — aber die Lücken erzählen eine eigene Geschichte.
        </p>
      </header>

      <div className="flex flex-col gap-3 max-w-prose">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          GDELT erfasst, was frei im Netz steht. Spiegel, SZ, Zeit — alles hinter Paywalls. Was bleibt, sind vor allem Regionalmedien und werbegestützte Newssites. Das dominante Bild: die <strong>Ippen Digital Mediengruppe</strong>, die mit über zwei Dutzend Titeln (merkur.de, hna.de, kreiszeitung.de u.a.) viel redaktionellen Content teilt.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          Trotzdem lohnt sich der Blick: Welche Parteien tauchen wo auf? Gibt es Muster zwischen Mediengruppen und Parteipräsenz? Und was passiert, wenn man die Quellenanalyse mit den Sonntagsfragen koppelt — steigen Erwähnungen vor Umfrage-Peaks?
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <TabButton active={tab === 'partei'} onClick={() => setTab('partei')}>
          Nach Partei
        </TabButton>
        <TabButton active={tab === 'domain'} onClick={() => setTab('domain')}>
          Nach Quelle
        </TabButton>
      </div>

      {tab === 'partei' ? <ByPartyView /> : <ByDomainView />}

      <footer className="text-xs pt-4 flex flex-col gap-1" style={{ borderTop: '1px solid var(--color-rule)', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
        <span>Quelle: GDELT Web NGrams 3.0 via BigQuery (deutschsprachige Quellen, Jan 2025–Jun 2026). Mediengruppen-Zuordnung: eigene Recherche.</span>
        <span style={{ opacity: 0.7 }}>Einschränkung: GDELT crawlt nur frei zugängliche Inhalte. Paywalled Qualitätsmedien (Spiegel, SZ, Zeit) sind stark unterrepräsentiert oder fehlen vollständig.</span>
      </footer>
    </article>
  )
}
