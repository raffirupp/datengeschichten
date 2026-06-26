import { useMemo, useState } from 'react'
import { geoIdentity, geoPath } from 'd3-geo'
import geojson from '../data/europe-geo.json'
import { partyFamilyColor, leftRightGradientColor } from '../lib/leftRightColor.js'
import MapLegend from './MapLegend.jsx'

const W = 800
const H = 720

const projection = geoIdentity().reflectY(true).fitSize([W, H], geojson)
const pathGen = geoPath(projection)

const PATHS = geojson.features.map((feat) => ({
  iso3: feat.properties.iso3,
  name: feat.properties.name,
  d: pathGen(feat),
}))

export default function EuropeGeoMap({ dataForYear, meta, highlightIso3 = null, colorMode = 'family' }) {
  const [hovered, setHovered] = useState(null)

  const colorFn = colorMode === 'spectrum' ? leftRightGradientColor : partyFamilyColor

  const fills = useMemo(() => {
    const map = {}
    for (const { iso3 } of PATHS) {
      const value = dataForYear?.[iso3]
      map[iso3] = { color: colorFn(value ?? null), value: value ?? null }
    }
    return map
  }, [dataForYear, colorMode])

  return (
    <div className="flex flex-col gap-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Karte Europas, eingefärbt nach politischer Ausrichtung der Regierung"
        style={{ display: 'block' }}
      >
        {PATHS.map(({ iso3, name, d }) => {
          if (!d) return null
          const { color, value } = fills[iso3] ?? { color: '#F2EEE3', value: null }
          const isHovered = hovered === iso3
          const isDimmed = highlightIso3 && highlightIso3 !== iso3
          return (
            <path
              key={iso3}
              d={d}
              fill={color}
              stroke="#FFFFFF"
              strokeWidth={isHovered ? 0 : 1.0}
              opacity={isDimmed ? 0.45 : 1}
              style={{ transition: 'fill 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease', cursor: 'default' }}
              onMouseEnter={() => setHovered(iso3)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>
                {name}{value != null ? `: ${value.toFixed(2)}` : ' — keine Daten'}
              </title>
            </path>
          )
        })}

        {/* Highlight-Overlay */}
        {highlightIso3 && (() => {
          const feat = PATHS.find(p => p.iso3 === highlightIso3)
          if (!feat?.d) return null
          const { color } = fills[highlightIso3] ?? { color: '#F2EEE3' }
          return (
            <path
              key={`highlight-${highlightIso3}`}
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

        {/* Hover-Overlay */}
        {hovered && hovered !== highlightIso3 && (() => {
          const feat = PATHS.find(p => p.iso3 === hovered)
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
      </svg>

      <MapLegend mode={colorMode} />
    </div>
  )
}
