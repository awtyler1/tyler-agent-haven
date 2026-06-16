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

const ANDREW = {
  name: 'Andrew Horn',
  title: 'Broker Development · Tyler Insurance Group',
  photo: '/images/founders/andrew-horn.png',
  initials: 'AH',
};

export const articles: Article[] = [
  {
    slug: 'what-a-medicare-fmo-really-does',
    title: 'What a Medicare FMO really does, and how to pick one that grows you',
    category: 'market',
    date: '2026-06-15',
    readTime: '7 min read',
    summary:
      'Your FMO is one of the biggest business decisions you will make, and most agents pick the one whose recruiter called first. Here is what an FMO actually does, how the old model differs from the new one, and what to look for.',
    author: AUSTIN,
    takeaways: [
      'An FMO holds your carrier contracts, pays your commissions, and is supposed to give you the tools, training, and support to grow. You do not pay them. The carrier does.',
      'Old-school FMOs just sign agents and collect overrides. Newer ones reinvest in you. Same cost to you, very different outcome.',
      'Treat picking an FMO like hiring a business partner. Shop a few, and read the release terms before you sign.',
    ],
    whatTitle: 'What an FMO actually is',
    what: [
      { type: 'p', text: 'FMO stands for Field Marketing Organization. In plain terms, it is the company that sits between you and the insurance carriers. It holds the master contracts, gets you appointed to sell, processes your commissions, and is supposed to back you with tools, training, and support.' },
      { type: 'p', text: 'Here is the part most agents miss. You do not pay your FMO. When you write a policy, the carrier pays you your commission, and separately pays the FMO an override, usually somewhere around $100 to $300 a year per enrollment. That override does not come out of your check. It comes from the carrier, on top of what you earn.' },
      { type: 'p', text: 'So nearly every FMO gets paid about the same to have you. The only real question is what they do with that money. That is the whole game.' },
      { type: 'h', text: 'The old-school FMO' },
      { type: 'p', text: 'The traditional model is simple: sign as many agents as possible, collect the overrides, and move on. You get a login and a contract, and after that you are mostly on your own.' },
      { type: 'ul', items: [
        'They recruit hard, then go quiet once you sign.',
        'Support means a help desk that does not know your name.',
        'Little or no real training past licensing and certifications.',
        'They lead with "biggest overrides" instead of how they will help you grow.',
        'Vague or restrictive release terms, so leaving means starting over.',
      ] },
      { type: 'h', text: 'The new FMO' },
      { type: 'p', text: 'A newer FMO treats that override as money to reinvest in you, because they only grow when you do. Same cost to you, completely different experience.' },
      { type: 'ul', items: [
        'The full tech stack at no cost: quoting, enrollment, and a real CRM built for Medicare.',
        'Coaching that goes past AHIP into how to actually build and keep a book.',
        'A real person who knows your name and picks up the phone.',
        'Clear, fair release terms, and your book of business is yours.',
        'They win when you write more, not when they recruit more.',
      ] },
      { type: 'h', text: 'What to look for' },
      { type: 'ul', items: [
        'Carrier access: top contracts with the carriers you need, and fast releases.',
        'Technology: Medicare-specific quoting, enrollment, and CRM, included.',
        'Support: a named person, not a ticket number.',
        'Training: real coaching, not just a certification link.',
        'Marketing and leads: practical help, not just a pep talk.',
        'The fine print: how they make money, whether you can leave, and whether you keep your clients.',
      ] },
    ],
    why: [
      'Your FMO is the foundation your business runs on. It is the tools you sell with, the training you grow with, who answers when you are stuck, and whether you own your book. Get it right and it quietly accelerates everything. Get it wrong and it quietly caps you.',
      'Here is the kicker. Since the override is about the same either way, staying with an FMO that does not help you is leaving money and growth on the table for nothing. There is no prize for loyalty to a login.',
      'Most agents end up with an FMO because a recruiter called first. It deserves a lot more thought than that. It is one of the biggest decisions for your business, so treat it like hiring a partner you will work with for years.',
    ],
    actions: [
      'Audit what you have. List what your FMO actually gives you: tools, training, support, leads. If the honest answer is "a contract," you are overdue to look around.',
      'Shop at least two or three. Compare the technology, the support, the training, and the release terms side by side. The overrides are similar, so make them compete for you.',
      'Read the release language before you sign anything. Know whether you can leave and whether your book comes with you.',
      'Talk to a real person there first. If you cannot get a leader or a founder on the phone before you sign, do not expect it after.',
    ],
    sources: 'Sources: Ritter Insurance Marketing; Spark Advisors; Senior Market Advisors; Pinnacle Financial Services (2026).',
  },
  {
    slug: 'cms-2027-commissions',
    title: 'What the 2027 CMS commission changes mean for you',
    category: 'cms',
    date: '2026-06-11',
    readTime: '6 min read',
    summary:
      'CMS raised what you can get paid in 2027 and loosened the marketing rules right before AEP. Here is the plain version, and what the move really signals for agents.',
    author: ANDREW,
    takeaways: [
      'Your max pay went up again. In most states a new MA enrollment is worth up to $725 for 2027, up from $694.',
      'Part D got the biggest raise: up 14% to $130 for a new member. CMS wants you writing drug plans.',
      'The marketing rules loosened too. The 48 hour wait after a Scope of Appointment is gone.',
    ],
    whatTitle: 'What changed',
    what: [
      { type: 'p', text: 'Every year CMS sets the most a carrier is allowed to pay you for a Medicare Advantage or Part D enrollment. For 2027 those caps went up again, and CMS also changed some of the rules around how and when you can market. Here is the plain version.' },
      { type: 'h', text: 'What you can get paid in 2027' },
      { type: 'ul', items: [
        'Medicare Advantage, most states: up to $725 to enroll a new member (up from $694), and $363 a year to keep them.',
        'Higher-cost states: California and New Jersey are $902 new and $451 renewal. Connecticut, Pennsylvania, and DC are $816 new and $408 renewal.',
        'Part D drug plans: $130 for a new member (up from $114) and $65 renewal. That 14% raise is the biggest jump on the board.',
        'Referral fees did not change: $100 for MA, $25 for Part D.',
      ] },
      { type: 'p', text: 'One thing to keep straight: these are the maximums, not a promise. A carrier can pay all of it, some of it, or none of it. The cap is the ceiling, not your check.' },
      { type: 'h', text: 'What changed with the rules' },
      { type: 'ul', items: [
        'The 48 hour wait between a signed Scope of Appointment and the actual appointment is gone. You can sit down right away.',
        'You can now collect a Scope of Appointment at an educational event.',
        'The 12 hour gap between an educational event and a sales event at the same location is gone, as long as people are told and can leave first.',
        'The required third-party marketing disclaimer now has to be read before you talk about any plan benefits.',
      ] },
      { type: 'p', text: 'The pay changes apply to 2027 enrollments. The marketing changes start October 1, 2026, right before AEP opens.' },
    ],
    why: [
      'More money per sale and less red tape before you can help someone. That is a good setup heading into AEP.',
      'The 14% Part D raise is the real tell. Standalone drug plans have been a headache since the $2,000 out of pocket cap and carriers pulling plans. CMS is paying you more to keep writing them so seniors do not get left without help. If you have been skipping PDPs, 2027 is the year to stop.',
      'Zoom out and the signal is clear. After a few years of CMS tightening the screws on agents, the rules just swung the other way. This CMS wants agents selling, not sidelined.',
    ],
    actions: [
      'Know your real numbers. Ask each carrier what they actually pay for 2027, since the CMS cap is just the ceiling.',
      'Give Part D another look. With a 14% raise and members who genuinely need help, standalone drug plans are worth your time again.',
      'Use the looser timeline, but keep it clean. No 48 hour wait means you can help people faster, but still get your Scope of Appointment, still record, and still document everything.',
      "Mark October 1 on your calendar. The new marketing rules start then, so build your AEP game plan around them, not last year's.",
    ],
    sources: 'Sources: CMS Contract Year 2027 Final Rule and the June 2026 CMS commission memo; Ritter Insurance Marketing and Center for Medicare Advocacy (2026).',
  },
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
