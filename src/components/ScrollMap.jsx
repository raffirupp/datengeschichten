import { useEffect, useRef, useState } from 'react'
import scrollama from 'scrollama'

export default function ScrollMap({ beats, manualYear, onActiveBeatChange, highlightKey = 'iso3', renderMap }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    const scroller = scrollama()
    scroller
      .setup({
        step: '.scrollmap-step',
        offset: 0.6,
      })
      .onStepEnter(({ index }) => setActiveIndex(index))

    const handleResize = () => scroller.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      scroller.destroy()
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const activeBeat = beats[activeIndex]

  useEffect(() => {
    onActiveBeatChange?.(activeBeat)
  }, [activeBeat, onActiveBeatChange])

  const effectiveYear = manualYear ?? activeBeat.year
  const effectiveHighlight = manualYear ? null : activeBeat[highlightKey]

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div style={{ position: 'sticky', top: '1.5rem', alignSelf: 'start', height: 'fit-content' }}>
        {renderMap(effectiveYear, effectiveHighlight)}
      </div>

      <div className="flex flex-col">
        {beats.map((beat, i) => (
          <div
            key={i}
            className="scrollmap-step flex flex-col gap-2 justify-center"
            style={{
              minHeight: '60vh',
              opacity: i === activeIndex ? 1 : 0.4,
              transition: 'opacity 0.4s ease',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                color: 'var(--color-accent)',
              }}
            >
              {beat.year}
            </span>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontVariationSettings: '"opsz" 28',
                fontSize: '1.5rem',
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              {beat.headline}
            </h3>
            <p
              className="text-base leading-relaxed max-w-prose"
              style={{ color: 'var(--color-muted)' }}
            >
              {beat.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
