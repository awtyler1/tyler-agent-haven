// ============================================================================
// TIG AGENT HUB — WEEKLY CONTENT (Board + Dock dashboard)
// ----------------------------------------------------------------------------
// This file is the single source of truth for the hub home page. Edit it
// weekly and redeploy (Vercel auto-deploys from `main`).
//
//   • boardMeta / boardItems → 📌 The Board (deadlines, actions, openings)
//   • dockLinks              → ⚡ the tool dock (always visible row)
//   • hubEvents              → 🗓 Upcoming (past-dated events auto-hide)
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
  postedOn: "2026-06-09", // update when you refresh the board
};

export const boardItems: BoardItem[] = [
  {
    id: "aetna-cert-close",
    kind: "deadline",
    title: "Aetna 2027 certification closes",
    note: "Do it now, the portal gets slow near the deadline",
    when: "Jun 30",
    date: "2026-06-30",
  },
  {
    id: "humana-rts",
    kind: "action",
    title: "Humana RTS attestation due",
    note: "Takes 10 minutes in the Humana portal",
    when: "Jul 5",
    date: "2026-07-05",
  },
  {
    id: "wellcare-open",
    kind: "open",
    title: "Wellcare 2027 certifications",
    note: "Early certifiers get first AEP appointments",
    when: "Open",
    whenSub: "go early",
  },
];

// ── The Dock (tools) ─────────────────────────────────────────────────────────
// href: 'http…' opens in a new tab; '/path' is an in-app route.
export const dockLinks = [
  { label: "SunFire", icon: "⚡", href: "https://www.sunfirematrix.com/app/agent/" },
  { label: "Connecture", icon: "✍️", href: "https://pinnacle7.destinationrx.com/PC/Agent/Account/Login" },
  { label: "BOSS CRM", icon: "👥", href: "https://fmo.kizen.com/login" },
  { label: "AHIP", icon: "🎓", href: "https://www.ahipmedicaretraining.com/" },
  { label: "Carrier portals", icon: "⛨", href: "/carrier-portals" },
  { label: "Forms", icon: "📋", href: "/forms-library" },
];

// ── Upcoming events ──────────────────────────────────────────────────────────
export interface HubEvent {
  id: string;
  title: string;
  date: string; // 'YYYY-MM-DD' — past events auto-hide
  time?: string; // '11:00 AM ET'
  location?: string; // 'Zoom'
}

export const hubEvents: HubEvent[] = [
  {
    id: "monthly-call-jun",
    title: "Monthly Agent Call",
    date: "2026-06-12",
    time: "11:00 AM ET",
    location: "Zoom",
  },
  {
    id: "onboarding-jun",
    title: "New Agent Onboarding",
    date: "2026-06-18",
    time: "1:00 PM ET",
    location: "Zoom",
  },
  {
    id: "aep-webinar",
    title: "AEP Readiness Webinar",
    date: "2026-09-15",
    time: "2:00 PM ET",
    location: "Zoom",
  },
];

// ── New this week ────────────────────────────────────────────────────────────
export interface NewItem {
  id: string;
  category: "Playbook" | "Form" | "CMS" | "Carrier" | "Training" | "Update";
  title: string;
  href?: string; // optional link (in-app route or URL)
}

export const newThisWeek: NewItem[] = [
  { id: "t65-script", category: "Playbook", title: "T65 outreach script that converts" },
  { id: "soa-2027", category: "Form", title: "2027 SOA, updated version", href: "/forms-library" },
  { id: "final-rule", category: "CMS", title: "2027 Final Rule, plain-English recap" },
];

// ── AEP countdown ────────────────────────────────────────────────────────────
// Oct 15 of the current year; flips to "days left in AEP" during Oct 15–Dec 7.
export const aep = {
  startMonth: 10,
  startDay: 15,
  endMonth: 12,
  endDay: 7,
};
