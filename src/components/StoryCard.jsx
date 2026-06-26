import { Link } from 'react-router-dom'
import { colorsFor } from '../lib/categoryColors.js'
import StoryMotif from './StoryMotif.jsx'

function CategoryPill({ category }) {
  const colors = colorsFor(category)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
      <span style={{
        display: 'inline-block',
        width: '7px', height: '7px',
        borderRadius: '50%',
        backgroundColor: colors.color,
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: colors.text,
      }}>
        {category}
      </span>
    </div>
  )
}

function Badge({ isNew }) {
  if (isNew) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        letterSpacing: '0.06em',
        padding: '0.2rem 0.6rem',
        borderRadius: '99px',
        backgroundColor: 'rgba(28, 93, 87, 0.09)',
        color: '#1C5D57',
      }}>
        neu
      </span>
    )
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      letterSpacing: '0.06em',
      padding: '0.2rem 0.6rem',
      borderRadius: '99px',
      backgroundColor: '#F2F2F2',
      color: '#999999',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#CCCCCC', display: 'inline-block' }} />
      Experiment
    </span>
  )
}

function CardInner({ story, variant }) {
  const isLead = variant === 'lead'
  const colors = colorsFor(story.category)

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 3px 10px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.18s ease, transform 0.18s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.09), 0 12px 30px rgba(0,0,0,0.09)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06), 0 3px 10px rgba(0,0,0,0.06)'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {isLead ? (
        <>
          {/* Thin top color bar for lead card */}
          <div style={{ height: '3px', backgroundColor: colors.color }} />
          <div style={{ display: 'flex', gap: '2rem', padding: '2rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <CategoryPill category={story.category} />
              {story.kicker && (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-muted)',
                }}>
                  {story.kicker}
                </span>
              )}
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontVariationSettings: '"opsz" 36',
                fontSize: 'clamp(1.5rem, 3vw, 1.9rem)',
                fontWeight: 600,
                color: 'var(--color-ink)',
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
                margin: 0,
              }}>
                {story.title}
              </h2>
              {story.teaser && (
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--color-muted)', margin: 0 }}>
                  {story.teaser}
                </p>
              )}
              {story.status !== 'live' && (
                <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                  <Badge isNew={story.isNew} />
                </div>
              )}
            </div>
            <div style={{ width: '180px', flexShrink: 0, alignSelf: 'center' }}>
              <StoryMotif />
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '0.75rem', flex: 1 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontVariationSettings: '"opsz" 20',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--color-ink)',
            lineHeight: 1.2,
            letterSpacing: '-0.015em',
            margin: 0,
          }}>
            {story.title}
          </h2>
          {story.teaser && (
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--color-muted)', margin: 0 }}>
              {story.teaser}
            </p>
          )}
          {story.status !== 'live' && (
            <div style={{ marginTop: 'auto', paddingTop: '0.25rem' }}>
              <Badge isNew={story.isNew} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function StoryCard({ story, variant = 'small' }) {
  if (story.status === 'live' || story.status === 'experiment') {
    return (
      <Link to={`/story/${story.key}`} style={{ textDecoration: 'none', display: 'block' }}>
        <CardInner story={story} variant={variant} />
      </Link>
    )
  }

  return <CardInner story={story} variant={variant} />
}
