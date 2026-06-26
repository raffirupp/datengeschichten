import { PARTY_FAMILIES } from '../lib/leftRightColor.js'

export default function MapLegend({ mode = 'family' }) {
  if (mode === 'spectrum') {
    return (
      <div className="flex flex-col gap-2">
        <div style={{
          height: '9px',
          borderRadius: '4px',
          background: 'linear-gradient(to right, #C0272D, #E8A0A8, #E8E8E8, #A0B4D8, #1547A0)',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-muted)' }}>Links (1)</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-muted)' }}>Mitte (5.5)</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-muted)' }}>Rechts (10)</span>
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-muted)', margin: 0 }}>
          ParlGov-Skala · 1 = weit links, 10 = weit rechts
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {PARTY_FAMILIES.map(f => (
          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              width: '12px', height: '12px', borderRadius: '3px',
              backgroundColor: f.color, flexShrink: 0, display: 'inline-block',
            }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
              {f.label}
            </span>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-muted)', margin: 0 }}>
        Parteifamilien nach ParlGov-Skala (1 = weit links, 10 = weit rechts)
      </p>
    </div>
  )
}
