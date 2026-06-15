export default function StoryMotif() {
  return (
    <div
      className="rounded-md overflow-hidden border flex flex-col"
      style={{ borderColor: 'var(--color-rule)', backgroundColor: '#F2EEE3' }}
    >
      <svg
        viewBox="0 0 240 116"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        aria-hidden="true"
      >
        {/* Bottom layer — Gold */}
        <path
          d="M0 90 Q60 86 120 92 Q180 98 240 88 L240 116 L0 116 Z"
          fill="var(--color-accentGold)"
          opacity="0.55"
        />
        {/* Middle layer — Warm */}
        <path
          d="M0 62 Q60 56 120 64 Q180 72 240 60 L240 116 L0 116 Z"
          fill="var(--color-accentWarm)"
          opacity="0.6"
        />
        {/* Top layer — Accent/Petrol */}
        <path
          d="M0 36 Q60 28 120 38 Q180 48 240 34 L240 116 L0 116 Z"
          fill="var(--color-accent)"
          opacity="0.65"
        />
        {/* Vertical marker line */}
        <line x1="154" y1="18" x2="154" y2="116" stroke="var(--color-ink)" strokeWidth="1" opacity="0.4" />
        <circle cx="154" cy="38" r="3" fill="var(--color-ink)" opacity="0.6" />
      </svg>

      <div
        className="flex justify-between px-3 py-2 text-xs"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
      >
        <span>2000</span>
        <span>2012</span>
        <span>2025</span>
      </div>
    </div>
  )
}
