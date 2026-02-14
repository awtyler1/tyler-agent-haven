import { Track, Lesson } from '@/data/trainingData';

interface ContinueCardProps {
  track: Track;
  lesson: Lesson;
  completed: number;
  total: number;
}

export function ContinueCard({ track, lesson, completed, total }: ContinueCardProps) {
  const lessonIndex = track.lessons.findIndex(l => l.id === lesson.id) + 1;

  const descParts: string[] = [];
  if (lesson.contentTypes.includes('video')) descParts.push(`${lesson.durationMinutes} min video`);
  if (lesson.contentTypes.includes('pdf')) descParts.push('comparison cheat sheet');
  const desc = `${lesson.subtitle}${descParts.length ? ' — ' + descParts.join(' + ') : ''}`;

  return (
    <div
      style={{
        margin: '22px 48px 0',
        background: 'var(--bg-card)',
        borderRadius: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,0.05), 0 0 0 1px rgba(201,168,76,0.08)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.07), 0 0 0 1px rgba(201,168,76,0.12)';
        const play = e.currentTarget.querySelector('[data-play]') as HTMLElement;
        if (play) {
          play.style.transform = 'scale(1.06)';
          play.style.boxShadow = '0 6px 20px rgba(201,168,76,0.3), 0 0 32px rgba(201,168,76,0.12)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05), 0 0 0 1px rgba(201,168,76,0.08)';
        const play = e.currentTarget.querySelector('[data-play]') as HTMLElement;
        if (play) {
          play.style.transform = '';
          play.style.boxShadow = '0 4px 16px rgba(201,168,76,0.25), 0 0 24px rgba(201,168,76,0.08)';
        }
      }}
    >
      {/* Gold accent bar */}
      <div
        style={{
          width: 5,
          flexShrink: 0,
          background: 'linear-gradient(180deg, var(--gold), var(--gold-dark))',
        }}
      />

      {/* Inner content */}
      <div
        style={{
          flex: 1,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          background: 'linear-gradient(135deg, rgba(201,168,76,0.03) 0%, transparent 50%)',
        }}
      >
        {/* Play button */}
        <div
          data-play
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            flexShrink: 0,
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(201,168,76,0.25), 0 0 24px rgba(201,168,76,0.08)',
            transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginLeft: 2 }}
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--gold-dark)',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              marginBottom: 5,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'var(--gold)',
                flexShrink: 0,
              }}
            />
            {track.title} · Lesson {lessonIndex}
          </div>
          <div
            style={{
              fontFamily: "'Lora', serif",
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 5,
            }}
          >
            {lesson.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {desc}
          </div>
        </div>

        {/* Fraction */}
        <div
          style={{
            textAlign: 'right' as const,
            flexShrink: 0,
            paddingLeft: 20,
            borderLeft: '1px solid #F0EBE2',
          }}
        >
          <div
            style={{
              fontFamily: "'Lora', serif",
              fontSize: 32,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {completed}
            <span style={{ fontSize: 16, color: 'var(--text-faint)', fontWeight: 400 }}>
              {' '}/ {total}
            </span>
          </div>
          <div
            style={{
              fontSize: 9,
              color: 'var(--text-faint)',
              marginTop: 3,
              fontWeight: 500,
            }}
          >
            lessons done
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContinueCardEmpty() {
  return (
    <div
      style={{
        margin: '22px 48px 0',
        padding: '24px 28px',
        background: 'var(--bg-card)',
        borderRadius: 14,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        textAlign: 'center' as const,
      }}
    >
      <div
        style={{
          fontFamily: "'Lora', serif",
          fontSize: 16,
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginBottom: 4,
        }}
      >
        Pick a track below to start learning
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Your progress will be saved automatically.
      </div>
    </div>
  );
}
