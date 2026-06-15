import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Gallery from './pages/Gallery.jsx'
import StoryPage from './pages/StoryPage.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/story/:key" element={<StoryPage />} />
      </Routes>
    </Layout>
  )
}
