// ============================================================================
// SHARED AGENT ACCESS
// ----------------------------------------------------------------------------
// The hub uses a single shared agent login: agents type ONLY a password (no
// email). Behind the scenes the app signs into ONE shared Supabase account,
// whose email is set here and never shown to agents.
//
// ONE-TIME SETUP (in Supabase):
//   1. Create a user (Authentication → Users) with the email below and a
//      password. The password you set IS the password you give to agents.
//   2. Give that user a profile with onboarding_status = 'APPOINTED' and an
//      agent role (independent_agent), is_active = true — so it lands on the
//      hub home and never hits the contracting-only flow.
//   3. To rotate the agent password later, just change this account's password
//      in Supabase. No code change needed.
//
// You can override the email per-environment with VITE_SHARED_AGENT_EMAIL.
// ============================================================================
export const SHARED_AGENT_EMAIL =
  import.meta.env.VITE_SHARED_AGENT_EMAIL ?? 'agents@tylerinsurancegroup.com';
