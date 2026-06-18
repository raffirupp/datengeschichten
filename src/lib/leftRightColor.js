const NULL_HEX = '#F2EEE3'

// ─── Party family colors (based on European Parliament group colors) ──────────
// ParlGov left-right scale: 1 = far left, 10 = far right, mid ≈ 5
export const PARTY_FAMILIES = [
  { label: 'Weit links',         max: 2.8,        color: '#8B0000', textColor: '#F7F4EC' },
  { label: 'Sozialisten / Links',max: 3.8,        color: '#CC2020', textColor: '#F7F4EC' },
  { label: 'Sozialdemokraten',   max: 4.6,        color: '#E8324A', textColor: '#F7F4EC' },
  { label: 'Grüne',              max: 5.1,        color: '#3A8A3A', textColor: '#F7F4EC' },
  { label: 'Liberale',           max: 5.6,        color: '#D4900A', textColor: '#17150F' },
  { label: 'Konservative (EVP)', max: 7.0,        color: '#1547A0', textColor: '#F7F4EC' },
  { label: 'Rechts-Konservative',max: 8.2,        color: '#0D3470', textColor: '#F7F4EC' },
  { label: 'Weit rechts',        max: Infinity,   color: '#2B1A6E', textColor: '#F7F4EC' },
]

export function partyFamilyColor(value) {
  if (value === null || value === undefined || isNaN(value)) return NULL_HEX
  const family = PARTY_FAMILIES.find(f => value < f.max)
  return family ? family.color : NULL_HEX
}

export function partyFamilyTextColor(value) {
  if (value === null || value === undefined || isNaN(value)) return '#17150F'
  const family = PARTY_FAMILIES.find(f => value < f.max)
  return family ? family.textColor : '#17150F'
}

// Legacy: kept for any remaining callers
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}
export function textColorFor(bgHex) {
  const [r, g, b] = hexToRgb(bgHex)
  return ((0.299*r + 0.587*g + 0.114*b) / 255) > 0.55 ? '#17150F' : '#F7F4EC'
}

// Kept for backwards compat if anything still imports it
export function leftRightColor(value) {
  return partyFamilyColor(value)
}
