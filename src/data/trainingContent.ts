// ============================================================================
// TRAINING & PLAYBOOKS — content library (Category Rows layout)
// ----------------------------------------------------------------------------
// Add items below and they appear automatically: grouped into rows by
// `category`, in the order categories are listed in `trainingCategories`.
// Mark one item `featured: true` to highlight it in the top banner.
//
// While `trainingItems` is empty, the page shows an elegant "coming soon"
// state — no placeholder content is ever shown.
//
//   type:     'video' | 'article' | 'playbook' | 'case-study'
//   category: must match one of `trainingCategories` (else it won't show)
//   href:     video URL, PDF, or article link (opens in a new tab)
//   duration: e.g. '12 min' for video, '5 min read' for article, 'PDF'
// ============================================================================

export type TrainingType = "video" | "article" | "playbook" | "case-study";

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
  "CRM & Tools",
  "Product Training",
  "Grow Your Business",
  "Case Studies",
];

export const trainingItems: TrainingItem[] = [
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
