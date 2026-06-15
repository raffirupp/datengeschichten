import { Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import stories from '../data/stories/index.js'
import storyComponents from '../data/storyComponents.js'

export default function StoryPage() {
  const { key } = useParams()
  const story = stories.find((s) => s.key === key)

  if (!story) {
    return (
      <div className="flex flex-col gap-4">
        <p style={{ color: 'var(--color-muted)' }}>Geschichte nicht gefunden.</p>
        <Link
          to="/"
          className="text-sm underline"
          style={{ color: 'var(--color-accent)' }}
        >
          ← Zurück zur Übersicht
        </Link>
      </div>
    )
  }

  const StoryComponent = storyComponents[key]

  if (!StoryComponent) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <Link
          to="/"
          className="no-underline text-sm"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
        >
          ← Zurück
        </Link>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontVariationSettings: '"opsz" 36',
            fontSize: '2rem',
            fontWeight: 600,
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          {story.title}
        </h1>
        {story.teaser && (
          <p className="leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {story.teaser}
          </p>
        )}
        <p
          className="text-sm italic"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
        >
          Diese Geschichte ist noch in Arbeit.
        </p>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <p
          className="text-sm"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}
        >
          Lädt …
        </p>
      }
    >
      <StoryComponent />
    </Suspense>
  )
}
