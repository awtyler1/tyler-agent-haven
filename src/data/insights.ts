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

export interface InsightPost {
  slug: string;
  title: string;
  excerpt: string;
  category: InsightCategory;
  author: InsightAuthor;
  date: string; // 'YYYY-MM-DD'
  readTime: string; // e.g. '6 min read'
  image?: string; // cover image URL or /public path
  featured?: boolean; // the big hero card up top (first featured wins)
  members?: boolean; // gated behind the agent login
  articleSlug?: string; // links to the full body in articles.ts
}

// ── Posts (newest first) ─────────────────────────────────────────────────────
export const insights: InsightPost[] = [
  {
    slug: 'why-clients-choose-medicare-advantage',
    title: 'Why more clients are choosing Medicare Advantage in 2027',
    excerpt:
      'The plans changed, the math changed, and the conversation at the kitchen table changed with it. Here is what is actually driving the shift, and how to talk about it honestly.',
    category: 'medicare-101',
    author: AUSTIN,
    date: '2026-06-10',
    readTime: '6 min read',
    image: 'https://loremflickr.com/900/700/senior,couple,smiling?lock=21',
    featured: true,
    articleSlug: 'why-clients-choose-medicare-advantage',
  },
  {
    slug: 'cms-2027-final-rule',
    title: "What CMS's 2027 final rule means for your clients",
    excerpt:
      'The marketing rules tightened again. Here is the plain-English version and the three things worth changing before AEP opens.',
    category: 'industry',
    author: ANDREW,
    date: '2026-06-02',
    readTime: '5 min read',
    image: 'https://loremflickr.com/600/400/government,capitol,washington?lock=22',
  },
  {
    slug: 'inside-the-tig-toolkit',
    title: "Inside how we built TIG's agent toolkit",
    excerpt:
      'SunFire, Connecture, a real CRM, and why we give it all away at no cost to our agents. A look at how we actually back the people who write with us.',
    category: 'agency',
    author: AUSTIN,
    date: '2026-05-19',
    readTime: '4 min read',
    image: 'https://loremflickr.com/600/400/laptop,office,desk?lock=23',
  },
  {
    slug: 't65-outreach-sequence',
    title: 'The exact T-65 outreach sequence we use',
    excerpt:
      'Our week-by-week playbook for turning a birthday list into booked appointments — scripts, timing, and the follow-up cadence.',
    category: 'playbook',
    author: AUSTIN,
    date: '2026-05-28',
    readTime: '8 min read',
    image: 'https://loremflickr.com/600/400/calendar,phone,call?lock=24',
    members: true,
  },
  {
    slug: 'star-ratings-2027',
    title: "Star ratings just moved. Here's who won and lost",
    excerpt:
      'A quick read on the carriers that gained ground for 2027, and what it means at the kitchen table this enrollment.',
    category: 'industry',
    author: ANDREW,
    date: '2026-05-12',
    readTime: '3 min read',
    image: 'https://loremflickr.com/600/400/chart,graph,finance?lock=25',
  },
  {
    slug: 'ma-vs-med-supp-framing',
    title: 'MA vs. Med Supp: how we actually frame it',
    excerpt:
      'No jargon. The honest tradeoffs we walk every client through so they pick the plan that fits their life with confidence.',
    category: 'medicare-101',
    author: AUSTIN,
    date: '2026-05-07',
    readTime: '7 min read',
    image: 'https://loremflickr.com/600/400/doctor,patient,healthcare?lock=26',
  },
  {
    slug: 'appointment-compliance-checklist',
    title: 'Our compliance checklist for every appointment',
    excerpt:
      'SOA, recording, disclaimers, the works. The internal checklist our agents run before, during, and after every appointment.',
    category: 'playbook',
    author: ANDREW,
    date: '2026-04-30',
    readTime: '6 min read',
    image: 'https://loremflickr.com/600/400/checklist,clipboard,document?lock=27',
    members: true,
  },
];

export function getInsight(slug: string): InsightPost | undefined {
  return insights.find((p) => p.slug === slug);
}

export function categoryMeta(key: InsightCategory): InsightCategoryMeta {
  return INSIGHT_CATEGORIES.find((c) => c.key === key) ?? INSIGHT_CATEGORIES[0];
}
