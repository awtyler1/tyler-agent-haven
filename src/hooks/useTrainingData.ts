import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Track, Lesson, Playbook } from '@/data/trainingData';

export function useTrainingData() {
  const { profile } = useAuth();

  const tracksQuery = useQuery({
    queryKey: ['training-tracks', profile?.id],
    queryFn: async (): Promise<Track[]> => {
      // Fetch tracks
      const { data: tracks, error: tracksErr } = await supabase
        .from('training_tracks')
        .select('*')
        .eq('is_published', true)
        .order('sort_order');

      if (tracksErr) throw tracksErr;
      if (!tracks?.length) return [];

      // Fetch all published lessons
      const { data: lessons, error: lessonsErr } = await supabase
        .from('training_lessons')
        .select('*')
        .eq('is_published', true)
        .order('sort_order');

      if (lessonsErr) throw lessonsErr;

      // Fetch agent's progress (if logged in)
      const progressMap = new Map<string, { status: string; completed_at: string | null }>();
      if (profile?.id) {
        const { data: progress } = await supabase
          .from('training_lesson_progress')
          .select('lesson_id, status, completed_at')
          .eq('profile_id', profile.id);

        if (progress) {
          progress.forEach(p => progressMap.set(p.lesson_id, {
            status: p.status,
            completed_at: p.completed_at,
          }));
        }
      }

      // Fetch playbooks
      const { data: playbooks, error: playbooksErr } = await supabase
        .from('training_playbooks')
        .select('*')
        .eq('is_published', true)
        .order('sort_order');

      if (playbooksErr) throw playbooksErr;

      // Assemble into Track objects matching existing type shape
      return tracks.map(track => {
        const trackLessons = (lessons || [])
          .filter(l => l.track_id === track.id)
          .map((l): Lesson => {
            const progress = progressMap.get(l.id);
            let status: 'completed' | 'current' | 'locked' = 'locked';
            if (progress) {
              status = progress.status as 'completed' | 'current' | 'locked';
            }
            return {
              id: l.id,
              title: l.title,
              subtitle: l.subtitle || '',
              durationMinutes: l.duration_minutes,
              contentTypes: (l.content_types || ['video']) as ('video' | 'pdf')[],
              status,
              videoUrl: l.video_url || undefined,
              pdfUrl: l.pdf_url || undefined,
            };
          });

        const trackPlaybooks = (playbooks || [])
          .filter(p => p.track_id === track.id)
          .map((p): Playbook => ({
            id: p.id,
            title: p.title,
            pages: p.pages,
            iconColor: p.icon_color as 'red' | 'green' | 'blue' | 'amber',
            pdfUrl: p.pdf_url || undefined,
          }));

        return {
          id: track.id,
          title: track.title,
          description: track.description || '',
          coverTheme: track.cover_theme as Track['coverTheme'],
          trackNumber: track.track_number,
          lessons: trackLessons,
          playbooks: trackPlaybooks,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    tracks: tracksQuery.data || [],
    isLoading: tracksQuery.isLoading,
    error: tracksQuery.error,
  };
}
