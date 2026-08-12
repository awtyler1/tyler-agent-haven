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
  photo: string;
}

export const AUSTIN: InsightAuthor = { name: 'Austin Tyler', initials: 'AT', photo: '/images/founders/atyler-headshot.jpg' };
export const ANDREW: InsightAuthor = { name: 'Andrew Horn', initials: 'AH', photo: '/images/founders/andrew-horn.png' };

// The animated cover graphic for an article.
//
// POLICY: `cover` is OPTIONAL. Leave it off and the article gets a sensible
// default motif for its category (see CATEGORY_COVER below) — no per-article
// art work required. Set an explicit `cover` only for cornerstone pieces you
// want to stand out; those should be unique (a dev-time warning fires if two
// posts set the SAME explicit cover). Category defaults are expected to repeat
// across the long tail and are not warned.
export type CoverMotif =
  | 'rings'   // concentric care rings + cross (health / Medicare basics)
  | 'chart'   // rising trend line (market / industry data)
  | 'bars'    // growth bars (agency / growth)
  | 'lock'    // padlock (members / playbooks)
  | 'coins'   // stacked coins + arrow (money / commissions)
  | 'shield'  // shield + check (FMO / protection / contracts)
  | 'deal'    // consolidation network (acquisition / buying books)
  | 'steps'   // ascending steps + climber (starting from zero / fundamentals)
  | 'deed'    // ownership document + seal (who owns your book)
  | 'flow'    // carrier-to-agent money flow (how commissions work)
  | 'map';    // state map + pin (Kentucky / local commissions)

