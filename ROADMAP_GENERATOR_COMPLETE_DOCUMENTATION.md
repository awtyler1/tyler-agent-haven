# Strategic Growth Roadmap Generator - Complete Documentation

**Version:** V6
**Last Updated:** January 17, 2026
**Purpose:** Generate personalized 7-page PDF roadmaps for Medicare insurance agents

---

## Table of Contents

1. [Type Definitions](#1-type-definitions)
2. [Edge Function (PDF Generation)](#2-edge-function-pdf-generation)
3. [Logic Summary](#3-logic-summary)
   - [A. The 7 Inputs](#a-the-7-inputs)
   - [B. Channel Assignment Rules](#b-channel-assignment-rules)
   - [C. Activity Calculation Rules](#c-activity-calculation-rules)
   - [D. Referral Engine Math](#d-referral-engine-math)
   - [E. Economics Calculation](#e-economics-calculation)
   - [F. Priority Channel Logic](#f-priority-channel-logic)
   - [G. Personalization Points](#g-personalization-points)

---

## 1. Type Definitions

**File:** `src/types/roadmap.ts`

This file defines all TypeScript interfaces used throughout the application. These types ensure type safety between the frontend form, the Edge Function, and the database.

```typescript
// src/types/roadmap.ts
// V6 - Added referral metrics and season context

// ============================================================================
// BROKER PROFILE - The input data collected from the form
// ============================================================================

export interface BrokerProfile {
  id?: string;
  profile_id?: string | null;

  // Broker Information
  broker_name: string;        // Display name for the PDF
  manager_id?: string;        // Reference to manager (for permissions)
  manager_name: string;       // Manager name shown on PDF

  // Book Size (drives Client Touchpoints channel if > 15)
  // Also affects book modifier for activity calculations
  book_size: number;

  // Goal (drives all dynamic targets)
  // This is THE key input - everything else flows from this
  monthly_goal: number;

  // Assigned Resources (set by TIG Leadership, not the agent)
  lead_star_leads: number;      // Leads assigned per month (0 if none)
  seminar_eligible: boolean;    // Whether agent is eligible for seminar assignments
  seminars_planned?: number;    // Optional: specific slots if already scheduled
  mira_access: boolean;         // MIRA portal access (UHC leads)

  // Generated Data (populated after PDF generation, stored for reference)
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

// ============================================================================
// GROWTH CHANNEL - Represents one sales channel assigned to the agent
// ============================================================================

export interface GrowthChannel {
  name: string;           // Display name (e.g., "Circle of Influence")
  type: string;           // "tier1" (always included) or "tier2" (assigned resources)
  assigned: boolean;      // Whether this channel is active for this agent
  close_rate: number;     // Expected close rate as percentage (e.g., 45 = 45%)
  velocity: string;       // How quickly this channel converts (Fast/Medium/Slow)
  description: string;    // Explanation of the channel
  weekly_target: string;  // What the agent should do each week
  setup: string;          // First steps to get this channel working
  script: string;         // Exact words to use (key for training)
  expected_display: string;  // Display text for Expected Sales column (e.g., "~4/mo potential")
  priority: number;          // 1 = primary focus, 2+ = supporting channels
}

// ============================================================================
// ACTIVITY TARGETS - Daily/weekly metrics the agent should hit
// ============================================================================

export interface ActivityTargets {
  monthly_goal: number;

  // Primary metrics (what we track daily)
  daily_attempts: number;     // Calls/texts/emails per day
  weekly_attempts: number;    // daily_attempts * 5

  // Outcome metrics (expected results from attempts)
  daily_conversations: number;    // ~25% of attempts
  weekly_appointments: number;    // ~18% of conversations
  weekly_referral_asks: number;   // How many times to ask for referrals

  // Lead Star specific
  lead_star_leads: number;      // Leads assigned per month
  lead_star_expected: number;   // Expected sales (leads * 15%)

  // Referral specific metrics
  referral_weekly_asks: number;           // Total asks per week
  referral_expected_names: number;        // Expected names (asks * 30%)
  referral_expected_monthly_sales: number; // Expected sales from referrals
  referral_eligible_book: number;         // 80% of book_size

  // Tier context (for messaging)
  activity_tier: string;    // e.g., "Building the Foundation"
  tier_message: string;     // Motivational context
  book_modifier: number;    // Adjustment based on book size (-12 to +5)

  // The math (for transparency - shown to agent)
  math_conversations_needed: number;  // goal / 10% close rate
  math_attempts_needed: number;       // conversations / 25% contact rate
  buffer_percentage: number;          // How much buffer above math minimum

  // Season context
  season: 'oep' | 'aep';    // Off-season vs Annual Enrollment Period
  season_note: string;      // Explanation of season context
}

// ============================================================================
// ECONOMICS - 5-year income projection
// ============================================================================

export interface YearProjection {
  year: number;           // 1-5
  new_clients: number;    // monthly_goal * 12
  renewal_clients: number; // Compound with 85% retention
  new_income: number;     // From new sales
  renewal_income: number; // From renewals
  total_income: number;   // new + renewal
}

export interface Economics {
  t65_monthly: number;          // T65 sales per month (half of goal)
  plan_change_monthly: number;  // Plan changes per month (other half)
  monthly_new_income: number;   // (T65 * $694) + (PC * $347)
  annual_new_income: number;    // monthly * 12
  years: YearProjection[];      // 5-year projection array
}

// ============================================================================
// API RESPONSE
// ============================================================================

export interface RoadmapGenerationResult {
  success: boolean;
  filename?: string;
  pdf?: string; // base64 encoded PDF
  size?: number;
  error?: string;
  channels?: GrowthChannel[];
  activity?: ActivityTargets;
  economics?: Economics;
  review_date?: string;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

// Default values for new broker profile form
export const DEFAULT_BROKER_PROFILE: Omit<BrokerProfile, 'broker_name' | 'manager_name'> = {
  book_size: 0,
  monthly_goal: 6,
  lead_star_leads: 0,
  seminar_eligible: false,
  seminars_planned: 0,
  mira_access: false,
};

// ============================================================================
// BUSINESS CONSTANTS - These are the key assumptions
// ============================================================================

// Commission rates (industry standard for Medicare Advantage)
export const COMMISSION = {
  T65: 694,              // New-to-Medicare commission (full first year)
  PLAN_CHANGE: 347,      // Plan change commission (half rate)
  RENEWAL_ANNUAL: 347,   // Annual renewal commission
  RETENTION_RATE: 0.85,  // 85% of clients renew each year
} as const;

// Referral calculation constants
export const REFERRAL_CONSTANTS = {
  ASKS_PER_CLIENT_PER_YEAR: 2,    // Ask each client twice per year max
  TENURE_ELIGIBLE_PERCENT: 0.80,  // 80% of book assumed to be 60+ days old
  YIELD_RATE: 0.30,               // 30% of asks produce a usable name
  CLOSE_RATE: 0.50,               // 50% of referral names become clients
  MAX_WEEKLY_ASKS: 12,            // Cap to prevent burnout
} as const;
```

---

## 2. Edge Function (PDF Generation)

**File:** `supabase/functions/generate-roadmap-pdf/index.ts`

This is the Supabase Edge Function that generates the PDF. It runs on Deno and uses the `pdf-lib` library.

```typescript
/**
 * Generate Roadmap PDF Edge Function - V6
 *
 * Generates a 7-page Strategic Growth Roadmap PDF.
 * Professional. Grounded. No hype.
 *
 * ARCHITECTURE:
 * 1. Receive profile data from frontend
 * 2. Build channels array based on profile
 * 3. Calculate activity targets
 * 4. Calculate 5-year economics
 * 5. Generate 7-page PDF with all data
 * 6. Return base64-encoded PDF
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Convert base64 string to Uint8Array (used for embedding images)
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================================================
// TYPE DEFINITIONS (duplicated from frontend for Edge Function isolation)
// ============================================================================

interface BrokerProfile {
  id?: string;
  broker_name: string;
  manager_name: string;
  book_size: number;
  monthly_goal: number;
  lead_star_leads: number;
  seminar_eligible: boolean;
  seminars_planned?: number;
  mira_access: boolean;
}

interface GrowthChannel {
  name: string;
  type: string;
  assigned: boolean;
  close_rate: number;
  velocity: string;
  description: string;
  weekly_target: string;
  setup: string;
  script: string;
  expected_display: string;
  priority: number;
}

interface ActivityTargets {
  monthly_goal: number;
  daily_attempts: number;
  weekly_attempts: number;
  daily_conversations: number;
  weekly_appointments: number;
  weekly_referral_asks: number;
  lead_star_leads: number;
  lead_star_expected: number;
  referral_weekly_asks: number;
  referral_expected_names: number;
  referral_expected_monthly_sales: number;
  referral_eligible_book: number;
  activity_tier: string;
  tier_message: string;
  book_modifier: number;
  math_conversations_needed: number;
  math_attempts_needed: number;
  buffer_percentage: number;
  season: 'oep' | 'aep';
  season_note: string;
}

interface YearProjection {
  year: number;
  new_clients: number;
  renewal_clients: number;
  new_income: number;
  renewal_income: number;
  total_income: number;
}

interface Economics {
  t65_monthly: number;
  plan_change_monthly: number;
  monthly_new_income: number;
  annual_new_income: number;
  years: YearProjection[];
}

// ============================================================================
// BUSINESS CONSTANTS
// ============================================================================

// Commission rates - these are industry standard for Medicare Advantage
const COMMISSION = {
  T65: 694,              // Full first-year commission for new-to-Medicare
  PLAN_CHANGE: 347,      // Half commission for plan changes
  RENEWAL_ANNUAL: 347,   // Annual renewal amount
  RETENTION_RATE: 0.85,  // 85% retention is realistic and conservative
};

// Referral calculation constants - based on industry benchmarks
const REFERRAL = {
  ASKS_PER_CLIENT_PER_YEAR: 2,    // Don't over-ask (max 2x/year per client)
  TENURE_ELIGIBLE_PERCENT: 0.80,  // 80% of book is 60+ days (can legally ask)
  YIELD_RATE: 0.30,               // 30% of asks produce a name
  CLOSE_RATE: 0.50,               // 50% of names become clients (warm leads)
  MAX_WEEKLY_ASKS: 12,            // Prevent burnout - don't ask more than this
};

// ============================================================================
// COLOR PALETTE - Professional gold/charcoal theme
// ============================================================================

const GOLD = rgb(0.62, 0.49, 0.18);           // Primary accent #9E7D2E
const GOLD_LIGHT = rgb(0.96, 0.94, 0.90);     // Light gold background
const CHARCOAL = rgb(0.18, 0.18, 0.18);       // Primary text
const DARK_GRAY = rgb(0.29, 0.29, 0.29);      // Secondary text
const MEDIUM_GRAY = rgb(0.42, 0.42, 0.42);    // Tertiary text
const LIGHT_GRAY = rgb(0.91, 0.91, 0.91);     // Borders
const TIER2_BG = rgb(0.96, 0.96, 0.96);       // #F5F5F5 - Tier 2 channel background
const SCRIPT_BG = rgb(0.996, 0.976, 0.906);   // #FEF9E7 - Script box background
const WHITE = rgb(1, 1, 1);

// Page dimensions (standard US Letter)
const PAGE_WIDTH = 612;   // 8.5 inches
const PAGE_HEIGHT = 792;  // 11 inches
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// ============================================================================
// BUSINESS LOGIC: CHANNEL ASSIGNMENT
// ============================================================================

/**
 * Determines which growth channels to assign based on broker profile.
 *
 * TIER 1 CHANNELS (relationship-based, always included):
 * - Circle of Influence: Friends, family, acquaintances
 * - Client Referrals: Asking existing/new clients for names
 * - Professional Partners: CPAs, attorneys, financial advisors
 * - Client Touchpoints: Protecting existing book (only if book > 15)
 *
 * TIER 2 CHANNELS (assigned resources from leadership):
 * - Lead Star: Internet leads assigned by company
 * - MIRA Portal: UHC real-time leads (if access granted)
 * - Seminars: Group presentations (if eligible)
 */
function buildChannels(profile: BrokerProfile): GrowthChannel[] {
  const goal = profile.monthly_goal;
  const book = profile.book_size;
  const channels: GrowthChannel[] = [];

  // ============================================
  // REFERRAL CALCULATIONS (used across multiple channels)
  // ============================================
  const referralEligibleBook = Math.floor(book * REFERRAL.TENURE_ELIGIBLE_PERCENT);
  const annualAsksFromBook = referralEligibleBook * REFERRAL.ASKS_PER_CLIENT_PER_YEAR;
  const weeklyAsksFromBook = Math.ceil(annualAsksFromBook / 52);
  const weeklyAsksFromNewSales = Math.ceil(goal / 4);
  const totalWeeklyAsks = Math.min(weeklyAsksFromBook + weeklyAsksFromNewSales, REFERRAL.MAX_WEEKLY_ASKS);
  const weeklyExpectedNames = Math.round(totalWeeklyAsks * REFERRAL.YIELD_RATE * 10) / 10;
  const monthlyExpectedSales = Math.round(weeklyExpectedNames * 4 * REFERRAL.CLOSE_RATE * 10) / 10;

  // ----------------------------------------
  // TIER 1: CIRCLE OF INFLUENCE
  // Always included - this is the foundation
  // ----------------------------------------
  const coiTarget = Math.max(3, Math.ceil(goal * 0.8));
  const coiExpected = Math.min(Math.round(coiTarget * 0.45 * 4), goal);
  channels.push({
    name: 'Circle of Influence',
    type: 'tier1',
    assigned: true,
    close_rate: 45,           // High close rate - these people trust you
    velocity: 'Medium',       // Takes time but converts well
    description: 'Friends, family, acquaintances who trust you',
    weekly_target: `${coiTarget} conversations`,
    setup: 'List 50 people you know who are 60+. Reach out to 10 this week.',
    script: '"I help people navigate Medicare now. Do you know anyone turning 65 soon?"',
    expected_display: `~${coiExpected}/mo potential`,
    priority: 2,
  });

  // ----------------------------------------
  // TIER 1: CLIENT REFERRALS
  // Included if book >= 16 OR goal >= 4
  // Logic varies significantly by book size
  // ----------------------------------------
  if (book >= 16 || goal >= 4) {
    let weeklyTarget: string;
    let description: string;
    let setup: string;

    if (book < 16) {
      // New agent - focus on asking after each new sale
      weeklyTarget = `${weeklyAsksFromNewSales} asks (after each sale)`;
      description = 'Ask every new client - build the habit now';
      setup = 'After every appointment (sale or not), ask for one name.';
    } else if (book < 40) {
      // Small book - building momentum
      const asks = Math.max(2, Math.min(totalWeeklyAsks, 3));
      const expectedNames = Math.round(asks * REFERRAL.YIELD_RATE * 10) / 10;
      weeklyTarget = `${asks} asks -> ~${expectedNames} names/wk`;
      description = `Building referral momentum (${referralEligibleBook} eligible clients)`;
      setup = `You can ask each client ~2x/year. Pull 5 who haven't been asked in 6+ months.`;
    } else if (book < 75) {
      // Medium book - referrals becoming meaningful
      const asks = Math.max(3, Math.min(totalWeeklyAsks, 5));
      const expectedNames = Math.round(asks * REFERRAL.YIELD_RATE * 10) / 10;
      weeklyTarget = `${asks} asks -> ~${expectedNames} names/wk`;
      description = `Your book is generating referrals (${referralEligibleBook} eligible clients)`;
      setup = 'Rotate through your book systematically. Track who you\'ve asked and when.';
    } else if (book < 125) {
      // Strong book - referrals are a real channel
      const asks = Math.max(4, Math.min(totalWeeklyAsks, 7));
      const expectedNames = Math.round(asks * REFERRAL.YIELD_RATE * 10) / 10;
      weeklyTarget = `${asks} asks -> ~${expectedNames} names/wk`;
      description = `Strong referral engine (${referralEligibleBook} eligible clients)`;
      setup = 'You should be getting 1-2 names per week from your book alone.';
    } else {
      // Large book (125+) - referral machine
      const asks = Math.max(6, Math.min(totalWeeklyAsks, 10));
      const expectedNames = Math.round(asks * REFERRAL.YIELD_RATE * 10) / 10;
      weeklyTarget = `${asks} asks -> ~${expectedNames} names/wk`;
      description = `Referral machine (${referralEligibleBook} eligible) -> ~${monthlyExpectedSales} sales/mo potential`;
      setup = 'At your book size, referrals should be your #1 source. Prioritize these calls.';
    }

    channels.push({
      name: 'Client Referrals',
      type: 'tier1',
      assigned: true,
      close_rate: REFERRAL.CLOSE_RATE * 100,  // 50% - warm leads
      velocity: 'Fast',
      description,
      weekly_target: weeklyTarget,
      setup,
      script: '"Who else do you know who could use this kind of help?"',
      expected_display: `~${monthlyExpectedSales} from referrals`,
      priority: 2,
    });
  }

  // ----------------------------------------
  // TIER 1: PROFESSIONAL PARTNERS
  // Always included - long-term relationship building
  // ----------------------------------------
  const partnerTarget = Math.max(1, Math.ceil(goal * 0.25));
  channels.push({
    name: 'Professional Partners',
    type: 'tier1',
    assigned: true,
    close_rate: 35,
    velocity: 'Slow build',
    description: 'CPAs, attorneys, financial advisors, HR directors',
    weekly_target: `${partnerTarget} touches`,
    setup: 'Identify 10 professionals in your area. Contact 2 this week.',
    script: '"I handle Medicare so your clients don\'t have to bug you about it. Coffee?"',
    expected_display: 'Long-term',
    priority: 2,
  });

  // ----------------------------------------
  // TIER 1: CLIENT TOUCHPOINTS
  // Only if book > 15 (you need clients to protect)
  // ----------------------------------------
  if (book > 15) {
    let touchpointTarget: number;
    if (book < 50) {
      touchpointTarget = Math.ceil(book / 10);   // ~5 per week
    } else if (book < 100) {
      touchpointTarget = Math.ceil(book / 12);   // ~4-8 per week
    } else {
      touchpointTarget = Math.ceil(book / 15);   // Scales down for large books
    }

    channels.push({
      name: 'Client Touchpoints',
      type: 'tier1',
      assigned: true,
      close_rate: 60,       // High - retaining is easier than acquiring
      velocity: 'Fast',     // Quick conversations
      description: 'Protect your book. Competitors are calling your clients.',
      weekly_target: `${touchpointTarget} touchpoints`,
      setup: 'Pull this week\'s birthdays. Schedule annual reviews.',
      script: '"Just checking in - how\'s your plan working? Anything changed I should know about?"',
      expected_display: 'Retention focus',
      priority: 2,
    });
  }

  // ----------------------------------------
  // TIER 2: LEAD STAR (internet leads)
  // Only if leads are assigned (leadership decision)
  // ----------------------------------------
  if (profile.lead_star_leads > 0) {
    const weeklyLeads = Math.ceil(profile.lead_star_leads / 4);
    const expectedSales = Math.round(profile.lead_star_leads * 0.15);  // 15% close rate
    channels.push({
      name: 'Lead Star',
      type: 'tier2',
      assigned: true,
      close_rate: 15,       // Lower than warm leads - these are internet inquiries
      velocity: 'Fast',     // Speed to lead is critical
      description: `${profile.lead_star_leads}/mo assigned -> ~${expectedSales} expected sales`,
      weekly_target: `${weeklyLeads} leads, respond in <1 hour`,
      setup: 'Check dashboard every morning. Speed to lead is everything.',
      script: '"Hi, you requested Medicare information. Do you have a few minutes to chat?"',
      expected_display: `~${expectedSales} from ${profile.lead_star_leads} leads`,
      priority: 2,
    });
  }

  // ----------------------------------------
  // TIER 2: MIRA PORTAL (UHC leads)
  // Only if access granted
  // ----------------------------------------
  if (profile.mira_access) {
    channels.push({
      name: 'MIRA Portal',
      type: 'tier2',
      assigned: true,
      close_rate: 18,       // Slightly better than Lead Star - UHC leads
      velocity: 'Fast',
      description: 'UHC real-time leads - aged but interested',
      weekly_target: 'Check 3x/day, call ASAP',
      setup: 'Bookmark portal. Set phone alerts for 9am, 1pm, 5pm.',
      script: '"I see you were looking at Medicare options. Are you still shopping?"',
      expected_display: 'Variable',
      priority: 2,
    });
  }

  // ----------------------------------------
  // TIER 2: SEMINARS
  // Only if eligible (leadership assigns seminar slots)
  // ----------------------------------------
  if (profile.seminar_eligible) {
    const planned = profile.seminars_planned || 0;
    const seminarExpected = planned > 0
      ? Math.round(planned * 12 * 0.32)   // ~12 attendees * 32% close rate
      : 0;
    channels.push({
      name: 'Seminars',
      type: 'tier2',
      assigned: true,
      close_rate: 32,       // High for group presentations
      velocity: 'Scheduled',
      description: planned > 0
        ? `${planned} scheduled this quarter`
        : 'Eligibility confirmed - dates TBA',
      weekly_target: planned > 0
        ? `Prep for ${planned} seminar${planned > 1 ? 's' : ''}`
        : 'Prepare presentation materials',
      setup: 'Confirm venue, practice presentation, prep follow-up system.',
      script: '"I\'ll stay after to answer individual questions."',
      expected_display: planned > 0 ? `~${seminarExpected} from seminars` : 'TBA',
      priority: 2,
    });
  }

  // ----------------------------------------
  // PRIORITY LOGIC: Determine PRIMARY FOCUS channel
  // ----------------------------------------
  let primaryChannel: string;

  if (profile.lead_star_leads > 20) {
    // High lead volume = speed to lead is critical
    primaryChannel = 'Lead Star';
  } else if (book > 100) {
    // Large book = referral machine territory
    primaryChannel = 'Client Referrals';
  } else if (book > 50) {
    // Medium book = protect what you've built
    primaryChannel = 'Client Touchpoints';
  } else {
    // New/small book = warm market first
    primaryChannel = 'Circle of Influence';
  }

  // Set priority 1 for the primary channel
  for (const ch of channels) {
    if (ch.name === primaryChannel) {
      ch.priority = 1;
      break;
    }
  }

  return channels;
}

// ============================================================================
// BUSINESS LOGIC: ACTIVITY CALCULATION
// ============================================================================

/**
 * Calculates daily/weekly activity targets using a tiered framework.
 *
 * THE MATH:
 * - 10% blended close rate (conversations to sales)
 * - 25% contact rate (attempts to conversations)
 * - 20 working days per month
 *
 * TIERED FRAMEWORK:
 * - Goals 1-4: 18 base attempts (Building the Foundation)
 * - Goals 5-6: 22 base attempts (Finding Your Rhythm)
 * - Goals 7-8: 28 base attempts (Growth Mode)
 * - Goals 9-10: 32 base attempts (Producer Level)
 * - Goals 11-12: 38 base attempts (Serious Production)
 * - Goals 13-15: 45 base attempts (Elite Territory)
 * - Goals 16+: 55 base attempts (Top 1%)
 *
 * BOOK SIZE MODIFIER:
 * - 200+ clients: -12 (lots of inbound)
 * - 150-199: -10
 * - 100-149: -7
 * - 75-99: -5
 * - 50-74: -3
 * - 25-49: 0 (baseline)
 * - 0-24: +5 (need more reps to build skill)
 */
function calculateActivity(profile: BrokerProfile): ActivityTargets {
  const goal = profile.monthly_goal;
  const book = profile.book_size;

  // ============================================
  // THE REAL MATH
  // ============================================
  const CLOSE_RATE = 0.10;        // 10% realistic blended close rate
  const CONTACT_RATE = 0.25;      // 25% of attempts become conversations

  const conversationsNeeded = Math.ceil(goal / CLOSE_RATE);
  const attemptsNeeded = Math.ceil(conversationsNeeded / CONTACT_RATE);
  const mathBasedDaily = Math.ceil(attemptsNeeded / 20);

  // ============================================
  // TIERED FRAMEWORK
  // ============================================
  let baseAttempts: number;
  let activityTier: string;
  let tierMessage: string;

  if (goal <= 4) {
    baseAttempts = 18;
    activityTier = "Building the Foundation";
    tierMessage = "Master the basics. Consistency over intensity.";
  } else if (goal <= 6) {
    baseAttempts = 22;
    activityTier = "Finding Your Rhythm";
    tierMessage = "You're developing real habits now.";
  } else if (goal <= 8) {
    baseAttempts = 28;
    activityTier = "Growth Mode";
    tierMessage = "This is where most agents plateau. You won't.";
  } else if (goal <= 10) {
    baseAttempts = 32;
    activityTier = "Producer Level";
    tierMessage = "Top 20% of agents. The work shows.";
  } else if (goal <= 12) {
    baseAttempts = 38;
    activityTier = "Serious Production";
    tierMessage = "You're building real wealth now.";
  } else if (goal <= 15) {
    baseAttempts = 45;
    activityTier = "Elite Territory";
    tierMessage = "Your competition doesn't exist at this level.";
  } else {
    baseAttempts = 55;
    activityTier = "Top 1%";
    tierMessage = "You'll own your market.";
  }

  // ============================================
  // BOOK SIZE MODIFIER
  // ============================================
  let bookModifier = 0;
  if (book >= 200) {
    bookModifier = -12;
  } else if (book >= 150) {
    bookModifier = -10;
  } else if (book >= 100) {
    bookModifier = -7;
  } else if (book >= 75) {
    bookModifier = -5;
  } else if (book >= 50) {
    bookModifier = -3;
  } else if (book >= 25) {
    bookModifier = 0;
  } else {
    bookModifier = +5;  // New agents need more volume
  }

  // Apply modifier with floor of 15
  const FLOOR = 15;
  const dailyAttempts = Math.max(FLOOR, baseAttempts + bookModifier);
  const weeklyAttempts = dailyAttempts * 5;

  // ============================================
  // OUTCOME METRICS
  // ============================================
  const dailyConversations = Math.max(3, Math.ceil(dailyAttempts * 0.25));
  const weeklyConversations = dailyConversations * 5;
  const weeklyAppointments = Math.max(3, Math.ceil(weeklyConversations * 0.18));

  // Referral asks
  const weeklyFromNewSales = Math.ceil(goal / 4);
  const weeklyFromExisting = book > 25 ? Math.ceil(book / 30) : 0;
  const weeklyReferralAsks = Math.max(3, Math.min(weeklyFromNewSales + weeklyFromExisting, 12));

  // ============================================
  // REFERRAL-SPECIFIC METRICS
  // ============================================
  const referralEligibleBook = Math.floor(book * REFERRAL.TENURE_ELIGIBLE_PERCENT);
  const annualAsksFromBook = referralEligibleBook * REFERRAL.ASKS_PER_CLIENT_PER_YEAR;
  const weeklyAsksFromBook = Math.ceil(annualAsksFromBook / 52);
  const totalReferralAsks = Math.min(weeklyAsksFromBook + weeklyFromNewSales, REFERRAL.MAX_WEEKLY_ASKS);
  const referralExpectedNames = Math.round(totalReferralAsks * REFERRAL.YIELD_RATE * 10) / 10;
  const referralExpectedMonthlySales = Math.round(referralExpectedNames * 4 * REFERRAL.CLOSE_RATE * 10) / 10;

  // Lead Star
  const leadStarExpected = Math.round(profile.lead_star_leads * 0.15);

  // Buffer calculation
  const actualMonthlyAttempts = dailyAttempts * 20;
  const bufferPercentage = Math.round(((actualMonthlyAttempts / attemptsNeeded) - 1) * 100);

  return {
    monthly_goal: goal,
    daily_attempts: dailyAttempts,
    weekly_attempts: weeklyAttempts,
    daily_conversations: dailyConversations,
    weekly_appointments: weeklyAppointments,
    weekly_referral_asks: weeklyReferralAsks,
    lead_star_leads: profile.lead_star_leads,
    lead_star_expected: leadStarExpected,
    referral_weekly_asks: totalReferralAsks,
    referral_expected_names: referralExpectedNames,
    referral_expected_monthly_sales: referralExpectedMonthlySales,
    referral_eligible_book: referralEligibleBook,
    activity_tier: activityTier,
    tier_message: tierMessage,
    book_modifier: bookModifier,
    math_conversations_needed: conversationsNeeded,
    math_attempts_needed: attemptsNeeded,
    buffer_percentage: bufferPercentage,
    season: 'oep',
    season_note: 'These targets are calibrated for OEP (Jan-Sep). AEP requires a different playbook.',
  };
}

// ============================================================================
// ECONOMICS CALCULATION
// ============================================================================

/**
 * Calculates 5-year income projection.
 *
 * ASSUMPTIONS:
 * - 50/50 split between T65 ($694) and Plan Changes ($347)
 * - 85% annual retention rate
 * - Renewals start in Year 2
 */
function calculateEconomics(monthlyGoal: number): Economics {
  const t65Monthly = Math.floor(monthlyGoal / 2);
  const planChangeMonthly = monthlyGoal - t65Monthly;

  const monthlyNewIncome = (t65Monthly * COMMISSION.T65) + (planChangeMonthly * COMMISSION.PLAN_CHANGE);
  const annualNewIncome = monthlyNewIncome * 12;
  const annualClients = monthlyGoal * 12;

  const years: YearProjection[] = [];
  let totalClients = 0;

  for (let year = 1; year <= 5; year++) {
    const renewalClients = year === 1 ? 0 : Math.round(totalClients * COMMISSION.RETENTION_RATE);
    const newClients = annualClients;
    totalClients = renewalClients + newClients;

    const newIncome = annualNewIncome;
    const renewalIncome = Math.round(renewalClients * COMMISSION.RENEWAL_ANNUAL);
    const totalIncome = newIncome + renewalIncome;

    years.push({
      year,
      new_clients: newClients,
      renewal_clients: renewalClients,
      new_income: newIncome,
      renewal_income: renewalIncome,
      total_income: totalIncome,
    });

    totalClients = newClients + renewalClients;
  }

  return {
    t65_monthly: t65Monthly,
    plan_change_monthly: planChangeMonthly,
    monthly_new_income: monthlyNewIncome,
    annual_new_income: annualNewIncome,
    years,
  };
}

// ============================================================================
// PDF GENERATION (abbreviated - see full file for complete implementation)
// ============================================================================

// The full PDF generation code creates 7 pages:
// - Page 1: The Truth (goal, math pipeline, channel table)
// - Page 2: Channel Playbook (detailed cards for each channel)
// - Page 3: Economics (5-year projection with visualization)
// - Page 4: The Mindset (5 principles)
// - Page 5: The Rules (non-negotiables, first week checklist, weekly rhythm)
// - Page 6: Accountability (tracker, behind pace section, common mistakes)
// - Page 7: Quick Reference (daily targets, referral engine, when stuck)

// See the full index.ts file for complete PDF generation code.

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, saveToStorage = false } = await req.json();

    if (!profile || !profile.broker_name) {
      return new Response(
        JSON.stringify({ error: "Broker profile is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build all data
    const channels = buildChannels(profile);
    const activity = calculateActivity(profile);
    const economics = calculateEconomics(profile.monthly_goal);

    // Calculate review date (30 days from now)
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + 30);
    const reviewDateStr = reviewDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Generate PDF
    const pdfBytes = await generatePdf(profile, channels, activity, economics, reviewDateStr);

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const safeName = profile.broker_name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Roadmap_${safeName}_${dateStr}.pdf`;

    // Convert to base64
    let binary = '';
    for (let i = 0; i < pdfBytes.length; i++) {
      binary += String.fromCharCode(pdfBytes[i]);
    }
    const base64 = btoa(binary);

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        pdf: base64,
        size: pdfBytes.length,
        channels,
        activity,
        economics,
        review_date: reviewDateStr,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating roadmap:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate roadmap"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## 3. Logic Summary

### A. The 7 Inputs

| Input | Type | Description | How It Affects Output |
|-------|------|-------------|----------------------|
| `broker_name` | string | Agent's display name | Shown on cover page, used in filename |
| `manager_name` | string | Manager's name | Shown on PDF for accountability |
| `book_size` | number | Current client count | - Enables Client Touchpoints if > 15<br>- Affects book modifier (-12 to +5)<br>- Changes referral targets<br>- Determines primary channel priority<br>- Changes advice text (COI vs clients) |
| `monthly_goal` | number | Target sales per month | - THE key driver<br>- Determines activity tier<br>- Scales all weekly targets<br>- Drives economics projection |
| `lead_star_leads` | number | Leads assigned per month | - Enables Lead Star channel if > 0<br>- Calculates expected sales (leads × 15%)<br>- Can become primary channel if > 20 |
| `seminar_eligible` | boolean | Seminar eligibility | - Enables Seminars channel if true |
| `seminars_planned` | number | Seminars scheduled | - Calculates expected sales (seminars × 12 × 32%) |
| `mira_access` | boolean | MIRA portal access | - Enables MIRA Portal channel if true |

### B. Channel Assignment Rules

#### 1. Circle of Influence (Tier 1 - Always Included)

| Property | Value/Formula |
|----------|---------------|
| Close Rate | 45% |
| Velocity | Medium |
| Weekly Target | `max(3, ceil(goal × 0.8))` conversations |
| Expected Sales | `min(coiTarget × 0.45 × 4, goal)` per month |
| Script | "I help people navigate Medicare now. Do you know anyone turning 65 soon?" |

#### 2. Client Referrals (Tier 1 - If book >= 16 OR goal >= 4)

| Book Size | Weekly Target | Description |
|-----------|---------------|-------------|
| < 16 | `ceil(goal/4)` asks after each sale | Build the habit |
| 16-39 | 2-3 asks | Building momentum |
| 40-74 | 3-5 asks | Generating referrals |
| 75-124 | 4-7 asks | Strong referral engine |
| 125+ | 6-10 asks | Referral machine |

Close rate: 50% (warm leads)
Expected: `weeklyAsks × 0.30 × 4 × 0.50` sales/month

#### 3. Professional Partners (Tier 1 - Always Included)

| Property | Value/Formula |
|----------|---------------|
| Close Rate | 35% |
| Velocity | Slow build |
| Weekly Target | `max(1, ceil(goal × 0.25))` touches |
| Expected Sales | Long-term (not quantified) |
| Script | "I handle Medicare so your clients don't have to bug you about it. Coffee?" |

#### 4. Client Touchpoints (Tier 1 - If book > 15)

| Book Size | Weekly Target |
|-----------|---------------|
| 16-49 | `ceil(book/10)` |
| 50-99 | `ceil(book/12)` |
| 100+ | `ceil(book/15)` |

Close rate: 60% (retention)
Purpose: Protect existing book

#### 5. Lead Star (Tier 2 - If lead_star_leads > 0)

| Property | Value/Formula |
|----------|---------------|
| Close Rate | 15% |
| Velocity | Fast |
| Weekly Target | `ceil(leads/4)` leads, respond in < 1 hour |
| Expected Sales | `leads × 0.15` |
| Script | "Hi, you requested Medicare information. Do you have a few minutes to chat?" |

#### 6. MIRA Portal (Tier 2 - If mira_access = true)

| Property | Value |
|----------|-------|
| Close Rate | 18% |
| Velocity | Fast |
| Weekly Target | Check 3x/day, call ASAP |
| Expected Sales | Variable |
| Script | "I see you were looking at Medicare options. Are you still shopping?" |

#### 7. Seminars (Tier 2 - If seminar_eligible = true)

| Property | Value/Formula |
|----------|---------------|
| Close Rate | 32% |
| Velocity | Scheduled |
| Expected Sales | `seminars_planned × 12 × 0.32` |

### C. Activity Calculation Rules

#### The Tier System

| Monthly Goal | Base Attempts | Tier Name | Message |
|--------------|---------------|-----------|---------|
| 1-4 | 18 | Building the Foundation | Master the basics |
| 5-6 | 22 | Finding Your Rhythm | Developing habits |
| 7-8 | 28 | Growth Mode | Most plateau here |
| 9-10 | 32 | Producer Level | Top 20% |
| 11-12 | 38 | Serious Production | Building wealth |
| 13-15 | 45 | Elite Territory | No competition |
| 16+ | 55 | Top 1% | Own your market |

#### Book Size Modifier

| Book Size | Modifier | Reason |
|-----------|----------|--------|
| 200+ | -12 | Lots of inbound activity |
| 150-199 | -10 | Strong referral flow |
| 100-149 | -7 | Established base |
| 75-99 | -5 | Good foundation |
| 50-74 | -3 | Some traction |
| 25-49 | 0 | Baseline |
| 0-24 | +5 | Need more reps |

**Final Daily Attempts** = `max(15, baseAttempts + bookModifier)`

#### Outcome Metrics

| Metric | Formula |
|--------|---------|
| Daily Conversations | `max(3, ceil(dailyAttempts × 0.25))` |
| Weekly Appointments | `max(3, ceil(weeklyConversations × 0.18))` |
| Weekly Referral Asks | `max(3, min(fromNewSales + fromExisting, 12))` |

### D. Referral Engine Math

#### The 5 Constants

| Constant | Value | Rationale |
|----------|-------|-----------|
| ASKS_PER_CLIENT_PER_YEAR | 2 | Don't over-ask |
| TENURE_ELIGIBLE_PERCENT | 80% | Must be 60+ days for compliance |
| YIELD_RATE | 30% | Industry benchmark |
| CLOSE_RATE | 50% | Warm leads convert well |
| MAX_WEEKLY_ASKS | 12 | Prevent burnout |

#### Weekly Asks Formula

```
referralEligibleBook = floor(book_size × 0.80)
annualAsksFromBook = referralEligibleBook × 2
weeklyAsksFromBook = ceil(annualAsksFromBook / 52)
weeklyAsksFromNewSales = ceil(monthly_goal / 4)
totalWeeklyAsks = min(weeklyAsksFromBook + weeklyAsksFromNewSales, 12)
```

#### Expected Names and Sales

```
weeklyExpectedNames = totalWeeklyAsks × 0.30
monthlyExpectedSales = weeklyExpectedNames × 4 × 0.50
```

**Example (85 book, 8 goal):**
- Eligible book: 68 clients
- Annual asks: 136
- Weekly from book: 3
- Weekly from new: 2
- Total weekly: 5 asks
- Weekly names: 1.5
- Monthly sales: ~3 from referrals

### E. Economics Calculation

#### Commission Rates

| Type | Amount | When Paid |
|------|--------|-----------|
| T65 (New to Medicare) | $694 | First year |
| Plan Change | $347 | First year |
| Renewal | $347 | Each subsequent year |
| Retention Rate | 85% | Industry standard |

#### 5-Year Projection Formula

```
For each year 1-5:
  renewalClients = (year === 1) ? 0 : totalClients × 0.85
  newClients = monthly_goal × 12
  totalClients = renewalClients + newClients

  newIncome = (T65_monthly × $694 + PC_monthly × $347) × 12
  renewalIncome = renewalClients × $347
  totalIncome = newIncome + renewalIncome
```

**Example (8 plans/month):**

| Year | New Clients | Renewals | New Income | Renewal Income | Total |
|------|-------------|----------|------------|----------------|-------|
| 1 | 96 | 0 | $49,968 | $0 | $49,968 |
| 2 | 96 | 82 | $49,968 | $28,454 | $78,422 |
| 3 | 96 | 151 | $49,968 | $52,397 | $102,365 |
| 4 | 96 | 210 | $49,968 | $72,870 | $122,838 |
| 5 | 96 | 260 | $49,968 | $90,220 | $140,188 |

### F. Priority Channel Logic

The primary focus channel (gets gold badge) is determined by:

```
if (lead_star_leads > 20) {
  primaryChannel = 'Lead Star'        // Speed to lead critical
} else if (book_size > 100) {
  primaryChannel = 'Client Referrals' // Referral machine
} else if (book_size > 50) {
  primaryChannel = 'Client Touchpoints' // Protect the book
} else {
  primaryChannel = 'Circle of Influence' // Warm market first
}
```

### G. Personalization Points

Every place where PDF content changes based on the agent's profile:

#### Page 1 Changes
- **Goal box**: Shows `monthly_goal` prominently
- **Math pipeline**: All numbers derived from `daily_attempts`
- **Current book**: Shows `book_size` if > 0
- **Channel table**:
  - Only assigned channels shown
  - Tier 2 channels get gray background
  - Expected Sales column shows calculated values

#### Page 2 Changes
- **Channel cards**: Only shows assigned channels
- **PRIMARY FOCUS badge**: Shows on priority 1 channel
- **Lead Star stats**: Shows lead count and expected sales
- **Referral description**: Changes based on book size tier

#### Page 3 Changes
- **Monthly breakdown**: Based on `monthly_goal`
- **5-year projection**: All numbers calculated from goal
- **Comparison insight**: Shows "+2 goal" scenario

#### Page 5 Changes
- **First Week Checklist**:
  - If `book_size > 50`: "Pull 10 clients for referral calls (you have X to choose from)"
  - If `book_size <= 50`: "Build your Circle of Influence list (aim for 50 names)"
  - If `lead_star_leads > 0`: "Set up Lead Star portal alerts - you have X/month incoming"
- **Weekly Rhythm**: Shows `daily_attempts` in morning blocks

#### Page 6 Changes
- **Activity Tracker**: Shows `/${daily_attempts}` targets under each day
- **Behind Pace Section**:
  - Midweek target: `daily_attempts × 3 × 0.7`
  - Friday target: `daily_attempts × 4`
  - If `book_size >= 10`: "Call your 10 most recent clients for referrals"
  - If `book_size < 10`: "Call 10 people from your Circle of Influence list"
- **My Numbers**: Shows `monthly_goal` as reference

#### Page 7 Changes
- **Big goal boxes**: Shows `monthly_goal` and `daily_attempts`
- **Lead Star box**: Only shows if `lead_star_leads > 0`
- **Referral Engine**:
  - Shows `referral_eligible_book` in calculation
  - Shows all referral math with actual values
- **Weekly targets**: All derived from activity calculations
- **When Stuck Section**:
  - If `book_size >= 5`: "Call 5 existing clients for referrals"
  - If `book_size < 5`: "Call 5 people from your Circle of Influence"

---

## Summary

This roadmap generator creates personalized PDF documents by:

1. **Taking 7 inputs** that describe the agent's situation
2. **Assigning appropriate channels** (3-7 depending on resources)
3. **Calculating activity targets** based on goal + book size
4. **Projecting 5-year economics** with compound renewals
5. **Generating a 7-page PDF** with all content personalized

The key insight is that everything flows from `monthly_goal` and `book_size`. These two numbers determine the agent's tier, their primary focus, their daily targets, and their expected outcomes.

---

*Document generated for Tyler Insurance Group internal use.*
