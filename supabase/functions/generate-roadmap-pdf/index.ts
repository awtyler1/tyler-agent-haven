/**
 * Generate Roadmap PDF Edge Function - V5
 *
 * Generates a 7-page Strategic Growth Roadmap PDF.
 * Professional. Grounded. No hype.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Encode function for logo
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================================================
// TYPES
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
  expected_display: string;  // Display text for Expected Sales column
  priority: number;          // 1 = primary focus, 2+ = supporting channels
}

interface ActivityTargets {
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

  // Referral specific metrics (NEW)
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

  // Season context (NEW)
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
// CONSTANTS
// ============================================================================

const COMMISSION = {
  T65: 694,
  PLAN_CHANGE: 347,
  RENEWAL_ANNUAL: 347,
  RETENTION_RATE: 0.85,
};

// Referral calculation constants
const REFERRAL = {
  ASKS_PER_CLIENT_PER_YEAR: 2,
  TENURE_ELIGIBLE_PERCENT: 0.80,  // Assume 80% of book is 60+ days old
  YIELD_RATE: 0.30,               // 30% of asks produce a usable name
  CLOSE_RATE: 0.50,               // 50% of referral names become clients
  MAX_WEEKLY_ASKS: 12,            // Cap to prevent burnout
};

// Colors
const GOLD = rgb(0.62, 0.49, 0.18);
const GOLD_LIGHT = rgb(0.96, 0.94, 0.90);
const CHARCOAL = rgb(0.18, 0.18, 0.18);
const DARK_GRAY = rgb(0.29, 0.29, 0.29);
const MEDIUM_GRAY = rgb(0.42, 0.42, 0.42);
const LIGHT_GRAY = rgb(0.91, 0.91, 0.91);
const TIER2_BG = rgb(0.96, 0.96, 0.96);  // #F5F5F5 - subtle background for Tier 2 channels
const SCRIPT_BG = rgb(0.996, 0.976, 0.906);  // #FEF9E7 - light gold/cream for script boxes
const WHITE = rgb(1, 1, 1);

// Page dimensions
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// ============================================================================
// BUSINESS LOGIC: CHANNEL ASSIGNMENT
// ============================================================================

/**
 * Determines which growth channels to assign based on broker profile.
 * V6 - Updated referral logic tied to book size with realistic projections.
 */
