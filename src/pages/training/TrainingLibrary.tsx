import { useEffect } from 'react';
import { useTrainingData } from '@/hooks/useTrainingData';
import { getContinueTarget, getAllPlaybooks } from '@/data/trainingData';
import { ContinueCard, ContinueCardEmpty } from '@/components/training/ContinueCard';
import { TrackCard } from '@/components/training/TrackCard';
import { LessonRow } from '@/components/training/LessonRow';
import { PlaybookCard } from '@/components/training/PlaybookCard';

export default function TrainingLibrary() {
  const { tracks, isLoading, error } = useTrainingData();
  const continueTarget = getContinueTarget(tracks);
  const playbooks = getAllPlaybooks(tracks);

  // Find the active track (one with a current lesson) for the lesson list
  const activeTrack = tracks.find(t => t.lessons.some(l => l.status === 'current')) || tracks[0];

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

          {/* Error State */}
          {error && (
            <div style={{ padding: '60px 48px', textAlign: 'center' as const }}>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Unable to load training content. Please try again.
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !error && (
            <>
              {/* Continue Card skeleton */}
              <div style={{ padding: '20px 48px 0' }}>
                <div
                  style={{
                    height: 100,
                    borderRadius: 14,
                    background: 'var(--bg-muted)',
                    opacity: 0.5,
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
              </div>
              {/* Track grid skeleton */}
              <div style={{ padding: '30px 48px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      style={{
                        height: 140,
                        borderRadius: 12,
                        background: 'var(--bg-muted)',
                        opacity: 0.5,
                        animation: `pulse 2s ease-in-out ${i * 0.15}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Loaded Content */}
          {!isLoading && !error && tracks.length > 0 && (
            <>
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
                  {tracks.map((track) => (
                    <TrackCard key={track.id} track={track} />
                  ))}
                </div>
              </div>

              {/* Lesson List */}
              {activeTrack && (
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
              )}

              {/* Playbook Shelf */}
              {playbooks.length > 0 && (
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
