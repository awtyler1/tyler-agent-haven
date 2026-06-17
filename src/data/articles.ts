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
    slug: 'building-an-asset-not-a-job',
    title: 'Are you building an asset or renting a job?',
    category: 'market',
    date: '2026-06-16',
    readTime: '7 min read',
    summary:
      'Strip away the tactics and one question sits under everything you do in Medicare. Most agents never ask it. The ones who do build a book they could sell one day, not a pile of applications that churns.',
    author: AUSTIN,
    takeaways: [
      'Every move you make either builds an asset that compounds and could sell one day, or rents you a job that pays once and churns out.',
      'Volume from bought leads and gimmicks feels like progress, but the economics never worked, and now compliance and carriers punish it.',
      'The agents who win obsess over the boring fundamentals early: a niche, real trust, and relationships they actually keep.',
    ],
    whatTitle: 'The question under every decision',
    what: [
      { type: 'p', text: 'An asset compounds. It renews every year, it grows while you sleep, and one day someone will pay you for it. A job pays you once for the work, and the moment you stop feeding it, it stops. Almost every choice in this business is that choice in disguise. In Medicare, the line runs straight between a book of business and a pile of applications.' },
      { type: 'h', text: 'A book renews. A pile resets.' },
      { type: 'p', text: 'A book of business is people who chose you on purpose. They know your name, they call you first, and they stay. A pile of applications is people a gimmick chose for you: a free gift card, a giveaway, a lead vendor\'s promise. They came for the bait, not for you, so they leave the same way.' },
      { type: 'p', text: 'Here is the simple tell. If your clients would follow you to a different carrier or a different shop, you have a book. If they would vanish the second the gift card dried up, you have a pile.' },
      { type: 'h', text: 'Volume is a trap dressed up as progress' },
      { type: 'p', text: 'The buy-leads-and-burn approach usually comes straight out of the W2 call center, because for a lot of agents it is the only model they have ever seen. The problem is the call centers running it keep laying people off, not because those agents are lazy, but because the math does not close. You cannot out-dial bad economics, and a solo agent has even less room to absorb it than a call center does.' },
      { type: 'p', text: 'And the window on getting away with it has closed. Compliance has teeth now. Carriers want clean, sticky business and are squeezing out the application-stackers. The shortcut became the slow way.' },
      { type: 'h', text: "You can't skip time, but you can spend it well" },
      { type: 'p', text: 'Nobody starts knowing the products, the compliance, the sales, the marketing, and the economics all at once. That is not a knock, it is just the size of the thing. The agents who look like naturals almost never were. They were obsessive in years one and two, and what looks like talent now is really reps that hardened into habits.' },
      { type: 'p', text: 'So no, you cannot fake time. But you can decide how you spend it. Treat every conversation and every new skill as one brick. Stack enough real bricks and you look up in a couple of years standing on a wall nobody can knock down.' },
      { type: 'h', text: "People don't buy a logo. They buy you." },
      { type: 'p', text: 'Early on, your company name barely matters. Nobody is choosing "Senior Solutions Group" off a billboard. They are choosing the person who finally explained their drug plan in a way that made sense. A literal name like "Cincinnati Medicare" might catch some search traffic, fine, take it. But the thing that actually grows is trust in you. You are the brand. Build that first.' },
      { type: 'h', text: 'Go smaller than feels comfortable' },
      { type: 'p', text: 'The instinct is to market to everyone on Medicare. The edge is the opposite: pick a corner and own it.' },
      { type: 'ul', items: [
        'Veterans sorting out how Medicare works alongside their VA coverage.',
        'Teachers and their specific retirement setups.',
        'Railroad retirees, who play by entirely different Social Security and retirement rules.',
        'People who just want straight answers on Social Security timing, which almost no one does well.',
      ] },
      { type: 'p', text: 'Win their trust on the narrow thing first, then bring them into Medicare. A small pond where you are the obvious expert beats an ocean where you are a stranger.' },
      { type: 'h', text: 'Earn the attention before you ask for the sale' },
      { type: 'p', text: 'Whatever you put out, an ad, a post, a kitchen-table talk, it should do one of two things: teach them something or be worth their time. That is the whole bar. Be useful, be a little enjoyable, and be someone people genuinely like. You do not need to be the loudest person in the room. You need to be the one they trust enough to call.' },
      { type: 'h', text: 'Where bought leads quietly hurt you' },
      { type: 'p', text: 'Buying leads is not a sin. Buying them before you understand them is. If you are going to spend, know exactly what those people were told. If the ad never mentioned Medicare or health coverage, the lead and your product do not match, and you will feel it. If you cannot verify the marketing, assume the worst. And if the hook was a free gift card or a giveaway, pass. That is not a lead, it is a future complaint with your name on it.' },
      { type: 'h', text: 'Own the relationship, not just the application' },
      { type: 'p', text: 'The sale is the start of the relationship, not the end of it. Build a place to keep your people: an email list, a newsletter, maybe a group where they can ask questions. Capture the right contact info while you have it, emails and cell numbers, and skip the house phones that keep getting disconnected. Then use a real CRM to stay in touch with reminders, check-ins, and a quick text when something changes. Staying in front of your clients is how a one-time sale becomes a renewal you can count on.' },
    ],
    why: [
      'Every choice here is really the same choice made over and over: am I building something I own, or feeding something that owns me? A book of business compounds, renews, and has a number a buyer would genuinely pay for. A pile of applications pays once, churns out, and now drags compliance risk behind it.',
      'The good news is this is not about talent or deep pockets. It is about picking the asset every time, being obsessive while you learn, and having the right people in your corner.',
    ],
    actions: [
      'Run the loyalty test on your last 50 clients. Would they follow you anywhere, or did a gimmick bring them? Build more of the first kind.',
      'Claim one niche this quarter and become the obvious expert in it.',
      'Make "teach or entertain" the bar for everything you publish. If a piece does neither, kill it.',
      'Capture emails and cell numbers on every sale, and put them in a CRM you will actually use.',
      'Before you ever buy a lead, see the exact ad behind it. No gift-card bait.',
    ],
  },
  {
    slug: 'brokers-not-why-medicare-is-confusing',
    title: "Brokers aren't why Medicare is confusing. Medicare is.",
    category: 'market',
    date: '2026-06-16',
    readTime: '6 min read',
    summary:
      "MedPAC's new report on how confusing Medicare has become is, almost by accident, one of the best cases for agents we have seen from the government. It also takes a few cheap shots. Here is the honest version.",
    author: AUSTIN,
    takeaways: [
      "MedPAC's own report shows seniors are overwhelmed by Medicare and lean on agents to translate it.",
      'The shots it takes at agents do not hold up, including an "80%" stat that was pulled only from complaint calls.',
      'The real problem it finds is not agents. It is guaranteed issue, a rules problem that traps seniors in the wrong plan.',
    ],
    whatTitle: 'What the report says',
    what: [
      { type: 'p', text: "MedPAC just put out an analysis on how hard Medicare has become to navigate. Read it closely and it makes the case for independent agents better than most agents make it themselves. It also takes a few cheap shots. Here is the honest version." },
      { type: 'h', text: 'Seniors are drowning, and the report admits it' },
      { type: 'p', text: "The average beneficiary is choosing from about 39 Medicare Advantage plans, 11 standalone drug plans, and 10 Medigap types, each with its own premiums, networks, and rules. Add lifetime late-enrollment penalties and five or six sales calls a day, and people are overwhelmed." },
      { type: 'p', text: 'Their own focus groups say it plainly. One person: "It was truly, truly confusing, and I am supposed to be relatively smart." Another, after an agent visit: "I am not comprehending all this stuff."' },
      { type: 'h', text: 'Who seniors actually turn to' },
      { type: 'p', text: "The agent. The report describes beneficiaries whose agents made recommendations based on their real medications and their real doctors, and who had generally positive experiences. The free government counseling alternative, SHIP, was used by roughly 4 to 5 percent of seniors, and most had never heard of it. You cannot call something almost no one uses the replacement for the thing almost everyone does." },
      { type: 'h', text: 'The cheap shots, handled honestly' },
      { type: 'ul', items: [
        'The headline stat is that agents failed to ask the right questions or gave incomplete information "over 80 percent" of the time. The catch: those were complaint calls. A sample built from complaints shows you complaints, not the typical senior\'s experience.',
        'The report leans on a 2020 study where an AI tool helped lower-skill agents give better recommendations. The honest read is the opposite of "replace agents." The tool helped the agents who needed the most help. That is a case for giving agents better tools, which is what the good shops already do.',
      ] },
      { type: 'h', text: 'The part they almost get right' },
      { type: 'p', text: "The biggest barrier they find is not agent conduct. It is guaranteed issue. Switch from Medicare Advantage back to traditional Medicare after a bad diagnosis, and in most states you can be medically underwritten out of a Medigap policy. Their own data shows beneficiaries moved back to traditional Medicare at nearly double the rate in states that allow guaranteed-issue switching. That is a rules problem, not a broker problem." },
    ],
    why: [
      'This matters because "agents are the problem" is the story that gets used to pile more rules on you. The report\'s own findings cut the other way. Seniors are confused by the system, and they lean on agents to make sense of it.',
      'Know the counterargument cold. When someone waves around the "80 percent" number, you can explain it came from complaint calls. When someone says AI will replace you, you can point out the study showed AI helps agents, it does not beat them.',
      'And keep the main thing the main thing. You are not why Medicare is confusing. Medicare is. You are the person who makes it make sense, using real doctors and real drug lists, at no cost to the client.',
    ],
    actions: [
      'Use this when a prospect hesitates. Most seniors are overwhelmed by the choices. Naming that out loud, then walking them through it calmly, is your whole value.',
      'Lead with their real life. Pull up their actual medications and doctors before you ever talk plans. That is exactly the behavior the report praised.',
      'Get the tools that make you better. The AI study is real. Agents with strong quoting and CRM tools give better recommendations, so use them.',
      'Be honest about the switching trap. If a healthy client picks MA now, make sure they know that moving back to a Medigap plan later can require underwriting in most states.',
    ],
    sources: 'Sources: MedPAC, "The complexity of Medicare enrollment decisions for beneficiaries" (March 2026); NORC at the University of Chicago focus groups (2024-2025); CMS recorded-call and complaint reviews.',
  },
  {
    slug: 'medicare-acquisition-landscape',
    title: 'Why everyone is buying Medicare books right now',
    category: 'market',
    date: '2026-06-16',
    readTime: '7 min read',
    summary:
      'A retirement wave on one side, hungry buyers on the other. Here is the plain version of how Medicare books are valued today, why so many people are buying them, and what it means for the asset you have built.',
    author: AUSTIN,
    takeaways: [
      'A wave of agents is retiring. The average agent is about 59, and most have no succession plan, so more books are hitting the market than ever.',
      'Buyers are hungry. FMOs, aggregators, and private-equity-backed groups have spent years consolidating Medicare distribution because renewal income is steady and recurring.',
      'Your book is a real asset. What it is worth comes down to retention, whether you own your renewals, and how clean your data is.',
    ],
    whatTitle: "What's happening in the market",
    what: [
      { type: 'p', text: 'Two things are colliding in Medicare right now, and together they have created the busiest market for buying and selling books we have seen in years.' },
      { type: 'h', text: 'A wave of sellers' },
      { type: 'p', text: 'The average insurance agent is about 59 years old, and a large share of agents in their late 50s and 60s have no succession plan. A book can represent 30 or 40 years of work. As that generation steps back over the next few years, a flood of Medicare books is coming up for sale.' },
      { type: 'h', text: 'A line of buyers' },
      { type: 'p', text: 'At the same time, buyers have been circling for years. Medicare distribution has consolidated hard, with FMOs, aggregators, and private-equity-backed groups buying up agencies and books. The reason is simple: renewal income is recurring and predictable. MAPD and Part D renewals pay for the life of the client, which is exactly the kind of steady cash flow investors love.' },
      { type: 'p', text: 'Many of these buyers run a roll-up play. They buy a lot of small books, combine them, and aim to sell the whole thing a few years later at a higher price. Your life\'s work becomes a line item in someone else\'s portfolio.' },
      { type: 'h', text: 'How books are valued today' },
      { type: 'p', text: 'Most Medicare books are valued on a simple idea: a multiple of your annual renewal income. But in today\'s choppier market, buyers are pickier about what they will pay up for.' },
      { type: 'ul', items: [
        'Retention is everything. A book where clients stay year after year is worth far more than one that churns, even at the same size.',
        'Vesting matters. You can only sell renewals you actually own. If your contracts are not vested, there may be little to sell.',
        'Clean data wins. A book in a real CRM with notes and dates is worth more than a list of names on a spreadsheet.',
        'Product and market mix. Lifetime MAPD and sticky Med Supp clients carry more value than churn-prone single drug plans.',
      ] },
      { type: 'p', text: 'The market is also bumpier than it was. Carriers are trimming plans and exiting some areas for 2026, which means more clients shopping and more churn risk. That makes a clean, loyal, well-run book stand out even more, and a shaky one worth less.' },
    ],
    why: [
      'Here is the part most agents miss: you have built an asset, whether or not you ever plan to sell it. For a lot of agents it is the single most valuable thing they own, and they have never put a number on it.',
      'The buyer pool is as strong as it has ever been, but what you walk away with is mostly in your control. Retention, vesting, and clean records are the difference between a top-of-market sale and pennies on the dollar.',
      'And the buyer you choose matters as much as the price. Some buyers see your clients as a spreadsheet. The right one keeps serving the people you spent a career taking care of.',
    ],
    actions: [
      'Know your number. Even a ballpark changes how you think about your business. Our Book Estimator gives you a rough range in a couple of minutes.',
      'Protect what drives value. Keep retention high, confirm your renewals are vested, and get your book into a real CRM.',
      'If you are within a few years of slowing down, start early. The best outcomes come from planning, not a fire sale.',
      'Talk to a buyer who will treat your clients right. Price matters, but so does who picks up the phone for your people after you step away.',
    ],
    sources: 'Sources: Spark Advisors; Cherry Bekaert 2025 Private Equity Outlook; Honest Health 2025 MA Year in Review; Ritter Insurance Marketing; LIMRA and Nationwide succession data (2025-2026).',
  },
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
