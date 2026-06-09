// ============================================================================
// TIG AGENT HUB — STATIC CONTENT
// ----------------------------------------------------------------------------
// This is the single source of truth for the dashboard's editable content.
// To update what agents see on the home page, edit the arrays below and
// redeploy (Vercel auto-deploys from `main`).
//
//   • hubEvents   → "Upcoming" calendar list
//   • hubUpdates  → "Latest Updates" announcements feed
//   • hubContacts → "Your TIG Team" directory
//
// Dates are ISO strings ('YYYY-MM-DD'). Events with a date in the past are
// automatically hidden from the dashboard.
// ============================================================================

export type EventType = "training" | "deadline" | "enrollment" | "meeting" | "event";

export interface HubEvent {
  id: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  time?: string; // e.g. '2:00 PM ET'
  type: EventType;
  location?: string; // e.g. 'Zoom', 'Lexington Office'
}

export type UpdateCategory =
  | "Announcement"
  | "CMS"
  | "Carrier"
  | "Product"
  | "Compliance";

export interface HubUpdate {
  id: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  category: UpdateCategory;
  excerpt: string;
  url?: string; // optional external link
}

export interface HubContact {
  id: string;
  name: string; // department or person
  role: string; // what they help with
  email?: string;
  phone?: string;
}

// ── Upcoming events ─────────────────────────────────────────────────────────
export const hubEvents: HubEvent[] = [
  {
    id: "monthly-call-jun",
    title: "Monthly Agent Call",
    date: "2026-06-12",
    time: "11:00 AM ET",
    type: "meeting",
    location: "Zoom",
  },
  {
    id: "new-agent-onboarding-jun",
    title: "New Agent Onboarding",
    date: "2026-06-18",
    time: "1:00 PM ET",
    type: "training",
    location: "Zoom",
  },
  {
    id: "2027-certs-open",
    title: "2027 Certifications Open",
    date: "2026-06-25",
    type: "deadline",
  },
  {
    id: "aep-readiness-webinar",
    title: "AEP Readiness Webinar",
    date: "2026-09-15",
    time: "2:00 PM ET",
    type: "training",
    location: "Zoom",
  },
];

// ── Latest updates ──────────────────────────────────────────────────────────
export const hubUpdates: HubUpdate[] = [
  {
    id: "welcome-hub",
    title: "Welcome to the new TIG Agent Hub",
    date: "2026-06-09",
    category: "Announcement",
    excerpt:
      "Your new home base for everything Tyler Insurance Group — calendar, updates, plan info, and contacts all in one place.",
  },
  {
    id: "2027-certs",
    title: "2027 Carrier Certifications Now Open",
    date: "2026-06-05",
    category: "Carrier",
    excerpt:
      "Several carriers have opened 2027 certifications. Get ahead of AEP by completing them early.",
  },
  {
    id: "summer-compliance",
    title: "Summer Compliance Reminder: Marketing Materials",
    date: "2026-05-28",
    category: "Compliance",
    excerpt:
      "A quick refresher on CMS marketing rules before the busy season. Review before distributing any new materials.",
  },
];

// ── Your TIG team ───────────────────────────────────────────────────────────
export const hubContacts: HubContact[] = [
  {
    id: "contracting",
    name: "Contracting & Onboarding",
    role: "Get appointed & set up",
    email: "contracting@tylerinsurancegroup.com",
  },
  {
    id: "commissions",
    name: "Commissions",
    role: "Pay & statements",
    email: "commissions@tylerinsurancegroup.com",
  },
  {
    id: "support",
    name: "Agent Support",
    role: "Day-to-day help",
    email: "support@tylerinsurancegroup.com",
  },
];
