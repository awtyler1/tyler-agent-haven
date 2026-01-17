// src/types/roadmap.ts
// V6 - Added referral metrics and season context

export interface BrokerProfile {
  id?: string;
  profile_id?: string | null;

  // Broker Information
  broker_name: string;
  manager_id?: string;
  manager_name: string;

  // Book Size (drives Client Touchpoints channel if > 15)
  book_size: number;

  // Goal (drives all dynamic targets)
  monthly_goal: number;

  // Assigned Resources (set by TIG Leadership)
  lead_star_leads: number;      // Leads assigned per month (0 if none)
  seminar_eligible: boolean;    // Whether agent is eligible for seminar assignments
  seminars_planned?: number;    // Optional: specific slots if already scheduled
  mira_access: boolean;         // MIRA portal access

  // Generated Data (populated after PDF generation)
  last_generated_at?: string;
  pdf_storage_path?: string;
  review_date?: string;
  assigned_channels?: GrowthChannel[];
  activity_targets?: ActivityTargets;
  economics?: Economics;

  // Metadata
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface GrowthChannel {
  name: string;
  type: string;
  assigned: boolean;
  close_rate: number;
  velocity: string;
  description: string;
  weekly_target: string;
  setup: string;
  script: string;
  expected_display: string;  // Display text for Expected Sales column
  priority: number;          // 1 = primary focus, 2+ = supporting channels
}

export interface ActivityTargets {
  monthly_goal: number;

  // Primary metrics
  daily_attempts: number;
  weekly_attempts: number;

  // Outcome metrics
  daily_conversations: number;
  weekly_appointments: number;
  weekly_referral_asks: number;

  // Lead Star specific
  lead_star_leads: number;
  lead_star_expected: number;

  // Referral specific metrics
  referral_weekly_asks: number;
  referral_expected_names: number;
  referral_expected_monthly_sales: number;
  referral_eligible_book: number;

  // Tier context
  activity_tier: string;
  tier_message: string;
  book_modifier: number;

  // The math (for transparency)
  math_conversations_needed: number;
  math_attempts_needed: number;
  buffer_percentage: number;

  // Season context
  season: 'oep' | 'aep';
  season_note: string;
}

export interface YearProjection {
  year: number;
  new_clients: number;
  renewal_clients: number;
  new_income: number;
  renewal_income: number;
  total_income: number;
}

export interface Economics {
  t65_monthly: number;
  plan_change_monthly: number;
  monthly_new_income: number;
  annual_new_income: number;
  years: YearProjection[];
}

export interface RoadmapGenerationResult {
  success: boolean;
  filename?: string;
  pdf?: string; // base64
  size?: number;
  error?: string;
  channels?: GrowthChannel[];
  activity?: ActivityTargets;
  economics?: Economics;
  review_date?: string;
}

// Default values for new broker profile
export const DEFAULT_BROKER_PROFILE: Omit<BrokerProfile, 'broker_name' | 'manager_name'> = {
  book_size: 0,
  monthly_goal: 6,
  lead_star_leads: 0,
  seminar_eligible: false,
  seminars_planned: 0,
  mira_access: false,
};

// Commission constants
export const COMMISSION = {
  T65: 694,
  PLAN_CHANGE: 347,
  RENEWAL_ANNUAL: 347,
  RETENTION_RATE: 0.85,
} as const;

// Referral constants
export const REFERRAL_CONSTANTS = {
  ASKS_PER_CLIENT_PER_YEAR: 2,
  TENURE_ELIGIBLE_PERCENT: 0.80,  // 80% of book assumed to be 60+ days
  YIELD_RATE: 0.30,               // 30% of asks produce a name
  CLOSE_RATE: 0.50,               // 50% of names become clients
  MAX_WEEKLY_ASKS: 12,            // Cap to prevent burnout
} as const;
