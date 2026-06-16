const categoryMap = {
  'Europa':      { color: 'var(--color-accent)',     text: '#1C5D57' },
  'Deutschland': { color: 'var(--color-accentWarm)', text: '#A84A30' },
  'Wirtschaft':  { color: 'var(--color-accentGold)', text: '#A8771A' },
  'Labor':       { color: 'var(--color-muted)',      text: '#6B6658' },
}

const fallback = { color: 'var(--color-muted)', text: '#6B6658' }

export function colorsFor(category) {
  return categoryMap[category] ?? fallback
}

export default categoryMap
