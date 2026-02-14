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

// Sample data — hardcoded for V1, will come from Supabase later
export const TRACKS: Track[] = [
  {
    id: 'foundations',
    title: 'Medicare Foundations',
    description: 'Parts A–D, enrollment windows, the conversations that build trust.',
    coverTheme: 'foundations',
    trackNumber: '01',
    lessons: [
      { id: 'f1', title: 'What Is Medicare?', subtitle: 'The four parts, who qualifies', durationMinutes: 5, contentTypes: ['video'], status: 'completed' },
      { id: 'f2', title: 'Parts A & B Deep Dive', subtitle: 'Hospital vs. medical coverage', durationMinutes: 7, contentTypes: ['video'], status: 'completed' },
      { id: 'f3', title: 'Part D & Drug Coverage', subtitle: 'Formularies, tiers, the donut hole', durationMinutes: 6, contentTypes: ['video', 'pdf'], status: 'completed' },
      { id: 'f4', title: 'MA vs. Medigap', subtitle: 'The comparison every agent needs to master', durationMinutes: 6, contentTypes: ['video', 'pdf'], status: 'current' },
      { id: 'f5', title: 'Enrollment Windows', subtitle: 'IEP, AEP, OEP, SEP — when clients can make changes', durationMinutes: 8, contentTypes: ['video', 'pdf'], status: 'locked' },
      { id: 'f6', title: 'The T65 Conversation', subtitle: 'The appointment that builds your book', durationMinutes: 5, contentTypes: ['video', 'pdf'], status: 'locked' },
      { id: 'f7', title: 'Common Mistakes & Myths', subtitle: 'The 10 things clients get wrong', durationMinutes: 6, contentTypes: ['video'], status: 'locked' },
      { id: 'f8', title: 'Putting It All Together', subtitle: 'A real scenario from first call to enrollment', durationMinutes: 5, contentTypes: ['video'], status: 'locked' },
    ],
    playbooks: [
      { id: 'p1', title: 'MA vs. Medigap', pages: 1, iconColor: 'red' },
      { id: 'p2', title: 'T65 Checklist', pages: 2, iconColor: 'green' },
    ],
  },
  {
    id: 'growth',
    title: 'Growing Your Book',
    description: 'Retention, referrals, prospecting — how top agents go from 50 to 500.',
    coverTheme: 'growth',
    trackNumber: '02',
    lessons: [
      { id: 'g1', title: 'The Retention Mindset', subtitle: 'Why keeping clients matters more than finding them', durationMinutes: 6, contentTypes: ['video'], status: 'locked' },
      { id: 'g2', title: 'Referral Systems', subtitle: 'Ask once, get referrals for years', durationMinutes: 7, contentTypes: ['video', 'pdf'], status: 'locked' },
      { id: 'g3', title: 'Community Events', subtitle: 'Hosting seminars that actually produce enrollments', durationMinutes: 6, contentTypes: ['video', 'pdf'], status: 'locked' },
      { id: 'g4', title: 'Digital Presence 101', subtitle: 'Google, Facebook, and your online reputation', durationMinutes: 5, contentTypes: ['video'], status: 'locked' },
      { id: 'g5', title: 'Working Your SOA', subtitle: 'Turn permission into appointments', durationMinutes: 7, contentTypes: ['video', 'pdf'], status: 'locked' },
      { id: 'g6', title: 'The 500-Client Playbook', subtitle: 'Scaling without burning out', durationMinutes: 7, contentTypes: ['video'], status: 'locked' },
    ],
    playbooks: [
      { id: 'p3', title: 'Objection Scripts', pages: 3, iconColor: 'blue' },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing Playbooks',
    description: 'Events, mailers, digital presence — real playbooks from real agents.',
    coverTheme: 'marketing',
    trackNumber: '03',
    lessons: [
      { id: 'm1', title: 'Direct Mail That Works', subtitle: 'The mailer formula top agents swear by', durationMinutes: 6, contentTypes: ['video', 'pdf'], status: 'locked' },
      { id: 'm2', title: 'Event Planning A-Z', subtitle: 'From venue to follow-up', durationMinutes: 8, contentTypes: ['video', 'pdf'], status: 'locked' },
      { id: 'm3', title: 'Social Media for Agents', subtitle: 'What to post and what to avoid', durationMinutes: 5, contentTypes: ['video'], status: 'locked' },
      { id: 'm4', title: 'Co-Marketing with Providers', subtitle: 'Partner with doctors offices', durationMinutes: 7, contentTypes: ['video', 'pdf'], status: 'locked' },
      { id: 'm5', title: 'Your Annual Marketing Calendar', subtitle: 'Plan the year in one sitting', durationMinutes: 6, contentTypes: ['video', 'pdf'], status: 'locked' },
    ],
    playbooks: [
      { id: 'p4', title: 'AEP Timeline', pages: 4, iconColor: 'amber' },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance Essentials',
    description: 'AHIP, scope rules, CMS guidelines — what NOT to say on a call.',
    coverTheme: 'compliance',
    trackNumber: '04',
    lessons: [
      { id: 'c1', title: 'AHIP Certification', subtitle: 'What it covers, when to renew', durationMinutes: 7, contentTypes: ['video'], status: 'locked' },
      { id: 'c2', title: 'Scope of Appointment', subtitle: 'The rules that keep you compliant', durationMinutes: 6, contentTypes: ['video', 'pdf'], status: 'locked' },
      { id: 'c3', title: 'CMS Marketing Guidelines', subtitle: 'What you can and cannot say', durationMinutes: 8, contentTypes: ['video', 'pdf'], status: 'locked' },
      { id: 'c4', title: 'Record Keeping', subtitle: 'Documentation that protects your business', durationMinutes: 7, contentTypes: ['video'], status: 'locked' },
    ],
    playbooks: [
      { id: 'p5', title: 'SOA Rules', pages: 1, iconColor: 'green' },
    ],
  },
];

export function getAllPlaybooks(): Playbook[] {
  return TRACKS.flatMap(t => t.playbooks);
}

export function getContinueTarget(): { track: Track; lesson: Lesson; completed: number; total: number } | null {
  for (const track of TRACKS) {
    const progress = getTrackProgress(track);
    if (progress.currentLesson) {
      return { track, lesson: progress.currentLesson, completed: progress.completed, total: progress.total };
    }
  }
  return null;
}
