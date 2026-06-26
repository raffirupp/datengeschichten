import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Gallery from './pages/Gallery.jsx'
import StoryPage from './pages/StoryPage.jsx'
import WerkstattPage from './pages/WerkstattPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Gallery />} />
      <Route path="/story/:key" element={<Layout><StoryPage /></Layout>} />
      <Route path="/werkstatt" element={<Layout><WerkstattPage /></Layout>} />
    </Routes>
  )
}
