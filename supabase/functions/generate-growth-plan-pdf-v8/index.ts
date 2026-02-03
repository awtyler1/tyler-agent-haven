/**
 * Generate Growth Plan PDF Edge Function - V8
 *
 * V8 - Backward Math Edition
 *
 * Core Philosophy Change:
 * - OLD: "Make 23 attempts/day" (abstract, confusing)
 * - NEW: "You want $3,470/mo -> here's what each channel produces" (concrete, actionable)
 *
 * Key Changes:
 * - Income goal is primary input (calculates sales automatically)
 * - Lead sources table shows expected sales per channel
 * - Daily checklist is channel-specific (not generic "attempts")
 * - Gap/buffer calculation when resources < or > goal
 * - Weekly tracker aligned with new checklist format
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  income_goal: number;      // V8: Primary input
  monthly_goal: number;     // Calculated from income_goal
  book_size: number;
  lead_star_leads: number;
  seminar_eligible: boolean;
  seminars_planned?: number;
  mira_access: boolean;
}

interface LeadSource {
  name: string;
  what_you_have: string;
  close_rate: number;
  expected_sales: number;
  is_variable: boolean;     // For MIRA, COI where we can't calculate exact number
  label?: string;           // "Buffer" or "Fill gap" for COI
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
  expected_sales: number;
  is_primary: boolean;
}

interface DailyChecklist {
  activity: string;
  detail: string;
  frequency: string;
  show: boolean;            // Whether to show based on agent's resources
}

interface YearProjection {
  year: number;
  book_size: number;
  new_clients: number;
  renewal_clients: number;
  new_income: number;
  renewal_income: number;
  total_income: number;
}

interface Economics {
  // V8: Income-driven
  income_goal: number;
  sales_goal: number;
  annual_income: number;

  // Lead sources breakdown
  lead_sources: LeadSource[];
  total_expected_sales: number;
  gap_or_buffer: number;    // Positive = on track/buffer, negative = gap
  community_weekly_target: number;  // Consistent target across all pages

  // T65/PC split for display
  t65_monthly: number;
  plan_change_monthly: number;

  // Existing book
  existing_book_size: number;
  existing_book_renewals: number;

  // 5-year projection
  years: YearProjection[];
  cumulative_5_year: number;
  year_5_renewal: number;
  estimated_book_value: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COMMISSION = {
  T65: 694,                 // Full commission regardless of enrollment month (new-to-Medicare)
  PLAN_CHANGE: 347,         // Full if Jan 1 effective, prorated if mid-year switch
  BLENDED_AVG: 434,         // Weighted average: 25% T65 ($694) + 75% PC ($347) = $434
  RENEWAL_ANNUAL: 347,      // Paid monthly (~$29/mo), only if client stays on SAME plan
  RETENTION_RATE: 0.85,     // Industry standard 80-90%
};

const CLOSE_RATES = {
  LEAD_STAR: 0.15,          // Inbound Medicare leads: 10-20% industry average
  SEMINARS: 0.32,           // Educational seminars: 20-35% for good presenters (one-time events)
  CLIENT_CARE: 0.50,        // Client Care referrals: 40-60% close rate (from existing book)
  MIRA: 0.18,               // Aged portal leads: 10-20%
  COMMUNITY: 0.10,          // Community & Networking: 5-15% for warm referrals/networking
};

// Colors
const GOLD = rgb(0.62, 0.49, 0.18);
const GOLD_LIGHT = rgb(0.96, 0.94, 0.90);
const CHARCOAL = rgb(0.18, 0.18, 0.18);
const DARK_GRAY = rgb(0.29, 0.29, 0.29);
const MEDIUM_GRAY = rgb(0.42, 0.42, 0.42);
const LIGHT_GRAY = rgb(0.91, 0.91, 0.91);
const WHITE = rgb(1, 1, 1);
const GREEN_LIGHT = rgb(0.91, 0.96, 0.91);
const GREEN_DARK = rgb(0.18, 0.49, 0.20);
const ORANGE_LIGHT = rgb(1.0, 0.95, 0.88);
const ORANGE_DARK = rgb(0.90, 0.40, 0.0);
const RED_LIGHT = rgb(0.96, 0.90, 0.90);

// Page dimensions
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 36;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// ============================================================================
// BUSINESS LOGIC: LEAD SOURCES CALCULATION
// ============================================================================

interface LeadSourcesResult {
  sources: LeadSource[];
  communityWeeklyTarget: number;
}

function calculateLeadSources(profile: BrokerProfile): LeadSourcesResult {
  const sources: LeadSource[] = [];
  let totalExpected = 0;
  let communityWeeklyTarget = 5; // default

  // Debug logging
  console.log("calculateLeadSources - lead_star_leads:", profile.lead_star_leads);
  console.log("calculateLeadSources - seminar_eligible:", profile.seminar_eligible);
  console.log("calculateLeadSources - seminars_planned:", profile.seminars_planned);
  console.log("calculateLeadSources - mira_access:", profile.mira_access);
  console.log("calculateLeadSources - book_size:", profile.book_size);

  // Lead Star
  if (profile.lead_star_leads > 0) {
    const expected = Math.round(profile.lead_star_leads * CLOSE_RATES.LEAD_STAR);
    totalExpected += expected;
    sources.push({
      name: 'Lead Star',
      what_you_have: `${profile.lead_star_leads} inbound calls/mo`,
      close_rate: CLOSE_RATES.LEAD_STAR * 100,
      expected_sales: expected,
      is_variable: false,
    });
  }

  // Client Care (from book) - combines referrals + touchpoints
  // Only show if book_size > 0
  if (profile.book_size > 0) {
    const eligibleBook = Math.floor(profile.book_size * 0.80);
    const monthlyNames = Math.max(1, Math.round((eligibleBook * 2 / 12) * 0.30));
    const expected = Math.max(1, Math.round(monthlyNames * CLOSE_RATES.CLIENT_CARE));
    totalExpected += expected;
    sources.push({
      name: 'Client Care',
      what_you_have: `${profile.book_size} clients -> ~${monthlyNames} referrals/mo`,
      close_rate: CLOSE_RATES.CLIENT_CARE * 100,
      expected_sales: expected,
      is_variable: false,
    });
  }

  // MIRA Portal
  if (profile.mira_access) {
    sources.push({
      name: 'MIRA Portal',
      what_you_have: 'Access granted',
      close_rate: CLOSE_RATES.MIRA * 100,
      expected_sales: 0,
      is_variable: true,
      label: 'Variable',
    });
  }

  // NOTE: Seminars are NOT included - they're one-time events shown in "Scheduled Events" section

  // Community & Networking - gap-based calculation
  // Calculate expected sales based on realistic conversation target
  const salesGoal = profile.monthly_goal;
  const gap = Math.max(0, salesGoal - totalExpected);

  if (gap > 0) {
    // How many conversations needed to fill the gap?
    const monthlyConvosNeeded = gap / CLOSE_RATES.COMMUNITY; // gap / 0.10
    const weeklyTarget = Math.ceil(monthlyConvosNeeded / 4);
    // Cap between 5-20 conversations/week (realistic bounds)
    communityWeeklyTarget = Math.max(5, Math.min(20, weeklyTarget));
    const expectedSales = Math.round(communityWeeklyTarget * 4 * CLOSE_RATES.COMMUNITY);

    sources.push({
      name: 'Community & Networking',
      what_you_have: `${communityWeeklyTarget} conversations/wk`,
      close_rate: CLOSE_RATES.COMMUNITY * 100,
      expected_sales: expectedSales,
      is_variable: false,
      label: communityWeeklyTarget >= 20 ? 'At max capacity' : undefined,
    });
    totalExpected += expectedSales;
  } else {
    // No gap - still show Community as activity-based supplement
    communityWeeklyTarget = 5;
    sources.push({
      name: 'Community & Networking',
      what_you_have: `${communityWeeklyTarget} conversations/wk`,
      close_rate: CLOSE_RATES.COMMUNITY * 100,
      expected_sales: 2, // 5/wk × 4 weeks × 10% = 2
      is_variable: false,
    });
  }

  // Debug logging
  console.log("calculateLeadSources - sources created:", sources.map(s => s.name));
  console.log("calculateLeadSources - communityWeeklyTarget:", communityWeeklyTarget);

  return { sources, communityWeeklyTarget };
}

// ============================================================================
// BUSINESS LOGIC: CHANNEL BUILDING
// ============================================================================

function buildChannels(profile: BrokerProfile, leadSources: LeadSource[], communityTarget: number): GrowthChannel[] {
  const channels: GrowthChannel[] = [];
  const book = profile.book_size;

  // Determine primary channel based on situation
  let primaryChannel = 'Community & Networking';
  if (profile.lead_star_leads > 20) {
    primaryChannel = 'Lead Star';
  } else if (book > 50) {
    primaryChannel = 'Client Care';
  }

  // Lead Star (if assigned) - scaled hours based on volume
  if (profile.lead_star_leads > 0) {
    const source = leadSources.find(s => s.name === 'Lead Star');
    let leadStarTarget = 'Be available when inbound calls come in';
    if (profile.lead_star_leads >= 26) {
      leadStarTarget = 'Block 2-3 hours daily for inbound calls';
    } else if (profile.lead_star_leads >= 11) {
      leadStarTarget = 'Block 1-2 hours daily during peak times';
    }
    channels.push({
      name: 'Lead Star',
      type: 'tier2',
      assigned: true,
      close_rate: 15,
      velocity: 'Inbound',
      description: `${profile.lead_star_leads} inbound calls/month = ~${source?.expected_sales || 0} sales`,
      weekly_target: leadStarTarget,
      setup: 'Set consistent availability hours. Prepare your environment - quiet space, notes ready.',
      script: '"Thanks for calling! Tell me a bit about your situation..."',
      expected_sales: source?.expected_sales || 0,
      is_primary: primaryChannel === 'Lead Star',
    });
  }

  // MIRA Portal (if assigned)
  if (profile.mira_access) {
    channels.push({
      name: 'MIRA Portal',
      type: 'tier2',
      assigned: true,
      close_rate: 18,
      velocity: 'Fast',
      description: 'UHC real-time leads - aged but interested',
      weekly_target: 'Check 3x/day, call ASAP',
      setup: 'Bookmark portal. Set phone alerts.',
      script: '"I see you were looking at Medicare options. Are you still shopping?"',
      expected_sales: 0,
      is_primary: false,
    });
  }

  // Client Care (if book_size > 0) - combines referrals + touchpoints
  if (book > 0) {
    const source = leadSources.find(s => s.name === 'Client Care');
    const contactsPerWeek = Math.max(3, Math.ceil(book / 10));
    channels.push({
      name: 'Client Care',
      type: 'tier1',
      assigned: true,
      close_rate: 50,
      velocity: 'Ongoing',
      description: 'Keep clients happy and ask for referrals.',
      weekly_target: `${contactsPerWeek} contacts/week`,
      setup: 'Pull this week\'s birthdays and annual review list.',
      script: '"How\'s your plan working? ... Who else could use this kind of help?"',
      expected_sales: source?.expected_sales || 0,
      is_primary: primaryChannel === 'Client Care',
    });
  }

  // Community & Networking (always show) - 10% close rate
  // Use the consistent target passed from economics
  const communityExpected = Math.round(communityTarget * 4 * CLOSE_RATES.COMMUNITY);

  channels.push({
    name: 'Community & Networking',
    type: 'outreach',
    assigned: true,
    close_rate: 10,  // 10% close rate for warm networking/referrals
    velocity: 'Ongoing',
    description: `${communityTarget} conversations/week = ~${communityExpected} sales`,
    weekly_target: `${communityTarget} conversations/week`,
    setup: 'List 50 people (personal + professional). Join a networking group.',
    script: '"I help people navigate Medicare. Know anyone turning 65?"',
    expected_sales: communityExpected,
    is_primary: primaryChannel === 'Community & Networking',
  });

  // NOTE: Seminars shown in "Scheduled Events" section instead of channel playbook

  return channels;
}

// ============================================================================
// BUSINESS LOGIC: DAILY CHECKLIST
// ============================================================================

function buildDailyChecklist(profile: BrokerProfile, communityTarget: number): DailyChecklist[] {
  const checklist: DailyChecklist[] = [];

  // Lead Star - inbound call availability (if assigned)
  // Scale hours based on lead volume
  if (profile.lead_star_leads > 0) {
    let leadStarFrequency = 'Be available';
    let leadStarDetail = 'Be available when inbound calls come in';

    if (profile.lead_star_leads >= 26) {
      leadStarFrequency = '2-3 hrs/day';
      leadStarDetail = 'Block 2-3 hours daily for consistent call volume';
    } else if (profile.lead_star_leads >= 11) {
      leadStarFrequency = '1-2 hrs/day';
      leadStarDetail = 'Block 1-2 hours daily during peak call times';
    }

    checklist.push({
      activity: 'Lead Star inbound hours',
      detail: leadStarDetail,
      frequency: leadStarFrequency,
      show: true,
    });
  }

  // MIRA Portal checks (if assigned)
  if (profile.mira_access) {
    checklist.push({
      activity: 'Check MIRA portal',
      detail: 'Respond quickly to new leads',
      frequency: '3x/day',
      show: true,
    });
  }

  // Client Care contacts (if book > 0)
  if (profile.book_size > 0) {
    const contactsPerWeek = Math.max(3, Math.ceil(profile.book_size / 10));
    checklist.push({
      activity: 'Client Care contact',
      detail: 'Birthday call, check-in, annual review + referral ask',
      frequency: `${contactsPerWeek}/week`,
      show: true,
    });
  }

  // Community & Networking conversations (always show)
  // Use the same target from calculateLeadSources via economics
  const atMaxCapacity = communityTarget >= 20;

  let communityDetail = 'Personal contacts, networking, professional partners';
  if (atMaxCapacity) {
    communityDetail = 'At max capacity - consider adding lead sources (Lead Star, MIRA)';
  }

  checklist.push({
    activity: 'Community conversation',
    detail: communityDetail,
    frequency: `${communityTarget}/week`,
    show: true,
  });

  return checklist;
}

// ============================================================================
// BUSINESS LOGIC: ECONOMICS
// ============================================================================

function calculateEconomics(profile: BrokerProfile): Economics {
  const incomeGoal = profile.income_goal;
  const salesGoal = profile.monthly_goal;
  const annualIncome = incomeGoal * 12;

  // Calculate lead sources (returns both sources and communityWeeklyTarget)
  const { sources: leadSources, communityWeeklyTarget } = calculateLeadSources(profile);
  const totalExpected = leadSources
    .filter(s => !s.is_variable)
    .reduce((sum, s) => sum + s.expected_sales, 0);

  const gapOrBuffer = totalExpected - salesGoal;

  // T65/PC split (25/75)
  const t65Monthly = Math.floor(salesGoal * 0.25);
  const planChangeMonthly = salesGoal - t65Monthly;

  // Existing book renewals
  const existingBookRenewals = Math.round(profile.book_size * COMMISSION.RETENTION_RATE * COMMISSION.RENEWAL_ANNUAL);

  // 5-year projection
  const annualNewClients = salesGoal * 12;
  const years: YearProjection[] = [];
  let previousYearEndBook = profile.book_size;

  for (let year = 1; year <= 5; year++) {
    const retainedClients = Math.round(previousYearEndBook * COMMISSION.RETENTION_RATE);
    const newClients = annualNewClients;
    const endOfYearBook = retainedClients + newClients;

    // Use blended average to match T65/PC split shown on page 1
    const newIncome = salesGoal * 12 * COMMISSION.BLENDED_AVG;
    const renewalIncome = Math.round(retainedClients * COMMISSION.RENEWAL_ANNUAL);
    const totalIncome = newIncome + renewalIncome;

    years.push({
      year,
      book_size: endOfYearBook,
      new_clients: newClients,
      renewal_clients: retainedClients,
      new_income: newIncome,
      renewal_income: renewalIncome,
      total_income: totalIncome,
    });

    previousYearEndBook = endOfYearBook;
  }

  const cumulative5Year = years.reduce((sum, y) => sum + y.total_income, 0);
  const year5Renewal = years[4].renewal_income;
  const estimatedBookValue = Math.floor(year5Renewal * 2);

  return {
    income_goal: incomeGoal,
    sales_goal: salesGoal,
    annual_income: annualIncome,
    lead_sources: leadSources,
    total_expected_sales: totalExpected,
    gap_or_buffer: gapOrBuffer,
    community_weekly_target: communityWeeklyTarget,
    t65_monthly: t65Monthly,
    plan_change_monthly: planChangeMonthly,
    existing_book_size: profile.book_size,
    existing_book_renewals: existingBookRenewals,
    years,
    cumulative_5_year: cumulative5Year,
    year_5_renewal: year5Renewal,
    estimated_book_value: estimatedBookValue,
  };
}

// ============================================================================
// PDF GENERATION
// ============================================================================

async function generatePdf(
  profile: BrokerProfile,
  channels: GrowthChannel[],
  checklist: DailyChecklist[],
  economics: Economics,
  reviewDateStr: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Load logo
  let logoImage: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  try {
    const logoUrl = "https://mgczpsrtkdkkjzmztpyd.supabase.co/storage/v1/object/public/Assets/Sheild%20Logo.PNG";
    const logoResponse = await fetch(logoUrl);
    const logoBytes = await logoResponse.arrayBuffer();
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch (error) {
    console.error("Failed to load logo:", error);
  }

  const totalPages = 8;
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Helper functions
  const drawText = (page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color = CHARCOAL) => {
    page.drawText(text, { x, y, size, font, color });
  };

  const drawTextRight = (page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color = CHARCOAL) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: x - textWidth, y, size, font, color });
  };

  const drawTextCentered = (page: PDFPage, text: string, centerX: number, y: number, size: number, font: PDFFont, color = CHARCOAL) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: centerX - textWidth / 2, y, size, font, color });
  };

  const drawRect = (page: PDFPage, x: number, y: number, w: number, h: number, color = GOLD_LIGHT, borderColor?: typeof GOLD) => {
    page.drawRectangle({ x, y, width: w, height: h, color, borderColor, borderWidth: borderColor ? 1 : 0 });
  };

  const drawLine = (page: PDFPage, x1: number, y1: number, x2: number, y2: number, color = LIGHT_GRAY, thickness = 1) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
  };

  const drawHeader = (page: PDFPage, pageTitle: string) => {
    drawRect(page, 0, PAGE_HEIGHT - 50, PAGE_WIDTH, 50, WHITE);
    drawLine(page, MARGIN, PAGE_HEIGHT - 50, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 50, GOLD, 2);

    if (logoImage) {
      page.drawImage(logoImage, { x: MARGIN, y: PAGE_HEIGHT - 42, width: 28, height: 28 });
    }

    const titleX = logoImage ? MARGIN + 36 : MARGIN;
    drawText(page, "STRATEGIC GROWTH PLAN", titleX, PAGE_HEIGHT - 25, 12, helveticaBold, CHARCOAL);
    drawText(page, pageTitle, titleX, PAGE_HEIGHT - 36, 7, helvetica, GOLD);
  };

  const drawFooter = (page: PDFPage, pageNum: number) => {
    // Gold accent line above footer
    drawLine(page, MARGIN, 28, PAGE_WIDTH - MARGIN, 28, GOLD, 0.5);
    drawLine(page, MARGIN, 24, PAGE_WIDTH - MARGIN, 24, LIGHT_GRAY, 0.5);
    drawText(page, "Tyler Insurance Group | Confidential", MARGIN, 14, 7, helvetica, MEDIUM_GRAY);
    // Modern page number format: "X / 8"
    drawTextRight(page, `${pageNum} / ${totalPages}`, PAGE_WIDTH - MARGIN, 14, 7, helvetica, MEDIUM_GRAY);
  };

  const assignedChannels = channels.filter(c => c.assigned);
  const visibleChecklist = checklist.filter(c => c.show);

  // ============================================
  // PAGE 1: YOUR GOAL + LEAD SOURCES
  // ============================================
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(page, "Your Path to the Goal");
  drawFooter(page, 1);

  let y = PAGE_HEIGHT - 68;

  // Agent name and date - PROMINENT personalization
  drawText(page, `Prepared for ${profile.broker_name}`, MARGIN, y, 14, helveticaBold, CHARCOAL);
  drawTextRight(page, today, PAGE_WIDTH - MARGIN, y, 9, helvetica, MEDIUM_GRAY);
  y -= 24;

  // Starting Position (if book > 0)
  if (profile.book_size > 0) {
    const startBoxH = 32;
    drawRect(page, MARGIN, y - startBoxH, CONTENT_WIDTH, startBoxH, GREEN_LIGHT, rgb(0.65, 0.84, 0.65));

    drawText(page, `${profile.book_size}`, MARGIN + 10, y - 21, 18, helveticaBold, GREEN_DARK);
    drawText(page, "clients in your book", MARGIN + 45, y - 14, 9, helvetica, GREEN_DARK);

    drawTextRight(page, `~${economics.existing_book_renewals.toLocaleString()}/yr in renewals`, PAGE_WIDTH - MARGIN - 10, y - 14, 9, helveticaBold, GREEN_DARK);
    drawTextRight(page, "Already generating renewal income", PAGE_WIDTH - MARGIN - 10, y - 25, 7, helvetica, GREEN_DARK);

    y -= startBoxH + 12;
  }

  // Income Goal Box (Gold gradient effect)
  const incomeBoxH = 58;
  drawRect(page, MARGIN, y - incomeBoxH, CONTENT_WIDTH, incomeBoxH, GOLD);

  drawText(page, "YOUR INCOME GOAL", MARGIN + 12, y - 12, 8, helveticaBold, WHITE);

  // Big income number
  drawText(page, `${economics.income_goal.toLocaleString()}`, MARGIN + 12, y - 36, 28, helveticaBold, WHITE);

  // Arrow and sales
  const incomeTextWidth = helveticaBold.widthOfTextAtSize(`${economics.income_goal.toLocaleString()}`, 28);
  drawText(page, "->", MARGIN + 20 + incomeTextWidth, y - 32, 16, helvetica, rgb(1, 1, 1));
  drawText(page, `${economics.sales_goal} sales`, MARGIN + 40 + incomeTextWidth, y - 32, 14, helveticaBold, WHITE);

  // Annual
  drawTextRight(page, `${economics.annual_income.toLocaleString()}/year`, PAGE_WIDTH - MARGIN - 12, y - 28, 12, helveticaBold, WHITE);

  // Breakdown
  drawText(page, `${economics.t65_monthly} T65 x $694 + ${economics.plan_change_monthly} PC x $347`, MARGIN + 12, y - 50, 7, helvetica, rgb(1, 1, 1));

  y -= incomeBoxH + 14;

  // Lead Sources Section
  drawText(page, "YOUR LEAD SOURCES", MARGIN, y, 10, helveticaBold, CHARCOAL);
  drawText(page, "- What each channel should produce", MARGIN + 115, y, 8, helvetica, MEDIUM_GRAY);
  y -= 16;

  // Lead Sources Table
  const tableHeaderH = 18;
  drawRect(page, MARGIN, y - tableHeaderH, CONTENT_WIDTH, tableHeaderH, GOLD);

  // Redistributed columns for better balance
  const colX = [MARGIN + 8, MARGIN + 100, MARGIN + 270, MARGIN + 360, MARGIN + 450];
  drawText(page, "Source", colX[0], y - 11, 8, helveticaBold, WHITE);
  drawText(page, "What You Have", colX[1], y - 11, 8, helveticaBold, WHITE);
  drawText(page, "Avg. Close", colX[2], y - 11, 8, helveticaBold, WHITE);
  drawText(page, "Monthly Sales", colX[3], y - 11, 8, helveticaBold, WHITE);
  y -= tableHeaderH;

  // Helper to truncate text (define early for use on all pages)
  const truncateText = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen - 3) + '...';
  };

  // Table rows with alternating colors
  let rowIndex = 0;
  for (const source of economics.lead_sources) {
    const rowH = 20;

    // Page break check
    if (y - rowH < 60) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawHeader(page, "Your Path to the Goal");
      drawFooter(page, 1);
      y = PAGE_HEIGHT - 68;
    }

    // Alternating row colors for scannability
    const rowBg = rowIndex % 2 === 0 ? WHITE : rgb(0.98, 0.98, 0.98);
    drawRect(page, MARGIN, y - rowH, CONTENT_WIDTH, rowH, rowBg);
    drawLine(page, MARGIN, y - rowH, PAGE_WIDTH - MARGIN, y - rowH, LIGHT_GRAY, 0.5);
    rowIndex++;

    // Shorten "Community & Networking" to "Community" for table fit
    const displayName = source.name === 'Community & Networking' ? 'Community' : source.name;
    drawText(page, truncateText(displayName, 20), colX[0], y - 13, 8, helveticaBold, CHARCOAL);
    drawText(page, truncateText(source.what_you_have, 30), colX[1], y - 13, 8, helvetica, DARK_GRAY);
    // Right-align close rate
    drawTextRight(page, `${source.close_rate}%`, colX[3] - 16, y - 13, 8, helvetica, DARK_GRAY);

    // Right-align expected sales
    if (source.is_variable) {
      drawTextRight(page, source.label || 'Variable', colX[4] + 40, y - 13, 8, helveticaOblique, MEDIUM_GRAY);
    } else {
      drawTextRight(page, `~${source.expected_sales}`, colX[4] + 40, y - 13, 10, helveticaBold, GOLD);
    }

    y -= rowH;
  }

  y -= 8;

  // Summary Box (Buffer or Gap)
  // Calculate if Community target is at max capacity (would need >20 convos/week)
  const communitySource = economics.lead_sources.find(s => s.name === 'Community & Networking');
  const isAtMaxCapacity = communitySource?.label === 'At max capacity';

  const summaryH = 34;  // All summary messages now fit in 2 lines
  const hasBuffer = economics.gap_or_buffer >= 0;
  const summaryBg = hasBuffer ? GREEN_LIGHT : (isAtMaxCapacity ? RED_LIGHT : ORANGE_LIGHT);
  const summaryBorder = hasBuffer ? rgb(0.65, 0.84, 0.65) : (isAtMaxCapacity ? rgb(1.0, 0.80, 0.80) : rgb(1.0, 0.76, 0.03));

  drawRect(page, MARGIN, y - summaryH, CONTENT_WIDTH, summaryH, summaryBg, summaryBorder);

  if (hasBuffer) {
    const onTrackMsg = `Your lead sources can produce ~${economics.total_expected_sales} sales. Your goal is ${economics.sales_goal}.`;
    drawText(page, truncateText(onTrackMsg, 75), MARGIN + 10, y - 14, 10, helveticaBold, CHARCOAL);
    drawText(page, "You're on track.", MARGIN + 10, y - 27, 8, helveticaBold, GREEN_DARK);
  } else if (isAtMaxCapacity) {
    const gapAbs = Math.abs(economics.gap_or_buffer);
    const gapMsg = `Your lead sources can produce ~${economics.total_expected_sales} sales. Your goal is ${economics.sales_goal}. Gap: ${gapAbs}.`;
    drawText(page, truncateText(gapMsg, 75), MARGIN + 10, y - 14, 10, helveticaBold, rgb(0.78, 0.16, 0.16));
    drawText(page, "Community at max (20/wk). Talk to your manager about Lead Star or MIRA.", MARGIN + 10, y - 27, 8, helvetica, DARK_GRAY);
  } else {
    const gapMsg = `Your lead sources can produce ~${economics.total_expected_sales} sales. Your goal is ${economics.sales_goal}.`;
    drawText(page, truncateText(gapMsg, 75), MARGIN + 10, y - 14, 10, helveticaBold, ORANGE_DARK);
    drawText(page, "Add more community conversations to close the gap.", MARGIN + 10, y - 27, 8, helvetica, DARK_GRAY);
  }

  y -= summaryH + 16;

  // Scheduled Events Section (Seminars) - only show if seminars planned
  if (profile.seminar_eligible && profile.seminars_planned && profile.seminars_planned > 0) {
    const seminarAttendees = profile.seminars_planned * 18;
    const seminarSales = Math.round(seminarAttendees * CLOSE_RATES.SEMINARS);

    const eventsH = 42;
    // Page break check
    if (y - eventsH < 60) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawHeader(page, "Your Path to the Goal");
      drawFooter(page, 1);
      y = PAGE_HEIGHT - 68;
    }

    // Light purple/blue background to distinguish from monthly sources
    const PURPLE_LIGHT = rgb(0.94, 0.92, 0.98);
    const PURPLE_BORDER = rgb(0.60, 0.45, 0.80);
    const PURPLE_DARK = rgb(0.40, 0.25, 0.60);

    drawRect(page, MARGIN, y - eventsH, CONTENT_WIDTH, eventsH, PURPLE_LIGHT, PURPLE_BORDER);

    drawText(page, "SCHEDULED EVENTS (One-time)", MARGIN + 10, y - 12, 8, helveticaBold, PURPLE_DARK);

    // Main content: X seminars -> Y attendees -> Z sales
    const eventText = `${profile.seminars_planned} seminar${profile.seminars_planned > 1 ? 's' : ''} planned -> ~${seminarAttendees} attendees -> ~${seminarSales} sales`;
    drawText(page, eventText, MARGIN + 10, y - 26, 9, helveticaBold, CHARCOAL);

    // Subtext
    drawText(page, "Seminars produce results when they happen - not counted in monthly goal.", MARGIN + 10, y - 38, 7, helveticaOblique, PURPLE_DARK);

    y -= eventsH + 10;
  }

  // Daily Checklist - check if we have room, otherwise page break
  const checklistH = 16 + visibleChecklist.length * 26;
  if (y - checklistH < 60) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawHeader(page, "Your Path to the Goal");
    drawFooter(page, 1);
    y = PAGE_HEIGHT - 68;
  }

  drawRect(page, MARGIN, y - checklistH, CONTENT_WIDTH, checklistH, rgb(0.98, 0.98, 0.98), LIGHT_GRAY);

  drawText(page, "YOUR DAILY MINIMUMS", MARGIN + 10, y - 12, 8, helveticaBold, CHARCOAL);
  drawTextRight(page, "Every working day", PAGE_WIDTH - MARGIN - 10, y - 12, 7, helvetica, MEDIUM_GRAY);

  let checkY = y - 26;
  for (const item of visibleChecklist) {
    // Checkbox with thicker border (1.5px) for tactile feel
    page.drawRectangle({ x: MARGIN + 10, y: checkY - 8, width: 10, height: 10, color: WHITE, borderColor: GOLD, borderWidth: 1.5 });

    // Activity (truncated)
    drawText(page, truncateText(item.activity, 40), MARGIN + 26, checkY - 6, 8, helveticaBold, CHARCOAL);
    drawText(page, truncateText(item.detail, 55), MARGIN + 26, checkY - 16, 7, helvetica, MEDIUM_GRAY);

    // Frequency
    drawTextRight(page, item.frequency, PAGE_WIDTH - MARGIN - 10, checkY - 10, 8, helveticaBold, GOLD);

    checkY -= 26;
  }

  y -= checklistH + 10;

  // Review Date
  drawRect(page, MARGIN, y - 28, CONTENT_WIDTH, 28, WHITE, LIGHT_GRAY);
  drawText(page, "30-Day Review", MARGIN + 10, y - 12, 7, helvetica, MEDIUM_GRAY);
  drawText(page, reviewDateStr, MARGIN + 10, y - 22, 9, helveticaBold, CHARCOAL);
  drawTextRight(page, `with ${profile.manager_name}`, PAGE_WIDTH - MARGIN - 10, y - 18, 8, helvetica, MEDIUM_GRAY);

  // Seasonality note moved to Page 5 to reduce Page 1 clutter

  // ============================================
  // PAGE 2: CHANNEL PLAYBOOK
  // ============================================
  page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(page, "How to Work Each Channel");
  drawFooter(page, 2);

  y = PAGE_HEIGHT - 68;
  drawText(page, "HOW YOUR CHANNELS WORK", MARGIN, y, 10, helveticaBold, CHARCOAL);
  y -= 16;

  for (const ch of assignedChannels) {
    // Increased card height to prevent overlap
    const cardH = 75;

    if (y - cardH < 60) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawHeader(page, "How to Work Each Channel");
      drawFooter(page, 2);
      y = PAGE_HEIGHT - 68;
    }

    // Card background
    drawRect(page, MARGIN, y - cardH, CONTENT_WIDTH, cardH, rgb(0.98, 0.98, 0.98), LIGHT_GRAY);

    // Gold left accent
    drawRect(page, MARGIN, y - cardH, 3, cardH, GOLD);

    // Channel name (y - 14)
    drawText(page, ch.name, MARGIN + 12, y - 14, 10, helveticaBold, CHARCOAL);

    // Stats on same line as name - show close rate only (removed velocity labels)
    const statsText = ch.close_rate > 0 ? `${ch.close_rate}% close rate` : '';
    if (statsText) {
      drawTextRight(page, statsText, PAGE_WIDTH - MARGIN - 10, y - 14, 8, helvetica, MEDIUM_GRAY);
    }

    // Description (y - 28)
    drawText(page, truncateText(ch.description, 80), MARGIN + 12, y - 28, 8, helveticaOblique, DARK_GRAY);

    // Target (y - 42)
    drawText(page, "TARGET:", MARGIN + 12, y - 42, 7, helveticaBold, GOLD);
    drawText(page, truncateText(ch.weekly_target, 65), MARGIN + 50, y - 42, 8, helveticaBold, CHARCOAL);

    // Script box at y - 58 with 14px height (proper spacing from TARGET)
    const scriptY = y - 58 - 14;
    drawRect(page, MARGIN + 10, scriptY, CONTENT_WIDTH - 20, 14, rgb(1.0, 0.98, 0.92));
    drawRect(page, MARGIN + 10, scriptY, 2, 14, GOLD);
    // Gold opening quote mark to indicate "say this"
    drawText(page, '"', MARGIN + 16, scriptY + 2, 10, helveticaBold, GOLD);
    drawText(page, truncateText(ch.script.replace(/^"/, ''), 70), MARGIN + 24, scriptY + 3, 8, helveticaOblique, CHARCOAL);

    y -= cardH + 8;
  }

  // ============================================
  // PAGE 3: WHAT YOU'RE BUILDING
  // ============================================
  page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(page, "What You're Building");
  drawFooter(page, 3);

  y = PAGE_HEIGHT - 68;

  // Starting Position Box
  if (profile.book_size > 0) {
    drawText(page, "STARTING POSITION", MARGIN, y, 10, helveticaBold, CHARCOAL);
    y -= 16;

    const startBoxH = 32;
    drawRect(page, MARGIN, y - startBoxH, CONTENT_WIDTH / 2 - 5, startBoxH, WHITE, LIGHT_GRAY);
    drawText(page, "Current Book", MARGIN + 10, y - 12, 8, helvetica, MEDIUM_GRAY);
    drawText(page, `${profile.book_size} clients`, MARGIN + 10, y - 26, 12, helveticaBold, CHARCOAL);

    drawRect(page, MARGIN + CONTENT_WIDTH / 2 + 5, y - startBoxH, CONTENT_WIDTH / 2 - 5, startBoxH, WHITE, LIGHT_GRAY);
    drawText(page, "Existing Renewal Income", MARGIN + CONTENT_WIDTH / 2 + 15, y - 12, 8, helvetica, MEDIUM_GRAY);
    drawText(page, `${economics.existing_book_renewals.toLocaleString()}/year`, MARGIN + CONTENT_WIDTH / 2 + 15, y - 26, 12, helveticaBold, GOLD);

    y -= startBoxH + 16;
  }

  // 5-Year Trajectory
  drawText(page, "YOUR 5-YEAR INCOME", MARGIN, y, 10, helveticaBold, CHARCOAL);
  drawText(page, "(85% retention)", MARGIN + 120, y, 8, helvetica, MEDIUM_GRAY);
  y -= 16;

  // Table header (taller for more professional feel)
  const trajHeaderH = 18;
  drawRect(page, MARGIN, y - trajHeaderH, CONTENT_WIDTH, trajHeaderH, GOLD);
  // Right-align positions for numerical columns
  const trajColX = [MARGIN + 10, MARGIN + 110, MARGIN + 220, MARGIN + 340, MARGIN + 460];
  drawText(page, "Year", trajColX[0], y - 12, 8, helveticaBold, WHITE);
  drawTextRight(page, "Book Size", trajColX[1], y - 12, 8, helveticaBold, WHITE);
  drawTextRight(page, "New Income", trajColX[2], y - 12, 8, helveticaBold, WHITE);
  drawTextRight(page, "Renewal Income", trajColX[3], y - 12, 8, helveticaBold, WHITE);
  drawTextRight(page, "Total", trajColX[4], y - 12, 8, helveticaBold, WHITE);
  y -= trajHeaderH;

  // Table rows
  for (const yr of economics.years) {
    const rowH = 18;

    // Page break check
    if (y - rowH < 60) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawHeader(page, "What You're Building");
      drawFooter(page, 3);
      y = PAGE_HEIGHT - 68;
    }

    drawRect(page, MARGIN, y - rowH, CONTENT_WIDTH, rowH, WHITE);
    drawLine(page, MARGIN, y - rowH, PAGE_WIDTH - MARGIN, y - rowH, LIGHT_GRAY, 0.5);

    drawText(page, `Year ${yr.year}`, trajColX[0], y - 12, 8, helveticaBold, CHARCOAL);
    drawTextRight(page, `${yr.book_size}`, trajColX[1], y - 12, 8, helvetica, DARK_GRAY);
    drawTextRight(page, `${yr.new_income.toLocaleString()}`, trajColX[2], y - 12, 8, helvetica, DARK_GRAY);
    drawTextRight(page, `${yr.renewal_income.toLocaleString()}`, trajColX[3], y - 12, 8, helvetica, DARK_GRAY);
    drawTextRight(page, `${yr.total_income.toLocaleString()}`, trajColX[4], y - 12, 10, helveticaBold, GOLD);

    y -= rowH;
  }

  y -= 8;
  drawText(page, "*Projection uses weighted average ($434): 25% T65 @ $694 + 75% plan changes @ $347.", MARGIN, y, 7, helveticaOblique, MEDIUM_GRAY);
  y -= 8;
  drawText(page, "*Assumes AEP-focused sales (Jan 1 effective = full commission). Mid-year sales are prorated.", MARGIN, y, 7, helveticaOblique, MEDIUM_GRAY);
  y -= 16;

  // Stay vs Quit comparison
  drawText(page, "IF YOU STAY VS IF YOU QUIT", MARGIN, y, 9, helveticaBold, CHARCOAL);
  y -= 14;

  const compareH = 70;
  const halfW = (CONTENT_WIDTH - 10) / 2;

  // Quit box
  drawRect(page, MARGIN, y - compareH, halfW, compareH, RED_LIGHT, rgb(1.0, 0.80, 0.80));
  drawText(page, "X  Quit After Year 1", MARGIN + 10, y - 14, 8, helveticaBold, rgb(0.78, 0.16, 0.16));
  drawText(page, `${economics.years[0].total_income.toLocaleString()} earned total`, MARGIN + 10, y - 30, 7, helvetica, DARK_GRAY);
  drawText(page, "0 ongoing renewals", MARGIN + 10, y - 42, 7, helvetica, DARK_GRAY);
  drawText(page, "Start over somewhere else", MARGIN + 10, y - 54, 7, helvetica, DARK_GRAY);

  // Stay box
  drawRect(page, MARGIN + halfW + 10, y - compareH, halfW, compareH, GREEN_LIGHT, rgb(0.65, 0.84, 0.65));
  drawText(page, "+  Stay 5 Years", MARGIN + halfW + 20, y - 14, 8, helveticaBold, GREEN_DARK);
  drawText(page, `${economics.cumulative_5_year.toLocaleString()} total earned`, MARGIN + halfW + 20, y - 30, 10, helveticaBold, CHARCOAL);
  drawText(page, `$${economics.year_5_renewal.toLocaleString()} in annual renewals`, MARGIN + halfW + 20, y - 42, 7, helvetica, DARK_GRAY);
  drawText(page, `Book worth ~$${economics.estimated_book_value.toLocaleString()} if you sell it`, MARGIN + halfW + 20, y - 54, 7, helvetica, DARK_GRAY);

  y -= compareH + 14;

  // What this means - PERSONALIZED based on their income goal
  const meaningH = 48;
  drawRect(page, MARGIN, y - meaningH, CONTENT_WIDTH, meaningH, GOLD_LIGHT, GOLD);
  drawText(page, "WHAT THIS MEANS FOR YOU", MARGIN + 10, y - 14, 8, helveticaBold, CHARCOAL);

  // Find crossover year when renewals exceed their income goal (personalized!)
  let crossoverYear = 5;
  let crossoverRenewal = economics.year_5_renewal;
  for (const yr of economics.years) {
    if (yr.renewal_income >= economics.income_goal * 12) {
      crossoverYear = yr.year;
      crossoverRenewal = yr.renewal_income;
      break;
    }
  }
  const crossoverMsg = `By Year ${crossoverYear}, your renewals alone ($${crossoverRenewal.toLocaleString()}) will cover a $${economics.income_goal.toLocaleString()}/month lifestyle.`;

  drawText(page, truncateText(crossoverMsg, 85), MARGIN + 10, y - 28, 8, helvetica, DARK_GRAY);
  drawText(page, "New sales build wealth, not just pay bills. Build a business, not a job.", MARGIN + 10, y - 42, 8, helveticaBold, GOLD);

  // ============================================
  // PAGE 4: THE MINDSET
  // ============================================
  page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(page, "The Mindset");
  drawFooter(page, 4);

  y = PAGE_HEIGHT - 68;
  drawText(page, "WHAT ACTUALLY MATTERS", MARGIN, y, 10, helveticaBold, CHARCOAL);
  y -= 12;
  drawText(page, "What separates successful agents from those who quit:", MARGIN, y, 8, helvetica, DARK_GRAY);
  y -= 18;

  const principles = [
    { title: "Reps build confidence", truth: "Every conversation makes you sharper for when it counts.", detail: "Use OEP and summer to master products and refine your approach." },
    { title: "Right plan beats highest commission", truth: "Clients remember who helped them vs who sold them.", detail: "A lower commission on the right plan generates referrals for years." },
    { title: "Discipline beats motivation", truth: "Most days you won't feel like making calls. Do it anyway.", detail: "Motivation fades. Discipline is a choice you make every morning." },
    { title: "Your book compounds", truth: "Year 3 renewals pay for Year 3 mistakes. Protect what you've built.", detail: "Each client = $347/year. 100 clients = $35K/year in renewals." },
    { title: "Embrace the boring", truth: "Success is doing simple things with extraordinary consistency.", detail: "No secrets. Winners show up every day." },
  ];

  for (let i = 0; i < principles.length; i++) {
    const p = principles[i];
    const isFirst = i === 0;
    const cardH = 64;

    // Page break check
    if (y - cardH < 60) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawHeader(page, "The Mindset");
      drawFooter(page, 4);
      y = PAGE_HEIGHT - 68;
    }

    // First principle gets emphasis: gold background, thicker border
    const cardBg = isFirst ? GOLD_LIGHT : rgb(0.98, 0.98, 0.98);
    const borderW = isFirst ? 5 : 3;
    drawRect(page, MARGIN, y - cardH, CONTENT_WIDTH, cardH, cardBg, LIGHT_GRAY);

    // Gold left accent (consistent on all cards, thicker on first)
    drawRect(page, MARGIN, y - cardH, borderW, cardH, GOLD);

    // Number (larger on first principle)
    const numSize = isFirst ? 18 : 14;
    drawText(page, `${i + 1}.`, MARGIN + 10, y - 16, numSize, helveticaBold, GOLD);

    // Title
    drawText(page, truncateText(p.title, 50), MARGIN + 30, y - 14, 10, helveticaBold, CHARCOAL);

    // Truth (more space with taller card)
    drawText(page, truncateText(p.truth, 80), MARGIN + 10, y - 32, 8, helveticaBold, GOLD);

    // Detail (more space with taller card)
    drawText(page, truncateText(p.detail, 95), MARGIN + 10, y - 48, 7, helvetica, DARK_GRAY);

    y -= cardH + 8;
  }

  // ============================================
  // PAGE 5: YOUR WEEK
  // ============================================
  page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(page, "Your Week");
  drawFooter(page, 5);

  y = PAGE_HEIGHT - 68;

  // The Rules
  drawText(page, "PROVEN TACTICS", MARGIN, y, 10, helveticaBold, CHARCOAL);
  y -= 14;

  const rules = [
    { name: "1-Hour Rule", detail: "Respond to every new lead within 1 hour", stat: "78% more likely" },
    { name: "6-Touch Rule", detail: "Every lead gets 6 attempts over 14 days", stat: "80% need 5+" },
    { name: "Referral Rule", detail: "Ask every satisfied client for a name", stat: "4x value" },
    { name: "Protection Rule", detail: "Review every client annually", stat: "10x retention" },
  ];

  for (const rule of rules) {
    const rowH = 28;

    // Page break check
    if (y - rowH < 60) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawHeader(page, "Your Week");
      drawFooter(page, 5);
      y = PAGE_HEIGHT - 68;
    }

    drawRect(page, MARGIN, y - rowH, CONTENT_WIDTH, rowH, rgb(0.98, 0.98, 0.98), LIGHT_GRAY);
    // Consistent gold left accent on all cards
    drawRect(page, MARGIN, y - rowH, 3, rowH, GOLD);

    drawText(page, rule.name, MARGIN + 12, y - 12, 9, helveticaBold, CHARCOAL);
    drawText(page, truncateText(rule.detail, 55), MARGIN + 12, y - 23, 7, helvetica, DARK_GRAY);
    drawTextRight(page, rule.stat, PAGE_WIDTH - MARGIN - 10, y - 16, 10, helveticaBold, GOLD);

    y -= rowH + 4;
  }

  y -= 10;

  // Weekly Rhythm
  drawText(page, "WEEKLY RHYTHM", MARGIN, y, 10, helveticaBold, CHARCOAL);
  y -= 14;

  // Rhythm table header (taller for more professional feel)
  const rhythmHeaderH = 18;
  drawRect(page, MARGIN, y - rhythmHeaderH, CONTENT_WIDTH, rhythmHeaderH, GOLD);
  drawText(page, "Day", MARGIN + 10, y - 12, 7, helveticaBold, WHITE);
  drawText(page, "Morning (9-11am)", MARGIN + 60, y - 12, 7, helveticaBold, WHITE);
  drawText(page, "Midday", MARGIN + 200, y - 12, 7, helveticaBold, WHITE);
  drawText(page, "Afternoon", MARGIN + 340, y - 12, 7, helveticaBold, WHITE);
  y -= rhythmHeaderH;

  const rhythmDays = [
    { day: "Mon", morning: "Outreach + Networking", midday: "Follow-up calls", afternoon: "Appointments" },
    { day: "Tue", morning: "Outreach + Client Care", midday: "Community contacts", afternoon: "Appointments" },
    { day: "Wed", morning: "Outreach + Networking", midday: "Partner outreach", afternoon: "Appointments" },
    { day: "Thu", morning: "Outreach + Client Care", midday: "Client check-ins", afternoon: "Appointments" },
    { day: "Fri", morning: "Outreach + Catchup", midday: "Weekly review", afternoon: "Next week planning" },
  ];

  for (const r of rhythmDays) {
    const rowH = 16;

    // Page break check
    if (y - rowH < 60) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawHeader(page, "Your Week");
      drawFooter(page, 5);
      y = PAGE_HEIGHT - 68;
    }

    drawRect(page, MARGIN, y - rowH, CONTENT_WIDTH, rowH, WHITE);
    drawLine(page, MARGIN, y - rowH, PAGE_WIDTH - MARGIN, y - rowH, LIGHT_GRAY, 0.5);

    drawText(page, r.day, MARGIN + 10, y - 10, 8, helveticaBold, CHARCOAL);
    drawText(page, truncateText(r.morning, 22), MARGIN + 60, y - 10, 7, helvetica, DARK_GRAY);
    drawText(page, truncateText(r.midday, 22), MARGIN + 200, y - 10, 7, helvetica, DARK_GRAY);
    drawText(page, truncateText(r.afternoon, 22), MARGIN + 340, y - 10, 7, helvetica, DARK_GRAY);

    y -= rowH;
  }

  y -= 14;

  // First Week Checklist
  drawText(page, "FIRST WEEK CHECKLIST", MARGIN, y, 10, helveticaBold, CHARCOAL);
  y -= 14;

  // Build first week tasks with conditional Client Care based on book size
  const firstWeekTasks: string[] = [
    profile.lead_star_leads > 0 ? "Set your Lead Star availability hours (consistent daily blocks)" : profile.mira_access ? "Set up MIRA portal alerts (check 3x daily)" : "Build your community contact list (50 names)",
  ];

  // Client Care task - conditional based on book size
  // book_size = 0: Don't show (no clients to call)
  // book_size <= 20: Review full list (small enough to work through)
  // book_size 21-75: Pull 10 prioritized
  // book_size > 75: Pull 15 prioritized
  if (profile.book_size > 0 && profile.book_size <= 20) {
    firstWeekTasks.push("Review your full client list for Client Care calls");
  } else if (profile.book_size > 20 && profile.book_size <= 75) {
    firstWeekTasks.push("Pull 10 clients to prioritize for Client Care calls");
  } else if (profile.book_size > 75) {
    firstWeekTasks.push("Pull 15 clients to prioritize for Client Care calls");
  }

  firstWeekTasks.push(
    "List 50 people (personal contacts + professional partners)",
    "Block 9-11am daily for outreach",
    "Review this plan before Monday morning"
  );

  for (const task of firstWeekTasks) {
    drawRect(page, MARGIN + 5, y - 8, 8, 8, WHITE, MEDIUM_GRAY);
    drawText(page, truncateText(task, 75), MARGIN + 18, y - 7, 9, helvetica, DARK_GRAY);
    y -= 14;
  }

  y -= 10;

  // Foundation-building season note (reframed from AEP-focused)
  const seasonalH = 40;
  if (y - seasonalH >= 40) {
    drawRect(page, MARGIN, y - seasonalH, CONTENT_WIDTH, seasonalH, ORANGE_LIGHT, rgb(1.0, 0.76, 0.03));
    drawText(page, "BUILD YOUR FOUNDATION NOW", MARGIN + 10, y - 12, 8, helveticaBold, ORANGE_DARK);
    drawText(page, "This is your foundation-building season. Focus on T65s, learning products, building relationships.", MARGIN + 10, y - 25, 8, helvetica, CHARCOAL);
    drawText(page, "AEP (Oct 15 - Dec 7) rewards the work you do now.", MARGIN + 10, y - 37, 8, helvetica, DARK_GRAY);
  }

  // ============================================
  // PAGE 6: WEEKLY TRACKER
  // ============================================
  page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(page, "Weekly Tracker");
  drawFooter(page, 6);

  y = PAGE_HEIGHT - 68;

  drawText(page, "WEEK OF: ____________", MARGIN, y, 9, helveticaBold, CHARCOAL);
  drawTextRight(page, `Goal: ${economics.sales_goal} sales/month = ${Math.ceil(economics.sales_goal / 4)}/week`, PAGE_WIDTH - MARGIN, y, 8, helvetica, MEDIUM_GRAY);
  y -= 18;

  // Tracker table header (taller for more professional feel)
  const trackerHeaderH = 18;
  drawRect(page, MARGIN, y - trackerHeaderH, CONTENT_WIDTH, trackerHeaderH, GOLD);

  const trackerColX = [MARGIN + 8, MARGIN + 100, MARGIN + 180, MARGIN + 260, MARGIN + 340, MARGIN + 420, MARGIN + 490];
  drawText(page, "Activity", trackerColX[0], y - 12, 7, helveticaBold, WHITE);
  drawText(page, "Mon", trackerColX[1], y - 12, 7, helveticaBold, WHITE);
  drawText(page, "Tue", trackerColX[2], y - 12, 7, helveticaBold, WHITE);
  drawText(page, "Wed", trackerColX[3], y - 12, 7, helveticaBold, WHITE);
  drawText(page, "Thu", trackerColX[4], y - 12, 7, helveticaBold, WHITE);
  drawText(page, "Fri", trackerColX[5], y - 12, 7, helveticaBold, WHITE);
  drawText(page, "Total", trackerColX[6], y - 12, 7, helveticaBold, WHITE);
  y -= trackerHeaderH;

  // Build tracker rows based on checklist (dynamic based on profile)
  const trackerRows = [];

  // Lead Star Hours (if assigned) - scaled based on volume
  if (profile.lead_star_leads > 0) {
    let leadStarTarget = "Be available";
    if (profile.lead_star_leads >= 26) {
      leadStarTarget = "2-3 hrs/day";
    } else if (profile.lead_star_leads >= 11) {
      leadStarTarget = "1-2 hrs/day";
    }
    trackerRows.push({ activity: "Lead Star Hours", target: leadStarTarget, weeklyTarget: "" });
  }

  // MIRA Checks (if assigned)
  if (profile.mira_access) {
    trackerRows.push({ activity: "MIRA Checks", target: "3/day", weeklyTarget: "/15" });
  }

  // Client Care Contacts (if book > 0)
  if (profile.book_size > 0) {
    const contactsPerWeek = Math.max(3, Math.ceil(profile.book_size / 10));
    trackerRows.push({ activity: "Client Care", target: `${contactsPerWeek}/week`, weeklyTarget: `/${contactsPerWeek}` });
  }

  // Community Conversations (always) - use consistent target from economics
  trackerRows.push({ activity: "Networking", target: `${economics.community_weekly_target}/week`, weeklyTarget: `/${economics.community_weekly_target}` });

  trackerRows.push({ activity: "Appointments Set", target: "", weeklyTarget: "" });
  trackerRows.push({ activity: "Sales Closed", target: "", weeklyTarget: `/${Math.ceil(economics.sales_goal / 4)}` });

  for (const row of trackerRows) {
    const rowH = 28;

    // Page break check
    if (y - rowH < 60) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawHeader(page, "Weekly Tracker");
      drawFooter(page, 6);
      y = PAGE_HEIGHT - 68;
    }

    drawRect(page, MARGIN, y - rowH, CONTENT_WIDTH, rowH, WHITE);

    // Activity label (truncated)
    drawRect(page, MARGIN, y - rowH, 90, rowH, rgb(0.98, 0.98, 0.98));
    drawText(page, truncateText(row.activity, 18), trackerColX[0], y - 12, 7, helveticaBold, CHARCOAL);
    if (row.target) {
      drawText(page, `Target: ${row.target}`, trackerColX[0], y - 22, 7, helvetica, MEDIUM_GRAY);
    }

    // Day columns (empty cells for writing) with writing guide lines
    for (let i = 1; i <= 5; i++) {
      drawLine(page, trackerColX[i] - 5, y, trackerColX[i] - 5, y - rowH, LIGHT_GRAY, 0.5);
      // Faint horizontal guide line in middle of cell for neat writing
      const cellMiddleY = y - rowH / 2;
      const cellLeft = trackerColX[i] - 3;
      const cellRight = i < 5 ? trackerColX[i + 1] - 7 : trackerColX[6] - 7;
      drawLine(page, cellLeft, cellMiddleY, cellRight, cellMiddleY, LIGHT_GRAY, 0.3);
    }

    // Total column
    drawLine(page, trackerColX[6] - 5, y, trackerColX[6] - 5, y - rowH, LIGHT_GRAY, 0.5);
    if (row.weeklyTarget) {
      drawText(page, row.weeklyTarget, trackerColX[6] + 15, y - 18, 7, helvetica, MEDIUM_GRAY);
    }

    drawLine(page, MARGIN, y - rowH, PAGE_WIDTH - MARGIN, y - rowH, LIGHT_GRAY, 0.5);
    y -= rowH;
  }

  y -= 14;

  // Behind Pace box - conditional based on book size
  const behindH = 65;
  drawRect(page, MARGIN, y - behindH, CONTENT_WIDTH, behindH, GOLD_LIGHT, GOLD);

  drawText(page, "FALLING BEHIND?", MARGIN + 10, y - 12, 9, helveticaBold, GOLD);

  drawText(page, "Wednesday & under 3 Client Care calls?", MARGIN + 10, y - 28, 7, helveticaBold, CHARCOAL);
  // Show different action based on book size
  const clientCareAction = profile.book_size > 0
    ? "-> Call 5 clients Thursday morning"
    : "-> Make 5 community contacts Thursday";
  drawText(page, clientCareAction, MARGIN + 180, y - 28, 7, helvetica, DARK_GRAY);

  drawText(page, "Friday & no appointments set?", MARGIN + 10, y - 42, 7, helveticaBold, CHARCOAL);
  drawText(page, "-> Saturday networking session (3 hours)", MARGIN + 180, y - 42, 7, helvetica, DARK_GRAY);

  drawText(page, "Low conversion on calls?", MARGIN + 10, y - 56, 7, helveticaBold, CHARCOAL);
  drawText(page, "-> Ask your manager for help with scripts", MARGIN + 180, y - 56, 7, helvetica, DARK_GRAY);

  y -= behindH + 14;

  // Weekly Reflection
  drawText(page, "WEEKLY REFLECTION", MARGIN, y, 9, helveticaBold, CHARCOAL);
  y -= 16;

  const reflectionH = 75;
  drawRect(page, MARGIN, y - reflectionH, CONTENT_WIDTH, reflectionH, WHITE, LIGHT_GRAY);

  drawText(page, `This week's sales: _______  (Goal: ${Math.ceil(economics.sales_goal / 4)})`, MARGIN + 10, y - 16, 8, helvetica, DARK_GRAY);
  drawText(page, "What worked: _______________________________________________", MARGIN + 10, y - 34, 8, helvetica, DARK_GRAY);
  drawText(page, "What to improve: ___________________________________________", MARGIN + 10, y - 52, 8, helvetica, DARK_GRAY);
  drawText(page, "Next week focus: ___________________________________________", MARGIN + 10, y - 70, 8, helvetica, DARK_GRAY);

  // ============================================
  // PAGE 7: QUICK REFERENCE
  // ============================================
  page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(page, "Quick Reference - Print This Page");
  drawFooter(page, 7);

  y = PAGE_HEIGHT - 68;

  // Print indicator - signals this is the tear-off reference sheet
  drawTextRight(page, "Tear-out reference sheet", PAGE_WIDTH - MARGIN, y, 7, helvetica, MEDIUM_GRAY);
  y -= 8;

  // Big number boxes
  const bigBoxH = 60;
  const bigBoxW = (CONTENT_WIDTH - 10) / 2;

  // Income box (gold)
  drawRect(page, MARGIN, y - bigBoxH, bigBoxW, bigBoxH, GOLD);
  drawTextCentered(page, `${economics.income_goal.toLocaleString()}`, MARGIN + bigBoxW / 2, y - 38, 28, helveticaBold, WHITE);
  drawTextCentered(page, "monthly income goal", MARGIN + bigBoxW / 2, y - 52, 8, helvetica, WHITE);

  // Sales box (dark)
  drawRect(page, MARGIN + bigBoxW + 10, y - bigBoxH, bigBoxW, bigBoxH, CHARCOAL);
  drawTextCentered(page, `${economics.sales_goal}`, MARGIN + bigBoxW + 10 + bigBoxW / 2, y - 38, 28, helveticaBold, WHITE);
  drawTextCentered(page, "sales per month", MARGIN + bigBoxW + 10 + bigBoxW / 2, y - 52, 8, helvetica, WHITE);

  y -= bigBoxH + 14;

  // Daily Checklist - check if we have room
  const qrChecklistH = 18 + visibleChecklist.length * 22;
  if (y - qrChecklistH < 60) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawHeader(page, "Quick Reference - Print This Page");
    drawFooter(page, 7);
    y = PAGE_HEIGHT - 68;
  }

  drawRect(page, MARGIN, y - qrChecklistH, CONTENT_WIDTH, qrChecklistH, rgb(0.98, 0.98, 0.98), LIGHT_GRAY);

  drawText(page, "DAILY CHECKLIST", MARGIN + 10, y - 14, 9, helveticaBold, CHARCOAL);

  let qrCheckY = y - 30;
  for (const item of visibleChecklist) {
    // Checkbox with thicker border (1.5px) for tactile feel
    page.drawRectangle({ x: MARGIN + 10, y: qrCheckY - 6, width: 12, height: 12, color: WHITE, borderColor: GOLD, borderWidth: 1.5 });
    drawText(page, truncateText(item.activity, 45), MARGIN + 28, qrCheckY - 4, 8, helveticaBold, CHARCOAL);
    drawTextRight(page, item.frequency, PAGE_WIDTH - MARGIN - 10, qrCheckY - 4, 9, helveticaBold, GOLD);
    qrCheckY -= 22;
  }

  y -= qrChecklistH + 10;

  // Lead Sources Summary - check if we have room
  const hasSeminars = profile.seminar_eligible && profile.seminars_planned && profile.seminars_planned > 0;
  const seminarRowH = hasSeminars ? 20 : 0;
  const lsBoxH = 16 + economics.lead_sources.length * 16 + 18 + seminarRowH;
  if (y - lsBoxH < 60) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawHeader(page, "Quick Reference - Print This Page");
    drawFooter(page, 7);
    y = PAGE_HEIGHT - 68;
  }

  drawRect(page, MARGIN, y - lsBoxH, CONTENT_WIDTH, lsBoxH, WHITE, LIGHT_GRAY);

  drawText(page, "LEAD SOURCES -> EXPECTED SALES", MARGIN + 10, y - 12, 8, helveticaBold, GOLD);

  let lsY = y - 28;
  for (const source of economics.lead_sources) {
    // Shorten display name and simplify what_you_have for scannability
    const shortName = source.name === 'Community & Networking' ? 'Community' : source.name;
    // Extract just the key number (e.g., "75 clients" from "75 clients -> ~3 referrals/mo")
    const shortDetail = source.what_you_have.split('->')[0].trim();
    const sourceText = `${shortName} (${shortDetail})`;
    drawText(page, truncateText(sourceText, 45), MARGIN + 10, lsY, 7, helvetica, DARK_GRAY);
    const expectedText = source.is_variable ? source.label || 'Variable' : `~${source.expected_sales}`;
    drawTextRight(page, expectedText, PAGE_WIDTH - MARGIN - 10, lsY, 8, helveticaBold, source.is_variable ? MEDIUM_GRAY : GOLD);
    lsY -= 16;
  }

  // Total row
  drawRect(page, MARGIN, lsY - 4, CONTENT_WIDTH, 18, GOLD_LIGHT);
  drawText(page, "Total Expected (Monthly)", MARGIN + 10, lsY, 8, helveticaBold, CHARCOAL);
  const totalText = `~${economics.total_expected_sales} (Goal: ${economics.sales_goal})`;
  drawTextRight(page, totalText, PAGE_WIDTH - MARGIN - 10, lsY, 9, helveticaBold, GOLD);
  lsY -= 18;

  // Scheduled Events row (if seminars planned)
  if (hasSeminars) {
    const seminarAttendees = profile.seminars_planned * 18;
    const seminarSales = Math.round(seminarAttendees * CLOSE_RATES.SEMINARS);
    const PURPLE_DARK = rgb(0.40, 0.25, 0.60);

    drawRect(page, MARGIN, lsY - 4, CONTENT_WIDTH, 18, rgb(0.94, 0.92, 0.98));
    drawText(page, `+ Scheduled Events: ${profile.seminars_planned} seminar${profile.seminars_planned > 1 ? 's' : ''}`, MARGIN + 10, lsY, 7, helveticaOblique, PURPLE_DARK);
    drawTextRight(page, `~${seminarSales} (one-time)`, PAGE_WIDTH - MARGIN - 10, lsY, 8, helveticaBold, PURPLE_DARK);
  }

  y -= lsBoxH + 10;

  // When You're Stuck - check if we have room
  if (y < 120) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawHeader(page, "Quick Reference - Print This Page");
    drawFooter(page, 7);
    y = PAGE_HEIGHT - 68;
  }

  drawText(page, "QUICK FIXES", MARGIN, y, 9, helveticaBold, CHARCOAL);
  y -= 14;

  const stuckItems = [
    { problem: "Can't reach anyone?", solution: "Switch to texts/emails for an hour" },
    { problem: "No appointments?", solution: profile.book_size > 0 ? "Call 5 clients (Client Care)" : "Make 5 community contacts" },
    { problem: "Feeling unmotivated?", solution: "Do one checklist item. Go." },
    { problem: "Bad week?", solution: "Review last month. Repeat it." },
  ];

  const stuckBoxW = (CONTENT_WIDTH - 10) / 2;
  for (let i = 0; i < stuckItems.length; i += 2) {
    const rowH = 36;

    // Left box with gold accent
    drawRect(page, MARGIN, y - rowH, stuckBoxW, rowH, rgb(0.97, 0.97, 0.97), LIGHT_GRAY);
    drawRect(page, MARGIN, y - rowH, 3, rowH, GOLD);
    drawText(page, stuckItems[i].problem, MARGIN + 10, y - 12, 7, helveticaBold, CHARCOAL);
    drawText(page, truncateText(`-> ${stuckItems[i].solution}`, 38), MARGIN + 10, y - 24, 7, helvetica, DARK_GRAY);

    // Right box with gold accent
    if (stuckItems[i + 1]) {
      drawRect(page, MARGIN + stuckBoxW + 10, y - rowH, stuckBoxW, rowH, rgb(0.97, 0.97, 0.97), LIGHT_GRAY);
      drawRect(page, MARGIN + stuckBoxW + 10, y - rowH, 3, rowH, GOLD);
      drawText(page, stuckItems[i + 1].problem, MARGIN + stuckBoxW + 20, y - 12, 7, helveticaBold, CHARCOAL);
      drawText(page, truncateText(`-> ${stuckItems[i + 1].solution}`, 38), MARGIN + stuckBoxW + 20, y - 24, 7, helvetica, DARK_GRAY);
    }

    y -= rowH + 6;
  }

  y -= 8;

  // Final message - personalized with their sales goal
  drawLine(page, MARGIN, y, PAGE_WIDTH - MARGIN, y, GOLD, 1);
  y -= 14;
  const personalQuote = `Your ${economics.sales_goal} sales start with today's first call.`;
  drawTextCentered(page, personalQuote, PAGE_WIDTH / 2, y, 10, helveticaBold, CHARCOAL);
  y -= 14;
  drawTextCentered(page, "Tyler Insurance Group", PAGE_WIDTH / 2, y, 10, helveticaBold, GOLD);

  // ============================================
  // PAGE 8: GLOSSARY
  // ============================================
  page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(page, "Glossary of Terms");
  drawFooter(page, 8);

  y = PAGE_HEIGHT - 68;

  drawText(page, "MEDICARE TERMS", MARGIN, y, 10, helveticaBold, CHARCOAL);
  y -= 16;

  const glossaryTerms = [
    { term: "T65", definition: "Turning 65. New-to-Medicare client. Full $694 commission." },
    { term: "AEP", definition: "Annual Enrollment (Oct 15 - Dec 7). Your biggest sales period." },
    { term: "OEP", definition: "Open Enrollment Period (Jan 1 - Mar 31). MA beneficiaries can switch once." },
    { term: "SEP", definition: "Special Enrollment Period. Life events allowing enrollment outside AEP/OEP." },
    { term: "SOA", definition: "Scope of Appointment. CMS-required form signed BEFORE any sales meeting." },
    { term: "MA", definition: "Medicare Advantage (Part C). Private plans replacing Original Medicare." },
    { term: "PDP", definition: "Prescription Drug Plan (Part D). Standalone drug coverage." },
    { term: "Med Supp", definition: "Medicare Supplement (Medigap). Covers gaps in Original Medicare." },
  ];

  for (const item of glossaryTerms) {
    const termH = 24;  // Increased height for better readability

    if (y - termH < 60) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawHeader(page, "Glossary of Terms");
      drawFooter(page, 8);
      y = PAGE_HEIGHT - 68;
    }

    drawRect(page, MARGIN, y - termH, CONTENT_WIDTH, termH, WHITE);
    drawLine(page, MARGIN, y - termH, PAGE_WIDTH - MARGIN, y - termH, LIGHT_GRAY, 0.5);

    drawText(page, item.term, MARGIN + 8, y - 16, 9, helveticaBold, GOLD);
    drawText(page, truncateText(item.definition, 80), MARGIN + 70, y - 16, 8, helvetica, CHARCOAL);

    y -= termH;
  }

  y -= 12;

  drawText(page, "TIG-SPECIFIC TERMS", MARGIN, y, 10, helveticaBold, CHARCOAL);
  y -= 16;

  const tigTerms = [
    { term: "Lead Star", definition: "TIG's inbound call program. 15% avg close rate." },
    { term: "MIRA", definition: "UHC's real-time lead portal. Check 3x daily. 18% avg close rate." },
    { term: "Client Care", definition: "Contact clients for check-ins and referral asks." },
    { term: "Community", definition: "Your network. Personal contacts, BNI, professional partners." },
    { term: "Book", definition: "Your book of business. Each client = ~$347/year renewal income." },
  ];

  for (const item of tigTerms) {
    const termH = 24;  // Increased height for better readability

    if (y - termH < 60) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawHeader(page, "Glossary of Terms");
      drawFooter(page, 8);
      y = PAGE_HEIGHT - 68;
    }

    drawRect(page, MARGIN, y - termH, CONTENT_WIDTH, termH, WHITE);
    drawLine(page, MARGIN, y - termH, PAGE_WIDTH - MARGIN, y - termH, LIGHT_GRAY, 0.5);

    drawText(page, item.term, MARGIN + 8, y - 16, 9, helveticaBold, GOLD);
    drawText(page, truncateText(item.definition, 75), MARGIN + 80, y - 16, 8, helvetica, CHARCOAL);

    y -= termH;
  }

  y -= 16;

  // Compliance reminder - check if we have room
  const complianceH = 50;
  if (y - complianceH < 40) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawHeader(page, "Glossary of Terms");
    drawFooter(page, 8);
    y = PAGE_HEIGHT - 68;
  }

  drawRect(page, MARGIN, y - complianceH, CONTENT_WIDTH, complianceH, RED_LIGHT, rgb(1.0, 0.80, 0.80));
  drawText(page, "COMPLIANCE REMINDER", MARGIN + 10, y - 14, 8, helveticaBold, rgb(0.78, 0.16, 0.16));
  drawText(page, "• Complete AHIP certification annually (July-September)", MARGIN + 10, y - 28, 7, helvetica, CHARCOAL);
  drawText(page, "• Complete carrier certifications before selling their products", MARGIN + 10, y - 38, 7, helvetica, CHARCOAL);
  drawText(page, "• Always get SOA signed BEFORE any Medicare sales conversation", MARGIN + 10, y - 48, 7, helvetica, CHARCOAL);

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
    const { profile: rawProfile, saveToStorage = false } = await req.json();

    if (!rawProfile || !rawProfile.broker_name) {
      return new Response(
        JSON.stringify({ error: "Broker profile is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize profile values (ensure correct types)
    const profile: BrokerProfile = {
      id: rawProfile.id,
      broker_name: String(rawProfile.broker_name || 'Agent'),
      manager_name: String(rawProfile.manager_name || 'TIG Leadership'),
      income_goal: Number(rawProfile.income_goal) || 0,
      monthly_goal: Number(rawProfile.monthly_goal) || 0,
      book_size: Number(rawProfile.book_size) || 0,
      lead_star_leads: Number(rawProfile.lead_star_leads) || 0,
      seminar_eligible: rawProfile.seminar_eligible === true || rawProfile.seminar_eligible === 'true',
      seminars_planned: Number(rawProfile.seminars_planned) || 0,
      mira_access: rawProfile.mira_access === true || rawProfile.mira_access === 'true',
    };

    // Debug logging
    console.log("Profile received:", JSON.stringify(profile));

    // V8: Ensure income_goal drives monthly_goal
    if (profile.income_goal && !profile.monthly_goal) {
      profile.monthly_goal = Math.round(profile.income_goal / COMMISSION.BLENDED_AVG);
    }
    if (!profile.income_goal && profile.monthly_goal) {
      profile.income_goal = profile.monthly_goal * COMMISSION.BLENDED_AVG;
    }

    // Calculate economics (includes lead sources)
    const economics = calculateEconomics(profile);

    // Build channels (pass consistent community target from economics)
    const channels = buildChannels(profile, economics.lead_sources, economics.community_weekly_target);

    // Build daily checklist (pass consistent community target from economics)
    const checklist = buildDailyChecklist(profile, economics.community_weekly_target);

    // Calculate review date
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + 30);
    const reviewDateStr = reviewDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Generate PDF
    const pdfBytes = await generatePdf(profile, channels, checklist, economics, reviewDateStr);

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const safeName = profile.broker_name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `GrowthPlan_${safeName}_${dateStr}.pdf`;

    // Convert to base64
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
          const storagePath = `growth-plans/${profile.id}/${filename}`;

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
        checklist,
        economics,
        review_date: reviewDateStr,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating growth plan:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate growth plan"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
