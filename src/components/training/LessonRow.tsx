import { Lesson } from '@/data/trainingData';

interface LessonRowProps {
  lesson: Lesson;
  index: number;
}

export function LessonRow({ lesson, index }: LessonRowProps) {
  const isDone = lesson.status === 'completed';
  const isCurrent = lesson.status === 'current';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '11px 20px',
        borderBottom: '1px solid #FAF6F0',
        cursor: 'pointer',
        transition: 'background 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        background: isCurrent ? 'rgba(201,168,76,0.04)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isCurrent
          ? 'rgba(201,168,76,0.06)'
          : 'var(--bg-warm-glow)';
        const action = e.currentTarget.querySelector('[data-action]') as HTMLElement;
        if (action) action.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isCurrent
          ? 'rgba(201,168,76,0.04)'
          : 'transparent';
        const action = e.currentTarget.querySelector('[data-action]') as HTMLElement;
        if (action && !isCurrent) action.style.opacity = '0';
      }}
    >
      {/* Status dot */}
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          ...(isDone && {
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
            color: 'white',
          }),
          ...(isCurrent && {
            background: 'white',
            border: '2px solid var(--gold)',
            color: 'var(--gold-dark)',
          }),
          ...(lesson.status === 'locked' && {
            background: 'var(--bg-subtle)',
            color: 'var(--text-faint)',
            border: '1px solid var(--bg-muted)',
          }),
        }}
      >
        {isDone ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          index + 1
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: isCurrent ? 600 : 500,
            color: isDone ? 'var(--text-faint)' : 'var(--text-primary)',
          }}
        >
          {lesson.title}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}>
          {lesson.subtitle}
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Content type chips */}
        <div style={{ display: 'flex', gap: 3 }}>
          {lesson.contentTypes.map((type) => (
            <div
              key={type}
              style={{
                width: 6,
                height: 6,
                borderRadius: 2,
                background: type === 'video' ? 'var(--blue)' : 'var(--amber)',
              }}
            />
          ))}
        </div>

        {/* Duration */}
        <div style={{ fontSize: 10, color: 'var(--text-faint)', minWidth: 32, textAlign: 'right' as const }}>
          {lesson.durationMinutes} min
        </div>

        {/* Action button */}
        <div
          data-action
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--blue)',
            opacity: isCurrent ? 1 : 0,
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {isCurrent ? (
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ) : (
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
