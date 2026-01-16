/**
 * Generate Roadmap PDF Edge Function
 *
 * Generates a personalized Strategic Growth Roadmap PDF for insurance brokers.
 * Uses AI to recommend growth channels based on broker profile.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
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
  months_in_business: number;
  book_size: number;
  monthly_goal: number;
  personality: 'Introvert' | 'Extrovert' | 'Ambivert';
  phone_comfort: 1 | 2 | 3 | 4 | 5;
  community_connections: boolean;
  strengths?: string;
  mira_access: boolean;
  seminar_assigned: boolean;
}

interface GrowthChannel {
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

interface ExperiencePhase {
  name: 'Foundation' | 'Growth' | 'Expansion';
  description: string;
  one_thing: string;
  focus: string;
  metric: string;
}

// ============================================================================
// PHASE DETERMINATION
// ============================================================================

function getExperiencePhase(months: number): ExperiencePhase {
  if (months < 6) {
    return {
      name: 'Foundation',
      description: 'Building your first client relationships and learning the business',
      one_thing: 'Master one lead source before adding others',
      focus: 'Learn the enrollment process and build confidence',
      metric: 'First 10 satisfied clients',
    };
  } else if (months < 18) {
    return {
      name: 'Growth',
      description: 'Scaling your book with proven methods',
      one_thing: 'Systematize your best-performing channel',
      focus: 'Increase volume while maintaining quality',
      metric: 'Consistent monthly production',
    };
  } else {
    return {
      name: 'Expansion',
      description: 'Diversifying and building long-term sustainability',
      one_thing: 'Leverage referrals and build passive lead sources',
      focus: 'Work smarter, not harder',
      metric: '50%+ of business from referrals',
    };
  }
}

// ============================================================================
// CHANNEL RECOMMENDATION ENGINE
// ============================================================================

function recommendChannels(profile: BrokerProfile): GrowthChannel[] {
  const channels: GrowthChannel[] = [];
  const monthlyGoal = profile.monthly_goal;
  let remainingAllocation = 100;
  let remainingPlans = monthlyGoal;

  // Helper to add a channel
  const addChannel = (
    name: string,
    channel: string,
    allocation: number,
    closeRate: number,
    velocity: string,
    rationale: string,
    weeklyVolume: string,
    followUp: string
  ) => {
    const actualAllocation = Math.min(allocation, remainingAllocation);
    const plans = Math.round((actualAllocation / 100) * monthlyGoal);

    if (actualAllocation > 0 && plans > 0) {
      channels.push({
        name,
        channel,
        allocation: actualAllocation,
        plans,
        close_rate: closeRate,
        velocity,
        rationale,
        weekly_volume: weeklyVolume,
        follow_up: followUp,
      });
      remainingAllocation -= actualAllocation;
      remainingPlans -= plans;
    }
  };

  // MIRA Portal - if they have access and decent phone skills
  if (profile.mira_access && profile.phone_comfort >= 3) {
    const allocation = profile.phone_comfort >= 4 ? 40 : 25;
    addChannel(
      'MIRA Portal Leads',
      'mira',
      allocation,
      15,
      'Fast - same day contact required',
      'Real-time leads from UHC. Best ROI when called within 5 minutes.',
      '15-20 leads/week',
      'Call within 5 min, then 3x follow-up over 48 hours'
    );
  }

  // Seminars - if assigned
  if (profile.seminar_assigned) {
    addChannel(
      'Educational Seminars',
      'seminars',
      30,
      35,
      'Medium - 2-3 week cycle',
      'High close rate, builds authority. Ideal for relationship builders.',
      '1-2 seminars/month, 15-25 attendees each',
      'Call within 24 hours, schedule 1-on-1 within the week'
    );
  }

  // Community partnerships - for extroverts or those with connections
  if (profile.community_connections || profile.personality === 'Extrovert') {
    addChannel(
      'Community Partnerships',
      'community',
      25,
      25,
      'Slow build - 4-8 week relationship cycle',
      'Sustainable referral source. Perfect for your networking strengths.',
      '2-3 partner visits/week',
      'Monthly check-ins, referral tracking system'
    );
  }

  // Referrals - weight based on book size
  if (profile.book_size >= 20) {
    const referralAllocation = Math.min(35, 10 + Math.floor(profile.book_size / 10));
    addChannel(
      'Client Referrals',
      'referrals',
      referralAllocation,
      45,
      'Ongoing - continuous cultivation',
      `With ${profile.book_size} clients, referrals should be a primary source.`,
      'Ask 5-10 clients/week for referrals',
      'Thank you calls, small gifts for referrers'
    );
  } else if (profile.book_size >= 5) {
    addChannel(
      'Client Referrals',
      'referrals',
      15,
      45,
      'Ongoing - start building the habit',
      'Start asking every satisfied client. Plant seeds now.',
      'Ask every client after positive interaction',
      'Send thank you cards for every referral'
    );
  }

  // Phone prospecting - only for high phone comfort
  if (profile.phone_comfort >= 4 && remainingAllocation >= 15) {
    addChannel(
      'Phone Prospecting',
      'phone',
      20,
      8,
      'Fast - immediate feedback',
      'Your phone comfort is an asset. Volume game with quick results.',
      '50-75 dials/day, 2-3 days/week',
      'Structured callback schedule, CRM tracking'
    );
  }

  // Digital/Social - for introverts or younger brokers
  if (profile.personality === 'Introvert' && remainingAllocation >= 15) {
    addChannel(
      'Digital Marketing',
      'digital',
      20,
      12,
      'Medium - 2-4 week nurture cycle',
      'Leverage content to attract leads without cold outreach.',
      '3-5 posts/week, 1 educational piece',
      'Email nurture sequence, retargeting'
    );
  }

  // Door-to-door for extroverts with low phone comfort
  if (profile.personality === 'Extrovert' && profile.phone_comfort <= 2 && remainingAllocation >= 15) {
    addChannel(
      'Door-to-Door/Field Marketing',
      'field',
      25,
      18,
      'Medium - same week enrollment possible',
      'Face-to-face plays to your strengths. Better than phone for you.',
      '3-4 hours canvassing, 2-3 days/week',
      'Leave materials, follow up within 48 hours'
    );
  }

  // Fill remaining with appropriate channel
  if (remainingAllocation >= 10) {
    if (profile.personality === 'Introvert') {
      addChannel(
        'Strategic Networking',
        'networking',
        remainingAllocation,
        20,
        'Slow - relationship-based',
        'Quality over quantity approach suits your style.',
        '1-2 targeted events/month',
        'Personal follow-up notes within 24 hours'
      );
    } else {
      addChannel(
        'Community Events',
        'events',
        remainingAllocation,
        22,
        'Medium - event-based cycle',
        'Your energy shines in group settings.',
        '2-3 community events/month',
        'Collect cards, call within 48 hours'
      );
    }
  }

  return channels;
}

// ============================================================================
// PDF GENERATION
// ============================================================================

async function generatePdf(
  profile: BrokerProfile,
  phase: ExperiencePhase,
  channels: GrowthChannel[],
  reviewDate: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const gold = rgb(0.72, 0.53, 0.04); // TIG Gold
  const darkGray = rgb(0.2, 0.2, 0.2);
  const mediumGray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.85, 0.85, 0.85);

  // Page dimensions
  const pageWidth = 612; // Letter size
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  // ====== PAGE 1: Cover & Overview ======
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Header
  page.drawText('STRATEGIC GROWTH ROADMAP', {
    x: margin,
    y,
    size: 24,
    font: helveticaBold,
    color: gold,
  });
  y -= 35;

  page.drawText(`Prepared for ${profile.broker_name}`, {
    x: margin,
    y,
    size: 16,
    font: helvetica,
    color: darkGray,
  });
  y -= 20;

  page.drawText(`Manager: ${profile.manager_name}`, {
    x: margin,
    y,
    size: 12,
    font: helvetica,
    color: mediumGray,
  });
  y -= 15;

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  page.drawText(`Generated: ${today}`, {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: mediumGray,
  });
  y -= 40;

  // Divider line
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 2,
    color: gold,
  });
  y -= 35;

  // Profile Summary Box
  page.drawText('BROKER PROFILE', {
    x: margin,
    y,
    size: 14,
    font: helveticaBold,
    color: darkGray,
  });
  y -= 25;

  const profileItems = [
    `Experience: ${profile.months_in_business} months in business`,
    `Current Book: ${profile.book_size} clients`,
    `Monthly Goal: ${profile.monthly_goal} plans/month`,
    `Personality: ${profile.personality}`,
    `Phone Comfort: ${profile.phone_comfort}/5`,
    `MIRA Access: ${profile.mira_access ? 'Yes' : 'No'}`,
    `Seminar Assigned: ${profile.seminar_assigned ? 'Yes' : 'No'}`,
  ];

  for (const item of profileItems) {
    page.drawText(`• ${item}`, {
      x: margin + 10,
      y,
      size: 11,
      font: helvetica,
      color: mediumGray,
    });
    y -= 18;
  }

  if (profile.strengths) {
    y -= 5;
    page.drawText(`Strengths: ${profile.strengths}`, {
      x: margin + 10,
      y,
      size: 11,
      font: helvetica,
      color: mediumGray,
    });
    y -= 18;
  }
  y -= 20;

  // Experience Phase Section
  page.drawText(`YOUR PHASE: ${phase.name.toUpperCase()}`, {
    x: margin,
    y,
    size: 14,
    font: helveticaBold,
    color: gold,
  });
  y -= 22;

  page.drawText(phase.description, {
    x: margin,
    y,
    size: 11,
    font: helvetica,
    color: darkGray,
  });
  y -= 25;

  page.drawText(`The ONE Thing: ${phase.one_thing}`, {
    x: margin,
    y,
    size: 11,
    font: helveticaBold,
    color: darkGray,
  });
  y -= 18;

  page.drawText(`Focus: ${phase.focus}`, {
    x: margin + 10,
    y,
    size: 11,
    font: helvetica,
    color: mediumGray,
  });
  y -= 18;

  page.drawText(`Key Metric: ${phase.metric}`, {
    x: margin + 10,
    y,
    size: 11,
    font: helvetica,
    color: mediumGray,
  });
  y -= 35;

  // Review Date
  page.drawRectangle({
    x: margin,
    y: y - 25,
    width: contentWidth,
    height: 35,
    color: rgb(0.97, 0.95, 0.9),
    borderColor: gold,
    borderWidth: 1,
  });

  page.drawText(`30-Day Review Date: ${reviewDate}`, {
    x: margin + 15,
    y: y - 15,
    size: 12,
    font: helveticaBold,
    color: darkGray,
  });
  y -= 60;

  // ====== PAGE 2: Channel Strategy ======
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  y = pageHeight - margin;

  page.drawText('GROWTH CHANNEL STRATEGY', {
    x: margin,
    y,
    size: 18,
    font: helveticaBold,
    color: gold,
  });
  y -= 15;

  page.drawText(`Target: ${profile.monthly_goal} plans/month`, {
    x: margin,
    y,
    size: 12,
    font: helvetica,
    color: mediumGray,
  });
  y -= 30;

  // Channel cards
  for (const channel of channels) {
    // Check if we need a new page
    if (y < 180) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    // Channel header
    page.drawRectangle({
      x: margin,
      y: y - 18,
      width: contentWidth,
      height: 22,
      color: gold,
    });

    page.drawText(`${channel.name} (${channel.allocation}% → ${channel.plans} plans)`, {
      x: margin + 10,
      y: y - 13,
      size: 11,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });
    y -= 28;

    // Channel details
    const details = [
      `Close Rate: ${channel.close_rate}%`,
      `Velocity: ${channel.velocity}`,
      `Weekly Volume: ${channel.weekly_volume}`,
      `Follow-up: ${channel.follow_up}`,
    ];

    for (const detail of details) {
      page.drawText(`• ${detail}`, {
        x: margin + 10,
        y,
        size: 10,
        font: helvetica,
        color: darkGray,
      });
      y -= 15;
    }

    // Rationale
    y -= 3;
    page.drawText(`Why this works for you:`, {
      x: margin + 10,
      y,
      size: 10,
      font: helveticaBold,
      color: mediumGray,
    });
    y -= 14;

    // Word wrap the rationale
    const maxChars = 85;
    let rationale = channel.rationale;
    while (rationale.length > 0) {
      const line = rationale.substring(0, maxChars);
      const lastSpace = line.lastIndexOf(' ');
      const breakPoint = lastSpace > 60 ? lastSpace : maxChars;

      page.drawText(rationale.substring(0, breakPoint), {
        x: margin + 10,
        y,
        size: 10,
        font: helvetica,
        color: mediumGray,
      });
      y -= 14;
      rationale = rationale.substring(breakPoint).trim();
    }

    y -= 20;
  }

  // ====== PAGE 3: Weekly Action Plan ======
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  y = pageHeight - margin;

  page.drawText('WEEKLY ACTION PLAN', {
    x: margin,
    y,
    size: 18,
    font: helveticaBold,
    color: gold,
  });
  y -= 35;

  // Create weekly breakdown
  const weeklyTasks = channels.map(ch => ({
    channel: ch.name,
    task: ch.weekly_volume,
  }));

  page.drawText('Monday - Wednesday: Primary Prospecting', {
    x: margin,
    y,
    size: 12,
    font: helveticaBold,
    color: darkGray,
  });
  y -= 20;

  for (const task of weeklyTasks.slice(0, 2)) {
    page.drawText(`☐ ${task.channel}: ${task.task}`, {
      x: margin + 15,
      y,
      size: 11,
      font: helvetica,
      color: mediumGray,
    });
    y -= 18;
  }
  y -= 15;

  page.drawText('Thursday - Friday: Follow-up & Appointments', {
    x: margin,
    y,
    size: 12,
    font: helveticaBold,
    color: darkGray,
  });
  y -= 20;

  page.drawText('☐ Follow up on all leads from the week', {
    x: margin + 15,
    y,
    size: 11,
    font: helvetica,
    color: mediumGray,
  });
  y -= 18;

  page.drawText('☐ Schedule appointments for next week', {
    x: margin + 15,
    y,
    size: 11,
    font: helvetica,
    color: mediumGray,
  });
  y -= 18;

  page.drawText('☐ Update CRM with all activities', {
    x: margin + 15,
    y,
    size: 11,
    font: helvetica,
    color: mediumGray,
  });
  y -= 30;

  page.drawText('Saturday (Optional): Relationship Building', {
    x: margin,
    y,
    size: 12,
    font: helveticaBold,
    color: darkGray,
  });
  y -= 20;

  page.drawText('☐ Send thank you notes/referral requests', {
    x: margin + 15,
    y,
    size: 11,
    font: helvetica,
    color: mediumGray,
  });
  y -= 18;

  page.drawText('☐ Plan next week\'s activities', {
    x: margin + 15,
    y,
    size: 11,
    font: helvetica,
    color: mediumGray,
  });
  y -= 40;

  // Key metrics to track
  page.drawText('KEY METRICS TO TRACK', {
    x: margin,
    y,
    size: 14,
    font: helveticaBold,
    color: gold,
  });
  y -= 25;

  const metrics = [
    'Leads generated per channel',
    'Contact rate (leads reached / total leads)',
    'Appointment rate (appointments / contacts)',
    'Close rate (sales / appointments)',
    'Average case size',
    'Referrals requested vs received',
  ];

  for (const metric of metrics) {
    page.drawText(`• ${metric}`, {
      x: margin + 10,
      y,
      size: 11,
      font: helvetica,
      color: darkGray,
    });
    y -= 18;
  }
  y -= 30;

  // Footer message
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: lightGray,
  });
  y -= 25;

  page.drawText('This roadmap is a starting point. Track your results, adjust as needed, and', {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: mediumGray,
  });
  y -= 14;

  page.drawText(`review progress with ${profile.manager_name} on ${reviewDate}.`, {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: mediumGray,
  });
  y -= 25;

  page.drawText('Tyler Insurance Group', {
    x: margin,
    y,
    size: 10,
    font: helveticaBold,
    color: gold,
  });

  return pdfDoc.save();
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
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

    // Determine experience phase
    const phase = getExperiencePhase(profile.months_in_business || 0);

    // Generate channel recommendations
    const channels = recommendChannels(profile);

    // Calculate review date (30 days from now)
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + 30);
    const reviewDateStr = reviewDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Generate PDF
    const pdfBytes = await generatePdf(profile, phase, channels, reviewDateStr);

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const safeName = profile.broker_name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Roadmap_${safeName}_${dateStr}.pdf`;

    // Convert to base64
    const base64 = btoa(String.fromCharCode(...pdfBytes));

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
        phase,
        channels,
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
