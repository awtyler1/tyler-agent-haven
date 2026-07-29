// ============================================================================
// WHAT'S NEW — the running notification log
// ----------------------------------------------------------------------------
// One dated entry per announcement: a new form, a feature, carrier news, event
// dates, anything worth an agent's "did I miss something?" check. The hub's
// bell reads this file (plus recently published articles) and shows a gold
// count of what each browser hasn't seen yet.
//
// Rules of the road (see HOMESTEAD.md § 14):
//   • Needs action by a date → it's a Board/calendar item, not a notification.
//   • Reading material       → it's an article (Worth reading), it auto-joins
//     this feed, so don't add it here twice.
//   • Everything else new    → add ONE entry here. Newest first is handled by
//     sorting, so append anywhere; keep this file forever, it's the log.
//
// Dates are 'YYYY-MM-DD'. href: '/path' is in-app; 'http…' opens a new tab.
// ============================================================================

export type WhatsNewCategory = "Form" | "Feature" | "Event" | "Carrier" | "CMS" | "Update";

export interface WhatsNewItem {
  id: string;
  date: string; // 'YYYY-MM-DD' — the day it was posted/added
  category: WhatsNewCategory;
  title: string;
  /** Optional one-liner under the title: the "why you care." */
  note?: string;
  /** Optional link (in-app route or URL). */
  href?: string;
}

export const whatsNew: WhatsNewItem[] = [
  {
    id: "team-night-two-nights",
    date: "2026-07-29",
    category: "Event",
    title: "Team Night is now two nights: Lexington Aug 6, Louisville Aug 13",
    note: "We split the get-together so nobody has a long drive. Come to whichever is closer. RSVP by email to Austin or Andrew by Mon, Aug 3.",
    href: "/calendar",
  },
  {
    id: "uhc-2027-overview-dates",
    date: "2026-07-22",
    category: "Carrier",
    title: "UHC 2027 Product Overview: save the dates",
    note: "Four sessions: Lexington Sept 1, Owensboro Sept 8, virtual Sept 22 and 24. Registration required; watch for the invitation.",
    href: "/calendar",
  },
  {
    id: "humana-stevenson-call-added",
    date: "2026-07-22",
    category: "Event",
    title: "New team call: Humana's Samantha Stevenson, Jul 30",
    note: "Humana market position and what makes a great Medicare broker. Join link is on the board and the calendar.",
    href: "/calendar",
  },
  {
    id: "ahip-reviews-added",
    date: "2026-07-22",
    category: "Feature",
    title: "AHIP exam prep is on the Certifications page",
    note: "Review questions for all 5 modules plus the Full Final Review, ready to study or download.",
    href: "/certifications",
  },
];
