# datengeschichten — Projektbriefing

Redaktionelle Datenvisualisierungs-Showcase. Kein Bezug zu wer-wird-diplomatin.

**Lokal:** `/Users/raffaelruppert/Desktop/datengeschichten`
**GitHub:** https://github.com/raffirupp/datengeschichten (öffentlich)
**Vercel:** Auto-Deploy bei Push auf `main`

## Tech-Stack

React 19 · Vite · Tailwind CSS v4 (`@tailwindcss/vite`, CSS-basierte Config) · React Router v7 · d3-array, d3-geo, d3-scale, d3-shape (eigene SVG, kein Kartenframework) · scrollama

**Dev:** `npm run dev` — **Vor jedem Commit:** `npm run build && npm run lint`

## Design-Tokens (`src/index.css`)

| Token | Wert | Rubrik |
|---|---|---|
| `paper` | #F7F4EC | Hintergrund |
| `ink` | #17150F | Primärtext |
| `accent` | #1C5D57 | Europa (Petrol) |
| `accentWarm` | #BE5A3C | Deutschland (Korall) |
| `accentGold` | #C08A1E | Wirtschaft (Ocker) |
| `muted` | #6B6658 | Labor/Experiment (Grau) |
| `rule` | #D8D2C4 | Trennlinien |

Schriften: Fraunces Variable (Display), Geist (Sans), Geist Mono (Kicker/Labels/Zahlen).
**Markenfarben (`categoryColors.js`) und Datenfarben (`leftRightColor.js`, `partyColors.js`) nie mischen.**

## Neue Story anlegen — Pflichtschritte

1. Eintrag in `src/data/stories/index.js` (`{ key, title, teaser, category, kicker, status }`)
2. Eintrag in `src/data/storyComponents.js` (`key → lazy(() => import(...))`)
3. Story-Komponente in `src/pages/stories/`
4. Eintrag in `src/data/werkstatt.js`
5. **Gallery.jsx / StoryPage.jsx nie anfassen** — die lesen die Registry generisch

`status`: `"live"` | `"experiment"` (klickbar, gestricheltes Badge) | `"geplant"` (nicht klickbar)

## Datenpipelines

Rohdaten immer nach `data-prep/raw/`, nie nach `src/`. Skripte in `data-prep/build-*.mjs`, registriert als `data:*`-Scripts in `package.json`.

**Wichtig:** Bei neuen API-Quellen immer zuerst einen einzelnen Test-Call machen und Antwortstruktur prüfen — nie Feldnamen raten.

### Vorhandene Pipelines

| Script | npm run | Quelle |
|---|---|---|
| build-europe-governments.mjs | data:europe | ParlGov |
| build-europe-geo.mjs | data:geo | GISCO |
| build-polls.mjs | data:polls | DAWUM (ODbL) |
| build-laender-governments.mjs | data:laender | Wikidata SPARQL |
| build-laender-geo.mjs | data:laender-geo | GISCO NUTS-1 |
| build-gdelt-signal.mjs | data:gdelt | GDELT Doc API |

### CPP-BT (Bundestagsreden)

Quelle: Sean Fobbe, [Codeberg](https://codeberg.org/seanfobbe/cpp-bt) + [Zenodo](https://zenodo.org/records/15462956)
Lizenz: **gemeinfrei (copyright-free)** · Stand: 2026-01-17
Dateien: `data-prep/raw/cpp-bt/` (in .gitignore, nicht ins Repo)
- `CPP-BT_2026-01-17_DE_CSV_Reden_Gesamt.csv` — Redetexte ab 18. WP
- `CPP-BT_2026-01-17_DE_CSV_Reden_Metadaten.csv` — Metadaten

## GDELT-Regeln (hart erkämpft)

- Einzelwörter **nie** in Anführungszeichen (`"CDU"` → Fehler "phrase too short")
- Rate-Limit ist massiv — Skript cached jeden Erfolg einzeln, Retry mit 12s Pause
- GRÜNE/LINKE liefern konsequent leere Antworten (GDELT-Eigenheit, kein Bug)

## ScrollMap-Muster

```jsx
<ScrollMap
  beats={...}
  highlightKey="iso3"
  manualYear={manualYear}
  onActiveBeatChange={fn}
  renderMap={(year, highlight) => <KartenKomponente />}
/>
```
View-Umschalter (geo/Kacheln) muss in `renderMap` selbst, sonst scrollt Klick nach oben.

## Stolpersteine

- **Wikidata Partei-Bug:** Bei mehreren offenen Mitgliedschaften → die mit **spätestem Startdatum** nehmen
- **leftRightColor:** braucht `meta.valueMin/valueMax` — falls JSON das nicht mitliefert, im Component selbst berechnen (s. LaenderStory.jsx)
- **DAWUM:** `Results` liegt direkt im Survey-Objekt, nicht in `Tastes`
- **papaparse** ist devDependency — in Pipeline-Skripten mit `import Papa from 'papaparse'` nutzbar
