// ============================================================================
// TIG CALENDAR — single source of truth for all events.
// ----------------------------------------------------------------------------
// The Calendar page AND the hub home's "Upcoming" card both read from here,
// so you only ever update one list. Edit + redeploy.
//
//   • date     'YYYY-MM-DD'
//   • title    short — it renders as a chip in a calendar cell
//   • detail   optional sub-line, e.g. "11:00 AM ET · Zoom" (shows on the
//              hub home card; calendar shows it as a tooltip)
//   • category colors the chip:
//       deadline → red      cert → gold       tig → green
//       carrier  → steel    holiday → gray    ooo → purple (dashed)
//
// Multi-day spans (e.g. someone out Mon–Wed): add one entry per day.
// ============================================================================

export type EventCategory = "deadline" | "cert" | "tig" | "carrier" | "holiday" | "ooo";

/** A document tied to an event — prep material, or slides/notes in a recap. */
export interface CalEventDoc {
  name: string;
  url: string;
}

/** Post-event recap, shown in the popout after the meeting happens. */
export interface CalEventRecap {
  summary?: string; // a short "here's what it was about" paragraph
  points?: string[]; // key takeaways / action items
  documents?: CalEventDoc[]; // slides, notes, or handouts from the meeting
}

export interface CalEvent {
  id: string;
  date: string;
  title: string;
  detail?: string;
  category: EventCategory;
  // ── Detail popout (shown when an event is clicked on the Calendar) ──
  // Every event opens the same layout: Title, Description, Location, Time,
  // and any documents to review beforehand. Fill what applies; empty fields
  // are simply skipped, and Documents shows a "nothing to review" note.
  /** Full description shown in the popout (falls back to `detail`). */
  description?: string;
  /** Where it happens, e.g. "Microsoft Teams" or a street address. */
  location?: string;
  /** When it happens, e.g. "11:00 AM ET". */
  time?: string;
  /** Docs/links an agent should review before the meeting. */
  documents?: CalEventDoc[];
  /** Post-event recap. When set, the popout shows a "Recap" section and the
   *  calendar chip gets a 📝 marker so agents know a recap is available. */
  recap?: CalEventRecap;
  /** Optional join/RSVP URL. Renders as a button inside the popout. The
   *  raw URL is never shown. */
  link?: string;
  /** Label for the link, e.g. "Join the call". Defaults to "Join". */
  linkLabel?: string;
}

export const CATEGORY_META: Record<EventCategory, { label: string; color: string; dashed?: boolean }> = {
  deadline: { label: "Deadline", color: "#b8503f" },
  cert: { label: "Certifications", color: "#A8801F" },
  tig: { label: "TIG event", color: "#5b7d44" },
  carrier: { label: "Carrier event", color: "#5e7d9e" },
  holiday: { label: "Holiday", color: "#8a8273" },
  ooo: { label: "Team out of office", color: "#a08bb0", dashed: true },
};

