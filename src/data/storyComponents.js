import { lazy } from 'react'

const storyComponents = {
  'europa-faerbt': lazy(() => import('../pages/stories/EuropeStory.jsx')),
}

export default storyComponents
