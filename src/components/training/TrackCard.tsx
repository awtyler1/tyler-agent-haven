import { Track, getTrackProgress } from '@/data/trainingData';

const COVER_GRADIENTS: Record<Track['coverTheme'], string> = {
  foundations: 'linear-gradient(135deg, #3D3929 0%, #5A4E38 100%)',
  growth: 'linear-gradient(135deg, #2E3D28 0%, #4A5E3A 100%)',
  marketing: 'linear-gradient(135deg, #2A3040 0%, #3E4D62 100%)',
  compliance: 'linear-gradient(135deg, #3D2929 0%, #5A3838 100%)',
};

interface TrackCardProps {
  track: Track;
}

export function TrackCard({ track }: TrackCardProps) {
  const { total, percent } = getTrackProgress(track);
  const pdfCount = track.lessons.filter(l => l.contentTypes.includes('pdf')).length;
  const totalMinutes = track.lessons.reduce((sum, l) => sum + l.durationMinutes, 0);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
      }}
    >
      {/* Cover header */}
      <div
        style={{
          height: 60,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '0 16px 8px',
          background: COVER_GRADIENTS[track.coverTheme],
        }}
      >
        {/* Gold radial overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 80% at 80% 40%, rgba(201,168,76,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Watermark number */}
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 14,
            fontFamily: "'Lora', serif",
            fontSize: 32,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.06)',
            lineHeight: 1,
          }}
        >
          {track.trackNumber}
        </span>

        {/* Track label */}
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            fontSize: 9,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
          }}
        >
          Track {track.trackNumber}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 10px' }}>
        <div
          style={{
            fontFamily: "'Lora', serif",
            fontSize: 14.5,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 3,
          }}
        >
          {track.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.4,
            marginBottom: 10,
          }}
        >
          {track.description}
        </div>

        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 10,
            color: 'var(--text-faint)',
            fontWeight: 500,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {total} lessons
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {pdfCount} PDFs
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {totalMinutes} min
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #F5F0E8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            flex: 1,
            height: 3,
            background: 'var(--bg-muted)',
            borderRadius: 2,
            overflow: 'hidden',
            marginRight: 10,
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: 2,
              width: `${percent}%`,
              background: percent > 0 ? 'linear-gradient(90deg, var(--gold-dark), var(--gold))' : 'transparent',
            }}
          />
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: percent > 0 ? 'var(--gold-dark)' : 'var(--text-faint)',
          }}
        >
          {percent > 0 ? `${percent}%` : '\u2014'}
        </span>
      </div>
    </div>
  );
}
