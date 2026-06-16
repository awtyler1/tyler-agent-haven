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
  /** Big right-side label, e.g. 'Jun 30' or 'Open'. */
  when: string;
  /** Optional date used to auto-compute "N days" under `when`. */
  date?: string; // 'YYYY-MM-DD'
  /** Small label under `when` when no date is given, e.g. 'go early'. */
  whenSub?: string;
}

export const boardMeta = {
  postedBy: "Austin & Andrew",
  postedOn: "2026-06-16", // update when you refresh the board
};

// A warm welcome that sits at the top of the Board. Set show:false to hide it
// once the team is settled in.
export const welcome = {
  show: true,
  title: "Welcome to your TIG home base.",
  body:
    "Glad you're here. Everything you need to run your business now lives in one place: your carrier portals, contacts, and docs, your forms, certifications, training, and all your tools. This board up top is where we post what matters most each week, so start here when you log in.",
  sign: "Anything you need, just reach out. We're in it with you. — Austin & Andrew",
};

export const boardItems: BoardItem[] = [
  {
    id: "ahip-2027-launch",
    kind: "action",
    title: "AHIP 2027 training launches",
    note: "Knock it out early — you need AHIP done before any carrier certification",
    when: "Jun 22",
    date: "2026-06-22",
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
