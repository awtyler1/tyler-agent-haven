// ============================================================================
// TIG LANDING PAGE CONTENT
// ----------------------------------------------------------------------------
// Everything editable on the public landing page lives here. Tweak the copy,
// stats, links, and contacts below and redeploy — no component changes needed.
//
// Link convention used across the page:
//   • starts with "http"  → external link (opens in new tab, shows ↗)
//   • starts with "#"      → smooth-scroll to a section on this page
//   • starts with "/"      → internal app route (e.g. the gated agent hub)
// ============================================================================

export const tig = {
  name: "Tyler Insurance Group",
  short: "TIG",
  tagline: "Independent Medicare FMO",
  // Where "Become a TIG Agent" inquiries should go:
  recruitingEmail: "join@tylerinsurancegroup.com",
};

export const headContracting = {
  name: "Head of Contracting",
  email: "contracting@tylerinsurancegroup.com",
  phone: "", // e.g. "(859) 555-0147" — leave blank to hide
};

// Top-nav anchor links (in-page sections)
export const navLinks = [
  { label: "Why TIG", href: "#why" },
  { label: "Tools", href: "#tools" },
  { label: "Resources", href: "#resources" },
  { label: "Training", href: "#training" },
  { label: "About", href: "#about" },
];

// ── Hero ────────────────────────────────────────────────────────────────────
export const hero = {
  eyebrow: "Independent Medicare FMO",
  // Keep the headline punchy — it's the first thing a prospective agent reads.
  titleLines: ["The FMO built for", "where Medicare is going."],
  subhead:
    "Top carrier access, the best quoting and CRM tech, real training, and a contracting team that actually picks up the phone. Everything you need to grow your book — in one place.",
  primaryCta: { label: "Become a TIG Agent", href: "#join" },
  secondaryCta: { label: "Agent Login", href: "/auth" },
};

// Trust stats under the hero — REPLACE with your real numbers.
export const heroStats = [
  { value: "60+", label: "Carriers" },
  { value: "1,200+", label: "Agents" },
  { value: "15+", label: "Years" },
  { value: "AHIP", label: "Ready" },
];

// Carrier names shown in the trust strip (text only — no logos required).
export const carriers = [
  "UnitedHealthcare",
  "Humana",
  "Aetna",
  "Cigna",
  "Anthem",
  "Wellcare",
  "Devoted Health",
  "Mutual of Omaha",
];

// ── Why TIG (value pillars) ───────────────────────────────────────────────────
export const pillars: { icon: string; title: string; body: string }[] = [
  {
    icon: "shield",
    title: "Top carrier access & comp",
    body: "Direct, competitive contracts with the carriers your clients actually want — with street-level commissions and fast releases.",
  },
  {
    icon: "bolt",
    title: "Tools & technology",
    body: "Quote and enroll in minutes with SunFire and Connecture, and run your whole book from a modern CRM — all at no cost to you.",
  },
  {
    icon: "cap",
    title: "Training & support",
    body: "From Medicare 101 to growing a mature book, plus market updates and CRM walkthroughs. Real people, real answers.",
  },
  {
    icon: "pen",
    title: "Contracting made easy",
    body: "A streamlined onboarding flow and a dedicated contracting team that gets you appointed without the runaround.",
  },
];

// ── Tools we offer ────────────────────────────────────────────────────────────
export const tools: { name: string; desc: string; href: string }[] = [
  {
    name: "SunFire",
    desc: "Real-time MA/PDP quoting, provider & drug lookups, and e-signature enrollment.",
    href: "https://www.sunfirematrix.com/",
  },
  {
    name: "Connecture (DRX)",
    desc: "Side-by-side plan comparison and compliant online enrollment.",
    href: "https://www.connecture.com/",
  },
  {
    name: "BOSS CRM",
    desc: "Track leads, manage clients, and stay on top of every renewal.",
    href: "https://fmo.kizen.com/login",
  },
];

// ── Agent resources ───────────────────────────────────────────────────────────
export const resources: { icon: string; title: string; desc: string; href: string }[] = [
  {
    icon: "phone",
    title: "Carrier contact list",
    desc: "Direct lines, broker support, and portal links for every carrier.",
    href: "/carrier-resources",
  },
  {
    icon: "badge",
    title: "Certifications",
    desc: "Carrier certifications as they open each year — right after AHIP.",
    href: "/contracting-hub",
  },
  {
    icon: "check",
    title: "AHIP info",
    desc: "Everything you need to complete AHIP and get ready to sell.",
    href: "#training",
  },
  {
    icon: "chat",
    title: "Contracting questions",
    desc: "Talk to our head of contracting and get appointed faster.",
    href: "mailto:contracting@tylerinsurancegroup.com",
  },
];

// ── Training & Learning Center ─────────────────────────────────────────────────
export const training = {
  trainingItems: [
    "Medicare 101 for new agents",
    "Growing & retaining your book",
    "CRM walkthroughs & workflows",
    "AHIP & carrier certification prep",
  ],
  learningItems: [
    "Industry insights & analysis",
    "CMS & market updates",
    "Compliance best practices",
    "TIG blog — guides to grow your business",
  ],
};

// ── About ──────────────────────────────────────────────────────────────────────
export const about = {
  heading: "An FMO that feels like a partner, not a pipeline.",
  body: [
    "Tyler Insurance Group is an independent Medicare FMO built around one idea: when our agents grow, we grow. We pair top carrier access and modern technology with the kind of hands-on support you can only get from people who pick up the phone.",
    "Whether you're writing your first plan or running a mature book, we give you the tools, training, and contracting muscle to build something that lasts.",
  ],
};

// ── Closing CTA ──────────────────────────────────────────────────────────────────
export const joinCta = {
  heading: "Ready to grow with TIG?",
  subhead: "Get contracted, get the tools, and get to selling. We'll handle the rest.",
  primaryCta: { label: "Become a TIG Agent", href: "mailto:join@tylerinsurancegroup.com" },
};
