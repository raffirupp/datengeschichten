import stories from '../data/stories/index.js'
import categoryMap, { colorsFor } from '../lib/categoryColors.js'
import Masthead from '../components/Masthead.jsx'
import StoryCard from '../components/StoryCard.jsx'

function groupByCategory(items) {
  const order = Object.keys(categoryMap)
  const groups = new Map()
  for (const item of items) {
    if (!groups.has(item.category)) groups.set(item.category, [])
    groups.get(item.category).push(item)
  }
  return [...groups.entries()].sort(
    (a, b) => order.indexOf(a[0]) - order.indexOf(b[0])
  )
}

export default function Gallery() {
  const featured = stories.find((s) => s.featured)
  const rest = stories.filter((s) => !s.featured)
  const groups = groupByCategory(rest)

  return (
    <div className="flex flex-col gap-8">
      <Masthead />

      {featured && (
        <StoryCard story={featured} variant="lead" />
      )}

      {groups.map(([category, items]) => (
        <div key={category} className="flex flex-col gap-4">
          <span
            className="text-xs tracking-[.12em] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: colorsFor(category).text }}
          >
            {category}
          </span>
          <div className="flex flex-wrap gap-4">
            {items.map((story) => (
              <div key={story.key} style={{ flex: '1 1 240px', maxWidth: '320px' }}>
                <StoryCard story={story} variant="small" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
