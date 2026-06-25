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
  opensLabel: "Available now",
  url: "https://www.ahipmedicaretraining.com/page/login",
};

export type CertStatus = "open" | "not-open";

export interface CarrierCert {
  id: string;
  name: string;
  color: string; // brand color for the card bar + mark
  status: CertStatus;
  opensLabel?: string; // optional hint, e.g. "Opens late July"
  howTo?: string[]; // inline how-to steps — renders an expandable box (preferred for short flows)
  howToUrl?: string; // OR a PDF on how to certify (used only when howTo is not set)
  portalUrl?: string; // carrier certification portal (leave '' until ready)
}

// year shown in the page title + card sublabels
export const certYear = 2027;

export const carrierCerts: CarrierCert[] = [
  {
    id: "devoted",
    name: "Devoted Health",
    color: "#B8292F",
    status: "open",
    opensLabel: "Available now",
    portalUrl: "https://agent.devoted.com/",
    howTo: [
      "Log in at agent.devoted.com.",
      "On the main page, click “Start RTS Certification Now.”",
    ],
  },
  {
    id: "aetna",
    name: "Aetna",
    color: "#7a2f86",
    status: "open",
    opensLabel: "Available now",
    portalUrl: "https://www.aetna.com/producer_public/login.fcc",
    howTo: [
      "Log in to the Aetna producer portal.",
      "Under 2027 Medicare Certification options, click “Learn about annual Certification.”",
      "Click “Go to Aetna Academy to Certify.”",
      "Under Individual Medicare Certification, click “Start Now.”",
    ],
  },
  { id: "uhc", name: "UnitedHealthcare", color: "#002677", status: "not-open", opensLabel: "Coming soon" },
  { id: "humana", name: "Humana", color: "#3A9A34", status: "not-open", opensLabel: "Coming soon" },
  { id: "anthem", name: "Anthem", color: "#0033A0", status: "not-open", opensLabel: "Coming soon" },
  { id: "wellcare", name: "Wellcare", color: "#007A72", status: "not-open", opensLabel: "Coming soon" },
  { id: "cigna", name: "Cigna", color: "#00857C", status: "not-open", opensLabel: "Coming soon" },
  { id: "moo", name: "Mutual of Omaha", color: "#004B8D", status: "not-open", opensLabel: "Coming soon" },
];
