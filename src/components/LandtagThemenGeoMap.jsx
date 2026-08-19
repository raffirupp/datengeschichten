import { useMemo, useState, useRef, useEffect } from 'react'
import { geoIdentity, geoPath } from 'd3-geo'
import { scaleLinear } from 'd3-scale'
import geojson from '../data/laender-geo.json'
import useIsMobile from '../hooks/useIsMobile.js'

const W = 800
const H = 720
const NULL_COLOR = '#F2EEE3'

const projection = geoIdentity().reflectY(true).fitSize([W, H], geojson)
const pathGen = geoPath(projection)

const PATHS = geojson.features.map((feat) => ({
  code: feat.properties.code,
  name: feat.properties.name,
  d: pathGen(feat),
}))

export default function LandtagThemenGeoMap({ dataForYear, topicLabel, topicColor, maxValue }) {
  const [hovered, setHovered] = useState(null)
  const isMobile = useIsMobile()
  const wrapperRef = useRef(null)

  const colorScale = useMemo(
    () => scaleLinear().domain([0, maxValue || 1]).range([NULL_COLOR, topicColor]).clamp(true),
    [maxValue, topicColor]
  )

  const fills = useMemo(() => {
    const map = {}
    for (const { code } of PATHS) {
      const value = dataForYear?.[code] ?? null
      map[code] = { color: value == null ? NULL_COLOR : colorScale(value), value }
    }
    return map
  }, [dataForYear, colorScale])

  // Tap outside the map dismisses the touch tooltip (native hover/leave doesn't fire on touch)
  useEffect(() => {
    if (!hovered) return
    function handleOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setHovered(null)
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [hovered])

  const hoveredInfo = hovered ? fills[hovered] : null
  const hoveredName = hovered ? PATHS.find(p => p.code === hovered)?.name : null

  return (
    <div ref={wrapperRef} className="flex flex-col gap-4" style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Karte der 16 Bundesländer, eingefärbt nach Intensität des Themas ${topicLabel}`}
        style={{ display: 'block' }}
      >
        {PATHS.map(({ code, name, d }) => {
          if (!d) return null
          const { color, value } = fills[code] ?? { color: NULL_COLOR, value: null }
          const isHovered = hovered === code
          return (
            <path
              key={code}
              d={d}
              fill={color}
              stroke="#FFFFFF"
              strokeWidth={isHovered ? 2 : 1.2}
              style={{ transition: 'fill 0.5s ease', cursor: 'default' }}
              onMouseEnter={() => setHovered(code)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setHovered(prev => (prev === code ? null : code))}
            >
              <title>
                {name}
                {value != null ? `: ${value.toFixed(1)} Erwähnungen/Mio. Tokens` : ' — keine Daten'}
              </title>
            </path>
          )
        })}
      </svg>

      {isMobile && hoveredName && (
        <div
          style={{
            position: 'absolute',
            left: '8px',
            bottom: '8px',
            backgroundColor: 'var(--color-paper)',
            border: '1px solid var(--color-rule)',
            borderRadius: '6px',
            padding: '6px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--color-ink)',
            pointerEvents: 'none',
            maxWidth: '85%',
          }}
        >
          {hoveredName}{hoveredInfo?.value != null ? `: ${hoveredInfo.value.toFixed(1)} Erwähnungen/Mio. Tokens` : ' — keine Daten'}
        </div>
      )}

      {/* Gradient-Legende */}
      <div className="flex items-center gap-3">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)' }}>
          niedrig
        </span>
        <div
          style={{
            flex: 1,
            height: '8px',
            borderRadius: '4px',
            background: `linear-gradient(to right, ${NULL_COLOR}, ${topicColor})`,
          }}
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)' }}>
          hoch
        </span>
      </div>
    </div>
  )
}