export interface InsightPost {
  slug: string;
  title: string;
  excerpt: string;
  category: InsightCategory;
  cover?: CoverMotif; // optional; falls back to a category default (see CATEGORY_COVER)
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
    slug: 'medicare-2027-disruption-plan-exits-part-d-premiums',
    title: "Medicare's 2027 shake-up: plan exits, Part D premium hikes, and the star ratings fight",
    excerpt:
      "Humana is exiting plans covering roughly 600,000 members. The Part D subsidy that held premiums down dies January 1. And a federal judge just forced CMS to rebuild the star ratings math. Here is the 2027 disruption map, and why every piece of it favors the prepared agent.",
    category: 'industry',
    author: AUSTIN,
    date: '2026-08-12',
    readTime: '8 min read',
    articleSlug: 'medicare-2027-disruption-plan-exits-part-d-premiums',
  },
  {
    slug: 'medicare-agent-quality-metrics-comp',
    title: 'Carriers are grading your book: the quality metrics that will decide Medicare agent comp',
    excerpt:
      "The volume era of Medicare distribution comp is ending. Carriers are wiring overrides and marketing dollars to quality metrics: complaint rates, HRA completion, rapid disenrollment, provider selection. It starts at the top of the hierarchy, and it rolls downhill. Here are the four numbers to know, and how to protect yours.",
    category: 'industry',
    author: ANDREW,
    date: '2026-08-12',
    readTime: '8 min read',
    articleSlug: 'medicare-agent-quality-metrics-comp',
  },
  {
    slug: 'under-65-market-aca-subsidy-expiration',
    title: 'The under-65 window: ACA subsidy expiration is pushing clients to your desk',
    excerpt:
      "Enhanced ACA subsidies died in December and marketplace enrollment has already fallen by about 3 million. Millions of people are priced out, uninsured, or underinsured, and most agents are ignoring them because they are not 65 yet. Here is the product shelf, the compliance lines, and why this market feeds your Medicare book.",
    category: 'industry',
    author: AUSTIN,
    date: '2026-08-12',
    readTime: '7 min read',
    articleSlug: 'under-65-market-aca-subsidy-expiration',
  },
  {
    slug: 'medicare-marketing-rules-2027',
    title: 'The New Medicare Marketing Rules: What Changes October 1 and How to Rebuild Your Process Around It',
    excerpt:
      'On October 1, the 48-hour Scope of Appointment wait dies, the TPMO disclaimer moves, and the wall between educational and sales events comes down. The rules got looser. The winners will be the agents who redesign their process in September, not the ones who merely know the rules changed.',
    category: 'playbook',
    author: AUSTIN,
    date: '2026-07-29',
    readTime: '7 min read',
    articleSlug: 'medicare-marketing-rules-2027',
  },
  {
    slug: 'part-d-2027-premium-shock',
    title: 'The 2027 Part D Premium Increase: Why It Is Coming and How Agents Get Ahead of It',
    excerpt:
      'CMS is ending the Part D premium stabilization demo after 2026. The subsidy and the cap that held drug plan premiums down for two years are gone, right as the deductible and out-of-pocket cap rise. Here is why the sticker shock is coming, and the September playbook for it.',
    category: 'industry',
    author: ANDREW,
    date: '2026-07-29',
    readTime: '7 min read',
    articleSlug: 'part-d-2027-premium-shock',
  },
  {
    slug: 'who-owns-your-book',
    title: 'Who owns your book of business? A straight answer for Medicare agents',
    excerpt:
      "There is one question that decides whether you are building a business or renting one, and most agents never ask it: if I leave, do my clients come with me? The answer is one word in your contract. Here is how to find it.",
    category: 'agency',
    author: AUSTIN,
    date: '2026-07-14',
    readTime: '7 min read',
    cover: 'deed',
    articleSlug: 'who-owns-your-book',
  },
  {
    slug: 'how-fmo-commissions-work',
    title: 'How Medicare FMO Commissions Work: Street, Override, and Who Pays You',
    excerpt:
      "FMO pay sounds complicated on purpose. Strip it down and the carrier pays in two directions, the override is about the same everywhere, and “we pay the most” is mostly a myth. Here is how the money actually moves.",
    category: 'industry',
    author: ANDREW,
    date: '2026-07-13',
    readTime: '7 min read',
    cover: 'flow',
    articleSlug: 'how-fmo-commissions-work',
  },
  {
    slug: 'kentucky-medicare-commissions-2027',
    title: 'Medicare Agent Commissions in Kentucky: 2026 and 2027 Pay',
    excerpt:
      "Kentucky uses the national CMS commission maximums, and they went up again for 2027. Here are the real numbers for Medicare Advantage, Part D, and Supplement, and why your renewals matter more than any of them.",
    category: 'industry',
    author: AUSTIN,
    date: '2026-07-12',
    readTime: '6 min read',
    cover: 'map',
    articleSlug: 'kentucky-medicare-commissions-2027',
  },
  {
    slug: 'starting-from-zero-again',
    title: 'How to Build a Medicare Agency From Scratch (If I Were Starting From Zero)',
    excerpt:
      "If I lost it all tomorrow and had to rebuild a Medicare agency from nothing, I wouldn't go hunting for a secret. I'd do four boring things, in order, before I let myself get distracted by anything shiny: start a Google Business Profile, get the word out, get around other agents, and make my carrier reps my teachers.",
    category: 'agency',
    author: AUSTIN,
    date: '2026-06-28',
    readTime: '7 min read',
    cover: 'steps',
    articleSlug: 'starting-from-zero-again',
  },
  {
    slug: 'aep-game-plan',
    title: 'Medicare AEP Game Plan: How Agents Prepare for Annual Enrollment',
    excerpt:
      'AEP is still months out, but it should sit in the back of everything you do until then. Here is the five-part game plan: stay in front of clients year-round, know your book cold before September, get into advisor mode now, out-prepare every appointment, and map your outreach before the mail hits.',
    category: 'playbook',
    author: AUSTIN,
    date: '2026-06-24',
    readTime: '6 min read',
    cover: 'lock',
    featured: true,
    articleSlug: 'aep-game-plan',
  },
  {
    slug: 'building-an-asset-not-a-job',
    title: 'Building a Medicare Book of Business: Asset or Just a Job?',
    excerpt:
      'Strip away the tactics and one question sits under everything you do in Medicare. Most agents never ask it. The ones who do build a book they could sell one day, not a pile of applications that churns.',
    category: 'agency',
    author: AUSTIN,
    date: '2026-06-16',
    readTime: '7 min read',
    cover: 'bars',
    articleSlug: 'building-an-asset-not-a-job',
  },
  {
    slug: 'brokers-not-why-medicare-is-confusing',
    title: "Why Is Medicare So Confusing? It's Not the Agents",
    excerpt:
      "MedPAC's new report on how confusing Medicare has become is, almost by accident, one of the best cases for agents we have seen from the government. It also takes a few cheap shots. Here is the honest version.",
    category: 'industry',
    author: AUSTIN,
    date: '2026-06-16',
    readTime: '6 min read',
    cover: 'chart',
    articleSlug: 'brokers-not-why-medicare-is-confusing',
  },
  {
    slug: 'medicare-acquisition-landscape',
    title: "What's a Medicare Book of Business Worth? Why Everyone's Buying",
    excerpt:
      'A retirement wave on one side, hungry buyers on the other. Here is how books are valued today, why so many people are buying them, and what it means for the asset you have built.',
    category: 'industry',
    author: AUSTIN,
    date: '2026-06-16',
    readTime: '7 min read',
    cover: 'deal',
    articleSlug: 'medicare-acquisition-landscape',
  },
  {
    slug: 'what-a-medicare-fmo-really-does',
    title: 'What Is a Medicare FMO, and How Do You Choose One?',
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
    title: '2027 CMS Commission Changes: What They Mean for Medicare Agents',
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

// Default cover motif per category, used when a post does not set an explicit
// `cover`. These are meant to repeat across the long tail.
export const CATEGORY_COVER: Record<InsightCategory, CoverMotif> = {
  'medicare-101': 'rings',
  industry: 'chart',
  agency: 'bars',
  playbook: 'steps',
};

// Resolve the motif to render for a post: its explicit cover, else the category
// default. Use this everywhere instead of reading `post.cover` directly.
export function coverFor(p: Pick<InsightPost, 'cover' | 'category'>): CoverMotif {
  return p.cover ?? CATEGORY_COVER[p.category];
}

// Guardrail: warn (in dev) only if two posts set the SAME *explicit* cover.
// Category-default covers are expected to repeat and are not flagged.
if (import.meta.env?.DEV) {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const p of insights) {
    if (!p.cover) continue;
    if (seen.has(p.cover)) dupes.add(p.cover);
    seen.add(p.cover);
  }
  if (dupes.size) {
    console.warn(
      `[insights] Duplicate explicit cover graphic(s): ${[...dupes].join(', ')}. ` +
        'Give each cornerstone article a unique cover, or drop `cover` to use the category default.',
    );
  }
}
