// Vollfarben (Linien, Marker, Text)
export const DE_COLOR = '#1C5D57'   // Petrol
export const FR_COLOR = '#BE5A3C'   // Korall

// Dunklere Töne (Text auf hellen Flächen)
export const DE_DARK  = '#0E3D38'
export const FR_DARK  = '#9A4225'

// Helle Fülltöne
export const DE_FILL      = '#AEC6C2'  // Petrol-Fill (Ist)
export const DE_FILL_SOFT = '#CFDAD7'  // Petrol-Fill (Prognose)
export const FR_FILL      = '#E6C6BA'  // Korall-Fill (Ist)
export const FR_FILL_SOFT = '#F0DAD1'  // Korall-Fill (Prognose)

// Achsen / Hilfslinien
export const RULE_SOFT  = '#E4DECF'
export const AXIS_MUTED = '#A39E90'
export const LABEL_MUTED = '#8A8579'
export const INK  = '#17150F'
export const RULE = '#D8D2C4'
export const MUTED = '#6B6658'
export const OCKER = '#C08A1E'

// Returns { actual: [{year, value}], forecast: [{year, value}] }
// forecast beginnt inkl. lastActual für nahtlosen Übergang
export function splitActualForecast(series, lastActual = 2024) {
  const entries = Object.entries(series)
    .map(([y, v]) => ({ year: +y, value: v }))
    .sort((a, b) => a.year - b.year)
  return {
    actual:   entries.filter(e => e.year <= lastActual),
    forecast: entries.filter(e => e.year >= lastActual),
  }
}

export function fmtDe(value, decimals = 1) {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
