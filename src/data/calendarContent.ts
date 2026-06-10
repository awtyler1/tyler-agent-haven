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

export interface CalEvent {
  id: string;
  date: string;
  title: string;
  detail?: string;
  category: EventCategory;
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
  // ── June 2026 ──
  { id: "call-jun", date: "2026-06-12", title: "Monthly Agent Call", detail: "11:00 AM ET · Zoom", category: "tig" },
  { id: "onboard-jun", date: "2026-06-18", title: "New Agent Onboarding", detail: "1:00 PM ET · Zoom", category: "tig" },
  { id: "juneteenth", date: "2026-06-19", title: "Juneteenth", category: "holiday" },
  { id: "aetna-close", date: "2026-06-30", title: "Aetna 2027 certs close", detail: "Last day — don't wait for the portal rush", category: "deadline" },

  // ── July 2026 ──
  { id: "july4", date: "2026-07-04", title: "Independence Day", category: "holiday" },
  { id: "humana-rts", date: "2026-07-05", title: "Humana RTS attestation due", detail: "10 minutes in the Humana portal", category: "deadline" },
  { id: "call-jul", date: "2026-07-14", title: "Monthly Agent Call", detail: "11:00 AM ET · Zoom", category: "tig" },

  // ── September 2026 ──
  { id: "aep-webinar", date: "2026-09-15", title: "AEP Readiness Webinar", detail: "2:00 PM ET · Zoom", category: "tig" },

  // ── October 2026 ──
  { id: "aep-start", date: "2026-10-15", title: "AEP begins 🔔", category: "deadline" },

  // ── December 2026 ──
  { id: "aep-end", date: "2026-12-07", title: "AEP ends", category: "deadline" },
  { id: "christmas", date: "2026-12-25", title: "Christmas Day", category: "holiday" },
];
