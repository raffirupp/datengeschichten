const werkstatt = [
  {
    id: 'europa',
    title: 'Europa wechselt die Farbe',
    storyKey: 'europa-faerbt',
    summary: 'Eine Karte Europas, eingefärbt nach der Links-rechts-Position der jeweiligen Regierung — für jedes Jahr von 2000 bis 2025.',
    sources: [
      { name: 'ParlGov (Döring & Manow)', url: 'https://www.parlgov.org', license: 'frei, mit Quellenangabe' },
      { name: 'Eurostat GISCO (Geometrie)', url: 'https://ec.europa.eu/eurostat/web/gisco', license: 'frei' },
    ],
    steps: [
      'Aus ParlGov (view_cabinet) je Land und Kabinett die Regierungsparteien geholt.',
      'Für jedes Kabinett den sitzgewichteten Mittelwert der Links-rechts-Werte der Regierungsparteien berechnet — das ergibt die ideologische Position der Regierung.',
      'Für jedes Jahr 2000–2025 die jeweils aktive Regierung bestimmt und eingefärbt; das letzte bekannte Kabinett wird bis heute fortgeschrieben.',
    ],
    caveats: [
      'ParlGov endet 2023. Jahre danach werden fortgeschrieben; einzelne neue Wechsel (z. B. Deutschland 2025) sind transparent von Hand ergänzt.',
      'Gefärbt wird nach Ideologie (Petrol = links, Korall = rechts), NICHT nach Parteifarben — damit der Vergleich über 25 Jahre und viele Länder konsistent bleibt.',
    ],
  },
  {
    id: 'laender',
    title: 'Die Länder wechseln die Farbe',
    storyKey: 'laender-faerben',
    summary: 'Dieselbe Idee für die 16 deutschen Bundesländer: wer regierte wann, übersetzt in eine Links-rechts-Position.',
    sources: [
      { name: 'Wikidata (Regierungschef:innen)', url: 'https://www.wikidata.org', license: 'CC0' },
      { name: 'Eurostat GISCO NUTS-1 (Geometrie)', url: 'https://ec.europa.eu/eurostat/web/gisco', license: 'frei' },
    ],
    steps: [
      'Per Wikidata-Abfrage die Regierungschef:innen aller 16 Länder mit Amtszeiten ab 2000 geholt (Stadtstaaten über dieselbe Eigenschaft P6).',
      'Die Partei der jeweiligen Regierungschefin in einen Links-rechts-Wert übersetzt (eigene Einordnung).',
      'Pro Jahr die aktive Landesregierung bestimmt und die Karte eingefärbt.',
    ],
    caveats: [
      'Die Links-rechts-Werte der Parteien sind eine offengelegte eigene Einordnung, kein objektives Maß — besonders BSW und Freie Wähler sind Ermessensfragen.',
      'Fallstrick DDR-Blockparteien: Wikidata führt bei manchen ostdeutschen Politiker:innen alte Mitgliedschaften (LDPD, Block-CDU). Das wird automatisch korrigiert, indem die zuletzt begonnene Mitgliedschaft gewählt wird.',
    ],
  },
  {
    id: 'wahltrend-btw',
    title: 'Wahltrend Bundestag',
    storyKey: 'wahltrend-bundestag',
    summary: 'Alle veröffentlichten Sonntagsfrage-Umfragen, zusammengeführt zu einem geglätteten Trend.',
    sources: [
      { name: 'DAWUM', url: 'https://dawum.de', license: 'ODbL (mit Quellenangabe)' },
    ],
    steps: [
      'Über die offene DAWUM-Schnittstelle alle Umfragen zur Bundestagswahl geholt.',
      'Je Partei einen geglätteten Trend berechnet: gewichteter Mittelwert über ein 21-Tage-Fenster, neuere und größere Umfragen zählen etwas stärker.',
      'Einzelumfragen als dezente Punkte, den Trend als kräftige Linie dargestellt.',
    ],
    caveats: [
      'Die Glättung ist bewusst einfach und transparent gehalten (Version 1).',
      'Geplanter nächster Schritt: Korrektur von Instituts-Schlagseiten (House-Effects) und ein Modell, das Trend UND Unsicherheit gemeinsam schätzt.',
    ],
  },
]

export default werkstatt