export const calendarEvents: CalEvent[] = [
  // Real Medicare/holiday anchors. Add your own TIG events, carrier
  // events, deadlines, and OOO as they come up — see the shape above.

  // ── TIG events ──
  {
    id: "tig-aetna-aep-call",
    date: "2026-07-08",
    title: "TIG + Aetna AEP Call ⭐",
    detail: "11:00 AM ET · Microsoft Teams · What to expect from Aetna for AEP and next year. Don't miss this one.",
    description:
      "The Tyler team sits down with Aetna to walk through what to expect for AEP and the year ahead — plan changes, market moves, and how to position Aetna with your clients. One of the most important calls before the season, so make it if you can.",
    location: "Microsoft Teams",
    time: "11:00 AM ET",
    category: "tig",
    link: "https://teams.microsoft.com/meet/219912569776466?p=C3AZ6F6PvcIUqnwECm",
    linkLabel: "Join the call",
    recap: {
      summary:
        "Today's call was mostly a certification push — get your Aetna certification done — plus a heads-up to watch for first looks coming in late July.",
      points: [
        "Get certified now: Aetna's certification runs through the Aetna Academy online platform. They've also moved contracting over to Aetna Academy.",
        "First looks are coming late July — be on the lookout.",
        "Save the date: Aetna First Looks is Tuesday, July 28 at 10:00 AM at the Signature Club (also added to the calendar).",
        "New Aetna contact: Stefni Powell, Medicare Account Manager — (502) 658-3652, Stefni.Powell@aetna.com.",
      ],
    },
  },
  {
    id: "tig-uhc-call",
    date: "2026-07-15",
    title: "TIG + UHC Call (Mark Reeder)",
    detail: "11:00 AM ET · Microsoft Teams · Tyler Team + UHC with Mark Reeder.",
    description:
      "The Tyler team meets with UnitedHealthcare's Mark Reeder to cover UHC's AEP outlook, product updates, and what's changing for the coming year. Bring your questions.",
    location: "Microsoft Teams",
    time: "11:00 AM ET",
    category: "tig",
    link: "https://teams.microsoft.com/meet/262872777073942?p=vc3uuzfmDgMxC2zAJQ",
    linkLabel: "Join the call",
  },
  {
    id: "tig-devoted-call",
    date: "2026-07-22",
    title: "TIG + Devoted Call (Hailey Lindenbauer)",
    detail: "11:00 AM ET · Microsoft Teams · Tyler Team + Devoted with Hailey Lindenbauer.",
    description:
      "The Tyler team meets with Devoted's Hailey Lindenbauer for a look at Devoted's plans, AEP outlook, and updates for the year ahead.",
    location: "Microsoft Teams",
    time: "11:00 AM ET",
    category: "tig",
    link: "https://teams.microsoft.com/meet/23718475518502?p=kvWc3NPMJ7CYzBp5mU",
    linkLabel: "Join the call",
  },
  {
    id: "aetna-first-looks",
    date: "2026-07-28",
    title: "Aetna First Look + Bid Mechanics 👀",
    detail: "10:00 AM–12:00 PM ET · Signature Club of Lansdowne · Register ahead, seating is limited.",
    description:
      "Aetna's First Look at Benefits, now with a new Bid Mechanics segment built for the broker community. Bid Mechanics gives you a behind-the-scenes look at how carriers build and rebuild MAPD plans, and why they make the decisions they do based on funding, STAR ratings, the bidding process, and the dynamics of pricing insurance. You'll see how the trade-offs get made between must-have and nice-to-have benefits, how cost constraints play in, and how benefits get prioritized around member needs, competition, and CMS funding. Expect to walk away with a deeper appreciation for the strategy behind plan design, plus talking points to guide your clients with confidence. This is a Brunch & Learn session. Seating is limited, so please register ahead of time at AetnaMedicareAgentTraining.com.",
    location: "The Signature Club of Lansdowne · 3256 Lansdowne Dr., Lexington, KY 40502",
    time: "10:00 AM–12:00 PM ET",
    category: "carrier",
    link: "https://AetnaMedicareAgentTraining.com",
    linkLabel: "Register now (seating is limited)",
  },
  {
    id: "tig-team-night-aep-kickoff",
    date: "2026-08-06",
    title: "TIG Team Night 🍕",
    detail: "6:00 PM · Goodfellas Distillery (Distillery District) · Team hang before AEP prep — pizza, then we walk the district.",
    description:
      "A team get-together before we dive into AEP prep and the AEP push. We'll meet up for pizza at Goodfellas, then walk to a few more spots around the Distillery District. Come kick off the season with the team.",
    location: "Goodfellas Distillery · 1228 Manchester St, Lexington, KY 40504 (Distillery District)",
    time: "6:00 PM ET",
    category: "tig",
  },

  // ── 2027 Certifications ──
  {
    id: "ahip-2027",
    date: "2026-06-22",
    title: "AHIP 2027 launches 🎓",
    detail: "2027 Medicare training opens",
    description:
      "2027 AHIP Medicare training opens. AHIP is required before you can certify with any carrier for 2027, so knock it out early to stay ahead of the carrier windows.",
    time: "Available now",
    category: "cert",
  },

  // ── Annual Enrollment Period (CMS) ──
  {
    id: "aep-start",
    date: "2026-10-15",
    title: "AEP begins 🔔",
    description:
      "The Medicare Annual Enrollment Period opens. Beneficiaries can enroll in or change Medicare Advantage and Part D plans through December 7.",
    category: "deadline",
  },
  {
    id: "aep-end",
    date: "2026-12-07",
    title: "AEP ends",
    description:
      "Last day of the Medicare Annual Enrollment Period. Changes made today take effect January 1.",
    category: "deadline",
  },

  // ── Federal holidays ──
  { id: "july4", date: "2026-07-04", title: "Independence Day", description: "Federal holiday.", category: "holiday" },
  { id: "thanksgiving", date: "2026-11-26", title: "Thanksgiving", description: "Federal holiday.", category: "holiday" },
  { id: "christmas", date: "2026-12-25", title: "Christmas Day", description: "Federal holiday.", category: "holiday" },
];
