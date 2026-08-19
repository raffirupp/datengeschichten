import { lazy } from 'react'

const storyComponents = {
  'europa-faerbt':       lazy(() => import('../pages/stories/EuropeStory.jsx')),
  'wahltrend-bundestag': lazy(() => import('../pages/stories/WahltrendStory.jsx')),
  'wahltrend-laender':   lazy(() => import('../pages/stories/WahltrendLaenderStory.jsx')),
  'laender-faerben':     lazy(() => import('../pages/stories/LaenderStory.jsx')),
  'nachrichten-signal':  lazy(() => import('../pages/stories/NachrichtenSignalStory.jsx')),
  'bundestag-sprache':   lazy(() => import('../pages/stories/BundestagSpracheStory.jsx')),
  'landtag-sprache':      lazy(() => import('../pages/stories/LandtagSpracheStory.jsx')),
  'nachrichten-quellen':  lazy(() => import('../pages/stories/NachrichtenQuellenStory.jsx')),
  'vergleich-frankreich-deutschland': lazy(() => import('../pages/stories/VergleichFrankreichDeutschlandStory.jsx')),
}

export default storyComponents
