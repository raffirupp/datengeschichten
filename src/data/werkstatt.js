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
    title: 'Wahltrend Bundestag & House-Effects',
    storyKey: 'wahltrend-bundestag',
    summary: 'Alle veröffentlichten Sonntagsfrage-Umfragen seit 2019, zusammengeführt zu einem geglätteten Trend — und darunter: eine vollständige Analyse, welche Institute welche Parteien systematisch höher oder niedriger schätzen als die Kollegen.',
    sources: [
      { name: 'DAWUM', url: 'https://dawum.de', license: 'ODbL (mit Quellenangabe)' },
    ],
    steps: [
      'Die Rohdaten kommen von DAWUM — alle veröffentlichten Sonntagsfragen zur Bundestagswahl seit Juni 2019 (1.943 Umfragen von 12 Instituten). Pro Umfrage: Datum, Institut, Stichprobengröße, Prozentwerte je Partei.',
      'Für den Trend wird für jeden Umfragetag ein gewichteter Mittelwert über alle Umfragen der vorangegangenen 21 Tage berechnet. Neuere Umfragen und solche mit größerer Stichprobe gehen stärker ein.',
      'Für die House-Effects-Analyse verwenden wir Leave-One-Out: Wenn wir den Konsens für eine Umfrage von Institut X berechnen, schließen wir alle Umfragen von Institut X selbst aus dem Berechnungsfenster aus. So kann ein Institut die eigene Baseline nicht aufblasen.',
      'Die Abweichung einer Umfrage ist: Wert des Instituts minus Konsens-Wert zum gleichen Zeitpunkt. Positiv = Institut schätzt diese Partei höher als der Rest, negativ = niedriger.',
      'Pro Institut und Partei aggregieren wir über alle Umfragen: Mittelwert der Abweichungen, Anzahl n, Streuungsmaß. Zellen mit n < 5 werden als zu dünn markiert und nicht gleichwertig angezeigt.',
      'Stabilitäts-Check: Wir teilen den Zeitraum in drei Perioden (vor Bundestagswahl 2021, zwischen den Wahlen 2021–2025, seit Bundestagswahl 2025) und prüfen, ob die Abweichung in allen Perioden in dieselbe Richtung zeigt. Wechselt die Richtung, markieren wir die Zelle als instabil.',
    ],
    caveats: [
      'Der Konsens ist kein unabhängiger externer Maßstab — er wird aus den anderen Instituten berechnet. Wenn sich mehrere Institute zusammen irren, sieht das in dieser Analyse wie Konsens aus.',
      'House-Effects und tatsächliche Wahlergebnisse sind zwei verschiedene Dinge. Ob ein Institut, das im Instituts-Vergleich hoch liegt, damit auch näher am wahren Ergebnis liegt, lässt sich hieraus nicht ablesen.',
      'Für BSW (seit 2024 im Bundestag) sind die Stichproben in allen Instituten kleiner. Frühe BSW-Werte — aus einer Phase, als die Partei gerade gegründet wurde und Umfrageerfahrung fehlte — können das Bild verzerren.',
      'Kleine Institute mit wenigen Umfragen (Institut Wahlkreisprognose, GMS, Civey) zeigen teils auffällige Werte — die Stichprobe ist aber zu klein, um daraus eine verlässliche Charakterisierung abzuleiten.',
      'Die Trendlinie im oberen Teil der Story ist nicht House-Effect-bereinigt. Das ist der nächste sinnvolle Schritt: einen Trend bauen, der die hier sichtbaren Schlagseiten herausrechnet.',
    ],
  },
  {
    id: 'nachrichten-signal',
    title: 'Nachrichten-Signal',
    storyKey: 'nachrichten-signal',
    summary: 'Wir haben GDELT Web NGrams via BigQuery befragt: wie oft taucht eine Partei pro Woche in deutschsprachigen Nachrichtentexten auf? Die Häufigkeit haben wir neben die Sonntagsfragen gelegt — und markiert, wo Peaks auf konkrete Ereignisse zurückgehen.',
    sources: [
      { name: 'GDELT Web NGrams 3.0 (via Google BigQuery)', url: 'https://www.gdeltproject.org', license: 'frei nutzbar (Forschungsprojekt)' },
      { name: 'DAWUM (Sonntagsfragen)', url: 'https://dawum.de', license: 'ODbL (mit Quellenangabe)' },
    ],
    steps: [
      'GDELT (Global Database of Events, Language, and Tone) erfasst Wortfrequenzen in frei zugänglichen Nachrichtentexten. Wir haben das BigQuery-Dataset "gdeltv2.webngrams" abgefragt — für alle acht Parteien, deutschsprachige Quellen, 2020 bis 2026.',
      'Pro Woche wird der Erwähnungsanteil einer Partei berechnet: Erwähnungen der Partei / Summe aller Parteierwähnungen dieser Woche. Das macht Wochen mit viel oder wenig Politikberichterstattung vergleichbar — zeigt aber nur relative Verschiebungen, keine absoluten Mengen.',
      'Peaks (lokale Hochpunkte im Signal) wurden manuell mit tatsächlichen Ereignissen verglichen und in einer Datenbank erfasst. Jeder Punkt auf dem Chart lässt sich anklicken — dann erscheint der Kontext plus ein Ausschnitt aus dem DAWUM-Umfragetrend um den Zeitpunkt des Ereignisses.',
      'Die DAWUM-Daten (Sonntagsfragen seit 2019) werden parallel als 21-Tage-gleitender Durchschnitt dargestellt — gewichtet nach Stichprobengröße.',
    ],
    caveats: [
      'GDELT erfasst nur, was frei im Web steht. Spiegel, SZ, Zeit — alles hinter Paywalls fehlt größtenteils. Das Signal repräsentiert das offene Nachrichtennetz, nicht die gesamte deutschsprachige Presselandschaft.',
      'Der Aufmerksamkeitsanteil ist ein Nullsummenspiel: Steigt eine Partei, fallen automatisch die anderen. Das macht echte parallele Ausschläge unsichtbar.',
      '"Grüne" und "Linke" als Suchbegriffe sind problematisch, weil sie auch als Adjektive vorkommen. Wir suchen deshalb über charakteristische Komposita — was den Anteil dieser Parteien systematisch etwas unterbewertet.',
      'Ob Medienpräsenz den Umfragen vorausläuft, bleibt offen. Das wäre der nächste Schritt — ein Modell, das sich statistisch testen lässt.',
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
  {
    id: 'nachrichten-quellen',
    title: 'Wer schreibt worüber?',
    storyKey: 'nachrichten-quellen',
    summary: 'Wir haben GDELT nach den häufigsten Quellen pro Partei gefragt — und dabei vor allem gelernt, was der Datensatz nicht kann.',
    sources: [
      { name: 'GDELT Web NGrams 3.0 (via Google BigQuery)', url: 'https://www.gdeltproject.org', license: 'frei nutzbar (Forschungsprojekt)' },
    ],
    steps: [
      'Aus dem GDELT-BigQuery-Dataset haben wir für Jan 2025–Jun 2026 pro Partei und Domain gezählt, wie oft der Parteiname auf einer URL auftaucht.',
      'Die Domains wurden manuell Mediengruppen zugeordnet (Ippen Digital, Axel Springer, RTL/ntv, öffentlich-rechtlich u.a.) um Konzernstrukturen sichtbar zu machen.',
      'Dargestellt wird: Top 10 Quellen je Partei, und umgekehrt der Parteimix je Domain.',
    ],
    caveats: [
      'Paywalled Medien fehlen fast vollständig. Der Spiegel taucht bei GDELT auf Rang 78 auf — weil seine Inhalte größtenteils nicht frei zugänglich sind. Das verzerrt das Bild erheblich.',
      'Die Ippen Digital Mediengruppe dominiert die Ergebnisse — nicht weil sie besonders wichtig ist, sondern weil sie viele regional verteilte, werbefinanzierte Sites betreibt, die GDELT crawlen kann.',
      'Die Auswertung zeigt Rohhäufigkeiten, keine redaktionelle Gewichtung. Ob eine Domain "wichtig" ist, lässt sich daraus nicht ablesen.',
    ],
  },
]

export default werkstatt
