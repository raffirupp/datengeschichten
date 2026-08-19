/**
 * Themen-Lexikon für die Landtags-Story „Worüber die Landtage sprechen".
 * Zugeschnitten auf Länderkompetenzen (Bildung, Landespolizei, Kommunales …),
 * statt die Bundestags-Themen (Bundeswehr, EU-Ratspolitik) zu übernehmen.
 * Jedes Thema enthält Keywords für case-insensitive Volltextsuche im Redetext.
 * Normalisierung: Treffer pro Million Tokens pro Jahr (analog Bundestag-Lexikon).
 *
 * Datengrundlage: StateParl v3 (Beltermann, Souris, Nguyen, Kropp / FU Berlin), GESIS.
 */

const topics = [
  {
    key: 'bildung',
    label: 'Bildung & Schule',
    color: '#1C5D57',
    keywords: [
      'schule', 'schulen', 'schulpflicht', 'lehrkräfte', 'lehrermangel',
      'unterrichtsausfall', 'grundschule', 'gymnasium', 'gesamtschule',
      'abitur', 'bildungspolitik', 'kultusministerium', 'g8', 'g9',
      'inklusion', 'ganztagsschule', 'schulabschluss',
    ],
  },
  {
    key: 'sicherheit',
    label: 'Innere Sicherheit & Justiz',
    color: '#2C3E50',
    keywords: [
      'landespolizei', 'polizeigesetz', 'polizeibeamte', 'kriminalität',
      'einbruchsdiebstahl', 'verfassungsschutz', 'extremismus',
      'justizvollzug', 'landesgericht', 'staatsanwaltschaft',
      'richtermangel', 'verwaltungsgericht', 'clankriminalität',
    ],
  },
  {
    key: 'kommunales',
    label: 'Kommunales & Wohnen',
    color: '#774936',
    keywords: [
      'kommunen', 'kommunalfinanzen', 'kommunaler finanzausgleich',
      'kitaplatz', 'kindertagesstätte', 'sozialwohnung', 'mietpreisbremse',
      'wohnungsnot', 'bauland', 'grunderwerbsteuer', 'landkreis',
      'landkreise', 'bürgermeister', 'kommunalaufsicht',
    ],
  },
  {
    key: 'wirtschaft',
    label: 'Wirtschaft & Landeshaushalt',
    color: '#C08A1E',
    keywords: [
      'landeshaushalt', 'schuldenbremse', 'nachtragshaushalt',
      'wirtschaftsförderung', 'mittelstand', 'standortpolitik',
      'tourismus', 'landwirtschaft', 'strukturwandel', 'fachkräftemangel',
      'investitionen', 'gewerbesteuer',
    ],
  },
  {
    key: 'gesundheit',
    label: 'Gesundheit & Pflege',
    color: '#27AE60',
    keywords: [
      'krankenhausplanung', 'krankenhausreform', 'klinikschließung',
      'ärztemangel', 'landarztquote', 'pflegepersonal', 'pflegenotstand',
      'rettungsdienst', 'gesundheitsamt', 'geburtsstation',
      'krankenhausfinanzierung',
    ],
  },
  {
    key: 'klima',
    label: 'Klima & Energie',
    color: '#2D6A4F',
    keywords: [
      'windkraft', 'windenergie', 'windvorranggebiet', 'solarenergie',
      'photovoltaik', 'energiewende', 'klimaschutzgesetz', 'artenschutz',
      'naturschutz', 'flächenverbrauch', 'landesentwicklungsplan',
      'stromtrasse', 'ausbauziel',
    ],
  },
  {
    key: 'verkehr',
    label: 'Verkehr & Infrastruktur',
    color: '#5B4FCF',
    keywords: [
      'öpnv', 'nahverkehr', 'deutschlandticket', 'landesstraße',
      'radverkehr', 'radwegenetz', 'breitbandausbau', 'glasfaser',
      'bahnstrecke', 'schienennetz', 'verkehrsinfrastruktur',
      'mobilitätswende',
    ],
  },
  {
    key: 'digital',
    label: 'Digitalisierung & Verwaltung',
    color: '#6B6658',
    keywords: [
      'digitalisierung', 'verwaltungsdigitalisierung', 'onlinezugangsgesetz',
      'digitalpakt', 'schuldigitalisierung', 'e-government',
      'behördengang', 'cybersicherheit', 'künstliche intelligenz',
      'datenschutz',
    ],
  },
  {
    key: 'migration',
    label: 'Migration & Integration',
    color: '#C0392B',
    keywords: [
      'flüchtlinge', 'geflüchtete', 'asylbewerber', 'erstaufnahmeeinrichtung',
      'landesaufnahmestelle', 'integrationskurs', 'abschiebung',
      'kommunale unterbringung', 'anschlussunterbringung', 'zuwanderung',
      'ausländerbehörde',
    ],
  },
]

export default topics
