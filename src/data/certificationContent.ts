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
  details: [
    "First-year agents: we cover your AHIP cost.",
    "Save $50: Pinnacle website > sign in > Agent Dashboard > Certification > AHIP Discounts.",
  ],
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
  {
    id: "uhc",
    name: "UnitedHealthcare",
    color: "#002677",
    status: "open",
    opensLabel: "Available now",
    portalUrl: "https://www.uhcjarvis.com/",
    howTo: [
      "Log in to Jarvis.",
      "On the main dashboard, under 2027 Certifications, click “Get Started Today.”",
      "Click “Launch Learning Center.”",
      "Click “Go to certification page.”",
    ],
  },
  {
    id: "humana",
    name: "Humana",
    color: "#3A9A34",
    status: "open",
    opensLabel: "Available now",
    portalUrl: "https://account.humana.com/",
    howTo: [
      "Log in at account.humana.com with your Vantage login.",
      "Open Humana MarketPoint University (HMU): click the Education card, or click “Get Certified/Recertify” on the Licensing, Certification and Contracts card.",
      "Inside HMU, open your certification course from “View” on the top banner, “Certifications & Courses,” or the drop-down menu.",
    ],
  },
  {
    id: "anthem",
    name: "Anthem",
    color: "#0033A0",
    status: "open",
    opensLabel: "Available now",
    portalUrl: "https://getcertified.elevancehealth.com/",
    howTo: [
      "Go to GetCertified.ElevanceHealth.com and click “Certify with AHIP.”",
      "Sign in and confirm the access code “External-SelfReg” is displayed — if it doesn’t appear, enter it.",
      "Complete AHIP training and all compliance training.",
      "Sign the attestations.",
      "Complete all product training.",
    ],
  },
  {
    id: "wellcare",
    name: "Wellcare",
    color: "#007A72",
    status: "open",
    opensLabel: "Available now",
    portalUrl: "https://www.wellcare.com/Broker-Resources/Broker-Resources",
    howTo: [
      "Log in to the Centene Workbench.",
      "In the left-hand menu, click “Training,” then “Required Training.”",
      "Complete the 2027 Wellcare required training to certify.",
    ],
  },
  { id: "essence", name: "Essence Healthcare", color: "#6B2C91", status: "not-open", opensLabel: "Coming soon" },
];
