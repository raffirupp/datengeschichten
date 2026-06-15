# datengeschichten

Redaktionelle Datenvisualisierungen — Storytelling mit Daten · data stories · histoires de données.

## Lokal starten

```bash
npm install
npm run dev
```

Öffne [http://localhost:5173](http://localhost:5173).

## Neue Story hinzufügen

Eintrag in `src/data/stories/index.js` ergänzen — erscheint automatisch in der Galerie:

```js
{
  key: 'mein-thema',
  title: 'Titel der Geschichte',
  teaser: 'Kurze Beschreibung.',
  category: 'Kategorie',
  status: 'geplant', // oder: 'live'
}
```

## Deployment

Vercel: Repo importieren, Framework = Vite, Build-Befehl `npm run build`, Output-Ordner `dist`.
Auto-Deploy bei Push auf `main`.

## Tech-Stack

React 19 · Vite · Tailwind CSS v4 · React Router v7
