import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Gallery from './pages/Gallery.jsx'
import StoryPage from './pages/StoryPage.jsx'
import WerkstattPage from './pages/WerkstattPage.jsx'

// Alte Einzel-URLs der zusammengelegten FR/DE-Vergleichsstorys — Bookmarks bleiben gültig.
const MERGED_FR_GE_REDIRECTS = ['vergleich-leben', 'vergleich-geld', 'vergleich-handel', 'vergleich-menschen']

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Gallery />} />
      {MERGED_FR_GE_REDIRECTS.map((key) => (
        <Route
          key={key}
          path={`/story/${key}`}
          element={<Navigate to="/story/vergleich-frankreich-deutschland" replace />}
        />
      ))}
      <Route path="/story/:key" element={<Layout><StoryPage /></Layout>} />
      <Route path="/werkstatt" element={<Layout><WerkstattPage /></Layout>} />
    </Routes>
  )
}
