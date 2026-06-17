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
      'Grundlage ist ParlGov — eine wissenschaftliche Datenbank, die für mehrere Jahrzehnte die Zusammensetzung von Regierungen in Demokratien erfasst. Pro Eintrag sind die Regierungsparteien mit ihren Sitzanteilen vermerkt sowie ein „left_right"-Wert zwischen 0 (ganz links) und 10 (ganz rechts) pro Partei.',
      'Für jedes Kabinett wird der ideologische Schwerpunkt berechnet: der sitzgewichtete Mittelwert der Links-rechts-Werte aller Regierungsparteien. Eine Koalition aus einer Partei bei 3 und einer bei 7, je zur Hälfte an Sitzen, ergibt eine Regierungsposition von 5.',
      'Für jedes Jahr 2000–2025 wird bestimmt, welches Kabinett zum Jahreswechsel im Amt war. Endet ein Kabinett unterjährig, zählt das Kabinett, das die meisten Tage dieses Jahres aktiv war.',
      'Die ermittelte Zahl wird auf eine Farbskala abgebildet: Petrol (Türkis-Grün) steht für linke Positionen, Korall (Orange-Rot) für rechte — unabhängig von Parteifarben. Länder ohne Daten bleiben grau.',
    ],
    caveats: [
      'ParlGov endet 2023. Jahre danach werden fortgeschrieben; einzelne neuere Wechsel (etwa Deutschland 2025) sind transparent von Hand ergänzt — diese Einträge basieren auf öffentlich verfügbaren Informationen, nicht auf einer wissenschaftlich kuratierten Quelle.',
      'Gefärbt wird nach ideologischer Position, nicht nach Parteifarben. Das ist eine bewusste Entscheidung: Parteifarben wechseln, und ein konsistenter Maßstab über 25 Jahre und viele Länder ist nur über eine einheitliche Skala möglich.',
      'Die Links-rechts-Einordnung ist eine Vereinfachung. Ein Wert von 7 für eine Partei bedeutet: ParlGov-Experten ordnen sie als eher rechts ein — aber eine Partei ist mehr als eine einzige Zahl. Populistische, ökologische oder nationalkonservative Dimensionen werden nicht separat abgebildet.',
      'Koalitionsregierungen mitteln ideologische Unterschiede heraus. Eine Große Koalition aus linker und rechter Partei kann dieselbe Farbe ergeben wie eine Mitte-Partei allein — der Farbton zeigt Richtung, nicht interne Dynamik.',
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
      'Über eine strukturierte Abfrage an Wikidata — die freie Wissensdatenbank hinter Wikipedia — werden alle Regierungschef:innen der 16 Bundesländer seit 2000 mit ihren Amtseintritts- und -austrittsdaten abgerufen. Stadtstaaten (Berlin, Hamburg, Bremen) nutzen dabei dieselbe Eigenschaft wie Flächenländer.',
      'Jeder Person wird ihre Partei zugeordnet (ebenfalls aus Wikidata), und diese Partei wird einem Links-rechts-Wert auf einer Skala von 0 bis 10 zugewiesen. Das ist eine eigene redaktionelle Einordnung, die im Zweifelsfall transparent offengelegt wird.',
      'Pro Kalenderjahr wird bestimmt, welche Person und damit welche Partei am Jahresende an der Regierung war. Die Karte färbt sich entsprechend ein — Petrol für links, Korall für rechts, Grautöne für die Mitte.',
    ],
    caveats: [
      'Die Links-rechts-Werte sind eine offengelegte eigene Einordnung, kein wissenschaftliches Maß. Besonders für Parteien wie BSW oder Freie Wähler ist die Einordnung eine Ermessensfrage: Beide verbinden wirtschaftlich eher konservative mit gesellschaftlich schwer einzuordnenden Positionen.',
      'Wikidata enthält bei einigen ostdeutschen Politiker:innen alte Mitgliedschaften in DDR-Blockparteien (LDPD, Block-CDU). Um hier nicht das falsche Jahrzehnt auszuwerten, wird automatisch die zeitlich zuletzt begonnene Parteimitgliedschaft gewählt.',
      'Die Karte zeigt die Partei des Regierungschefs, nicht die Koalitionszusammensetzung. In einem CDU-geführten Bundesland mit SPD-Koalitionspartnern erscheint die Karte so rechts wie in einem CDU-Alleinregierung — die Koalitionsdynamik bleibt unsichtbar.',
      'Wikidata wird laufend aktualisiert und kann unvollständig oder fehlerhaft sein. Die Abfrage wurde manuell geprüft, aber Fehler in den Grunddaten sind nicht auszuschließen.',
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
      'Die Rohdaten kommen von DAWUM, einer wissenschaftlich betriebenen Plattform, die alle veröffentlichten Sonntagsfragen zur Bundestagswahl sammelt. Pro Umfrage sind Datum, befragendes Institut, Stichprobengröße und die Prozentwerte je Partei verfügbar.',
      'Um aus den Einzelumfragen einen Trend zu machen, wird für jeden Tag ein gewichteter Mittelwert über alle Umfragen berechnet, die in den vorangegangenen 21 Tagen veröffentlicht wurden. Neuere Umfragen und solche mit größerer Stichprobe gehen dabei stärker in den Mittelwert ein.',
      'Das Ergebnis: für jede Partei eine glatte Linie, die kurzfristige Ausreißer einzelner Institute dämpft und längerfristige Bewegungen sichtbar macht. Die Einzelmessungen bleiben als dezente Punkte im Hintergrund.',
    ],
    caveats: [
      'Die Glättung ist Version 1: einfach, transparent und ohne Fehlerbalken. Sie sagt nichts darüber, wie sicher der Trend ist — ob eine Bewegung von 1 Prozentpunkt wirklich ein Signal oder nur Rauschen ist, lässt sich so nicht unterscheiden.',
      'Meinungsforschungsinstitute haben systematische Abweichungen (sogenannte House-Effects): ein Institut überschätzt systematisch CDU, ein anderes systematisch SPD. Diese Schlagseiten werden bisher nicht herausgerechnet — sie verzerren den Trend leicht.',
      'Umfragen messen Wahlabsicht, keine tatsächlichen Wahlergebnisse. Historisch weichen Umfragen kurz vor der Wahl um mehrere Prozentpunkte vom Wahlergebnis ab — und weit vorher noch mehr.',
      'Nächster geplanter Schritt: ein Modell, das House-Effects schätzt und gemeinsam mit dem Trend auch einen Unsicherheitskorridor ausgibt.',
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
      'GDELT (Global Database of Events, Language, and Tone) durchsucht kontinuierlich Nachrichtenseiten weltweit und indexiert Inhalte nach Thema, Tonlage und Ort. Wir nutzen die öffentliche DOC 2.0 API, die für beliebige Suchanfragen tägliche Zeitreihen über die letzten zwölf Monate liefert.',
      'Pro Partei werden zwei Abfragen gestellt: eine für die Artikelzahl (wie viel wird über diese Partei berichtet?) und eine für den Ton (positiv oder negativ im Durchschnitt?). Beide beschränken sich auf deutschsprachige Quellen.',
      'CDU, CSU, SPD, FDP, AfD und BSW werden über ihre Kürzel und gängige Langformen gesucht. Für Grüne und Linke werden stattdessen eindeutige Partei-Komposita verwendet (z. B. „Grünen-Fraktion", „Linken-Chef"), weil die Vollnamen in der GDELT-Indexierung kein zuverlässiges Signal liefern — ihr Aufmerksamkeits-Anteil ist dadurch eine konservative untere Schätzung.',
      'Die täglichen Werte werden auf Kalenderwochen gemittelt. Der Aufmerksamkeitswert wird zusätzlich normiert: Gezeigt wird nicht die absolute Artikelzahl, sondern der Anteil an allen Parteien-Erwähnungen dieser Woche — damit sind Wochen mit insgesamt viel oder wenig Politikberichterstattung miteinander vergleichbar.',
      'Die wöchentliche Reihe wird unverändert neben den DAWUM-Umfragetrend derselben Partei gestellt. Keine Verrechnung, keine Vorhersage — nur die Gegenüberstellung.',
    ],
    caveats: [
      'GDELT indexiert nicht alle deutschsprachigen Nachrichtenquellen gleichmäßig. Große überregionale Titel sind besser abgedeckt als Regionalzeitungen oder Nachrichtenagenturen. Das Signal ist kein repräsentativer Querschnitt der deutschen Presselandschaft.',
      'Die GDELT DOC 2.0 API liefert nur ein rollendes Zeitfenster der letzten zwölf Monate; eine längere Historie wäre erst über den GDELT-Datensatz auf Google BigQuery möglich.',
      'Ton ist keine Richtungsangabe: Ein negativer Tonwert bedeutet nicht, dass die Presse gegen eine Partei ist — negative Formulierungen können auch Berichte sein, in denen die Partei ihrerseits Kritik übt oder Krisen kommentiert.',
      'Für Grüne und Linke liefert die GDELT-Schnittstelle selbst mit Komposita-Suche kein verwertbares Signal — die Seite zeigt das ehrlich statt erfundener Werte. Die Ursache liegt wahrscheinlich in der ungleichmäßigen GDELT-Indexierung deutschsprachiger Quellen für diese Parteien.',
      'Noch nicht validiert: Ob das Signal den Umfragen vorausläuft, ist eine offene Frage, kein geprüftes Ergebnis. Nächster Schritt wäre ein Modell mit Out-of-Sample-Test gegen eine einfache Basislinie.',
    ],
  },
  {
    id: 'bundestag-sprache',
    title: 'Worüber Deutschland spricht',
    storyKey: 'bundestag-sprache',
    summary: 'Über 75.000 Bundestagsreden aus zwölf Jahren (Wahlperioden 18–21, 2014–2025), analysiert nach Keyword-Häufigkeiten in neun Themenfeldern.',
    sources: [
      {
        name: 'CPP-BT (Sean Fobbe)',
        url: 'https://codeberg.org/seanfobbe/cpp-bt',
        license: 'gemeinfrei (copyright-free)',
      },
      {
        name: 'Zenodo (Datensatz-Archiv)',
        url: 'https://zenodo.org/records/15462956',
        license: 'gemeinfrei',
      },
    ],
    steps: [
      'CPP-BT-Datensatz (Stand 2026-01-17) lokal eingelesen: Reden_Gesamt.csv mit 138.000 Zeilen und Redetext.',
      'Reden mit weniger als 20 Tokens (Verfahrensbemerkungen, Zwischenrufe) herausgefiltert — verbleiben 77.822 Reden.',
      'Pro Rede per regulärem Ausdruck Keyword-Treffer für 9 Themen gezählt; Lexikon mit 14–16 Keywords pro Thema.',
      'Je Jahr: Gesamtzahl Treffer pro Thema durch Gesamttokens dividiert, mal eine Million — ergibt Erwähnungen pro Mio. Tokens und macht Jahre mit unterschiedlicher Redezahl vergleichbar.',
      'Jahre 2013 (nur 179 Reden, WP-Start im Oktober) und 2026 (Januar-Schnappschuss) in der Visualisierung ausgeblendet.',
    ],
    caveats: [
      'Keyword-Suche, keine Sprachverarbeitung: ein Wort wie „Migration" zählt, egal ob die Rede Migration befürwortet oder ablehnt — es zählt nur das Thema, nicht die Position.',
      'Das Lexikon ist eine redaktionelle Auswahl, keine linguistische Norm. Themen überschneiden sich (z. B. Gesundheit und Wirtschaft). Die Treffermengen sind untereinander nicht direkt vergleichbar — sinnvoll ist der Verlauf je Thema über die Zeit.',
      'CPP-BT deckt nur die Wahlperioden 18–21 (ab 2013) als maschinenlesbares CSV ab, weil der Bundestag frühere Protokolle nicht in diesem Format veröffentlicht hat. Der Titel „75 Jahre" ist eine redaktionelle Aspiration; die Datenlage reicht zwölf Jahre zurück.',
    ],
  },
]

export default werkstatt
