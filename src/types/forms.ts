export type FormCategory = 'compliance' | 'client_intake' | 'enrollment' | 'other';

export interface Form {
  id: string;
  category: FormCategory;
  name: string;
  description: string | null;
  file_path: string;
  year: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormsByCategory {
  compliance: Form[];
  client_intake: Form[];
  enrollment: Form[];
  other: Form[];
}

// Display labels for categories
export const FORM_CATEGORY_LABELS: Record<FormCategory, string> = {
  compliance: 'Compliance Forms',
  client_intake: 'Client Intake',
  enrollment: 'Enrollment Forms',
  other: 'Other Forms',
};
