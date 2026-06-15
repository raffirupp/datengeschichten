import { useParams, Link } from 'react-router-dom'
import stories from '../data/stories/index.js'

export default function StoryPage() {
  const { key } = useParams()
  const story = stories.find((s) => s.key === key)

  if (!story) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted">Geschichte nicht gefunden.</p>
        <Link to="/" className="text-accent underline text-sm">← Zurück zur Übersicht</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/" className="text-sm text-muted hover:text-accent transition-colors">
        ← Zurück
      </Link>
      <h1
        className="text-4xl font-semibold tracking-tight text-ink"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {story.title}
      </h1>
      {story.teaser && (
        <p className="text-muted leading-relaxed max-w-prose">{story.teaser}</p>
      )}
      <p className="text-sm text-muted italic">Diese Geschichte ist noch in Arbeit.</p>
    </div>
  )
}
