import { useMemo, useState } from 'react'
import { geoIdentity, geoPath } from 'd3-geo'
import geojson from '../data/laender-geo.json'

const W = 800
const H = 720

const projection = geoIdentity().reflectY(true).fitSize([W, H], geojson)
const pathGen = geoPath(projection)

const PATHS = geojson.features.map((feat) => ({
  code: feat.properties.code,
  name: feat.properties.name,
  d: pathGen(feat),
  centroid: pathGen.centroid(feat),
}))

// ─── Deutsche Parteifarben für Länder-Karte ──────────────────────────────────
// Werte kommen aus partyLeftRight.js — jeder Wert = eindeutige Partei
const PARTY_BY_VALUE = {
  1.3:  { label: 'Die Linke',     color: '#BE3075', text: '#F7F4EC' },
  3.2:  { label: 'Grüne',         color: '#46962B', text: '#F7F4EC' },
  3.8:  { label: 'SPD',           color: '#C0272D', text: '#F7F4EC' },
  4.2:  { label: 'SSW',           color: '#3D7AAF', text: '#F7F4EC' },
  4.5:  { label: 'BSW',           color: '#6B3FA0', text: '#F7F4EC' },
  6.0:  { label: 'Freie Wähler',  color: '#F07000', text: '#17150F' },
  6.3:  { label: 'FDP',           color: '#E8B000', text: '#17150F' },
  6.6:  { label: 'CDU',           color: '#222222', text: '#F7F4EC' },
  7.0:  { label: 'CSU',           color: '#404040', text: '#F7F4EC' },
  9.2:  { label: 'AfD',           color: '#009EE0', text: '#17150F' },
}

const NULL_COLOR  = '#F2EEE3'
const NULL_TEXT   = '#17150F'

function partyForValue(value) {
  if (value == null) return { label: '—', color: NULL_COLOR, text: NULL_TEXT }
  // Round to 1 decimal to match map keys
  const key = Math.round(value * 10) / 10
  return PARTY_BY_VALUE[key] ?? { label: '?', color: NULL_COLOR, text: NULL_TEXT }
}

// ─── Legend ──────────────────────────────────────────────────────────────────
function LaenderLegend({ presentValues }) {
  const items = Object.entries(PARTY_BY_VALUE)
    .filter(([v]) => presentValues.has(Number(v)))
    .sort((a, b) => Number(a[0]) - Number(b[0]))

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {items.map(([, { label, color }]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            width: '12px', height: '12px', borderRadius: '3px',
            backgroundColor: color, flexShrink: 0, display: 'inline-block',
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Map ─────────────────────────────────────────────────────────────────────
export default function LaenderGeoMap({ dataForYear, highlightCode = null }) {
  const [hovered, setHovered] = useState(null)

  const fills = useMemo(() => {
    const map = {}
    for (const { code } of PATHS) {
      const value = dataForYear?.[code] ?? null
      map[code] = { ...partyForValue(value), value }
    }
    return map
  }, [dataForYear])

  const presentValues = useMemo(() => {
    const s = new Set()
    for (const { value } of Object.values(fills)) {
      if (value != null) s.add(Math.round(value * 10) / 10)
    }
    return s
  }, [fills])

  return (
    <div className="flex flex-col gap-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Karte der 16 Bundesländer, eingefärbt nach regierender Partei"
        style={{ display: 'block' }}
      >
        {PATHS.map(({ code, name, d }) => {
          if (!d) return null
          const { color, value } = fills[code] ?? { color: NULL_COLOR, value: null }
          const party = partyForValue(value)
          const isHovered = hovered === code
          const isDimmed = highlightCode && highlightCode !== code
          return (
            <path
              key={code}
              d={d}
              fill={color}
              stroke="#F7F4EC"
              strokeWidth={isHovered ? 0 : 0.8}
              opacity={isDimmed ? 0.45 : 1}
              style={{ transition: 'fill 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease', cursor: 'default' }}
              onMouseEnter={() => setHovered(code)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>{name}{party.label !== '—' ? `: ${party.label}` : ' — keine Daten'}</title>
            </path>
          )
        })}

        {/* Highlight-Overlay */}
        {highlightCode && (() => {
          const feat = PATHS.find((p) => p.code === highlightCode)
          if (!feat?.d) return null
          const { color } = fills[highlightCode] ?? { color: NULL_COLOR }
          return (
            <path
              key={`highlight-${highlightCode}`}
              d={feat.d}
              fill={color}
              stroke="#17150F"
              strokeWidth={2.2}
              style={{ pointerEvents: 'none', transformBox: 'fill-box', transformOrigin: 'center', transform: 'scale(1.03)', transition: 'fill 0.5s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          )
        })()}

        {/* Hover-Overlay */}
        {hovered && hovered !== highlightCode && (() => {
          const feat = PATHS.find((p) => p.code === hovered)
          if (!feat?.d) return null
          const { color } = fills[hovered] ?? { color: NULL_COLOR }
          return (
            <path
              key={`hover-${hovered}`}
              d={feat.d}
              fill={color}
              stroke="#17150F"
              strokeWidth={1.4}
              style={{ pointerEvents: 'none', transition: 'fill 0.35s ease' }}
            />
          )
        })()}

        {/* Code-Labels */}
        {PATHS.map(({ code, d, centroid }) => {
          if (!d) return null
          const { text, value } = fills[code] ?? { text: NULL_TEXT, value: null }
          const isDimmed = highlightCode && highlightCode !== code
          return (
            <text
              key={`label-${code}`}
              x={centroid[0]}
              y={centroid[1]}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={text}
              opacity={isDimmed ? 0.45 : 1}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '11px',
                letterSpacing: '-0.01em', pointerEvents: 'none', userSelect: 'none',
                transition: 'opacity 0.5s ease, fill 0.5s ease',
              }}
            >
              {code}
            </text>
          )
        })}
      </svg>

      <LaenderLegend presentValues={presentValues} />
    </div>
  )
}
