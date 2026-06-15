import { Link } from 'react-router-dom'
import stories from '../data/stories/index.js'

function groupByCategory(items) {
  return items.reduce((acc, story) => {
    const cat = story.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(story)
    return acc
  }, {})
}

function StoryCard({ story }) {
  const isLive = story.status === 'live'

  const card = (
    <div className="group border border-rule rounded-lg p-5 bg-paper hover:border-accent transition-colors flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h2
          className="text-lg font-semibold leading-snug text-ink group-hover:text-accent transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {story.title}
        </h2>
        {!isLive && (
          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full border border-rule text-muted mt-0.5">
            geplant
          </span>
        )}
      </div>
      {story.teaser && (
        <p className="text-sm text-muted leading-relaxed">{story.teaser}</p>
      )}
    </div>
  )

  if (isLive) {
    return (
      <Link to={`/story/${story.key}`} className="no-underline">
        {card}
      </Link>
    )
  }

  return <div>{card}</div>
}

export default function Gallery() {
  const grouped = groupByCategory(stories)
  const categories = Object.keys(grouped).sort()

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1
          className="text-4xl font-semibold tracking-tight text-ink mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Alle Geschichten
        </h1>
        <p className="text-muted">Daten, die erzählen.</p>
      </div>

      {categories.map((cat) => (
        <section key={cat}>
          <h2
            className="text-xs font-semibold uppercase tracking-widest text-muted mb-4 pb-2 border-b border-rule"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {cat}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped[cat].map((story) => (
              <StoryCard key={story.key} story={story} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
