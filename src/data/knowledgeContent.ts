// ============================================================================
// KNOWLEDGE & UPDATES — newsroom feed content
// ----------------------------------------------------------------------------
// Add items below. They render newest-first, grouped into "This week" /
// "Earlier this month" / older by date, color-striped by category. Mark one
// item `pinned: true` to feature it in the dark banner up top.
//
// While `knowledgeItems` is empty, the page shows an elegant coming-soon
// state — no placeholder content is ever shown.
//
//   category: 'cms' | 'carrier' | 'market' | 'compliance' | 'tig'
//   source:   where it's from, e.g. 'cms.gov', 'Humana', 'KFF', 'TIG'
//   href:     external link (shows ↗) OR an in-app/post route. Optional —
//             omit for a short text-only note (e.g. a compliance reminder).
//   summary:  optional one-line description
// ============================================================================

export type KnowledgeCategory = "cms" | "carrier" | "market" | "compliance" | "tig";

export interface KnowledgeItem {
  id: string;
  title: string;
  category: KnowledgeCategory;
  date: string; // 'YYYY-MM-DD'
  source?: string;
  summary?: string;
  href?: string;
  pinned?: boolean;
}

export const KNOWLEDGE_META: Record<KnowledgeCategory, { label: string; color: string }> = {
  cms: { label: "CMS", color: "#5e7d9e" },
  carrier: { label: "Carrier", color: "#5b7d44" },
  market: { label: "Market", color: "#A8801F" },
  compliance: { label: "Compliance", color: "#b8503f" },
  tig: { label: "TIG Insights", color: "#0E3B2E" },
};

export const knowledgeItems: KnowledgeItem[] = [
  // Example shape (delete the // to use):
  // {
  //   id: "final-rule-2027",
  //   title: "2027 CMS Final Rule: the 5 changes that affect your book",
  //   category: "tig",
  //   date: "2026-06-08",
  //   source: "TIG",
  //   summary: "Plain-English breakdown of marketing rules and AEP talking points.",
  //   href: "https://…",
  //   pinned: true,
  // },
];
