export const DE_COLOR = '#1C5D57'
export const FR_COLOR = '#BE5A3C'

// Returns { actual: [{year, value}], forecast: [{year, value}] }
// Forecast array starts at lastActual for visual continuity (connected line)
export function splitActualForecast(series, lastActual = 2024) {
  const entries = Object.entries(series)
    .map(([y, v]) => ({ year: +y, value: v }))
    .sort((a, b) => a.year - b.year)
  return {
    actual: entries.filter(e => e.year <= lastActual),
    forecast: entries.filter(e => e.year >= lastActual),
  }
}

export function fmtDe(value, decimals = 1) {
  return value.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
