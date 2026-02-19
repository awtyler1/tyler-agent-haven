// Book of Business types — adapted to existing schema
// Tables: clients, policies (carrier_id FK), client_interactions, client_risk_flags, monthly_syncs, commission_rates

export interface BookClient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  last_contacted_at: string | null;
  // Client lifecycle
  status?: string;
  lead_source?: string | null;
  created_at?: string | null;
  // Joined from latest active policy
  carrier_id?: string;
  carrier_name?: string;
  plan_name?: string;
  plan_type?: string | null;
  effective_date?: string;
  policy_status?: string;
  // Joined from risk flags
  flag_type?: string | null;
  flag_title?: string | null;
  flag_severity?: string | null;
}

export interface ClientInteraction {
  id: string;
  client_id: string;
  profile_id: string;
  interaction_type: string;
  outcome: string | null;
  notes: string | null;
  follow_up_date: string | null;
  follow_up_completed_at: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface ClientRiskFlag {
  id: string;
  client_id: string;
  flag_type: string;
  severity: string;
  title: string;
  description: string | null;
  status: string;
  source: string;
  expires_at: string | null;
  created_at: string;
}

export interface BookSummary {
  total_contacts: number;
  active_clients: number;
  total_policies: number;
  active_policies: number;
  total_annual_renewal: number;
  clients_needing_attention: number;
  retention_rate: number;
  new_this_month: number;
  growth_rate: number;
  total_termed_12m: number;
  months_of_data: number;
}

export interface MonthlyGrowth {
  month: string;
  total_clients: number;
  new_clients: number;
  termed_clients: number;
  net_change: number;
}

export interface CarrierIncome {
  carrier_id: string;
  carrier_name: string;
  policies: number;
  income: number;
  percentage: number;
  color: string;
}

export interface CarrierBreakdownItem {
  carrier_id: string;
  carrier_name: string;
  count: number;
  percentage: number;
  color: string;
}

export type InteractionType = 'call' | 'email' | 'text' | 'meeting' | 'note' | 'follow_up_scheduled' | 'follow_up_completed';
export type InteractionOutcome = 'reached' | 'voicemail' | 'no_answer' | 'wrong_number' | 'completed' | 'cancelled';
export type NoteTag = 'service_call' | 'plan_question' | 'retention' | 'complaint' | 'general';

// Map note tags to interaction_type + outcome for the DB
export const NOTE_TAG_TO_INTERACTION: Record<NoteTag, { type: InteractionType; outcome?: InteractionOutcome }> = {
  service_call: { type: 'call', outcome: 'reached' },
  plan_question: { type: 'call', outcome: 'reached' },
  retention: { type: 'note' },
  complaint: { type: 'note' },
  general: { type: 'note' },
};

// Carrier brand colors — keyed by carrier name (lowercase for matching)
export const CARRIER_COLORS: Record<string, string> = {
  humana: '#2D8B4E',
  aetna: '#1E6B4E',
  anthem: '#3B6FB5',
  wellcare: '#B8963E',
  devoted: '#E25555',
  uhc: '#2B3990',
  'united healthcare': '#2B3990',
  cigna: '#0072CE',
  centene: '#6B4C9A',
};

export function getCarrierColor(carrierName: string): string {
  const key = carrierName.toLowerCase();
  for (const [pattern, color] of Object.entries(CARRIER_COLORS)) {
    if (key.includes(pattern)) return color;
  }
  return '#8B7E6A'; // fallback muted color
}

// Commission rate defaults per plan type (annual renewal per policy)
export const PLAN_TYPE_RENEWAL: Record<string, number> = {
  MA: 347,
  MAPD: 347,
  PDP: 47,
  MEDIGAP: 800,
  OTHER: 37,
};

// Flag display config
export const FLAG_CONFIG: Record<string, { color: string; bg: string; label: string; short: string }> = {
  no_contact_90: { color: '#C75A3A', bg: 'rgba(199,90,58,0.1)', label: 'Overdue follow-up (90+ days)', short: 'Overdue' },
  no_contact_180: { color: '#C75A3A', bg: 'rgba(199,90,58,0.1)', label: 'No contact in 180+ days', short: 'Overdue' },
  birthday_upcoming: { color: '#C8A951', bg: 'rgba(200,169,81,0.1)', label: 'Birthday this week', short: 'Birthday' },
  anniversary_upcoming: { color: '#C8A951', bg: 'rgba(200,169,81,0.1)', label: 'Anniversary upcoming', short: 'Anniversary' },
  aep_review_needed: { color: '#3B6FB5', bg: 'rgba(59,111,181,0.1)', label: 'AEP review needed', short: 'AEP Review' },
  plan_benefit_cut: { color: '#C75A3A', bg: 'rgba(199,90,58,0.1)', label: 'Plan benefit cut', short: 'Benefit Cut' },
  carrier_exit: { color: '#C75A3A', bg: 'rgba(199,90,58,0.1)', label: 'Carrier exiting market', short: 'Carrier Exit' },
  plan_discontinued: { color: '#C75A3A', bg: 'rgba(199,90,58,0.1)', label: 'Plan discontinued', short: 'Discontinued' },
  // Generic fallbacks for callback/attention-style flags
  callback: { color: '#3B6FB5', bg: 'rgba(59,111,181,0.1)', label: 'Scheduled callback', short: 'Callback' },
  attention: { color: '#C75A3A', bg: 'rgba(199,90,58,0.1)', label: 'Needs attention', short: 'Attention' },
};

export function getFlagConfig(flagType: string) {
  return FLAG_CONFIG[flagType] || { color: '#C75A3A', bg: 'rgba(199,90,58,0.1)', label: flagType, short: 'Flag' };
}
