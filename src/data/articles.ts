// ============================================================================
// TIG ARTICLES — full posts rendered with the What / Why / Do template.
// ----------------------------------------------------------------------------
// Add an article here and it (1) gets a page at /knowledge/<slug> and
// (2) shows up automatically in the Knowledge & Updates feed.
//
// Keep to the template's discipline:
//   • takeaways  → 3 one-liners (the whole point in 10 seconds)
//   • what       → flexible blocks: paragraphs, subheads, bullet lists
//   • why        → the broker-impact beat (renders in the dark callout)
//   • actions    → "do this now" steps
// Short sentences. No walls of text. Always answer "so what for my business?"
// ============================================================================

import type { KnowledgeCategory } from './knowledgeContent';

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'ul'; items: string[] };

export interface Article {
  slug: string;
  title: string;
  category: KnowledgeCategory;
  date: string; // 'YYYY-MM-DD'
  readTime: string;
  summary: string; // used in the feed
  author: { name: string; title: string; photo: string; initials: string };
  takeaways: string[];
  whatTitle?: string; // defaults to "What's happening"
  what: Block[];
  why: string[];
  actions: string[];
  sources?: string;
}

const AUSTIN = {
  name: 'Austin Tyler',
  title: 'Broker Development · Tyler Insurance Group',
  photo: '/images/founders/atyler-headshot.jpg',
  initials: 'AT',
};

export const articles: Article[] = [
  {
    slug: 'why-clients-choose-medicare-advantage',
    title: 'Why more of your clients are choosing Medicare Advantage',
    category: 'market',
    date: '2026-06-10',
    readTime: '4 min read',
    summary:
      'MA now covers more than half of all Medicare beneficiaries. Here’s what’s driving the shift, the trade-offs to be honest about, and how to guide clients.',
    author: AUSTIN,
    takeaways: [
      'Medicare Advantage now covers 54% of all beneficiaries, and it’s still growing.',
      'The draw: bundled coverage, extra perks, and $0 premiums for most MAPD members.',
      'The catch: provider networks, less predictable out-of-pocket costs, and switching back to a Med Supp later can be tough.',
    ],
    whatTitle: "What's happening",
    what: [
      { type: 'p', text: 'For years, Original Medicare paired with a Medicare Supplement was called the “Cadillac” of coverage. The market has shifted, and most beneficiaries now drive Medicare Advantage instead.' },
      { type: 'p', text: 'MA has climbed steadily since the early 2000s. As of 2025, 54% of all Medicare beneficiaries were enrolled in an MA plan (KFF), and 2026 is expected to add roughly a million more.' },
      { type: 'p', text: 'Supply is keeping up with demand. There are about 3,373 MA plans for 2026, and the average beneficiary can choose from 39 MA plans, 32 of them MAPD.' },
      { type: 'h', text: 'Why clients like it' },
      { type: 'ul', items: [
        'Bundled coverage. Medical, hospital, and usually drug coverage live in one plan, on one card.',
        'Extra benefits most plans include: dental, vision, hearing, plus perks like gym memberships, OTC allowances, and even home-delivered meals.',
        'Low premiums. 67% of MAPD members paid $0 in 2026 (KFF).',
      ] },
      { type: 'h', text: 'The trade-offs to be honest about' },
      { type: 'ul', items: [
        'Less predictable costs. Copays and coinsurance add up until they hit the plan’s max out-of-pocket ($9,250 for 2026, often lower).',
        'Provider networks. HMO and PPO rules, possible referrals, and their doctor may not be in network.',
        'Hard to reverse. Switching back to a Med Supp later can require medical underwriting outside a guaranteed-issue window.',
      ] },
    ],
    why: [
      'More of your clients are going to ask for MA, so your value isn’t just enrolling them. It’s matching the right client to the right plan and setting honest expectations.',
      'Do that and you build trust and keep your book. Oversell the $0 premium and gloss over networks, and you get AEP churn, complaints, and lost renewals.',
    ],
    actions: [
      'Start with a needs conversation. Doctors, prescriptions, travel, and budget tell you MA vs. Med Supp before you ever quote.',
      'Always walk through the network and the max out-of-pocket before enrolling. No surprises later.',
      'For healthy clients choosing MA now, flag that switching back to a Med Supp may require underwriting.',
      'Lead with 5-star plans where available. They carry the richest extra benefits.',
    ],
    sources: 'Sources: KFF and CMS (2025–2026 data).',
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
