// ============================================================================
// TIG INSIGHTS — the public blog / articles feed (SEO + marketing).
// ----------------------------------------------------------------------------
// This file is the single place to manage what shows on /insights.
// Add a post object below and it appears on the page automatically.
//
//   • Public posts  → readable by anyone at /insights/<slug>
//   • Members posts → set members:true; the card shows a lock and routes to
//                     /auth (the shared agent login) instead of opening.
//
// FULL ARTICLE BODY:
//   The card here is just the teaser. The full write-up lives in
//   src/data/articles.ts (the What / Why / Do template). Set `articleSlug`
//   to the matching article slug to wire the card to its full page.
//   Posts without an `articleSlug` show a graceful "coming soon" reader.
//
// COVERS:
//   Card covers are generated automatically from the post's `category` as an
//   on-brand animated graphic (see InsightCover in InsightsPage). No stock
//   photos. The optional `image` field is currently unused and kept only for
//   a possible future "real photo" option.
// ============================================================================

export type InsightCategory = 'medicare-101' | 'industry' | 'agency' | 'playbook';

export interface InsightCategoryMeta {
  key: InsightCategory;
  label: string; // shown on the card kicker
  filter: string; // shown on the filter chip
}

// Order here is the order the filter chips render in.
export const INSIGHT_CATEGORIES: InsightCategoryMeta[] = [
  { key: 'medicare-101', label: 'Medicare 101', filter: 'Medicare 101' },
  { key: 'industry', label: 'Industry Updates', filter: 'Industry Updates' },
  { key: 'agency', label: 'Agency News', filter: 'Agency News' },
  { key: 'playbook', label: 'Agent Playbooks', filter: 'Agent Playbooks' },
];

export interface InsightAuthor {
  name: string;
  initials: string;
}

export const AUSTIN: InsightAuthor = { name: 'Austin Tyler', initials: 'AT' };
export const ANDREW: InsightAuthor = { name: 'Andrew Horn', initials: 'AH' };

// The animated cover graphic for an article. RULE: every article gets a unique
// cover. Never reuse the same motif on two articles. Add a new motif to
// InsightCover (in InsightsPage) before you run out. A dev-time console warning
// fires below if two posts ever share one.
export type CoverMotif =
  | 'rings'   // concentric care rings + cross (health / Medicare basics)
  | 'chart'   // rising trend line (market / industry data)
  | 'bars'    // growth bars (agency / growth)
  | 'lock'    // padlock (members / playbooks)
  | 'coins'   // stacked coins + arrow (money / commissions)
  | 'shield'  // shield + check (FMO / protection / contracts)
  | 'deal';   // consolidation network (acquisition / buying books)

export interface InsightPost {
  slug: string;
  title: string;
  excerpt: string;
  category: InsightCategory;
  cover: CoverMotif; // unique per article — see rule above
  author: InsightAuthor;
  date: string; // 'YYYY-MM-DD'
  readTime: string; // e.g. '6 min read'
  image?: string; // cover image URL or /public path (unused; covers are generated)
  featured?: boolean; // the big hero card up top (first featured wins)
  members?: boolean; // gated behind the agent login
  articleSlug?: string; // links to the full body in articles.ts
}

// ── Posts (newest first) ─────────────────────────────────────────────────────
export const insights: InsightPost[] = [
  {
    slug: 'medicare-acquisition-landscape',
    title: 'Why everyone is buying Medicare books right now',
    excerpt:
      'A retirement wave on one side, hungry buyers on the other. Here is how books are valued today, why so many people are buying them, and what it means for the asset you have built.',
    category: 'industry',
    author: AUSTIN,
    date: '2026-06-16',
    readTime: '7 min read',
    cover: 'deal',
    featured: true,
    articleSlug: 'medicare-acquisition-landscape',
  },
  {
    slug: 'what-a-medicare-fmo-really-does',
    title: 'What a Medicare FMO really does, and how to pick one that grows you',
    excerpt:
      'Your FMO is one of the biggest business decisions you will make, and most agents pick the one whose recruiter called first. Here is what an FMO actually does, old model versus new, and what to look for.',
    category: 'industry',
    author: AUSTIN,
    date: '2026-06-15',
    readTime: '7 min read',
    cover: 'shield',
    articleSlug: 'what-a-medicare-fmo-really-does',
  },
  {
    slug: 'cms-2027-commissions',
    title: 'What the 2027 CMS commission changes mean for you',
    excerpt:
      'CMS just raised what you can get paid in 2027 and loosened the marketing rules right before AEP. Here is the plain version, and what the move really signals.',
    category: 'industry',
    author: ANDREW,
    date: '2026-06-11',
    readTime: '6 min read',
    cover: 'coins',
    articleSlug: 'cms-2027-commissions',
  },
  {
    slug: 'why-clients-choose-medicare-advantage',
    title: 'Why more clients are choosing Medicare Advantage in 2027',
    excerpt:
      'The plans changed, the math changed, and the conversation at the kitchen table changed with it. Here is what is actually driving the shift, and how to talk about it honestly.',
    category: 'medicare-101',
    author: AUSTIN,
    date: '2026-06-10',
    readTime: '6 min read',
    cover: 'rings',
    articleSlug: 'why-clients-choose-medicare-advantage',
  },
];

export function getInsight(slug: string): InsightPost | undefined {
  return insights.find((p) => p.slug === slug);
}

export function categoryMeta(key: InsightCategory): InsightCategoryMeta {
  return INSIGHT_CATEGORIES.find((c) => c.key === key) ?? INSIGHT_CATEGORIES[0];
}

// Guardrail: warn (in dev) if any two articles reuse the same cover graphic.
if (import.meta.env?.DEV) {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const p of insights) {
    if (seen.has(p.cover)) dupes.add(p.cover);
    seen.add(p.cover);
  }
  if (dupes.size) {
    console.warn(
      `[insights] Duplicate cover graphic(s) in use: ${[...dupes].join(', ')}. ` +
        'Give each article a unique cover (see CoverMotif in src/data/insights.ts).',
    );
  }
}
