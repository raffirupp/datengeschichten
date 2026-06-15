import { useEffect, useRef, useState } from 'react'

export default function YearTimeline({ years, year, onChange }) {
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef(null)

  const min = years[0]
  const max = years[years.length - 1]
  const progress = ((year - min) / (max - min)) * 100

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        onChange((prev) => {
          if (prev >= max) {
            setPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 1200)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing, max, onChange])

  function handlePlay() {
    if (year >= max) onChange(min)
    setPlaying((p) => !p)
  }

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* Year display + play button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePlay}
          aria-label={playing ? 'Pause' : 'Abspielen'}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1.5px solid var(--color-accent)',
            backgroundColor: 'transparent',
            color: 'var(--color-accent)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)', e.currentTarget.style.color = 'var(--color-paper)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent', e.currentTarget.style.color = 'var(--color-accent)')}
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="4" height="10" rx="1"/>
              <rect x="7" y="1" width="4" height="10" rx="1"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 1.5l9 4.5-9 4.5V1.5z"/>
            </svg>
          )}
        </button>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.75rem',
            fontWeight: 400,
            color: 'var(--color-accent)',
            lineHeight: 1,
            minWidth: '4ch',
          }}
        >
          {year}
        </span>
      </div>

      {/* Slider */}
      <div className="relative flex items-center" style={{ paddingBottom: '20px' }}>
        {/* Track background */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '4px',
            borderRadius: '2px',
            backgroundColor: 'var(--color-rule)',
            pointerEvents: 'none',
          }}
        />
        {/* Progress fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${progress}%`,
            height: '4px',
            borderRadius: '2px',
            backgroundColor: 'var(--color-accent)',
            pointerEvents: 'none',
            transition: 'width 0.3s ease',
          }}
        />

        {/* Year tick marks */}
        {years
          .filter((y) => y % 5 === 0)
          .map((y) => {
            const pct = ((y - min) / (max - min)) * 100
            return (
              <div
                key={y}
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  bottom: 0,
                  transform: 'translateX(-50%)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--color-muted)',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {y}
              </div>
            )
          })}

        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={year}
          onChange={(e) => {
            setPlaying(false)
            onChange(Number(e.target.value))
          }}
          style={{
            position: 'relative',
            width: '100%',
            appearance: 'none',
            WebkitAppearance: 'none',
            background: 'transparent',
            cursor: 'pointer',
            margin: 0,
            zIndex: 1,
          }}
        />
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-accent);
          border: 2px solid var(--color-paper);
          box-shadow: 0 0 0 1.5px var(--color-accent);
          cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-accent);
          border: 2px solid var(--color-paper);
          box-shadow: 0 0 0 1.5px var(--color-accent);
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