function buildChannels(profile: BrokerProfile): GrowthChannel[] {
  const goal = profile.monthly_goal;
  const book = profile.book_size;
  const channels: GrowthChannel[] = [];

  // ============================================
  // REFERRAL CALCULATIONS (used in channel assignment)
  // ============================================
  const referralEligibleBook = Math.floor(book * REFERRAL.TENURE_ELIGIBLE_PERCENT);
  const annualAsksFromBook = referralEligibleBook * REFERRAL.ASKS_PER_CLIENT_PER_YEAR;
  const weeklyAsksFromBook = Math.ceil(annualAsksFromBook / 52);
  const weeklyAsksFromNewSales = Math.ceil(goal / 4);
  const totalWeeklyAsks = Math.min(weeklyAsksFromBook + weeklyAsksFromNewSales, REFERRAL.MAX_WEEKLY_ASKS);
  const weeklyExpectedNames = Math.round(totalWeeklyAsks * REFERRAL.YIELD_RATE * 10) / 10;
  const monthlyExpectedSales = Math.round(weeklyExpectedNames * 4 * REFERRAL.CLOSE_RATE * 10) / 10;

  // ----------------------------------------
  // TIER 1: ALWAYS INCLUDED (relationship-based)
  // ----------------------------------------

  // Circle of Influence - scales with goal
  const coiTarget = Math.max(3, Math.ceil(goal * 0.8));
  const coiExpected = Math.min(Math.round(coiTarget * 0.45 * 4), Math.floor(goal * 0.5));  // Cap at 50% of goal
  channels.push({
    name: 'Circle of Influence',
    type: 'tier1',
    assigned: true,
    close_rate: 45,
    velocity: 'Medium',
    description: 'Friends, family, acquaintances who trust you',
    weekly_target: `${coiTarget} conversations`,
    setup: 'List 50 people you know who are 60+. Reach out to 10 this week.',
    script: '"I help people navigate Medicare now. Do you know anyone turning 65 soon?"',
    expected_display: `~${coiExpected}/mo potential`,
    priority: 2,
  });

  // ----------------------------------------
  // CLIENT REFERRALS - Tied to book size with tiered targets
  // ----------------------------------------
  if (book >= 16 || goal >= 4) {
    let weeklyTarget: string;
    let description: string;
    let setup: string;

    if (book < 16) {
      // New agent with no meaningful book - focus on asking after new sales
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
      // Large book - referral machine
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
      close_rate: REFERRAL.CLOSE_RATE * 100,
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
  // PROFESSIONAL PARTNERS - scales with goal, slow build
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
  // CLIENT TOUCHPOINTS - only if book > 15
  // ----------------------------------------
  if (book > 15) {
    let touchpointTarget: number;
    if (book < 50) {
      touchpointTarget = Math.ceil(book / 10);
    } else if (book < 100) {
      touchpointTarget = Math.ceil(book / 12);
    } else {
      touchpointTarget = Math.ceil(book / 15);
    }

    channels.push({
      name: 'Client Touchpoints',
      type: 'tier1',
      assigned: true,
      close_rate: 60,
      velocity: 'Fast',
      description: 'Protect your book. Competitors are calling your clients.',
      weekly_target: `${touchpointTarget} touchpoints`,
      setup: 'Pull this week\'s birthdays. Schedule annual reviews.',
      script: '"Just checking in - how\'s your plan working? Anything changed I should know about?"',
      expected_display: 'Retention focus',
      priority: 2,
    });
  }

  // ----------------------------------------
  // TIER 2: ASSIGNED RESOURCES (leadership grants these)
  // ----------------------------------------

  // Lead Star (only if leads assigned)
  if (profile.lead_star_leads > 0) {
    const weeklyLeads = Math.ceil(profile.lead_star_leads / 4);
    const expectedSales = Math.round(profile.lead_star_leads * 0.15);
    channels.push({
      name: 'Lead Star',
      type: 'tier2',
      assigned: true,
      close_rate: 15,
      velocity: 'Fast',
      description: `${profile.lead_star_leads}/mo assigned -> ~${expectedSales} expected sales`,
      weekly_target: `${weeklyLeads} leads, respond in <1 hour`,
      setup: 'Check dashboard every morning. Speed to lead is everything.',
      script: '"Hi, you requested Medicare information. Do you have a few minutes to chat?"',
      expected_display: `~${expectedSales} from ${profile.lead_star_leads} leads`,
      priority: 2,
    });
  }

  // MIRA Portal (only if access granted)
  if (profile.mira_access) {
    channels.push({
      name: 'MIRA Portal',
      type: 'tier2',
      assigned: true,
      close_rate: 18,
      velocity: 'Fast',
      description: 'UHC real-time leads - aged but interested',
      weekly_target: 'Check 3x/day, call ASAP',
      setup: 'Bookmark portal. Set phone alerts for 9am, 1pm, 5pm.',
      script: '"I see you were looking at Medicare options. Are you still shopping?"',
      expected_display: 'Variable',
      priority: 2,
    });
  }

  // Seminars (only if eligible)
  if (profile.seminar_eligible) {
    const planned = profile.seminars_planned || 0;
    const seminarExpected = planned > 0 ? Math.round(planned * 12 * 0.32) : 0;  // seminars × avg attendees × close rate
    channels.push({
      name: 'Seminars',
      type: 'tier2',
      assigned: true,
      close_rate: 32,
      velocity: 'Scheduled',
      description: planned > 0 ? `${planned} scheduled this quarter` : 'Eligibility confirmed - dates TBA',
      weekly_target: planned > 0 ? `Prep for ${planned} seminar${planned > 1 ? 's' : ''}` : 'Prepare presentation materials',
      setup: 'Confirm venue, practice presentation, prep follow-up system.',
      script: '"I\'ll stay after to answer individual questions."',
      expected_display: planned > 0 ? `~${seminarExpected} from seminars` : 'TBA',
      priority: 2,
    });
  }

  // ----------------------------------------
  // PRIORITY LOGIC: Determine primary focus channel
  // ----------------------------------------
  // Priority 1 = primary focus based on agent's situation
  let primaryChannel: string;
  if (profile.lead_star_leads > 20) {
    primaryChannel = 'Lead Star';  // Speed to lead is critical with high lead volume
  } else if (book > 100) {
    primaryChannel = 'Client Referrals';  // Referral machine territory
  } else if (book > 50) {
    primaryChannel = 'Client Touchpoints';  // Protect what you've built
  } else {
    primaryChannel = 'Circle of Influence';  // Warm market for new agents
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
 * V6 - Fixed book modifier gaps, added referral metrics and season context.
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
  const mathBasedDaily = Math.ceil(attemptsNeeded / 20); // 20 working days

  // ============================================
  // TIERED FRAMEWORK (Sustainable + Challenging)
  // ============================================
  // These are ~30% above pure math to provide buffer
  // But not so high that agents burn out or lie about numbers

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
  // BOOK SIZE MODIFIER (FIXED - smooth gradient, no gaps)
  // ============================================
  // New agents need MORE reps to build skill
  // Established agents get more inbound, need less outbound
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
    bookModifier = 0;   // Baseline - agent has some traction
  } else {
    bookModifier = +5;  // New agents need more volume to build skill
  }

  // Apply modifier with floor of 15 (nobody coasts)
  const FLOOR = 15;
  const dailyAttempts = Math.max(FLOOR, baseAttempts + bookModifier);
  const weeklyAttempts = dailyAttempts * 5;

  // ============================================
  // OUTCOME METRICS
  // ============================================

  // ~25% of attempts become real conversations
  const dailyConversations = Math.max(3, Math.ceil(dailyAttempts * 0.25));

  // ~18% of conversations become appointments
  const weeklyConversations = dailyConversations * 5;
  const weeklyAppointments = Math.max(3, Math.ceil(weeklyConversations * 0.18));

  // Referral asks - using unified referral engine math (matches buildChannels)
  const referralEligibleBookForAsks = Math.floor(book * REFERRAL.TENURE_ELIGIBLE_PERCENT);
  const annualAsksFromBookForActivity = referralEligibleBookForAsks * REFERRAL.ASKS_PER_CLIENT_PER_YEAR;
  const weeklyAsksFromBookForActivity = Math.ceil(annualAsksFromBookForActivity / 52);
  const weeklyFromNewSales = Math.ceil(goal / 4);
  const weeklyReferralAsks = Math.max(3, Math.min(weeklyAsksFromBookForActivity + weeklyFromNewSales, REFERRAL.MAX_WEEKLY_ASKS));

  // ============================================
  // REFERRAL-SPECIFIC METRICS (NEW)
  // ============================================
  const referralEligibleBook = Math.floor(book * REFERRAL.TENURE_ELIGIBLE_PERCENT);
  const annualAsksFromBook = referralEligibleBook * REFERRAL.ASKS_PER_CLIENT_PER_YEAR;
  const weeklyAsksFromBook = Math.ceil(annualAsksFromBook / 52);
  const totalReferralAsks = Math.min(weeklyAsksFromBook + weeklyFromNewSales, REFERRAL.MAX_WEEKLY_ASKS);
  const referralExpectedNames = Math.round(totalReferralAsks * REFERRAL.YIELD_RATE * 10) / 10;
  const referralExpectedMonthlySales = Math.round(referralExpectedNames * 4 * REFERRAL.CLOSE_RATE * 10) / 10;

  // ============================================
  // LEAD STAR
  // ============================================
  const leadStarExpected = Math.round(profile.lead_star_leads * 0.15);

  // ============================================
  // BUFFER CALCULATION (for transparency)
  // ============================================
  const actualMonthlyAttempts = dailyAttempts * 20;
  const bufferPercentage = Math.round(((actualMonthlyAttempts / attemptsNeeded) - 1) * 100);

  return {
    monthly_goal: goal,

    // Primary metrics
    daily_attempts: dailyAttempts,
    weekly_attempts: weeklyAttempts,

    // Outcome metrics
    daily_conversations: dailyConversations,
    weekly_appointments: weeklyAppointments,
    weekly_referral_asks: weeklyReferralAsks,

    // Lead Star
    lead_star_leads: profile.lead_star_leads,
    lead_star_expected: leadStarExpected,

    // Referral specific (NEW)
    referral_weekly_asks: totalReferralAsks,
    referral_expected_names: referralExpectedNames,
    referral_expected_monthly_sales: referralExpectedMonthlySales,
    referral_eligible_book: referralEligibleBook,

    // Tier context
    activity_tier: activityTier,
    tier_message: tierMessage,
    book_modifier: bookModifier,

    // The math (for transparency)
    math_conversations_needed: conversationsNeeded,
    math_attempts_needed: attemptsNeeded,
    buffer_percentage: bufferPercentage,

    // Season context (NEW)
    season: 'oep',
    season_note: 'These targets are calibrated for OEP (Jan-Sep). AEP requires a different playbook.',
  };
}

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
// PDF HELPERS
// ============================================================================

function drawHeader(
  page: PDFPage,
  helveticaBold: PDFFont,
  helvetica: PDFFont,
  pageTitle?: string
) {
  // Gold line
  page.drawLine({
    start: { x: MARGIN, y: PAGE_HEIGHT - 60 },
    end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 60 },
    thickness: 2,
    color: GOLD,
  });

  // Title
  page.drawText('STRATEGIC GROWTH ROADMAP', {
    x: MARGIN,
    y: PAGE_HEIGHT - 45,
    size: 14,
    font: helveticaBold,
    color: CHARCOAL,
  });

  if (pageTitle) {
    page.drawText(pageTitle, {
      x: MARGIN,
      y: PAGE_HEIGHT - 55,
      size: 8,
      font: helvetica,
      color: GOLD,
    });
  }
}

function drawFooter(
  page: PDFPage,
  helvetica: PDFFont,
  pageNum: number,
  totalPages: number
) {
  page.drawLine({
    start: { x: MARGIN, y: 30 },
    end: { x: PAGE_WIDTH - MARGIN, y: 30 },
    thickness: 0.5,
    color: LIGHT_GRAY,
  });

  page.drawText('Tyler Insurance Group | Confidential', {
    x: MARGIN,
    y: 18,
    size: 7,
    font: helvetica,
    color: MEDIUM_GRAY,
  });

  page.drawText(`Page ${pageNum} of ${totalPages}`, {
    x: PAGE_WIDTH - MARGIN - 50,
    y: 18,
    size: 7,
    font: helvetica,
    color: MEDIUM_GRAY,
  });
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width < maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

// ============================================================================
// PDF GENERATION
// ============================================================================

async function generatePdf(
  profile: BrokerProfile,
  channels: GrowthChannel[],
  activity: ActivityTargets,
  economics: Economics,
  reviewDateStr: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Load logo from Supabase Storage
  let logoImage: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  try {
    const logoUrl = "https://mgczpsrtkdkkjzmztpyd.supabase.co/storage/v1/object/public/Assets/Sheild%20Logo.PNG";
    const logoResponse = await fetch(logoUrl);
    const logoBytes = await logoResponse.arrayBuffer();
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch (error) {
    console.error("Failed to load logo:", error);
  }

  // Page dimensions
  const width = 612;
  const height = 792;
  const margin = 36; // 0.5 inch
  const contentWidth = width - (margin * 2);
  const totalPages = 7;
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const drawText = (
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    size: number,
    font: PDFFont,
    color = CHARCOAL
  ) => {
    page.drawText(text, { x, y, size, font, color });
  };

  const drawTextRight = (
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    size: number,
    font: PDFFont,
    color = CHARCOAL
  ) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: x - textWidth, y, size, font, color });
  };

  const drawTextCentered = (
    page: PDFPage,
    text: string,
    centerX: number,
    y: number,
    size: number,
    font: PDFFont,
    color = CHARCOAL
  ) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: centerX - textWidth / 2, y, size, font, color });
  };

  const drawLine = (
    page: PDFPage,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color = LIGHT_GRAY,
    thickness = 1
  ) => {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness,
      color
    });
  };

  const drawRect = (
    page: PDFPage,
    x: number,
    y: number,
    w: number,
    h: number,
    color = GOLD_LIGHT,
    borderColor?: typeof GOLD
  ) => {
    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      color,
      borderColor,
      borderWidth: borderColor ? 1 : 0,
    });
  };

  const drawHeader = (page: PDFPage, pageTitle: string, showLogo = true) => {
    // White background for header
    drawRect(page, 0, height - 61, width, 61, WHITE);

    // Gold line under header
    drawLine(page, margin, height - 61, width - margin, height - 61, GOLD, 2);

    // Logo
    if (showLogo && logoImage) {
      page.drawImage(logoImage, {
        x: margin,
        y: height - 52,
        width: 32,
        height: 32,
      });
    }

    // Title
    const titleX = showLogo && logoImage ? margin + 40 : margin;
    drawText(page, "STRATEGIC GROWTH ROADMAP", titleX, height - 30, 13, helveticaBold, CHARCOAL);

    // Page subtitle
    drawText(page, pageTitle, titleX, height - 42, 8, helvetica, GOLD);
  };

  const drawFooter = (page: PDFPage, pageNum: number) => {
    drawLine(page, margin, 27, width - margin, 27, LIGHT_GRAY, 0.5);
    drawText(page, "Tyler Insurance Group | Confidential", margin, 16, 7, helvetica, MEDIUM_GRAY);
    drawTextRight(page, `Page ${pageNum} of ${totalPages}`, width - margin, 16, 7, helvetica, MEDIUM_GRAY);
  };

  const assignedChannels = channels.filter(c => c.assigned);

  // ============================================
  // PAGE 1: THE TRUTH
  // ============================================
  let page = pdfDoc.addPage([width, height]);
  drawHeader(page, "The Truth", true);
  drawFooter(page, 1);

  let y = height - 83;

  // Name and date
  drawText(page, `Prepared for ${profile.broker_name}`, margin, y, 11, helveticaBold, CHARCOAL);
  drawTextRight(page, today, width - margin, y, 9, helvetica, MEDIUM_GRAY);
  y -= 13;

  // OEP Edition indicator
  drawText(page, "OEP Edition (Off-Season Focus)", margin, y, 8, helveticaOblique, MEDIUM_GRAY);
  y -= 15;

  // Opening paragraph
  const opening = "This is not a motivational document. There are no secrets here. No magic scripts. No shortcuts. What follows is a simple plan based on math, proven channels, and the discipline to show up every day.";
  drawText(page, opening.substring(0, 95), margin, y, 9, helvetica, DARK_GRAY);
  y -= 11;
  drawText(page, opening.substring(95), margin, y, 9, helvetica, DARK_GRAY);
  y -= 20;

  // YOUR GOAL section
  drawText(page, "YOUR GOAL", margin, y, 10, helveticaBold, CHARCOAL);
  y -= 16;

  // Goal box
  const goalBoxH = 52;
  drawRect(page, margin, y - goalBoxH, contentWidth, goalBoxH, GOLD_LIGHT, GOLD);

  // Goal number
  drawText(page, `${profile.monthly_goal}`, margin + 13, y - 35, 32, helveticaBold, GOLD);

  // Goal text
  drawText(page, "Medicare enrollments per month", margin + 58, y - 25, 11, helveticaBold, CHARCOAL);
  drawText(page, `${economics.t65_monthly} T65 + ${economics.plan_change_monthly} Plan Changes (50/50 target mix)`, margin + 58, y - 38, 8, helvetica, DARK_GRAY);

  // Review date (right side)
  drawTextRight(page, `30-day review: ${reviewDateStr}`, width - margin - 11, y - 25, 8, helvetica, MEDIUM_GRAY);
  drawTextRight(page, "with TIG Leadership", width - margin - 11, y - 36, 8, helvetica, MEDIUM_GRAY);

  if (profile.book_size > 0) {
    drawTextRight(page, `Current book: ${profile.book_size} clients`, width - margin - 11, y - 47, 8, helveticaBold, GOLD);
  }

  y -= goalBoxH + 20;

  // THE MATH section
  drawText(page, "THE MATH", margin, y, 10, helveticaBold, CHARCOAL);
  y -= 13;
  drawText(page, "Success is predictable when you know the numbers:", margin, y, 8, helvetica, DARK_GRAY);
  y -= 18;

  // Math pipeline boxes
  const boxW = 79;
  const boxH = 37;
  const gap = 13;
  const mathItems = [
    { num: `${activity.daily_attempts}`, label: "attempts/day" },
    { num: `${activity.daily_attempts * 5}`, label: "attempts/week" },
    { num: `${activity.daily_conversations * 5}`, label: "convos/week" },
    { num: `${activity.math_conversations_needed}`, label: "convos/month" },
    { num: `${profile.monthly_goal}`, label: "sales/month" },
  ];

  for (let i = 0; i < mathItems.length; i++) {
    const bx = margin + i * (boxW + gap);
    const by = y - boxH;
    const isLast = i === mathItems.length - 1;

    if (isLast) {
      drawRect(page, bx, by, boxW, boxH, GOLD);
      drawTextCentered(page, mathItems[i].num, bx + boxW / 2, by + boxH - 16, 16, helveticaBold, WHITE);
      drawTextCentered(page, mathItems[i].label, bx + boxW / 2, by + 9, 7, helvetica, WHITE);
    } else {
      drawRect(page, bx, by, boxW, boxH, WHITE, LIGHT_GRAY);
      drawTextCentered(page, mathItems[i].num, bx + boxW / 2, by + boxH - 16, 16, helveticaBold, CHARCOAL);
      drawTextCentered(page, mathItems[i].label, bx + boxW / 2, by + 9, 7, helvetica, DARK_GRAY);
    }

    // Arrow between boxes
    if (i < mathItems.length - 1) {
      drawTextCentered(page, ">", bx + boxW + gap / 2, by + boxH / 2 - 2, 10, helveticaBold, GOLD);
    }
  }

  y -= boxH + 18;

  // Key insight box
  drawRect(page, margin, y - 29, contentWidth, 29, WHITE, GOLD);
  drawText(page, `If you make ${activity.daily_attempts} quality attempts every working day, you will hit your goal.`, margin + 9, y - 18, 8, helveticaBold, CHARCOAL);

  y -= 29 + 20;

  // YOUR CHANNELS table
  drawText(page, "YOUR CHANNELS", margin, y, 10, helveticaBold, CHARCOAL);
  y -= 16;

  // Table header
  drawRect(page, margin, y - 14, contentWidth, 14, GOLD);
  const colX = [margin + 6, margin + 120, margin + 168, margin + 218, margin + 340];
  const headers = ["Channel", "Close Rate", "Speed", "Weekly Target", "Expected Sales"];
  for (let i = 0; i < headers.length; i++) {
    drawText(page, headers[i], colX[i], y - 10, 7, helveticaBold, WHITE);
  }
  y -= 14;

  // Table rows
  for (const ch of assignedChannels) {
    const rowH = 19;
    // Tier 2 channels get subtle gray background for visual distinction
    const rowBg = ch.type === 'tier2' ? TIER2_BG : WHITE;
    drawRect(page, margin, y - rowH, contentWidth, rowH, rowBg);
    drawLine(page, margin, y - rowH, width - margin, y - rowH, LIGHT_GRAY, 0.5);

    drawText(page, ch.name, colX[0], y - 12, 8, helveticaBold, CHARCOAL);
    drawText(page, `${ch.close_rate}%`, colX[1], y - 12, 8, helvetica, DARK_GRAY);
    drawText(page, ch.velocity.split(',')[0].substring(0, 12), colX[2], y - 12, 8, helvetica, DARK_GRAY);
    drawText(page, ch.weekly_target.substring(0, 28), colX[3], y - 12, 8, helvetica, DARK_GRAY);

    // Expected Sales - use channel's expected_display field
    const isTier2WithValue = ch.type === 'tier2' && ch.expected_display !== 'Variable' && ch.expected_display !== 'TBA';
    const displayColor = isTier2WithValue ? GOLD : DARK_GRAY;
    const displayFont = isTier2WithValue ? helveticaBold : helvetica;
    drawText(page, ch.expected_display, colX[4], y - 12, 8, displayFont, displayColor);

    y -= rowH;
  }

  // ============================================
  // PAGE 2: CHANNEL PLAYBOOK
  // ============================================
  page = pdfDoc.addPage([width, height]);
  drawHeader(page, "Channel Playbook");
  drawFooter(page, 2);

  y = height - 83;
  drawText(page, "HOW TO WORK EACH CHANNEL", margin, y, 10, helveticaBold, CHARCOAL);
  y -= 22;

  for (const ch of assignedChannels) {
    const isPrimary = ch.priority === 1;
    const cardH = isPrimary ? 88 : 78;  // Primary cards are taller

    if (y - cardH < 45) {
      page = pdfDoc.addPage([width, height]);
      drawHeader(page, "Channel Playbook");
      drawFooter(page, 2);
      y = height - 83;
    }

    // Card background
    drawRect(page, margin, y - cardH, contentWidth, cardH, WHITE, LIGHT_GRAY);

    // Gold left accent (thicker for primary)
    const accentWidth = isPrimary ? 6 : 4;
    drawRect(page, margin, y - cardH, accentWidth, cardH, GOLD);

    // PRIMARY FOCUS badge (for priority 1 channels)
    if (isPrimary) {
      const badgeW = 85;
      const badgeH = 14;
      drawRect(page, width - margin - badgeW - 4, y - badgeH - 4, badgeW, badgeH, GOLD);
      drawTextCentered(page, "PRIMARY FOCUS", width - margin - badgeW / 2 - 4, y - badgeH + 1, 7, helveticaBold, WHITE);
    }

    // Channel name
    const nameX = margin + (isPrimary ? 16 : 13);
    drawText(page, ch.name, nameX, y - 13, isPrimary ? 11 : 10, helveticaBold, CHARCOAL);

    // Stats (right side) - show close rate | velocity for all channels
    // For primary channels, position stats below the PRIMARY FOCUS badge to avoid overlap
    const statsY = isPrimary ? y - 24 : y - 13;
    drawTextRight(page, `${ch.close_rate}% close rate | ${ch.velocity}`, width - margin - 9, statsY, 8, helvetica, MEDIUM_GRAY);

    // Description
    const descY = isPrimary ? y - 35 : y - 26;
    drawText(page, ch.description, nameX, descY, 8, helveticaOblique, DARK_GRAY);

    // Setup
    const setupY = isPrimary ? y - 46 : y - 37;
    drawText(page, "SETUP:", nameX, setupY, 7, helveticaBold, GOLD);
    drawText(page, ch.setup.substring(0, 70), nameX + 30, setupY, 8, helvetica, CHARCOAL);

    // Weekly
    const weeklyY = isPrimary ? y - 57 : y - 48;
    drawText(page, "WEEKLY:", nameX, weeklyY, 7, helveticaBold, GOLD);
    drawText(page, ch.weekly_target, nameX + 36, weeklyY, 8, helveticaBold, CHARCOAL);

    // Script box with gold background
    const scriptBoxH = 18;
    const scriptBoxY = isPrimary ? y - cardH + 6 : y - cardH + 6;
    const scriptBoxW = contentWidth - 16;

    // Script background box
    drawRect(page, margin + 8, scriptBoxY, scriptBoxW, scriptBoxH, SCRIPT_BG);
    // Gold left accent on script box
    drawRect(page, margin + 8, scriptBoxY, 2, scriptBoxH, GOLD);

    // Quotation mark and script text
    drawText(page, '"', margin + 14, scriptBoxY + scriptBoxH - 6, 12, helveticaBold, GOLD);
    drawText(page, ch.script.substring(1, 90), margin + 22, scriptBoxY + scriptBoxH - 7, 8, helveticaOblique, CHARCOAL);

    y -= cardH + (isPrimary ? 12 : 9);
  }

  // ============================================
  // PAGE 3: THE ECONOMICS
  // ============================================
  page = pdfDoc.addPage([width, height]);
  drawHeader(page, "What You're Building");
  drawFooter(page, 3);

  y = height - 83;
  drawText(page, "THE ECONOMICS", margin, y, 10, helveticaBold, CHARCOAL);
  y -= 13;
  drawText(page, "You're not just selling policies. You're building an asset.", margin, y, 9, helvetica, DARK_GRAY);
  y -= 22;

  // Monthly breakdown
  drawText(page, `Your ${profile.monthly_goal} plans/month breaks down to:`, margin, y, 9, helveticaBold, CHARCOAL);
  y -= 16;

  // T65 vs Plan Change boxes
  const econBoxW = 180;
  const econBoxH = 43;

  // T65 box
  drawRect(page, margin, y - econBoxH, econBoxW, econBoxH, GOLD_LIGHT, GOLD);
  drawText(page, "T65 (New to Medicare)", margin + 9, y - 13, 9, helveticaBold, CHARCOAL);
  drawText(page, `${economics.t65_monthly}`, margin + 9, y - 32, 18, helveticaBold, GOLD);
  drawText(page, `x $694 = $${(economics.t65_monthly * 694).toLocaleString()}`, margin + 36, y - 30, 9, helvetica, DARK_GRAY);

  // Plan Change box
  drawRect(page, margin + econBoxW + 14, y - econBoxH, econBoxW, econBoxH, WHITE, LIGHT_GRAY);
  drawText(page, "Plan Changes", margin + econBoxW + 23, y - 13, 9, helveticaBold, CHARCOAL);
  drawText(page, `${economics.plan_change_monthly}`, margin + econBoxW + 23, y - 32, 18, helveticaBold, CHARCOAL);
  drawText(page, `x $347 = $${(economics.plan_change_monthly * 347).toLocaleString()}`, margin + econBoxW + 50, y - 30, 9, helvetica, DARK_GRAY);

  // Monthly/Annual totals (right side)
  drawTextRight(page, `Monthly: $${economics.monthly_new_income.toLocaleString()}`, width - margin, y - 18, 10, helveticaBold, GOLD);
  drawTextRight(page, `Year 1: $${economics.annual_new_income.toLocaleString()}`, width - margin, y - 32, 12, helveticaBold, CHARCOAL);

  y -= econBoxH + 20;

  // 5-Year Projection
  drawText(page, "5-YEAR WEALTH TRAJECTORY (85% retention)", margin, y, 9, helveticaBold, CHARCOAL);
  y -= 16;

  // Table header
  drawRect(page, margin, y - 14, contentWidth, 14, GOLD);
  const yrColX = [margin + 7, margin + 50, margin + 115, margin + 185, margin + 270, margin + 365];
  const yrHeaders = ["Year", "New Clients", "Renewals", "New Income", "Renewal Income", "Total"];
  for (let i = 0; i < yrHeaders.length; i++) {
    drawText(page, yrHeaders[i], yrColX[i], y - 10, 7, helveticaBold, WHITE);
  }
  y -= 14;

  // Table rows (compact for 5 years)
  for (const yr of economics.years) {
    const rowH = 16;
    drawRect(page, margin, y - rowH, contentWidth, rowH, WHITE);
    drawLine(page, margin, y - rowH, width - margin, y - rowH, LIGHT_GRAY, 0.5);

    drawText(page, `Year ${yr.year}`, yrColX[0], y - 11, 8, helveticaBold, CHARCOAL);
    drawText(page, `${yr.new_clients}`, yrColX[1], y - 11, 8, helvetica, DARK_GRAY);
    drawText(page, `${yr.renewal_clients}`, yrColX[2], y - 11, 8, helvetica, DARK_GRAY);
    drawText(page, `$${yr.new_income.toLocaleString()}`, yrColX[3], y - 11, 8, helvetica, DARK_GRAY);
    drawText(page, `$${yr.renewal_income.toLocaleString()}`, yrColX[4], y - 11, 8, helvetica, DARK_GRAY);
    drawText(page, `$${yr.total_income.toLocaleString()}`, yrColX[5], y - 11, 8, helveticaBold, GOLD);

    y -= rowH;
  }

  y -= 16;

  // Income Growth Visualization
  drawText(page, "INCOME GROWTH TRAJECTORY", margin, y, 9, helveticaBold, CHARCOAL);
  y -= 14;

  const maxIncome = economics.years[4].total_income;
  const barMaxWidth = contentWidth - 100;  // Leave room for labels

  for (const yr of economics.years) {
    const barH = 12;
    const barWidth = Math.round((yr.total_income / maxIncome) * barMaxWidth);

    // Year label
    drawText(page, `Year ${yr.year}:`, margin, y - 9, 8, helvetica, DARK_GRAY);

    // Income bar
    drawRect(page, margin + 45, y - barH + 1, barWidth, barH - 2, GOLD);

    // Income amount at end of bar
    drawText(page, `$${yr.total_income.toLocaleString()}`, margin + 50 + barWidth, y - 9, 8, helveticaBold, CHARCOAL);

    y -= barH + 3;
  }

  y -= 12;

  // Emotional Payoff Callout Box
  const yr5 = economics.years[4];
  const calloutH = 52;
  drawRect(page, margin, y - calloutH, contentWidth, calloutH, GOLD_LIGHT, GOLD);
  drawText(page, "WHAT THIS MEANS FOR YOU", margin + 9, y - 13, 9, helveticaBold, CHARCOAL);
  drawText(page, `By Year 5, your renewal income alone ($${yr5.renewal_income.toLocaleString()}) could cover your living expenses.`, margin + 9, y - 26, 8, helvetica, DARK_GRAY);
  drawText(page, "New sales become wealth-building, not survival.", margin + 9, y - 37, 8, helvetica, DARK_GRAY);
  drawText(page, "This is how you build a business, not just a job.", margin + 9, y - 48, 8, helveticaBold, GOLD);

  y -= calloutH + 12;

  // Comparison Insight
  const higherGoal = profile.monthly_goal + 2;
  const higherEcon = calculateEconomics(higherGoal);
  const higherYear5 = higherEcon.years[4].total_income;
  drawText(page, `If you increased to ${higherGoal} plans/month, Year 5 total would be $${higherYear5.toLocaleString()}`, margin, y, 8, helveticaOblique, MEDIUM_GRAY);

  y -= 14;

  // Disclaimer
  drawText(page, "* Commissions shown are illustrative. Actual amounts may vary by carrier and timing.", margin, y, 7, helveticaOblique, MEDIUM_GRAY);

  // ============================================
  // PAGE 4: THE MINDSET
  // ============================================
  page = pdfDoc.addPage([width, height]);
  drawHeader(page, "The Mindset");
  drawFooter(page, 4);

  y = height - 83;
  drawText(page, "WHAT ACTUALLY MATTERS", margin, y, 10, helveticaBold, CHARCOAL);
  y -= 13;
  drawText(page, "Forget the hype. Here's what separates agents who build sustainable businesses from those who burn out:", margin, y, 8, helvetica, DARK_GRAY);
  y -= 22;

  const principles = [
    { title: "Discipline beats motivation", truth: "You will not feel like making calls most days. Make them anyway.", detail: "Motivation fades. Discipline is a choice you make every morning." },
    { title: "Own everything", truth: "It may not be your fault, but it's your responsibility.", detail: "The leads were bad. The market is tough. These may be true. They're also irrelevant." },
    { title: "Focus on what you control", truth: "Your effort. Your preparation. Your follow-up.", detail: "You cannot control if they answer. You can control how many times you call." },
    { title: "Play the long game", truth: "Reputation over commissions. Relationships over transactions.", detail: "The right plan for every client builds a referral machine that compounds for decades." },
    { title: "Embrace the boring", truth: "Success is doing simple things with extraordinary consistency.", detail: "There are no secrets. The agents who win show up every day. That's it." },
  ];

  for (let i = 0; i < principles.length; i++) {
    const p = principles[i];
    const cardH = 52;

    drawRect(page, margin, y - cardH, contentWidth, cardH, WHITE, LIGHT_GRAY);

    // Number
    drawText(page, `${i + 1}.`, margin + 9, y - 14, 12, helveticaBold, GOLD);

    // Title
    drawText(page, p.title, margin + 29, y - 14, 10, helveticaBold, CHARCOAL);

    // Truth
    drawText(page, p.truth, margin + 9, y - 29, 8, helveticaBold, GOLD);

    // Detail
    drawText(page, p.detail, margin + 9, y - 42, 8, helvetica, DARK_GRAY);

    y -= cardH + 7;
  }

  // ============================================
  // PAGE 5: THE RULES + FIRST WEEK + WEEKLY RHYTHM
  // ============================================
  page = pdfDoc.addPage([width, height]);
  drawHeader(page, "The Rules");
  drawFooter(page, 5);

  y = height - 83;
  drawText(page, "NON-NEGOTIABLES", margin, y, 10, helveticaBold, CHARCOAL);
  y -= 18;

  const rules = [
    { name: "1-Hour Rule", stat: "78%", statLabel: "of leads to first responder", detail: "Respond to every new lead within 1 hour. Check your portal hourly." },
    { name: "6-Touch Rule", stat: "80%", statLabel: "of sales after 5th contact", detail: "Every lead gets 6 attempts over 14 days. Most agents quit after 2." },
    { name: "Referral Rule", stat: "4x", statLabel: "higher close rate", detail: "Ask every satisfied client: \"Who else could use this kind of help?\"" },
    { name: "Protection Rule", stat: "10x", statLabel: "cheaper to retain", detail: "Review every client annually. They'll never leave." },
    { name: "Activity Rule", stat: "0", statLabel: "zero days allowed", detail: `Make ${activity.daily_attempts} attempts every working day. No exceptions.` },
  ];

  for (const rule of rules) {
    const rowH = 37;
    drawRect(page, margin, y - rowH, contentWidth, rowH, WHITE, LIGHT_GRAY);

    drawText(page, rule.name, margin + 7, y - 13, 9, helveticaBold, CHARCOAL);
    drawTextRight(page, rule.stat, width - margin - 7, y - 13, 14, helveticaBold, GOLD);
    drawTextRight(page, rule.statLabel, width - margin - 7, y - 23, 7, helvetica, MEDIUM_GRAY);
    drawText(page, rule.detail, margin + 7, y - 27, 8, helvetica, DARK_GRAY);

    y -= rowH + 4;
  }

  y -= 11;

  // FIRST WEEK CHECKLIST (Personalized)
  drawText(page, "FIRST WEEK CHECKLIST", margin, y, 10, helveticaBold, CHARCOAL);
  y -= 14;

  // Build personalized checklist based on agent's profile
  const firstWeekTasks: string[] = [];

  if (profile.book_size > 50) {
    firstWeekTasks.push(`Pull 10 clients for referral calls this week (you have ${profile.book_size} to choose from)`);
  } else {
    firstWeekTasks.push("Build your Circle of Influence list (aim for 50 names)");
  }

  if (profile.lead_star_leads > 0) {
    firstWeekTasks.push(`Set up Lead Star portal alerts - you have ${profile.lead_star_leads}/month incoming`);
  }

  firstWeekTasks.push("Identify 10 professional partners in your area");
  firstWeekTasks.push("Practice your referral ask: \"Who else could use this kind of help?\"");
  firstWeekTasks.push("Block 9-11am daily for outreach (this is when people answer)");

  for (const task of firstWeekTasks) {
    drawRect(page, margin + 4, y - 8, 7, 7, WHITE, MEDIUM_GRAY);
    drawText(page, task, margin + 16, y - 7, 8, helvetica, DARK_GRAY);
    y -= 14;
  }

  y -= 11;

  // WEEKLY RHYTHM with Time Blocks
  drawText(page, "YOUR WEEKLY RHYTHM", margin, y, 10, helveticaBold, CHARCOAL);
  y -= 14;

  // Time block header
  drawRect(page, margin, y - 16, contentWidth, 16, GOLD);
  drawText(page, "Day", margin + 7, y - 11, 7, helveticaBold, WHITE);
  drawText(page, "9-11am", margin + 55, y - 11, 7, helveticaBold, WHITE);
  drawText(page, "11am-12pm", margin + 160, y - 11, 7, helveticaBold, WHITE);
  drawText(page, "1-4pm", margin + 290, y - 11, 7, helveticaBold, WHITE);
  y -= 16;

  const dailyAttempts = activity.daily_attempts;
  const reducedAttempts = Math.round(dailyAttempts * 0.65);  // Thursday is lighter

  const rhythmBlocks = [
    { day: "Mon", morning: `${dailyAttempts} outreach attempts`, midday: "Lead follow-up", afternoon: "Appointments" },
    { day: "Tue", morning: `${dailyAttempts} outreach attempts`, midday: "Referral calls", afternoon: "Appointments" },
    { day: "Wed", morning: `${dailyAttempts} outreach attempts`, midday: "Partner outreach", afternoon: "Appointments" },
    { day: "Thu", morning: `${reducedAttempts} attempts + touchpoints`, midday: "Client check-ins", afternoon: "Appointments" },
    { day: "Fri", morning: "Admin + Tracking", midday: "Weekly review", afternoon: "Next week planning" },
  ];

  for (const r of rhythmBlocks) {
    const rowH = 15;
    drawRect(page, margin, y - rowH, contentWidth, rowH, WHITE);
    drawLine(page, margin, y - rowH, width - margin, y - rowH, LIGHT_GRAY, 0.5);
    drawText(page, r.day, margin + 7, y - 11, 8, helveticaBold, CHARCOAL);
    drawText(page, r.morning, margin + 55, y - 11, 7, helvetica, DARK_GRAY);
    drawText(page, r.midday, margin + 160, y - 11, 7, helvetica, DARK_GRAY);
    drawText(page, r.afternoon, margin + 290, y - 11, 7, helvetica, DARK_GRAY);
    y -= rowH;
  }

  // ============================================
  // PAGE 6: ACCOUNTABILITY (Redesigned)
  // ============================================
  page = pdfDoc.addPage([width, height]);
  drawHeader(page, "Accountability");
  drawFooter(page, 6);

  y = height - 83;

  // WEEKLY ACTIVITY TRACKER (Full-width, usable)
  drawText(page, "WEEKLY ACTIVITY TRACKER", margin, y, 10, helveticaBold, CHARCOAL);
  drawTextRight(page, "Week of: ____________", width - margin, y, 8, helvetica, DARK_GRAY);
  y -= 18;

  // Tracker table with larger cells
  const trackerDays = ["MON", "TUE", "WED", "THU", "FRI", "TOTAL"];
  const metricLabelW = 80;
  const dayCellW = (contentWidth - metricLabelW) / 6;
  const trackerRowH = 28;

  // Header row
  drawRect(page, margin, y - 18, contentWidth, 18, GOLD);
  drawText(page, "Activity", margin + 6, y - 13, 7, helveticaBold, WHITE);
  for (let i = 0; i < trackerDays.length; i++) {
    drawTextCentered(page, trackerDays[i], margin + metricLabelW + dayCellW * i + dayCellW / 2, y - 13, 7, helveticaBold, WHITE);
  }
  y -= 18;

  // Outreach Attempts row
  drawRect(page, margin, y - trackerRowH, contentWidth, trackerRowH, WHITE, LIGHT_GRAY);
  drawText(page, "Outreach", margin + 6, y - 12, 8, helveticaBold, CHARCOAL);
  drawText(page, "Attempts", margin + 6, y - 22, 8, helveticaBold, CHARCOAL);
  for (let i = 0; i < trackerDays.length; i++) {
    drawLine(page, margin + metricLabelW + dayCellW * i, y, margin + metricLabelW + dayCellW * i, y - trackerRowH, LIGHT_GRAY, 0.5);
    // Show target under each day (except Total)
    if (i < 5) {
      drawTextCentered(page, `/${activity.daily_attempts}`, margin + metricLabelW + dayCellW * i + dayCellW / 2, y - 24, 6, helvetica, MEDIUM_GRAY);
    } else {
      drawTextCentered(page, `/${activity.daily_attempts * 5}`, margin + metricLabelW + dayCellW * i + dayCellW / 2, y - 24, 6, helvetica, MEDIUM_GRAY);
    }
  }
  y -= trackerRowH;

  // Conversations row
  drawRect(page, margin, y - trackerRowH, contentWidth, trackerRowH, WHITE, LIGHT_GRAY);
  drawText(page, "Conversations", margin + 6, y - 17, 8, helvetica, CHARCOAL);
  for (let i = 0; i < trackerDays.length; i++) {
    drawLine(page, margin + metricLabelW + dayCellW * i, y, margin + metricLabelW + dayCellW * i, y - trackerRowH, LIGHT_GRAY, 0.5);
  }
  y -= trackerRowH;

  // Appointments Set row
  drawRect(page, margin, y - trackerRowH, contentWidth, trackerRowH, WHITE, LIGHT_GRAY);
  drawText(page, "Appointments", margin + 6, y - 12, 8, helvetica, CHARCOAL);
  drawText(page, "Set", margin + 6, y - 22, 8, helvetica, CHARCOAL);
  for (let i = 0; i < trackerDays.length; i++) {
    drawLine(page, margin + metricLabelW + dayCellW * i, y, margin + metricLabelW + dayCellW * i, y - trackerRowH, LIGHT_GRAY, 0.5);
  }
  y -= trackerRowH;

  // Referrals Asked row
  drawRect(page, margin, y - trackerRowH, contentWidth, trackerRowH, WHITE, LIGHT_GRAY);
  drawText(page, "Referrals", margin + 6, y - 12, 8, helvetica, CHARCOAL);
  drawText(page, "Asked", margin + 6, y - 22, 8, helvetica, CHARCOAL);
  for (let i = 0; i < trackerDays.length; i++) {
    drawLine(page, margin + metricLabelW + dayCellW * i, y, margin + metricLabelW + dayCellW * i, y - trackerRowH, LIGHT_GRAY, 0.5);
    // Show weekly target in Total column
    if (i === 5) {
      drawTextCentered(page, `/${activity.referral_weekly_asks}`, margin + metricLabelW + dayCellW * i + dayCellW / 2, y - 24, 6, helvetica, MEDIUM_GRAY);
    }
  }
  y -= trackerRowH;

  y -= 14;

  // BEHIND PACE? Section
  drawText(page, "BEHIND PACE?", margin, y, 10, helveticaBold, CHARCOAL);
  y -= 14;

  const behindPaceH = 72;
  drawRect(page, margin, y - behindPaceH, contentWidth, behindPaceH, GOLD_LIGHT, GOLD);

  const midweekTarget = Math.round(activity.daily_attempts * 3 * 0.7);  // ~70% of Mon-Wed target
  const fridayTarget = activity.daily_attempts * 4;  // 4 days worth

  drawText(page, `If it's Wednesday and you're under ${midweekTarget} attempts:`, margin + 9, y - 12, 8, helveticaBold, CHARCOAL);
  drawText(page, "-> Double your Thursday morning block (6am-11am)", margin + 15, y - 23, 8, helvetica, DARK_GRAY);
  const behindPaceReferralText = profile.book_size >= 10
    ? "-> Call your 10 most recent clients for referrals"
    : "-> Call 10 people from your Circle of Influence list";
  drawText(page, behindPaceReferralText, margin + 15, y - 33, 8, helvetica, DARK_GRAY);

  drawText(page, `If it's Friday and you're under ${fridayTarget} attempts:`, margin + 9, y - 46, 8, helveticaBold, CHARCOAL);
  drawText(page, "-> Saturday morning sprint: 9am-12pm focused calls", margin + 15, y - 57, 8, helvetica, DARK_GRAY);
  drawText(page, "-> This week is not lost until Sunday", margin + 15, y - 67, 8, helveticaOblique, MEDIUM_GRAY);

  y -= behindPaceH + 14;

  // COMMON MISTAKES (with checkboxes)
  drawText(page, "COMMON MISTAKES", margin, y, 10, helveticaBold, CHARCOAL);
  drawText(page, "(Check any you're doing)", margin + 100, y, 8, helveticaOblique, MEDIUM_GRAY);
  y -= 14;

  const mistakes = [
    "Quitting after 2 contact attempts (most agents do - that's why they fail)",
    "Ignoring existing clients while chasing new ones",
    "Skipping tracking (if you don't measure it, you can't improve it)",
    "Waiting until you \"feel ready\" - start before you're comfortable",
    "Expecting results without doing the daily work",
  ];

  for (const m of mistakes) {
    drawRect(page, margin, y - 8, 8, 8, WHITE, MEDIUM_GRAY);  // Checkbox
    drawText(page, m, margin + 14, y - 7, 8, helvetica, DARK_GRAY);
    y -= 14;
  }

  y -= 12;

  // MY NUMBERS THIS WEEK (replaces My Commitment)
  drawText(page, "MY NUMBERS THIS WEEK", margin, y, 10, helveticaBold, CHARCOAL);
  y -= 14;

  const numbersH = 75;
  drawRect(page, margin, y - numbersH, contentWidth, numbersH, WHITE, CHARCOAL);

  // Goal and Actual
  drawText(page, `Goal: _______ sales`, margin + 9, y - 13, 9, helvetica, DARK_GRAY);
  drawText(page, `(Monthly target: ${profile.monthly_goal})`, margin + 90, y - 13, 8, helveticaOblique, MEDIUM_GRAY);
  drawText(page, "Actual: _______ sales", margin + 260, y - 13, 9, helvetica, DARK_GRAY);

  // Reflection fields
  drawText(page, "What worked: ___________________________________________________________", margin + 9, y - 30, 8, helvetica, DARK_GRAY);
  drawText(page, "What to improve: _______________________________________________________", margin + 9, y - 47, 8, helvetica, DARK_GRAY);
  drawText(page, "Next week focus: _______________________________________________________", margin + 9, y - 64, 8, helvetica, DARK_GRAY);

  // ============================================
  // PAGE 7: QUICK REFERENCE (Enhanced)
  // ============================================
  page = pdfDoc.addPage([width, height]);
  drawHeader(page, "Quick Reference");
  drawFooter(page, 7);

  y = height - 83;
  drawText(page, "DAILY QUICK REFERENCE", margin, y, 10, helveticaBold, CHARCOAL);
  y -= 11;
  drawText(page, "Print this page and keep it visible.", margin, y, 8, helveticaOblique, MEDIUM_GRAY);
  y -= 20;

  // Big goal box (Monthly)
  const bigGoalH = 52;
  drawRect(page, margin, y - bigGoalH, contentWidth / 2 - 7, bigGoalH, GOLD);
  drawTextCentered(page, `${profile.monthly_goal}`, margin + contentWidth / 4 - 4, y - 36, 36, helveticaBold, WHITE);
  drawTextCentered(page, "plans per month", margin + contentWidth / 4 - 4, y - 48, 10, helveticaBold, WHITE);

  // Daily minimum box (Prominent)
  const dailyBoxH = 52;
  drawRect(page, margin + contentWidth / 2 + 7, y - dailyBoxH, contentWidth / 2 - 7, dailyBoxH, CHARCOAL);
  drawTextCentered(page, `${activity.daily_attempts}`, margin + contentWidth * 3 / 4 + 4, y - 36, 36, helveticaBold, WHITE);
  drawTextCentered(page, "attempts daily (before lunch)", margin + contentWidth * 3 / 4 + 4, y - 48, 9, helvetica, GOLD_LIGHT);

  y -= bigGoalH + 14;

  // Rules summary box (compact)
  const rulesBoxH = 95;
  drawRect(page, margin, y - rulesBoxH, contentWidth, rulesBoxH, GOLD_LIGHT, GOLD);
  drawText(page, "THE RULES", margin + 11, y - 14, 10, helveticaBold, CHARCOAL);

  const rulesSummary = [
    "1-Hour Rule: Respond to every lead within 1 hour",
    "6-Touch Rule: 6 attempts over 14 days per lead",
    "Referral Rule: Ask every satisfied client",
    "Protection Rule: Review every client annually",
  ];

  let ruleY = y - 28;
  for (const rs of rulesSummary) {
    drawText(page, rs, margin + 11, ruleY, 8, helvetica, CHARCOAL);
    ruleY -= 14;
  }

  y -= rulesBoxH + 12;

  // Lead Star info (if applicable)
  if (activity.lead_star_leads > 0) {
    const lsBoxH = 32;
    drawRect(page, margin, y - lsBoxH, contentWidth, lsBoxH, WHITE, GOLD);
    drawText(page, "LEAD STAR", margin + 11, y - 12, 9, helveticaBold, CHARCOAL);
    drawText(page, `${activity.lead_star_leads} leads/month`, margin + 80, y - 13, 12, helveticaBold, GOLD);
    drawText(page, `At 15% close rate = ~${activity.lead_star_expected} expected sales`, margin + 11, y - 26, 8, helvetica, DARK_GRAY);
    y -= lsBoxH + 12;
  }

  // YOUR REFERRAL ENGINE box
  const refBoxH = 82;
  drawRect(page, margin, y - refBoxH, contentWidth, refBoxH, WHITE, GOLD);
  drawText(page, "YOUR REFERRAL ENGINE", margin + 11, y - 14, 10, helveticaBold, CHARCOAL);

  // Calculate referral math values
  const weeklyFromBook = Math.ceil((activity.referral_eligible_book * 2) / 52);
  const weeklyFromNew = Math.ceil(profile.monthly_goal / 4);
  const weeklyNames = Math.round(activity.referral_weekly_asks * 0.30 * 10) / 10;
  const monthlyReferrals = Math.round(weeklyNames * 4 * 10) / 10;

  drawText(page, `${activity.referral_eligible_book} eligible clients x 2 asks/year = ${activity.referral_eligible_book * 2} annual asks`, margin + 11, y - 28, 8, helvetica, DARK_GRAY);
  drawText(page, `/ 52 weeks = ~${weeklyFromBook} asks/week from existing book`, margin + 11, y - 40, 8, helvetica, DARK_GRAY);
  drawText(page, `+ ${weeklyFromNew} asks/week from new sales = ${activity.referral_weekly_asks} total asks/week`, margin + 11, y - 52, 8, helvetica, DARK_GRAY);

  drawText(page, `At 30% yield = ~${weeklyNames} names/week = ~${monthlyReferrals} referrals/month`, margin + 11, y - 66, 8, helveticaBold, CHARCOAL);
  drawText(page, `At 50% close = ~${activity.referral_expected_monthly_sales} sales/month from referrals alone`, margin + 11, y - 78, 8, helveticaBold, GOLD);

  y -= refBoxH + 12;

  // Weekly targets (compact row)
  drawText(page, "WEEKLY TARGETS:", margin, y, 9, helveticaBold, CHARCOAL);

  const weeklyTargets = [
    { val: `${activity.daily_attempts * 5}`, label: "attempts" },
    { val: `${activity.daily_conversations * 5}`, label: "convos" },
    { val: `${activity.referral_weekly_asks}`, label: "asks" },
    { val: "2", label: "partners" },
  ];

  let wtx = margin + 95;
  for (const wt of weeklyTargets) {
    drawText(page, wt.val, wtx, y, 12, helveticaBold, GOLD);
    const valW = helveticaBold.widthOfTextAtSize(wt.val, 12);
    drawText(page, wt.label, wtx + valW + 3, y - 1, 8, helvetica, DARK_GRAY);
    wtx += 75;
  }

  y -= 18;

  // WHEN YOU'RE STUCK section
  drawText(page, "WHEN YOU'RE STUCK", margin, y, 10, helveticaBold, CHARCOAL);
  y -= 14;

  const stuckH = 58;
  drawRect(page, margin, y - stuckH, contentWidth, stuckH, TIER2_BG, LIGHT_GRAY);

  const noAppointmentsSolution = profile.book_size >= 5
    ? "Call 5 existing clients for referrals"
    : "Call 5 people from your Circle of Influence";
  const stuckItems = [
    { problem: "Can't reach anyone?", solution: "Switch to texts and emails for an hour" },
    { problem: "No appointments?", solution: noAppointmentsSolution },
    { problem: "Feeling unmotivated?", solution: "Just do 15 attempts. Start small." },
    { problem: "Bad week?", solution: "Review what worked last month. Repeat it." },
  ];

  let stuckY = y - 12;
  for (const s of stuckItems) {
    drawText(page, s.problem, margin + 11, stuckY, 8, helveticaBold, CHARCOAL);
    drawText(page, "->", margin + 115, stuckY, 8, helvetica, GOLD);
    drawText(page, s.solution, margin + 130, stuckY, 8, helvetica, DARK_GRAY);
    stuckY -= 12;
  }

  y -= stuckH + 14;

  // Final message
  drawLine(page, margin, y, width - margin, y, GOLD, 1);
  y -= 14;
  drawTextCentered(page, "The math only works if you do the work.", width / 2, y, 10, helveticaBold, CHARCOAL);
  y -= 12;
  drawTextCentered(page, "Tyler Insurance Group", width / 2, y, 9, helveticaBold, GOLD);

  return await pdfDoc.save();
}

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

    // Build channels dynamically
    const channels = buildChannels(profile);

    // Calculate activity targets
    const activity = calculateActivity(profile);

    // Calculate economics
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

    // Convert to base64 safely
    let binary = '';
    for (let i = 0; i < pdfBytes.length; i++) {
      binary += String.fromCharCode(pdfBytes[i]);
    }
    const base64 = btoa(binary);

    // Optionally save to storage
    if (saveToStorage && profile.id) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          const storagePath = `roadmaps/${profile.id}/${filename}`;

          await supabase.storage
            .from('contracting-documents')
            .upload(storagePath, pdfBytes, {
              contentType: 'application/pdf',
              upsert: true,
            });
        }
      } catch (storageError) {
        console.error('Storage error (non-fatal):', storageError);
      }
    }

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
