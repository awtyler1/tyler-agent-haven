-- Seed data for Forms Library
-- Run this after applying the create_forms_table migration

INSERT INTO public.forms (category, name, description, file_path, year, display_order) VALUES
-- Compliance Forms
('compliance', 'Scope of Appointment (SOA)', 'Required 48 hours before every Medicare appointment', '/downloads/Scope-of-Appointment_2026.pdf', 2026, 1),
('compliance', 'CMS-40B', 'Medicare Part B enrollment application', '/downloads/CMS-40B.pdf', 2026, 2),
('compliance', 'Verification of Chronic Condition (VCC)', 'C-SNP eligibility verification form', '/downloads/Blank_Verification_of_Chronic_Condition_VCC.pdf', 2026, 3),

-- Client Intake Forms
('client_intake', 'TIG Medicare Intake Form', 'Client information worksheet for initial consultation', '/downloads/Fillable_TIG_Medicare_Intake_Form.pdf', 2026, 1);
