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
    id: "aep-planning-session-aug21",
    date: "2026-08-18",
    category: "Event",
    title: "Friday Aug 21: AEP Business Planning session with Jeremy Boz and Eric Price",
    note: "1 PM ET on Zoom, for agents and managers across the country. Works straight from the two planning worksheets in the Forms Library. RSVP to Austin; join link is on the calendar and the board.",
    href: "/calendar",
  },
  {
    id: "tig-talks-launch",
    date: "2026-08-18",
    category: "Event",
    title: "TIG Talks: a weekly Tuesday bootcamp with Jay Eldridge, 11 AM ET",
    note: "Carriers, products, cross-selling, providers, marketing, and live mock sales scenarios, every Tuesday through AEP prep. Open to all agents. Register once; dates and the Zoom link are on the calendar.",
    href: "/calendar",
  },
  {
    id: "aetna-2027-trainings",
    date: "2026-08-18",
    category: "Carrier",
    title: "Aetna 2027 trainings: five September sessions across Kentucky, pick one",
    note: "Lexington Sept 10 or 22, Prestonsburg Sept 15, Ashland Sept 17, Somerset Sept 24. All 10 AM to noon, brunch provided. Register at AetnaMedicareAgentTraining.com; dates are on the calendar.",
    href: "/calendar",
  },
  {
    id: "quality-scorecard-triage-onepagers",
    date: "2026-08-12",
    category: "Form",
    title: "Two new one-pagers: Agent Quality Scorecard + 2027 Client Triage Checklist",
    note: "Print both. The scorecard covers the four metrics carriers now grade; the checklist is your September playbook for plan exits and Part D premium jumps. They pair with today's three market articles.",
    href: "/forms-library",
  },
  {
    id: "aep-business-plan-docs",
    date: "2026-08-11",
    category: "Form",
    title: "Your AEP business plan: two new printables in the Forms Library",
    note: "Start with the Top 20 Activities idea sheet, pick 4 to 6, then set your goal and weekly targets on the one-page AEP Business Plan and review it with your manager.",
    href: "/forms-library",
  },
  {
    id: "cms-l564-added",
    date: "2026-08-03",
    category: "Form",
    title: "New form: CMS-L564, Request for Employment Information",
    note: "The proof-of-employer-coverage form for Part B Special Enrollment. Pairs with the CMS-40B, both now in the Forms Library.",
    href: "/forms-library",
  },
  {
    id: "devoted-rollout-2027-lexington",
    date: "2026-08-03",
    category: "Carrier",
    title: "Devoted Broker Rollout 2027: four sessions, pick your city and date",
    note: "Louisville Aug 25 or Sept 24, Lexington Aug 27 or Sept 23, all at CenterWell Senior Primary Care. Registration links are on the calendar.",
    href: "/calendar",
  },
  {
    id: "humana-pre-aep-webinar",
    date: "2026-08-03",
    category: "Carrier",
    title: "Humana Pre-AEP Webinar: Aug 19 at 10 AM ET, register now",
    note: "A quick virtual session on Humana's 2027 rollout schedule and AEP resources. Registration link is on the calendar.",
    href: "/calendar",
  },
  {
    id: "humana-2027-dates",
    date: "2026-07-30",
    category: "Carrier",
    title: "Humana 2027: First Look Aug 14, rollouts Sept 16 (Louisville) and 17 (Lexington)",
    note: "From today's call with Samantha Stevenson. Order materials by Aug 14 for Sept 30 delivery, and 2027 certification is open now. All on the calendar.",
    href: "/calendar",
  },
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
