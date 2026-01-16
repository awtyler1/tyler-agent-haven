// src/types/roadmap.ts

export interface BrokerProfile {
  id?: string;
  profile_id?: string | null;

  // Broker Information
  broker_name: string;
  manager_id?: string;
  manager_name: string;

  // Experience & Book
  months_in_business: number;
  book_size: number;

  // Goals
  monthly_goal: number;

  // Profile Assessment
  personality: 'Introvert' | 'Extrovert' | 'Ambivert';
  phone_comfort: 1 | 2 | 3 | 4 | 5;
  community_connections: boolean;
  strengths?: string;

  // Resource Access
  mira_access: boolean;
  seminar_assigned: boolean;
  seminar_dates?: string[];

  // Generated Data
  last_generated_at?: string;
  pdf_storage_path?: string;
  review_date?: string;
  experience_phase?: string;
  assigned_channels?: GrowthChannel[];

  // Metadata
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface GrowthChannel {
  name: string;
  channel: string;
  allocation: number;
  plans: number;
  close_rate: number;
  velocity: string;
  rationale: string;
  weekly_volume: string;
  follow_up: string;
}

export interface ExperiencePhase {
  name: 'Foundation' | 'Growth' | 'Expansion';
  description: string;
  one_thing: string;
  focus: string;
  metric: string;
}

export interface RoadmapGenerationResult {
  success: boolean;
  filename?: string;
  pdf?: string; // base64
  size?: number;
  error?: string;
  channels?: GrowthChannel[];
  phase?: ExperiencePhase;
  review_date?: string;
}

// Default values for new broker profile
export const DEFAULT_BROKER_PROFILE: Omit<BrokerProfile, 'broker_name' | 'manager_name'> = {
  months_in_business: 0,
  book_size: 0,
  monthly_goal: 6,
  personality: 'Ambivert',
  phone_comfort: 3,
  community_connections: false,
  mira_access: false,
  seminar_assigned: false,
};

// Personality options for select
export const PERSONALITY_OPTIONS = [
  { value: 'Introvert', label: 'Introvert - Prefers depth over breadth' },
  { value: 'Ambivert', label: 'Ambivert - Balanced approach' },
  { value: 'Extrovert', label: 'Extrovert - Energized by connections' },
] as const;

// Phone comfort options
export const PHONE_COMFORT_OPTIONS = [
  { value: 1, label: '1 - Avoid if possible' },
  { value: 2, label: '2 - Uncomfortable but willing' },
  { value: 3, label: '3 - Neutral' },
  { value: 4, label: '4 - Comfortable' },
  { value: 5, label: '5 - Thrive on the phone' },
] as const;
