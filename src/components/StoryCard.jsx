import { Link } from 'react-router-dom'
import { colorsFor } from '../lib/categoryColors.js'
import StoryMotif from './StoryMotif.jsx'

function Badge({ status, color }) {
  const isExperiment = status === 'experiment'
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
      style={{
        border: isExperiment ? '1px dashed var(--color-muted)' : '1px solid var(--color-rule)',
        color: 'var(--color-muted)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: isExperiment ? 'var(--color-muted)' : color }} />
      {isExperiment ? 'Experiment' : 'geplant'}
    </span>
  )
}

function CardInner({ story, variant, colors }) {
  const isLead = variant === 'lead'

  return (
    <div
      className="group border bg-paper transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex flex-col"
      style={{
        borderColor: 'var(--color-rule)',
        borderRadius: '0 0 8px 8px',
        borderTop: `3px solid ${colors.color}`,
      }}
    >
      {isLead ? (
        <div className="flex flex-col sm:flex-row gap-6 p-6">
          <div className="flex-1 flex flex-col gap-3">
            {story.kicker && (
              <span
                className="text-xs tracking-[.12em] uppercase"
                style={{ fontFamily: 'var(--font-mono)', color: colors.text }}
              >
                {story.kicker}
              </span>
            )}
            <div>
              <h2
                className="leading-[1.1] mb-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontVariationSettings: '"opsz" 36',
                  fontSize: '1.7rem',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                }}
              >
                {story.title}
              </h2>
              <div
                className="h-[3px] rounded-sm mb-3"
                style={{ width: '46px', backgroundColor: colors.color }}
              />
            </div>
            {story.teaser && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                {story.teaser}
              </p>
            )}
            {story.status !== 'live' && (
              <div className="mt-auto pt-2">
                <Badge status={story.status} color={colors.color} />
              </div>
            )}
          </div>
          <div className="sm:w-56 shrink-0">
            <StoryMotif />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 p-5">
          {story.kicker && (
            <span
              className="text-xs tracking-[.12em] uppercase"
              style={{ fontFamily: 'var(--font-mono)', color: colors.text }}
            >
              {story.kicker}
            </span>
          )}
          <h2
            className="leading-snug"
            style={{
              fontFamily: 'var(--font-display)',
              fontVariationSettings: '"opsz" 18',
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--color-ink)',
            }}
          >
            {story.title}
          </h2>
          {story.teaser && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {story.teaser}
            </p>
          )}
          {story.status !== 'live' && (
            <div className="mt-auto pt-1">
              <Badge status={story.status} color={colors.color} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function StoryCard({ story, variant = 'small' }) {
  const colors = colorsFor(story.category)

  if (story.status === 'live' || story.status === 'experiment') {
    return (
      <Link to={`/story/${story.key}`} className="no-underline block">
        <CardInner story={story} variant={variant} colors={colors} />
      </Link>
    )
  }

  return <CardInner story={story} variant={variant} colors={colors} />
}
