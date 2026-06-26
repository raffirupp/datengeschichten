const NULL_HEX = '#F2EEE3'

// ─── Party family colors (based on European Parliament group colors) ──────────
// ParlGov left-right scale: 1 = far left, 10 = far right, mid ≈ 5
export const PARTY_FAMILIES = [
  { label: 'Weit links',          max: 2.8,      color: '#8B0000', textColor: '#F7F4EC' },
  { label: 'Sozialisten / Links', max: 3.8,      color: '#CC2020', textColor: '#F7F4EC' },
  { label: 'Sozialdemokraten',    max: 4.6,      color: '#E8324A', textColor: '#F7F4EC' },
  { label: 'Grüne',               max: 5.1,      color: '#3A8A3A', textColor: '#F7F4EC' },
  { label: 'Liberale',            max: 5.6,      color: '#D4900A', textColor: '#17150F' },
  { label: 'Konservative (EVP)',  max: 7.0,      color: '#1547A0', textColor: '#F7F4EC' },
  { label: 'Rechts-Konservative', max: 8.2,      color: '#0D3470', textColor: '#F7F4EC' },
  { label: 'Weit rechts',         max: Infinity, color: '#2B1A6E', textColor: '#F7F4EC' },
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

// ─── Continuous left-right gradient ─────────────────────────────────────────
// Maps ParlGov 1–10 to a red→neutral→blue gradient
function hexInterpolate(from, to, t) {
  const fr = parseInt(from.slice(1, 3), 16)
  const fg = parseInt(from.slice(3, 5), 16)
  const fb = parseInt(from.slice(5, 7), 16)
  const tr = parseInt(to.slice(1, 3), 16)
  const tg = parseInt(to.slice(3, 5), 16)
  const tb = parseInt(to.slice(5, 7), 16)
  const r = Math.round(fr + (tr - fr) * t)
  const g = Math.round(fg + (tg - fg) * t)
  const b = Math.round(fb + (tb - fb) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

const SPECTRUM_LEFT   = '#C0272D'  // rot (links)
const SPECTRUM_CENTER = '#E8E8E8'  // neutral (mitte, ~5.5)
const SPECTRUM_RIGHT  = '#1547A0'  // blau (rechts)
const SPECTRUM_MID    = 5.5        // ParlGov-Wert der Mitte

export function leftRightGradientColor(value) {
  if (value === null || value === undefined || isNaN(value)) return NULL_HEX
  if (value <= SPECTRUM_MID) {
    const t = Math.max(0, (value - 1) / (SPECTRUM_MID - 1))
    return hexInterpolate(SPECTRUM_LEFT, SPECTRUM_CENTER, t)
  } else {
    const t = Math.min(1, (value - SPECTRUM_MID) / (10 - SPECTRUM_MID))
    return hexInterpolate(SPECTRUM_CENTER, SPECTRUM_RIGHT, t)
  }
}

export function leftRightGradientTextColor(value) {
  if (value === null || value === undefined || isNaN(value)) return '#17150F'
  // Light backgrounds (near center) need dark text
  const t = value <= SPECTRUM_MID
    ? (value - 1) / (SPECTRUM_MID - 1)
    : (value - SPECTRUM_MID) / (10 - SPECTRUM_MID)
  return t > 0.55 ? '#F7F4EC' : '#17150F'
}

// ─── Legacy exports ───────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
export function textColorFor(bgHex) {
  const [r, g, b] = hexToRgb(bgHex)
  return ((0.299 * r + 0.587 * g + 0.114 * b) / 255) > 0.55 ? '#17150F' : '#F7F4EC'
}
export function leftRightColor(value) {
  return partyFamilyColor(value)
}
