export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  contentTypes: ('video' | 'pdf')[];
  status: 'completed' | 'current' | 'locked';
  videoUrl?: string;
  pdfUrl?: string;
}

export interface Track {
  id: string;
  title: string;
  description: string;
  coverTheme: 'foundations' | 'growth' | 'marketing' | 'compliance';
  trackNumber: string;
  lessons: Lesson[];
  playbooks: Playbook[];
}

export interface Playbook {
  id: string;
  title: string;
  pages: number;
  iconColor: 'red' | 'green' | 'blue' | 'amber';
  pdfUrl?: string;
}

export function getTrackProgress(track: Track): {
  completed: number;
  total: number;
  percent: number;
  currentLesson: Lesson | null;
} {
  const completed = track.lessons.filter(l => l.status === 'completed').length;
  const total = track.lessons.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const currentLesson = track.lessons.find(l => l.status === 'current') || null;
  return { completed, total, percent, currentLesson };
}

export function getAllPlaybooks(tracks: Track[]): Playbook[] {
  return tracks.flatMap(t => t.playbooks);
}

export function getContinueTarget(tracks: Track[]): { track: Track; lesson: Lesson; completed: number; total: number } | null {
  for (const track of tracks) {
    const progress = getTrackProgress(track);
    if (progress.currentLesson) {
      return { track, lesson: progress.currentLesson, completed: progress.completed, total: progress.total };
    }
  }
  return null;
}
