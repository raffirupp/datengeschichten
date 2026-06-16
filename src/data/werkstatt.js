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
  {
    id: 'nachrichten-signal',
    title: 'Stimmung in den Nachrichten',
    storyKey: 'nachrichten-signal',
    summary: 'Ein offenes Experiment: das Nachrichten-Signal aus GDELT (Aufmerksamkeit + Ton) neben dem DAWUM-Umfragetrend — ohne Vorhersage, ohne Modell.',
    sources: [
      { name: 'GDELT DOC 2.0 API', url: 'https://www.gdeltproject.org', license: 'frei nutzbar (Forschungsprojekt)' },
    ],
    steps: [
      'Pro Partei zwei Abrufe an die GDELT-Schnittstelle: einmal die Artikelzahl (Aufmerksamkeit), einmal den durchschnittlichen Ton deutschsprachiger Berichterstattung.',
      'Beide Reihen auf Wochen gemittelt; die Aufmerksamkeit zusätzlich als Anteil an allen Parteien-Erwähnungen dieser Woche normiert.',
      'Das Ergebnis unverändert neben den DAWUM-Umfragetrend derselben Partei gestellt — keine Verrechnung, keine Vorhersage.',
    ],
    caveats: [
      'Die GDELT-Schnittstelle liefert nur ein rollierendes, jüngeres Zeitfenster; eine längere Historie wäre erst über GDELT BigQuery möglich.',
      'Die Suchbegriffe je Partei sind mehrdeutig (z. B. überschneiden sich Berichte über die Partei mit Berichten über einzelne Politiker:innen); Ton ist außerdem keine Richtungsangabe — negative Berichterstattung kann z. B. auch Kritik an Gegnern meinen.',
      'Für Grüne und Linke liefert die GDELT-Schnittstelle aktuell durchgängig eine Leerantwort — in jeder getesteten Schreibweise (Vollname, Kurzform, mit/ohne Anführungszeichen). Andere Parteien sind davon nicht betroffen; die Ursache liegt vermutlich an der GDELT-Indexierung selbst, nicht an unserer Abfrage. Für diese beiden Parteien zeigt die Seite deshalb ehrlich „kein verwertbares Signal" statt erfundener Werte.',
      'Noch nicht validiert: Ob das Signal den Umfragen vorausläuft, ist eine offene Frage, kein geprüftes Ergebnis. Nächster Schritt wäre ein Modell mit Out-of-Sample-Test gegen eine einfache Basislinie.',
    ],
  },
]

export default werkstatt
