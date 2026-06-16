import { useMemo, useState } from 'react'
import { geoIdentity, geoPath } from 'd3-geo'
import geojson from '../data/laender-geo.json'
import { leftRightColor, textColorFor } from '../lib/leftRightColor.js'
import MapLegend from './MapLegend.jsx'

const W = 800
const H = 720

// Projektion + Pfade einmalig berechnen (Geometrie ist statisch)
const projection = geoIdentity().reflectY(true).fitSize([W, H], geojson)
const pathGen = geoPath(projection)

const PATHS = geojson.features.map((feat) => ({
  code: feat.properties.code,
  name: feat.properties.name,
  d: pathGen(feat),
  centroid: pathGen.centroid(feat),
}))

export default function LaenderGeoMap({ dataForYear, meta, highlightCode = null }) {
  const [hovered, setHovered] = useState(null)

  const fills = useMemo(() => {
    const map = {}
    for (const { code } of PATHS) {
      const value = dataForYear?.[code]
      map[code] = { color: leftRightColor(value ?? null, meta), value: value ?? null }
    }
    return map
  }, [dataForYear, meta])

  return (
    <div className="flex flex-col gap-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Karte der 16 Bundesländer, eingefärbt nach politischer Ausrichtung der Regierung"
        style={{ display: 'block' }}
      >
        {PATHS.map(({ code, name, d }) => {
          if (!d) return null
          const { color, value } = fills[code] ?? { color: '#F2EEE3', value: null }
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
              <title>
                {name}{value != null ? `: ${value.toFixed(2)}` : ' — keine Daten'}
              </title>
            </path>
          )
        })}
        {/* Highlight-Overlay: gehört zum aktiven Scroll-Beat */}
        {highlightCode && (() => {
          const feat = PATHS.find((p) => p.code === highlightCode)
          if (!feat?.d) return null
          const { color } = fills[highlightCode] ?? { color: '#F2EEE3' }
          return (
            <path
              key={`highlight-${highlightCode}`}
              d={feat.d}
              fill={color}
              stroke="#17150F"
              strokeWidth={2.2}
              style={{
                pointerEvents: 'none',
                transformBox: 'fill-box',
                transformOrigin: 'center',
                transform: 'scale(1.03)',
                transition: 'fill 0.5s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          )
        })()}
        {/* Hover-Overlay: ink-Rand über dem gehoverten Land */}
        {hovered && hovered !== highlightCode && (() => {
          const feat = PATHS.find((p) => p.code === hovered)
          if (!feat?.d) return null
          const { color } = fills[hovered] ?? { color: '#F2EEE3' }
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
        {/* Code-Labels mittig je Land */}
        {PATHS.map(({ code, d, centroid }) => {
          if (!d) return null
          const { color } = fills[code] ?? { color: '#F2EEE3' }
          const isDimmed = highlightCode && highlightCode !== code
          return (
            <text
              key={`label-${code}`}
              x={centroid[0]}
              y={centroid[1]}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={textColorFor(color)}
              opacity={isDimmed ? 0.45 : 1}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '-0.01em',
                pointerEvents: 'none',
                userSelect: 'none',
                transition: 'opacity 0.5s ease, fill 0.5s ease',
              }}
            >
              {code}
            </text>
          )
        })}
      </svg>

      <MapLegend />
    </div>
  )
}
