const LEFT_HEX  = '#C0392B'  // Rot
const MID_HEX   = '#EDE7D7'  // Creme
const RIGHT_HEX = '#1E3A6E'  // Dunkelblau
const NULL_HEX  = '#F2EEE3'  // Neutral / kein Wert

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

const LEFT_RGB  = hexToRgb(LEFT_HEX)
const MID_RGB   = hexToRgb(MID_HEX)
const RIGHT_RGB = hexToRgb(RIGHT_HEX)

export function leftRightColor(value, meta) {
  if (value === null || value === undefined || isNaN(value)) return NULL_HEX

  const { valueMin, valueMax, mid } = meta
  let t, from, to

  if (value <= mid) {
    t    = valueMin === mid ? 1 : (value - valueMin) / (mid - valueMin)
    from = LEFT_RGB
    to   = MID_RGB
  } else {
    t    = valueMax === mid ? 0 : (value - mid) / (valueMax - mid)
    from = MID_RGB
    to   = RIGHT_RGB
  }

  t = Math.max(0, Math.min(1, t))
  return rgbToHex(
    lerp(from[0], to[0], t),
    lerp(from[1], to[1], t),
    lerp(from[2], to[2], t),
  )
}

export function textColorFor(bgHex) {
  const [r, g, b] = hexToRgb(bgHex)
  // Relative luminance (sRGB)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#17150F' : '#F7F4EC'
}
