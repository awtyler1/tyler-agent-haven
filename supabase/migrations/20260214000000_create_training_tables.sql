-- Training content tables
-- Tracks → Lessons → Lesson progress
-- Playbooks are standalone but associated with tracks

-- ============================================
-- TRACKS
-- ============================================
CREATE TABLE IF NOT EXISTS training_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_theme TEXT NOT NULL DEFAULT 'foundations',
    -- Valid values: 'foundations', 'growth', 'marketing', 'compliance'
    -- Maps to gradient colors in the UI
  track_number TEXT NOT NULL,
    -- Display order string: '01', '02', etc.
  sort_order INTEGER NOT NULL DEFAULT 0,
    -- Numeric sort for display ordering
  is_published BOOLEAN NOT NULL DEFAULT false,
    -- Unpublished tracks are hidden from agents
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- LESSONS
-- ============================================
CREATE TABLE IF NOT EXISTS training_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES training_tracks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  sort_order INTEGER NOT NULL DEFAULT 0,
    -- Order within track
  content_types TEXT[] NOT NULL DEFAULT '{"video"}',
    -- Array of: 'video', 'pdf', 'quiz'
  video_url TEXT,
    -- Supabase Storage URL or external URL
  pdf_url TEXT,
    -- Supabase Storage URL for lesson PDF attachment
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_training_lessons_track_id ON training_lessons(track_id);
CREATE INDEX idx_training_lessons_sort ON training_lessons(track_id, sort_order);

-- ============================================
-- PLAYBOOKS (standalone downloadable PDFs)
-- ============================================
CREATE TABLE IF NOT EXISTS training_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES training_tracks(id) ON DELETE SET NULL,
    -- Optional association to a track. NULL = standalone playbook
  title TEXT NOT NULL,
  pages INTEGER NOT NULL DEFAULT 1,
  icon_color TEXT NOT NULL DEFAULT 'blue',
    -- Valid: 'red', 'green', 'blue', 'amber'
  pdf_url TEXT,
    -- Supabase Storage URL
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_training_playbooks_track_id ON training_playbooks(track_id);

-- ============================================
-- LESSON PROGRESS (per agent)
-- ============================================
CREATE TABLE IF NOT EXISTS training_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'locked',
    -- Valid: 'locked', 'current', 'completed'
  completed_at TIMESTAMPTZ,
  last_watched_at TIMESTAMPTZ,
  video_progress_seconds INTEGER DEFAULT 0,
    -- Resume position for video playback
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, lesson_id)
);

CREATE INDEX idx_training_progress_profile ON training_lesson_progress(profile_id);
CREATE INDEX idx_training_progress_lesson ON training_lesson_progress(lesson_id);
CREATE INDEX idx_training_progress_status ON training_lesson_progress(profile_id, status);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_training_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_tracks_updated_at
  BEFORE UPDATE ON training_tracks
  FOR EACH ROW EXECUTE FUNCTION update_training_updated_at();

CREATE TRIGGER training_lessons_updated_at
  BEFORE UPDATE ON training_lessons
  FOR EACH ROW EXECUTE FUNCTION update_training_updated_at();

CREATE TRIGGER training_playbooks_updated_at
  BEFORE UPDATE ON training_playbooks
  FOR EACH ROW EXECUTE FUNCTION update_training_updated_at();

CREATE TRIGGER training_lesson_progress_updated_at
  BEFORE UPDATE ON training_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_training_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Tracks: everyone reads published, admins read all + write
ALTER TABLE training_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published tracks"
  ON training_tracks FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can read all tracks"
  ON training_tracks FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert tracks"
  ON training_tracks FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tracks"
  ON training_tracks FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tracks"
  ON training_tracks FOR DELETE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Lessons: everyone reads published, admins manage all
ALTER TABLE training_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published lessons"
  ON training_lessons FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can read all lessons"
  ON training_lessons FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert lessons"
  ON training_lessons FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lessons"
  ON training_lessons FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete lessons"
  ON training_lessons FOR DELETE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Playbooks: everyone reads published, admins manage all
ALTER TABLE training_playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published playbooks"
  ON training_playbooks FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can read all playbooks"
  ON training_playbooks FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert playbooks"
  ON training_playbooks FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update playbooks"
  ON training_playbooks FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete playbooks"
  ON training_playbooks FOR DELETE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Progress: agents see own, admins see all
ALTER TABLE training_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents see own progress"
  ON training_lesson_progress FOR SELECT
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Agents can insert own progress"
  ON training_lesson_progress FOR INSERT
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Agents can update own progress"
  ON training_lesson_progress FOR UPDATE
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can read all progress"
  ON training_lesson_progress FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Create training storage bucket (public read)
-- If this fails, create the bucket manually in Supabase dashboard
INSERT INTO storage.buckets (id, name, public)
VALUES ('training', 'training', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can read, admins can upload/delete
CREATE POLICY "Anyone can read training files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'training');

CREATE POLICY "Admins can upload training files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'training'
    AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Admins can delete training files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'training'
    AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  );

-- ============================================
-- SEED DATA (matches current hardcoded content)
-- ============================================

