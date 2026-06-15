import stories from '../data/stories/index.js'
import Masthead from '../components/Masthead.jsx'
import StoryCard from '../components/StoryCard.jsx'

export default function Gallery() {
  const featured = stories.find((s) => s.featured)
  const rest = stories.filter((s) => !s.featured)

  return (
    <div className="flex flex-col gap-8">
      <Masthead />

      {featured && (
        <StoryCard story={featured} variant="lead" />
      )}

      {rest.length > 0 && (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
        >
          {rest.map((story) => (
            <StoryCard key={story.key} story={story} variant="small" />
          ))}
        </div>
      )}
    </div>
  )
}
