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
  // Real Medicare/holiday anchors. Add your own TIG events, carrier
  // events, deadlines, and OOO as they come up — see the shape above.

  // ── 2027 Certifications ──
  { id: "ahip-2027", date: "2026-06-22", title: "AHIP 2027 launches 🎓", detail: "2027 Medicare training opens", category: "cert" },
  { id: "cert-aetna", date: "2026-06-23", title: "Aetna certs kickoff", detail: "2027 certifications open", category: "cert" },
  { id: "cert-devoted", date: "2026-06-23", title: "Devoted certs kickoff", detail: "2027 certifications open", category: "cert" },
  { id: "cert-anthem", date: "2026-06-30", title: "Anthem certs kickoff", detail: "2027 certifications open", category: "cert" },
  { id: "cert-humana", date: "2026-07-08", title: "Humana certs kickoff", detail: "2027 certifications open", category: "cert" },
  { id: "cert-uhc", date: "2026-07-08", title: "UnitedHealthcare certs kickoff", detail: "2027 certifications open", category: "cert" },
  { id: "cert-wellcare", date: "2026-07-21", title: "Wellcare certs kickoff", detail: "2027 certifications open", category: "cert" },

  // ── Annual Enrollment Period (CMS) ──
  { id: "aep-start", date: "2026-10-15", title: "AEP begins 🔔", category: "deadline" },
  { id: "aep-end", date: "2026-12-07", title: "AEP ends", category: "deadline" },

  // ── Federal holidays ──
  { id: "july4", date: "2026-07-04", title: "Independence Day", category: "holiday" },
  { id: "thanksgiving", date: "2026-11-26", title: "Thanksgiving", category: "holiday" },
  { id: "christmas", date: "2026-12-25", title: "Christmas Day", category: "holiday" },
];
