export default function MapLegend() {
  return (
    <div className="flex flex-col gap-1 max-w-xs">
      <div
        style={{
          height: '8px',
          borderRadius: '4px',
          background: 'linear-gradient(to right, #C0392B, #EDE7D7, #1E3A6E)',
        }}
      />
      <div
        className="flex justify-between text-xs"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
      >
        <span>links</span>
        <span>Mitte</span>
        <span>rechts</span>
      </div>
    </div>
  )
}
