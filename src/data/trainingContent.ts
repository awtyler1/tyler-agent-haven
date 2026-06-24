// ============================================================================
// TRAINING & PLAYBOOKS — content library (Tabbed library layout)
// ----------------------------------------------------------------------------
// Add items below and they appear automatically. The page groups them into
// filter tabs by `type` (One-Pagers, Videos, Playbooks, …) with a search box.
//
// While `trainingItems` is empty, the page shows an elegant "coming soon"
// state — no placeholder content is ever shown.
//
//   type:     'guide' | 'video' | 'article' | 'playbook' | 'case-study'
//             ('guide' = a one-page PDF reference you can hand a client)
//   category: a short topic label shown on the card, e.g. 'Client Education'
//   href:     video URL, PDF, or article link (opens in a new tab)
//   duration: e.g. '12 min' for video, '5 min read' for article, 'PDF'
//   featured: optional — pins the item first within its tab
//   isNew:    optional — shows a gold "New" badge on the card
// ============================================================================

export type TrainingType = "guide" | "video" | "article" | "playbook" | "case-study";

export interface TrainingItem {
  id: string;
  title: string;
  type: TrainingType;
  category: string;
  href: string;
  duration?: string;
  blurb?: string; // only used by the featured banner
  featured?: boolean;
  isNew?: boolean;
}

// Row order. Add/rename categories here; rows render in this order.
export const trainingCategories: string[] = [
  "Client Education",
  "CRM & Tools",
  "Product Training",
  "Grow Your Business",
  "Case Studies",
];

export const trainingItems: TrainingItem[] = [
  {
    id: "aep-prep-checklist",
    title: "AEP Prep Checklist",
    type: "playbook",
    category: "Grow Your Business",
    href: "/forms/aep-prep-checklist.pdf",
    duration: "PDF",
    blurb: "The action checklist behind “The AEP Game Plan” — work it from now through September.",
    isNew: true,
  },
  {
    id: "ma-vs-medsupp",
    title: "Medicare Advantage vs. Medicare Supplement",
    type: "guide",
    category: "Client Education",
    href: "/forms/ma-vs-med-supp-comparison.pdf",
    duration: "1 page",
    blurb: "A clean one-pager that lays the two paths side by side, with examples and the questions to ask when helping a client choose.",
    isNew: true,
  },
  {
    id: "ma-explained",
    title: "Medicare Advantage, made simple",
    type: "guide",
    category: "Client Education",
    href: "/forms/medicare-advantage-guide.pdf",
    duration: "1 page",
    blurb: "How a Part C (MAPD) plan works with Original Medicare, with the key terms defined for someone brand new to it.",
    isNew: true,
  },
  {
    id: "medsupp-explained",
    title: "Medicare Supplement: Plan G vs. Plan N",
    type: "guide",
    category: "Client Education",
    href: "/forms/medicare-supplement-guide.pdf",
    duration: "1 page",
    blurb: "How Medigap fills the gaps in Original Medicare, plus a side-by-side of Plan G and Plan N.",
    isNew: true,
  },
  // Example shape (delete the // to use):
  // {
  //   id: "forge-onboarding",
  //   title: "Forge CRM: Your first 30 minutes",
  //   type: "video",
  //   category: "CRM & Tools",
  //   href: "https://…",
  //   duration: "18 min",
  //   blurb: "Set up your pipeline and never lose a renewal.",
  //   featured: true,
  //   isNew: true,
  // },
];
