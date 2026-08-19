const colors = {
  'CDU/CSU':       '#1A1A1A',
  // Landtags-Umfragen führen CDU/CSU je nach Bundesland getrennt (DAWUM-Parteicodes) —
  // gleiche Farbe wie der kombinierte Bundes-Code.
  'CDU':           '#1A1A1A',
  'CSU':           '#1A1A1A',
  'SPD':           '#C0272D',
  'Grüne':         '#46962B',
  'FDP':           '#E8B000',
  'AfD':           '#009EE0',
  'Linke':         '#BE3075',
  'BSW':           '#6B3FA0',
  'Freie Wähler':  '#F07000',
}

const FALLBACK = '#6B6658'

export function partyColor(key) {
  return colors[key] ?? FALLBACK
}

export default colors
