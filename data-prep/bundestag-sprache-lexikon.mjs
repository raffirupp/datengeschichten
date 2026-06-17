/**
 * Themen-Lexikon für die Bundestagsreden-Story.
 * Jedes Thema enthält Keywords für case-insensitive Volltextsuche im rede_text.
 * Normalisierung: Treffer pro Million Tokens pro Jahr.
 *
 * Datengrundlage: CPP-BT (Sean Fobbe), Wahlperioden 18–21 (2013–2026), gemeinfrei.
 * Quelle: https://codeberg.org/seanfobbe/cpp-bt | https://zenodo.org/records/15462956
 */

const topics = [
  {
    key: 'klima',
    label: 'Klima & Energie',
    color: '#2D6A4F',
    keywords: [
      'klimawandel', 'klimakrise', 'klimaschutz', 'co2', 'treibhausgas',
      'energiewende', 'erneuerbare', 'solarenergie', 'windkraft', 'windenergie',
      'emissionen', 'dekarbonisierung', 'klimaneutral', 'kohlendioxid',
      'kohleausstieg', 'fossile energie', 'paris-abkommen',
    ],
  },
  {
    key: 'migration',
    label: 'Migration & Asyl',
    color: '#774936',
    keywords: [
      'flüchtlinge', 'flüchtling', 'asylbewerber', 'asylsuchende', 'asylrecht',
      'migration', 'migrant', 'einwanderung', 'einwanderer', 'abschiebung',
      'geflüchtete', 'geflüchteten', 'integration', 'zuwanderung',
      'aufenthaltstitel', 'aufnahmelager', 'grenzschutz',
    ],
  },
  {
    key: 'soziales',
    label: 'Soziales & Arbeit',
    color: '#C0392B',
    keywords: [
      'rente', 'rentenversicherung', 'rentner', 'mindestlohn', 'bürgergeld',
      'hartz iv', 'arbeitslosigkeit', 'arbeitnehmer', 'arbeitgeber',
      'wohngeld', 'mietpreise', 'sozialhilfe', 'sozialleistungen',
      'krankenversicherung', 'pflegeversicherung', 'sozialstaat',
    ],
  },
  {
    key: 'europa',
    label: 'Europa & EU',
    color: '#1C5D57',
    keywords: [
      'europäische union', 'europaparlament', 'eurozone', 'eurokrise',
      'schengen', 'brexit', 'eu-kommission', 'eu-rat', 'eu-haushalt',
      'eurozone', 'europäischer', 'eu-mitglied', 'europäisches',
    ],
  },
  {
    key: 'sicherheit',
    label: 'Sicherheit & Verteidigung',
    color: '#2C3E50',
    keywords: [
      'bundeswehr', 'nato', 'verteidigung', 'verteidigungshaushalt',
      'terrorismus', 'terroranschlag', 'islamismus', 'extremismus',
      'innere sicherheit', 'kriminalität', 'polizei', 'rüstung',
      'militäreinsatz', 'auslandseinsatz', 'geheimdienst',
    ],
  },
  {
    key: 'wirtschaft',
    label: 'Wirtschaft & Finanzen',
    color: '#C08A1E',
    keywords: [
      'haushalt', 'bundeshaushalt', 'staatsschulden', 'schuldenbremse',
      'wirtschaftswachstum', 'konjunktur', 'investitionen', 'subventionen',
      'steuersenkung', 'steuererhöhung', 'steuerentlastung',
      'industrie', 'mittelstand', 'export', 'wettbewerbsfähigkeit',
    ],
  },
  {
    key: 'digital',
    label: 'Digitalisierung & KI',
    color: '#5B4FCF',
    keywords: [
      'digitalisierung', 'digitalstrategie', 'künstliche intelligenz',
      'ki-gesetz', 'datenschutz', 'dsgvo', 'plattformökonomie',
      'breitband', 'glasfaser', '5g', 'cybersicherheit', 'cyberangriff',
      'algorithmen', 'startups', 'technologie', 'digitale infrastruktur',
    ],
  },
  {
    key: 'gesundheit',
    label: 'Gesundheit & Pflege',
    color: '#27AE60',
    keywords: [
      'gesundheitsversorgung', 'krankenhäuser', 'krankenhaus',
      'corona', 'pandemie', 'covid', 'impfpflicht', 'impfung', 'lockdown',
      'pflege', 'pflegepersonal', 'pflegeheim', 'ärztemangel',
      'krankenversicherung', 'pharma', 'arzneimittel',
    ],
  },
  {
    key: 'demokratie',
    label: 'Demokratie & Rechtsstaat',
    color: '#6B6658',
    keywords: [
      'demokratie', 'rechtsstaatlichkeit', 'grundgesetz', 'verfassung',
      'meinungsfreiheit', 'pressefreiheit', 'extremismus',
      'populismus', 'desinformation', 'wahlrecht', 'gewaltenteilung',
      'bundesverfassungsgericht', 'verfassungsschutz', 'rechtsstaat',
    ],
  },
]

export default topics
