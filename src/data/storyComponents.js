import { lazy } from 'react'

const storyComponents = {
  'europa-faerbt':       lazy(() => import('../pages/stories/EuropeStory.jsx')),
  'wahltrend-bundestag': lazy(() => import('../pages/stories/WahltrendStory.jsx')),
  'laender-faerben':     lazy(() => import('../pages/stories/LaenderStory.jsx')),
  'nachrichten-signal':  lazy(() => import('../pages/stories/NachrichtenSignalStory.jsx')),
}

export default storyComponents
