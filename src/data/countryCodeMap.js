// ParlGov ISO3 -> Eurostat 2-letter code
export const iso3ToEu2 = {
  ISL: 'IS', NOR: 'NO', SWE: 'SE', FIN: 'FI',
  GBR: 'UK', DNK: 'DK', EST: 'EE',
  IRL: 'IE', NLD: 'NL', DEU: 'DE', POL: 'PL', LVA: 'LV',
  BEL: 'BE', LUX: 'LU', CZE: 'CZ', LTU: 'LT',
  FRA: 'FR', CHE: 'CH', AUT: 'AT', SVK: 'SK',
  PRT: 'PT', ESP: 'ES', ITA: 'IT', SVN: 'SI', HUN: 'HU', ROU: 'RO',
  HRV: 'HR', BGR: 'BG',
  MLT: 'MT', GRC: 'EL', CYP: 'CY',
}

// Reverse: Eurostat 2-letter -> ParlGov ISO3
export const eu2ToIso3 = Object.fromEntries(
  Object.entries(iso3ToEu2).map(([iso3, eu2]) => [eu2, iso3])
)

export default iso3ToEu2
