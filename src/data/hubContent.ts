// ============================================================================
// TIG AGENT HUB — WEEKLY CONTENT (Board + Dock dashboard)
// ----------------------------------------------------------------------------
// This file is the single source of truth for the hub home page. Edit it
// weekly and redeploy (Vercel auto-deploys from `main`).
//
//   • boardMeta / boardItems → 📌 The Board (deadlines, actions, openings)
//   • dockLinks              → ⚡ the tool dock (always visible row)
//   • events live in src/data/calendarContent.ts (one list feeds the
//     Calendar page AND the hub home's Upcoming card)
//   • newThisWeek            → 🆕 New this week
//
// Dates are 'YYYY-MM-DD'. Keep the board to 3–5 items max — it's a bulletin,
// not a backlog.
// ============================================================================

// ── The Board ────────────────────────────────────────────────────────────────
export type BoardKind = "deadline" | "action" | "open";

export interface BoardItem {
  id: string;
  kind: BoardKind; // deadline = red, action = amber, open = green
  title: string;
  note?: string; // the "why it matters" line under the title
  details?: string[]; // optional bullet points under the note
  /** Big right-side label, e.g. 'Jun 30' or 'Open'. */
  when: string;
  /** Optional date used to auto-compute "N days" under `when`. */
  date?: string; // 'YYYY-MM-DD'
  /** Small label under `when` when no date is given, e.g. 'go early'. */
  whenSub?: string;
  /** Optional join/RSVP URL. Renders as a "Join" button; raw URL is hidden. */
  link?: string;
  /** Label for the link, e.g. 'Join the call'. Defaults to 'Join'. */
  linkLabel?: string;
}

export const boardMeta = {
  postedBy: "Austin & Andrew",
  postedOn: "2026-07-20", // update when you refresh the board
};

// ── Season banner ────────────────────────────────────────────────────────────
// A slim, always-on reminder pinned to the top of the Board. It names the season
// and points to the depth — it does NOT repeat the AHIP/RTS detail (that lives on
// the Certifications page). Flip show:false when cert season winds down.
export const season = {
  show: true,
  emoji: "🎓",
  title: "It's cert season: AHIP, carrier certs, and Ready to Sell.",
  body: "AHIP 2027 is out. Get certified and Ready to Sell before AEP opens Oct 15.",
  ctaLabel: "Go to Certifications",
  ctaHref: "/certifications",
};

// ── Featured highlight ───────────────────────────────────────────────────────
// A single spotlight card that sits directly under the Board on the hub home.
// Use it to surface one thing worth everyone's attention this stretch (a
// research report, a playbook, a big update). Flip show:false to hide it.
// href: '/path' is an in-app route; 'http…' opens in a new tab.
export const featured = {
  show: true,
  eyebrow: "TIG Research",
  title: "The Kentucky Medicare Market Report",
  body:
    "Our original research on the market we sell in: ~900K Kentuckians on Medicare, ~55% in Medicare Advantage, one of the oldest and least-healthy senior populations in the country, and where 2026's disruption (a carrier exit, a new entrant, forced plan changes) opens real room for the prepared agent.",
  ctaLabel: "Read the report",
  ctaHref: "/market-report",
};

// A warm welcome that sits at the top of the Board. Set show:false to hide it
// once the team is settled in.
export const welcome = {
  show: false,
  title: "Welcome to your TIG home base.",
  body:
    "Glad you're here. Everything you need to run your business now lives in one place: your carrier portals, contacts, and docs, your forms, certifications, training, and all your tools. This board up top is where we post what matters most each week, so start here when you log in.",
  sign: "Anything you need, just reach out. We're in it with you. — Austin & Andrew",
};

// Time-sensitive weekly items ONLY (carrier calls, CMS deadlines, new openings).
// Certification is NOT posted here — it lives in the `season` banner above and,
// in full, on the Certifications page. Keep this to what's happening THIS week.
// Example shape:
//   {
//     id: "tig-humana-call",
//     kind: "action",
//     title: "TIG + Humana AEP call, Aug 5 at 11 AM ET",
//     note: "What to expect from Humana this AEP. Block the time, bring questions.",
//     when: "Aug 5",
//     date: "2026-08-05",
//     link: "https://teams.microsoft.com/...",
//     linkLabel: "Join the call",
//   },
export const boardItems: BoardItem[] = [
  {
    id: "aetna-first-look-bid-mechanics",
    kind: "action",
    title: "Aetna First Look + Bid Mechanics, Jul 28 at 10 AM ET",
    note: "This year's First Look adds a Bid Mechanics segment: a behind-the-scenes look at how carriers build and rebuild MAPD plans. Brunch & Learn at the Signature Club of Lansdowne. Seating is limited, so register ahead.",
    when: "Jul 28",
    whenSub: "register now",
    link: "https://AetnaMedicareAgentTraining.com",
    linkLabel: "Register now (seating is limited)",
  },
];

// ── The Dock (tools) ─────────────────────────────────────────────────────────
// href: 'http…' opens in a new tab; '/path' is an in-app route.
export const dockLinks = [
  { label: "Forge CRM", icon: "🔥", href: "https://app.runonforge.us" },
  { label: "SunFire", icon: "⚡", href: "https://www.sunfirematrix.com/app/agent/" },
  { label: "Connecture", icon: "✍️", href: "https://pinnacle7.destinationrx.com/PC/Agent/Account/Login" },
  { label: "BOSS CRM", icon: "👥", href: "https://fmo.kizen.com/login" },
  { label: "AHIP", icon: "🎓", href: "https://www.ahipmedicaretraining.com/" },
  { label: "Carrier portals", icon: "⛨", href: "/carrier-portals" },
  { label: "Forms", icon: "📋", href: "/forms-library" },
];

// ── Events ────────────────────────────────────────────────────────────────────
// All events (TIG, carrier, deadlines, holidays, OOO) live in
// src/data/calendarContent.ts — one list feeds the Calendar page and the
// hub home's "Upcoming" card.

// ── New this week ────────────────────────────────────────────────────────────
export interface NewItem {
  id: string;
  category: "Playbook" | "Form" | "CMS" | "Carrier" | "Training" | "Update";
  title: string;
  href?: string; // optional link (in-app route or URL)
}

export const newThisWeek: NewItem[] = [
  // Add what changed this week. Example shape:
  // { id: "t65-script", category: "Playbook", title: "T65 outreach script that converts" },
  // { id: "soa-2027", category: "Form", title: "2027 SOA (updated)", href: "/forms-library" },
];

// ── AEP countdown ────────────────────────────────────────────────────────────
// Oct 15 of the current year; flips to "days left in AEP" during Oct 15–Dec 7.
export const aep = {
  startMonth: 10,
  startDay: 15,
  endMonth: 12,
  endDay: 7,
};
