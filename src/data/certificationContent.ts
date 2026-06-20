// ============================================================================
// 2027 CERTIFICATIONS — page content
// ----------------------------------------------------------------------------
// Edit as carrier windows open. Each carrier shows a status pill plus a
// "How-to" PDF and a certification portal link. Leave howToUrl / portalUrl
// empty ('') and those buttons render dimmed/disabled until you add them.
//
//   status: 'not-open'  → amber "Not open yet"
//           'open'      → green "Open now"  (also lights up the portal button)
//   opensLabel: optional, e.g. 'Opens late July' shown next to the pill
// ============================================================================

export const ahip = {
  title: "Complete your AHIP",
  note: "Required before any carrier certification. Score 90% to pass.",
  opensLabel: "Opens June 22",
  url: "https://www.ahipmedicaretraining.com/page/login",
};

export type CertStatus = "open" | "not-open";

export interface CarrierCert {
  id: string;
  name: string;
  color: string; // brand color for the card bar + mark
  status: CertStatus;
  opensLabel?: string; // optional hint, e.g. "Opens late July"
  howToUrl?: string; // PDF on how to certify (leave '' until ready)
  portalUrl?: string; // carrier certification portal (leave '' until ready)
}

// year shown in the page title + card sublabels
export const certYear = 2027;

export const carrierCerts: CarrierCert[] = [
  { id: "uhc", name: "UnitedHealthcare", color: "#002677", status: "not-open", opensLabel: "Kickoff July 8" },
  { id: "humana", name: "Humana", color: "#3A9A34", status: "not-open", opensLabel: "Kickoff July 8" },
  { id: "aetna", name: "Aetna", color: "#7a2f86", status: "not-open", opensLabel: "Kickoff June 23" },
  { id: "anthem", name: "Anthem", color: "#0033A0", status: "not-open", opensLabel: "Kickoff June 30" },
  { id: "wellcare", name: "Wellcare", color: "#007A72", status: "not-open", opensLabel: "Kickoff July 21" },
  { id: "devoted", name: "Devoted Health", color: "#B8292F", status: "not-open", opensLabel: "Kickoff June 23" },
  { id: "cigna", name: "Cigna", color: "#00857C", status: "not-open" },
  { id: "moo", name: "Mutual of Omaha", color: "#004B8D", status: "not-open" },
];
