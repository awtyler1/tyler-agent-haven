import { useEffect } from 'react';
import { TRACKS, getContinueTarget, getAllPlaybooks } from '@/data/trainingData';
import { ContinueCard, ContinueCardEmpty } from '@/components/training/ContinueCard';
import { TrackCard } from '@/components/training/TrackCard';
import { LessonRow } from '@/components/training/LessonRow';
import { PlaybookCard } from '@/components/training/PlaybookCard';

export default function TrainingLibrary() {
  const continueTarget = getContinueTarget();
  const playbooks = getAllPlaybooks();

  // Find the active track (one with a current lesson) for the lesson list
  const activeTrack = TRACKS.find(t => t.lessons.some(l => l.status === 'current')) || TRACKS[0];

  useEffect(() => {
    document.title = 'Training Library | TIG Platform';
  }, []);

  return (
    <div
      style={{
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column' as const,
        minHeight: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 12%, var(--bg-warm-glow) 0%, var(--bg) 70%)',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto' as const }}>
        <div style={{ maxWidth: 840, width: '100%', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ padding: '28px 48px 0' }}>
            <div
              style={{
                fontFamily: "'Lora', serif",
                fontSize: 25,
                fontWeight: 400,
                color: 'var(--text-primary)',
                marginBottom: 3,
              }}
            >
              Your <em style={{ fontStyle: 'italic', color: 'var(--gold-dark)' }}>Library</em>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Pick up where you left off, explore a new track, or grab a playbook for your next appointment.
            </div>
          </div>

          {/* Continue Card */}
          {continueTarget ? (
            <ContinueCard
              track={continueTarget.track}
              lesson={continueTarget.lesson}
              completed={continueTarget.completed}
              total={continueTarget.total}
            />
          ) : (
            <ContinueCardEmpty />
          )}

          {/* Learning Tracks */}
          <div style={{ padding: '0 48px', marginTop: 30 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontFamily: "'Lora', serif",
                  fontStyle: 'italic',
                  fontSize: 13.5,
                  color: 'var(--text-muted)',
                }}
              >
                Learning Tracks
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {TRACKS.map((track) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          </div>

          {/* Lesson List */}
          <div style={{ padding: '0 48px', marginTop: 30 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontFamily: "'Lora', serif",
                  fontStyle: 'italic',
                  fontSize: 13.5,
                  color: 'var(--text-muted)',
                }}
              >
                {activeTrack.title}
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--blue)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View all tracks →
              </span>
            </div>
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}
            >
              {activeTrack.lessons.map((lesson, idx) => (
                <LessonRow key={lesson.id} lesson={lesson} index={idx} />
              ))}
            </div>
          </div>

          {/* Playbook Shelf */}
          <div style={{ padding: '0 48px', marginTop: 30 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontFamily: "'Lora', serif",
                  fontStyle: 'italic',
                  fontSize: 13.5,
                  color: 'var(--text-muted)',
                }}
              >
                Playbook Shelf
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--blue)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Browse all →
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 10,
                marginBottom: 48,
              }}
            >
              {playbooks.map((pb) => (
                <PlaybookCard key={pb.id} playbook={pb} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
