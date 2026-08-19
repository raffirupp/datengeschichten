import { Fragment, useMemo } from 'react'
import { scaleLinear } from 'd3-scale'
import { partyColor } from '../lib/partyColors.js'

const NULL_COLOR = '#F2EEE3'

// Normalisierung pro Thema (Zeile) über alle Parteien — zeigt, welche Partei
// ein Thema relativ zu den anderen besonders stark bzw. schwach bespielt.
export default function PartyTopicHeatmap({ parties, topics }) {
  const { scales, maxByTopic } = useMemo(() => {
    const maxByTopic = {}
    const scales = {}
    for (const { key, color } of topics) {
      const max = Math.max(...parties.map((p) => p[key] ?? 0), 0)
      maxByTopic[key] = max
      scales[key] = scaleLinear().domain([0, max || 1]).range([NULL_COLOR, color]).clamp(true)
    }
    return { scales, maxByTopic }
  }, [parties, topics])

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `188px repeat(${parties.length}, minmax(68px, 1fr))`,
            gap: '3px',
            minWidth: '760px',
          }}
        >
          {/* Kopfzeile: Parteien */}
          <div />
          {parties.map(({ party }) => (
            <div
              key={party}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '4px',
                paddingBottom: '6px',
                textAlign: 'center',
              }}
            >
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: partyColor(party), display: 'inline-block',
              }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600,
                color: partyColor(party), lineHeight: 1.2,
              }}>
                {party}
              </span>
            </div>
          ))}

          {/* Zeilen: Themen */}
          {topics.map(({ key, label }) => (
            <Fragment key={key}>
              <div style={{
                display: 'flex', alignItems: 'center',
                fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-ink)',
                paddingRight: '10px',
              }}>
                {label}
              </div>
              {parties.map(({ party, ...values }) => {
                const value = values[key] ?? 0
                const max = maxByTopic[key] || 1
                const bg = scales[key](value)
                const isDark = value / max > 0.55
                return (
                  <div
                    key={party + key}
                    title={`${party} · ${label}: ${value.toFixed(1)} Erwähnungen/Mio. Tokens (parteieigen)`}
                    style={{
                      backgroundColor: bg,
                      height: '38px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '10px',
                      color: isDark ? '#F7F4EC' : 'var(--color-ink)', opacity: 0.9,
                    }}>
                      {value.toFixed(0)}
                    </span>
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
      {/* Scroll-Hinweis: rechter Fade-Rand, zeigt Wischbarkeit auf schmalen Screens */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: '4px',
          width: '28px',
          background: 'linear-gradient(to right, transparent, #FFFFFF)',
          pointerEvents: 'none',
        }}
      />
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)',
        marginTop: '10px',
      }}>
        Farbintensität je Zeile: relativ zur Partei mit den meisten Erwähnungen dieses Themas (nicht zwischen Themen vergleichbar).
      </p>
    </div>
  )
}
