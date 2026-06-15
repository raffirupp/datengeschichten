export default function MapLegend() {
  return (
    <div className="flex flex-col gap-1 max-w-xs">
      <div
        style={{
          height: '8px',
          borderRadius: '4px',
          background: 'linear-gradient(to right, #1C5D57, #EDE7D7, #BE5A3C)',
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