-- Insert the 4 tracks
INSERT INTO training_tracks (id, title, description, cover_theme, track_number, sort_order, is_published) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Medicare Foundations', 'Parts A-D, enrollment windows, the conversations that build trust.', 'foundations', '01', 1, true),
  ('a1000000-0000-0000-0000-000000000002', 'Growing Your Book', 'Retention, referrals, prospecting - how top agents go from 50 to 500.', 'growth', '02', 2, true),
  ('a1000000-0000-0000-0000-000000000003', 'Marketing Playbooks', 'Events, mailers, digital presence - real playbooks from real agents.', 'marketing', '03', 3, true),
  ('a1000000-0000-0000-0000-000000000004', 'Compliance Essentials', 'AHIP, scope rules, CMS guidelines - what NOT to say on a call.', 'compliance', '04', 4, true);

-- Insert lessons for Medicare Foundations
INSERT INTO training_lessons (track_id, title, subtitle, duration_minutes, sort_order, content_types, is_published) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'What Is Medicare?', 'The four parts, who qualifies', 5, 1, '{"video"}', true),
  ('a1000000-0000-0000-0000-000000000001', 'Parts A & B Deep Dive', 'Hospital vs. medical coverage', 7, 2, '{"video"}', true),
  ('a1000000-0000-0000-0000-000000000001', 'Part D & Drug Coverage', 'Formularies, tiers, the donut hole', 6, 3, '{"video","pdf"}', true),
  ('a1000000-0000-0000-0000-000000000001', 'MA vs. Medigap', 'The comparison every agent needs to master', 6, 4, '{"video","pdf"}', true),
  ('a1000000-0000-0000-0000-000000000001', 'Enrollment Windows', 'IEP, AEP, OEP, SEP - when clients can make changes', 8, 5, '{"video","pdf"}', true),
  ('a1000000-0000-0000-0000-000000000001', 'The T65 Conversation', 'The appointment that builds your book', 5, 6, '{"video","pdf"}', true),
  ('a1000000-0000-0000-0000-000000000001', 'Common Mistakes & Myths', 'The 10 things clients get wrong', 6, 7, '{"video"}', true),
  ('a1000000-0000-0000-0000-000000000001', 'Putting It All Together', 'A real scenario from first call to enrollment', 5, 8, '{"video"}', true);

-- Insert lessons for Growing Your Book
INSERT INTO training_lessons (track_id, title, subtitle, duration_minutes, sort_order, content_types, is_published) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'The Retention Mindset', 'Why keeping clients matters more than finding them', 6, 1, '{"video"}', true),
  ('a1000000-0000-0000-0000-000000000002', 'Referral Systems', 'Ask once, get referrals for years', 7, 2, '{"video","pdf"}', true),
  ('a1000000-0000-0000-0000-000000000002', 'Community Events', 'Hosting seminars that actually produce enrollments', 6, 3, '{"video","pdf"}', true),
  ('a1000000-0000-0000-0000-000000000002', 'Digital Presence 101', 'Google, Facebook, and your online reputation', 5, 4, '{"video"}', true),
  ('a1000000-0000-0000-0000-000000000002', 'Working Your SOA', 'Turn permission into appointments', 7, 5, '{"video","pdf"}', true),
  ('a1000000-0000-0000-0000-000000000002', 'The 500-Client Playbook', 'Scaling without burning out', 7, 6, '{"video"}', true);

-- Insert lessons for Marketing Playbooks
INSERT INTO training_lessons (track_id, title, subtitle, duration_minutes, sort_order, content_types, is_published) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'Direct Mail That Works', 'The mailer formula top agents swear by', 6, 1, '{"video","pdf"}', true),
  ('a1000000-0000-0000-0000-000000000003', 'Event Planning A-Z', 'From venue to follow-up', 8, 2, '{"video","pdf"}', true),
  ('a1000000-0000-0000-0000-000000000003', 'Social Media for Agents', 'What to post and what to avoid', 5, 3, '{"video"}', true),
  ('a1000000-0000-0000-0000-000000000003', 'Co-Marketing with Providers', 'Partner with doctors offices', 7, 4, '{"video","pdf"}', true),
  ('a1000000-0000-0000-0000-000000000003', 'Your Annual Marketing Calendar', 'Plan the year in one sitting', 6, 5, '{"video","pdf"}', true);

-- Insert lessons for Compliance Essentials
INSERT INTO training_lessons (track_id, title, subtitle, duration_minutes, sort_order, content_types, is_published) VALUES
  ('a1000000-0000-0000-0000-000000000004', 'AHIP Certification', 'What it covers, when to renew', 7, 1, '{"video"}', true),
  ('a1000000-0000-0000-0000-000000000004', 'Scope of Appointment', 'The rules that keep you compliant', 6, 2, '{"video","pdf"}', true),
  ('a1000000-0000-0000-0000-000000000004', 'CMS Marketing Guidelines', 'What you can and cannot say', 8, 3, '{"video","pdf"}', true),
  ('a1000000-0000-0000-0000-000000000004', 'Record Keeping', 'Documentation that protects your business', 7, 4, '{"video"}', true);

-- Insert playbooks
INSERT INTO training_playbooks (track_id, title, pages, icon_color, sort_order, is_published) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'MA vs. Medigap', 1, 'red', 1, true),
  ('a1000000-0000-0000-0000-000000000001', 'T65 Checklist', 2, 'green', 2, true),
  ('a1000000-0000-0000-0000-000000000002', 'Objection Scripts', 3, 'blue', 3, true),
  ('a1000000-0000-0000-0000-000000000003', 'AEP Timeline', 4, 'amber', 4, true),
  ('a1000000-0000-0000-0000-000000000004', 'SOA Rules', 1, 'green', 5, true);
