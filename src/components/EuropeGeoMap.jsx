import { useMemo, useState } from 'react'
import { geoIdentity, geoPath } from 'd3-geo'
import geojson from '../data/europe-geo.json'
import { leftRightColor } from '../lib/leftRightColor.js'
import MapLegend from './MapLegend.jsx'

const W = 800
const H = 720

// Compute projection + path strings once (geometry is static)
const projection = geoIdentity().reflectY(true).fitSize([W, H], geojson)
const pathGen = geoPath(projection)

const PATHS = geojson.features.map((feat) => ({
  iso3: feat.properties.iso3,
  name: feat.properties.name,
  d: pathGen(feat),
}))

export default function EuropeGeoMap({ dataForYear, meta }) {
  const [hovered, setHovered] = useState(null)

  const fills = useMemo(() => {
    const map = {}
    for (const { iso3 } of PATHS) {
      const value = dataForYear?.[iso3]
      map[iso3] = { color: leftRightColor(value ?? null, meta), value: value ?? null }
    }
    return map
  }, [dataForYear, meta])

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
          return (
            <path
              key={iso3}
              d={d}
              fill={color}
              stroke="#F7F4EC"
              strokeWidth={isHovered ? 0 : 0.8}
              style={{ transition: 'fill 0.35s ease', cursor: 'default' }}
              onMouseEnter={() => setHovered(iso3)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>
                {name}{value != null ? `: ${value.toFixed(2)}` : ' — keine Daten'}
              </title>
            </path>
          )
        })}
        {/* Hover-Overlay: drawn on top with ink stroke */}
        {hovered && (() => {
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

      <MapLegend />
    </div>
  )
}
