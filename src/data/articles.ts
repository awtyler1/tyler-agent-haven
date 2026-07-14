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
    slug: 'fill-your-t65-pipeline',
    title: 'The T65 pipeline: how to grow a book that doesn’t live and die by AEP',
    category: 'market',
    date: '2026-07-14',
    readTime: '8 min read',
    summary:
      'About 10,000 Americans turn 65 every day, and their enrollment window has nothing to do with AEP. Here are the real, actionable ways to fill your Turning 65 pipeline, starting with the free ones, so you have new business coming in all twelve months.',
    author: AUSTIN,
    takeaways: [
      'T65 is the one lead source that never sleeps. About 10,000 people turn 65 every day, on their own clock, not the AEP calendar. Build this and you stop living and dying by October through December.',
      'The highest-converting T65 prospects come from people who already trust you: your own clients and a few professional referral partners. Work those before you spend a dollar on leads.',
      'Timing is the whole game. Reach them 3 to 6 months before their 65th birthday. Too early and it does not stick, too late and you lose them to whoever got there first.',
    ],
    whatTitle: 'How to actually fill the pipeline',
    what: [
      { type: 'p', text: "Most Medicare books have the same weakness: they run on AEP. The phone rings in October, you sprint through December, and then it goes quiet until next fall. That is a stressful way to build a business, and it caps how fast you grow." },
      { type: 'p', text: "Turning 65 is the fix. Every day, about 10,000 Americans age into Medicare, and their enrollment window has nothing to do with AEP. Fill this pipeline and you have first-time buyers coming to you all twelve months. Here is how to actually do it, cheapest and highest-converting first." },
      { type: 'h', text: 'Why T65 is the steadiest pipeline you can build' },
      { type: 'p', text: "A person turning 65 gets a seven-month Initial Enrollment Period: the three months before their birthday month, the month itself, and the three months after. They have never picked a plan, they know they need help, and they expect to hear from someone. That is why T65 prospects close at a higher rate than aged-in shoppers who already have coverage." },
      { type: 'p', text: "It is also predictable. Unlike AEP, it does not come in one wave. It arrives in a steady trickle you can plan around, which is exactly what makes it good for growth." },
      { type: 'h', text: 'The timing that matters' },
      { type: 'p', text: "Build awareness 6 to 12 months out, then concentrate your real effort 3 to 6 months before the birthday, when people start actively researching. One simple way to think about it: plant the seed at 63, educate at 64, and be the obvious name in their head by the time their window opens." },
      { type: 'p', text: "Miss that window and you are not early, you are late. Someone else mailed them, ran the seminar, or showed up first on Google. Get there during the research phase and the appointment is usually yours." },
      { type: 'h', text: '1. Start where the trust already is (free)' },
      { type: 'p', text: "Your own book is the best T65 list you will ever have, and it costs nothing. Two moves:" },
      { type: 'ul', items: [
        "Work the spouses. When you write a client, one spouse is often 65 before the other. Note the younger spouse's birthday and reach out a few months ahead. You already have the household's trust.",
        "Ask every client, specifically. Not “let me know if anyone needs help.” Instead: “Who do you know turning 65 in the next year? A friend, a coworker, a sibling?” Specific asks get specific names.",
      ] },
      { type: 'p', text: "Referrals from happy clients are the highest-closing leads there are, because the trust transfers before you ever pick up the phone." },
      { type: 'h', text: '2. Build three to five referral partners' },
      { type: 'p', text: "This is the compounding one. Certain professionals sit on a steady stream of people turning 65 and do not want to handle the Medicare side themselves. Become their Medicare person." },
      { type: 'ul', items: [
        "Financial advisors and CPAs: their clients are retiring and aging in, and Medicare is a question they dread. Offer to be their go-to resource so they never have to guess.",
        "Estate and elder-law attorneys: same setup, older client base.",
        "HR and benefits managers at local employers: they have employees retiring and turning 65 who need somewhere to land.",
      ] },
      { type: 'p', text: "Make it easy for them to hand you off. Bring simple materials they can pass along, and offer to co-host a retirement-and-Medicare workshop for their people. One good partner can feed you for years, quietly, with no ad spend. This door takes longer to open than a bought lead, and it is worth far more." },
      { type: 'h', text: '3. Get in front of the turning-65 crowd' },
      { type: 'ul', items: [
        "Educational seminars: host a plain-English “welcome to Medicare” session at a library, community room, or partner's office. A typical seminar draws 15 to 25 people, and folks who see you teach are far more likely to book an appointment. Keep it strictly educational (see the compliance note below).",
        "Grassroots community presence: build relationships with the local businesses, churches, and gyms that serve this age group, and let them help spread the word. It is slow, it is free, and it makes you the local name.",
      ] },
      { type: 'h', text: '4. Turn on the digital and paid channels' },
      { type: 'p', text: "Most pre-retirees start researching 6 to 12 months out on Google, YouTube, and Facebook. Be there when they look." },
      { type: 'ul', items: [
        "Google Business Profile: claim it, fill it out, and gather reviews so you show up when someone searches “Medicare help near me.” This is the cheapest lead engine you can own. (We break down the review side in “If I Were Starting From Zero Again.”)",
        "Educational content: short “turning 65” explainer posts and videos. It compounds. It takes months to rank, then produces leads at almost no cost per lead.",
        "Facebook: target ages 64 to 67 with a simple educational offer and a landing page. Reaches pre-retirees where they already spend time.",
        "T65 mailing lists: buy a list filtered by birth month, mail 3 to 6 months ahead, and put a phone number on it that a real person answers fast. Targeted T65 mail lands in the 2 to 5 percent response range.",
      ] },
      { type: 'h', text: '5. Keep it compliant' },
      { type: 'p', text: "T65 marketing has clean guardrails. Know them and you can move fast without worry:" },
      { type: 'ul', items: [
        "Educational events are educational only. No plan-specific benefits, no sign-in requirement, and you collect contact info only if the person volunteers it.",
        "Attendance is not permission to contact. To follow up, you need explicit consent. Put a Permission to Contact form in every hand (it is in our Forms library) so every lead is one you can legally call.",
        "Educating someone before they are 65 is fine. The moment you talk specific Medicare Advantage or Part D plans, CMS marketing rules apply, and you still need a Scope of Appointment before any sales appointment.",
      ] },
    ],
    why: [
      "A T65 book is a different kind of asset than an AEP book. It comes in steadily, it renews, and it does not spike and crash with the calendar. Every person you win at 65 is a relationship that can feed referrals and cross-sells for the next decade. You are not buying a sale, you are starting a client.",
      "The agents who struggle are the ones who go dark from January to September and then scramble in the fall. Filling a T65 pipeline is how you stay in motion, and stay growing, all year. The best part is that the strongest sources on this list, your own clients and a few referral partners, cost you time instead of money.",
    ],
    actions: [
      "Pull every client turning 65 in the next 6 months, plus their younger spouses, and start the conversation this month.",
      "Line up three referral partners: one financial advisor, one CPA, and one HR or benefits contact. Offer to be their Medicare person and to co-host one workshop.",
      "Book one educational seminar for this fall and start building the invite list now.",
      "Claim and polish your Google Business Profile, then publish two plain-English “turning 65” explainers to start the SEO clock.",
      "Keep Permission to Contact forms on hand (they are in the Forms library) so every T65 lead is one you can legally follow up with.",
    ],
  },
  {
    slug: 'medicare-2027-changes',
    title: 'What\'s changing in Medicare for 2027 — your AEP briefing',
    category: 'cms',
    date: '2026-07-07',
    readTime: '8 min read',
    summary:
      'The 2027 rules are set: a $2,400 drug cap, negotiated prices on 15 more drugs including Ozempic and Wegovy, better-funded MA plans, and a D-SNP overhaul. Here is the plain version of what changes for your clients — and what to do about it before AEP.',
    author: AUSTIN,
    takeaways: [
      'The Part D out-of-pocket cap rises to $2,400 (from $2,100) and the deductible to $700 (from $615). Clients will feel both at the pharmacy counter early in the year.',
      'Fifteen more drugs get negotiated prices on January 1 — Ozempic, Wegovy, and Rybelsus drop to $274 a month, 71% off list. If a client takes one of the 15, their math changes.',
      'MA plans get a real funding raise for 2027, the first in a few years. Expect a more stable plan shelf this AEP than the last two — but read your ANOCs anyway.',
    ],
    whatTitle: 'What changes January 1',
    what: [
      { type: 'p', text: 'CMS locked in the 2027 rules this spring — the final rule and payment notice landed in early April. Every plan you sell this AEP is built on them. Here is what actually changes for the people in your book, in plain English.' },
      { type: 'h', text: 'The drug cap goes up: $2,400, with a $700 deductible' },
      { type: 'p', text: 'The out-of-pocket cap on covered Part D drugs rises from $2,100 to $2,400, and the standard deductible climbs from $615 to $700. Both are roughly 14% jumps — the cap is indexed to drug-cost inflation, so it moves every year.' },
      { type: 'p', text: 'The structure your clients learned these past two years stays put: no more donut hole, $0 cost sharing once they hit the cap, and the option to spread drug costs across the year with the Medicare Prescription Payment Plan. What was temporary guidance is now permanent regulation — CMS codified the whole redesign for 2027 and beyond.' },
      { type: 'p', text: 'The client-facing version: "Your worst-case year at the pharmacy is $2,400, then you pay nothing. But your deductible is bigger, so January may sting more before coverage kicks in."' },
      { type: 'h', text: 'Negotiated prices hit 15 more drugs — including Ozempic and Wegovy' },
      { type: 'p', text: 'Round two of Medicare drug price negotiation takes effect January 1, 2027. The headliners: Ozempic, Wegovy, and Rybelsus drop to $274 a month — about 71% off list price. The list also includes Trelegy and Breo (COPD/asthma), Ofev, Xtandi, Ibrance, Pomalyst, Calquence (cancer), Linzess and Xifaxan (GI), and Tradjenta and Janumet (diabetes).' },
      { type: 'p', text: 'Around 5.3 million Medicare members take at least one of these 15. What the negotiated price changes is the plan-side cost — which pulls down what clients pay in the deductible phase and slows how fast they burn toward the cap. CMS estimates roughly $685 million in out-of-pocket savings across the program.' },
      { type: 'p', text: 'Two footnotes worth knowing cold. First, the first ten negotiated drugs (Eliquis, Xarelto, Jardiance, Januvia, and others) have been at negotiated prices since this January — 2027 stacks 15 more on top. Second, for weight loss specifically, the GLP-1 Bridge still beats everything at $50 a month through the end of 2027 — the $274 negotiated price matters for clients using these drugs for diabetes and other covered uses.' },
      { type: 'h', text: 'MA plans get a raise — expect a steadier shelf' },
      { type: 'p', text: 'CMS finalized a 2.48% base increase in MA payments for 2027 — north of $13 billion, and closer to 5% once risk-score trend is counted. After two lean years of benefit trims, county exits, and plan terminations, carriers have more room to hold benefits together.' },
      { type: 'p', text: 'That does not mean nothing changes — it means the changes should be less bloody. Read every ANOC like you always do. But the "my plan disappeared" conversations should be fewer this fall than last.' },
      { type: 'h', text: 'Supplemental benefits get honest' },
      { type: 'ul', items: [
        'Flex cards get fixed: starting in 2027, plans using debit cards for supplemental benefits must verify eligibility in real time at the register. Fewer declined cards, fewer mystery balances, fewer angry calls to you.',
        'SSBCI transparency: plans must publicly post eligibility criteria for chronic-condition extras (food, transportation, pest control), so you can check whether a client actually qualifies before you sell the benefit.',
        'One rollback to know: the planned mid-year "you have unused benefits" notice was rescinded. Nobody reminds your clients to use their dental allowance — except you. That is a touchpoint you own now.',
      ] },
      { type: 'h', text: 'D-SNPs: one card, one assessment, tighter alignment' },
      { type: 'p', text: 'If you work dual-eligibles, 2027 is a real shift. Integrated D-SNPs must issue a single member ID card that works for both Medicare and Medicaid, and run one combined health risk assessment instead of two. Enrollment in certain D-SNPs also tightens to members of the affiliated Medicaid managed care plan — alignment rules that started rolling in 2025 finish landing here.' },
      { type: 'p', text: 'Translation for your appointments: fewer cards in the shoebox, fewer duplicate phone assessments, but stricter matching between a client\'s Medicaid plan and the D-SNP you can put them in. Check the Medicaid side first, always.' },
      { type: 'h', text: 'The numbers still coming' },
      { type: 'p', text: 'The 2027 Part B premium is not final until November. The trustees project about $209.50 a month (up from $202.90 — a mild 3.2%), though private forecasters peg it at $216 to $219 based on the trustees\' track record of undershooting. Star ratings also got rebuilt for 2027 — CMS stripped out 11 administrative measures to focus on clinical outcomes, so expect some plans\' stars to move for reasons that have nothing to do with member experience.' },
      { type: 'p', text: 'And a reminder we covered in June: your commission caps went up for 2027 ($725 for new MA in most states, $130 for PDP), and the marketing rules loosen October 1 — no more 48-hour scope wait. Different article, same season.' },
    ],
    why: [
      'This is the material your AEP appointments are made of. Every renewal conversation this fall is really a 2027 conversation: a bigger deductible in January, a higher cap, cheaper prices on 15 very common drugs, and steadier plan benefits. The agent who can explain those four things in plain English — without the client having to ask — is the agent who keeps the book.',
      'The drug list is the sleeper opportunity. If you know which of your clients take Ozempic, Trelegy, Xtandi, or Linzess, you have a genuinely good phone call to make in December: "your drug is about to cost the plan a third of what it did, and here is what that means for you." That is the kind of unprompted value that generates referrals.',
    ],
    actions: [
      'Flag every client on one of the 15 newly negotiated drugs (start with Ozempic, Trelegy, Linzess — the high-volume ones) and work them into your AEP outreach with a specific talking point.',
      'Set the January expectation now: the deductible rises to $700, so early-year costs may feel heavier even though the annual cap protects them at $2,400.',
      'Read ANOCs with fresh eyes — a better-funded year means changes will be subtler, not absent. Star ratings moved for structural reasons too, so do not let a rating dip alone drive a plan change.',
      'If you have a dual book, verify each client\'s Medicaid plan alignment before AEP — the 2027 D-SNP rules tie your plan options to it.',
      'Own the benefits-reminder touchpoint: plans no longer have to tell members about unused supplemental benefits, so build a mid-year "use your dental and OTC" check-in into your calendar.',
    ],
  },
  {
    slug: 'medicare-glp1-bridge',
    title: 'The Medicare GLP-1 Bridge is live: what to tell your clients',
    category: 'cms',
    date: '2026-07-02',
    readTime: '6 min read',
    summary:
      'Starting July 1, eligible Medicare members can get Wegovy, Zepbound, or Foundayo for a flat $50 a month. Your phone is going to ring about it. Here is the plain version, including the catches that will trip clients up.',
    author: AUSTIN,
    takeaways: [
      'As of July 1, 2026, eligible Medicare members can get select GLP-1 weight-loss drugs for a flat $50 a month, but it is a temporary demonstration that ends December 31, 2027.',
      'It runs outside their Part D plan through a central processor. No separate sign-up, but a doctor has to submit prior authorization, and the $50 does not count toward their drug out-of-pocket cap.',
      'Not everyone qualifies. It is weight-loss use only, tied to BMI tiers, and members already covered for diabetes, sleep apnea, or MASH are excluded.',
    ],
    whatTitle: 'What the GLP-1 Bridge is',
    what: [
      { type: 'p', text: 'GLP-1 drugs are the most talked-about medications in the country right now, and Medicare has never covered them for weight loss. That just changed, and your clients are seeing the headlines. Expect the questions. Here is the plain version so you can answer them well.' },
      { type: 'p', text: 'The Medicare GLP-1 Bridge is a temporary CMS demonstration. Starting July 1, 2026, eligible members can get certain GLP-1 medications for weight loss at a flat $50 a month. That $50 is the total out-of-pocket cost for the drug. The program runs through December 31, 2027, and then it is scheduled to end.' },
      { type: 'p', text: 'The key thing to understand: the Bridge runs outside a member\'s Part D plan. CMS uses a single central processor to handle the prior authorization, the claim, and payment to the pharmacy. So this is not their plan "adding" Ozempic-style coverage. It is a separate lane that sits alongside whatever plan they already have.' },
      { type: 'h', text: 'What it covers, and who qualifies' },
      { type: 'p', text: 'Three drugs are covered when used to reduce excess weight and keep it off:' },
      { type: 'ul', items: [
        'Wegovy (semaglutide), injection and tablets',
        'Zepbound (tirzepatide), KwikPen formulation only',
        'Foundayo (orforglipron), an oral GLP-1 option',
      ] },
      { type: 'p', text: 'To be eligible, a member must be enrolled in Medicare Part D or a Medicare Advantage plan with drug coverage, and a prescriber must confirm they meet one of three BMI-based tiers:' },
      { type: 'ul', items: [
        'BMI of 35 or higher, on BMI alone.',
        'BMI of 30 or higher with heart failure, uncontrolled high blood pressure, or chronic kidney disease.',
        'BMI of 27 or higher with prediabetes, a prior heart attack, a prior stroke, or peripheral artery disease.',
      ] },
      { type: 'p', text: 'There is no separate enrollment for the member. They do not opt in or pick a new plan. But a doctor has to submit a prior authorization to the central processor attesting to the BMI tier and documenting the criteria. No prescriber attestation, no Bridge.' },
      { type: 'h', text: 'Who does not qualify' },
      { type: 'p', text: 'Members who have type 2 diabetes, moderate-to-severe obstructive sleep apnea, or noncirrhotic MASH (a liver condition) are excluded from the Bridge, even if they otherwise meet the BMI criteria. That sounds backwards until you see why: GLP-1 drugs are already covered under a normal Part D plan for those medical conditions. Those members go through their regular plan, not the Bridge. The Bridge exists to cover the one use Part D never did, weight loss on its own.' },
      { type: 'h', text: 'The fine print that will trip clients up' },
      { type: 'ul', items: [
        'It is temporary. The Bridge ends December 31, 2027. Nobody should reshape their whole plan around a benefit with an expiration date.',
        'The $50 does not count toward their drug cap. Because the Bridge sits outside Part D, the copay does not apply to the deductible or the $2,100 out-of-pocket limit for 2026.',
        'No Extra Help. The low-income subsidy does not apply to the Bridge, so the $50 is $50 even for LIS members.',
        'Weight loss only. This is not general "GLP-1 coverage." It is specific drugs, for weight reduction, for members who clear the BMI tiers.',
        'It is their doctor\'s call, not yours. Eligibility and the prior authorization run through the prescriber.',
      ] },
    ],
    why: [
      'This is the single most-asked-about drug class in the country, and now it touches Medicare. When a client hears "Medicare covers Ozempic now" on the news, they are going to call someone. Be the person who explains it accurately, catches and all. That is the exact kind of no-pitch, genuinely-helpful moment that keeps a client for years.',
      'Stay in your lane. You do not sell, enroll, or approve anyone for the Bridge, and you should not give medical advice or promise eligibility. Your job is to set honest expectations and point them to their prescriber for the clinical piece. Get that boundary right and you look like the pro. Get it wrong and you own a problem that was never yours.',
    ],
    actions: [
      'Learn the three-sentence version: $50 a month for Wegovy, Zepbound, or Foundayo for weight loss, through 2027, if a doctor confirms you meet the BMI rules.',
      'When a client asks, first confirm they are in a Part D or MA-PD plan, then send them to their prescriber for eligibility and the prior authorization.',
      'Set expectations on the catches: temporary through 2027, weight-loss use only, the $50 does not count toward their drug cap, and no Extra Help.',
      'Never promise eligibility or give medical advice. The BMI attestation is the physician\'s, not yours.',
      'Use it as a reason to reach out. A short, helpful note to your book or community about the Bridge is a warm touch that asks for nothing.',
    ],
  },
  {
    slug: 'starting-from-zero-again',
    title: 'If I Were Starting From Zero Again',
    category: 'market',
    date: '2026-06-28',
    readTime: '7 min read',
    summary:
      "What I'd actually do to build a Medicare agency from nothing, in the order I'd do it. Four boring things, done before I let myself get distracted by anything shiny.",
    author: AUSTIN,
    takeaways: [
      'Start a Google Business Profile today and ask every single client for a review. The payoff can take a year or two, which is exactly why most agents quit.',
      'In the beginning you have one problem: nobody knows you exist. Get the word out, to consumers and to the professionals whose clients are turning 65.',
      "Get around other agents, even competitors, and make your carrier reps your teachers. You can't shortcut the years, but you can borrow from people who already have them.",
    ],
    whatTitle: 'The four things, in order',
    what: [
      { type: 'p', text: "If I lost it all tomorrow and had to rebuild a Medicare agency from the ground up, I wouldn't go hunting for a secret. I'd do four boring things, in order, and I'd do them before I let myself get distracted by anything shiny." },
      { type: 'p', text: "Most agents starting out burn their first year looking for the silver bullet. There isn't one. Here's what there is." },
      { type: 'h', text: '1. Start a Google Business Profile. Today. Before anything else.' },
      { type: 'p', text: "A lot of people reading this have never set one up. That's fine. You don't know what you've never done before. Search “how to set up a Google Business Profile,” follow the steps, and you'll have it done in an afternoon." },
      { type: 'p', text: 'Then make it a rule. Every single client you bring on, you ask for a Google review. Every one. No exceptions.' },
      { type: 'p', text: "Here's the part nobody tells you. You will not see the payoff in a month. You might not see it in six months. It can take a year, sometimes two, before that page starts working for you. That's exactly why most agents quit doing it. They ask for a few reviews, nothing happens, they stop." },
      { type: 'p', text: 'Don’t stop. Consistency is the whole thing here, and it will reward you more than almost anything else you do early.' },
      { type: 'p', text: "For me, the switch flipped around twenty reviews. That's when I started ranking and the inbound calls began to trickle in. Twenty isn't a huge number, but I had to ask for every one of them, one client at a time, before any of it showed up. That's the part most people never reach, because they quit at five." },
      { type: 'p', text: 'Think about it plainly. When someone needs help with something today, where do they go? Google. You want to be the local name that comes up when a 64-year-old in your area finally types “Medicare help near me.” That spot gets built one review at a time, starting now.' },
      { type: 'h', text: '2. In the beginning, you have exactly one problem: nobody knows you exist.' },
      { type: 'p', text: "Not a lead problem. Not a closing problem. An awareness problem. People don't know what you do and they don't know how to find you. That's it. That's the whole job in this phase." },
      { type: 'p', text: "Once you see it that clearly, it gets simple. You don't need a funnel or a fancy system yet. You need people to know what you're doing." },
      { type: 'p', text: 'So you do warm outreach. You tell anybody and everybody you know. You can buy a list and do cold outreach too. The goal is the same either way. Get the word out.' },
      { type: 'p', text: "But here's the move most agents miss. You're not talking to one audience, you're talking to two." },
      { type: 'ul', items: [
        'Consumer-facing: the people who need Medicare help.',
        'The professional network around them: financial advisors, accountants, large-group employers. Every one of them has clients turning 65, and most don’t want to deal with the Medicare side themselves.',
      ] },
      { type: 'p', text: "If you can clearly articulate what you do and why it helps their clients, you've turned one conversation into a referral source that can feed you for years. That second door takes more work, because you have to explain your value to a professional, not just a prospect. But it's worth more, and almost nobody does it well." },
      { type: 'p', text: 'When I first started, I sat down with the COO of a large financial advisory firm here in Lexington. I was completely fresh to the industry and I felt like an imposter the entire meeting, intimidated from start to finish. Then nothing. Weeks went by, I didn’t hear a word, and I figured it went nowhere. Then out of the blue, his referrals started showing up.' },
      { type: 'p', text: "That's how that door works. It's quiet, and then it isn't. You won't get the instant yes you get from a prospect, so don't read the silence as a no. Plant it and let it sit." },
      { type: 'p', text: 'Stop looking for the trick. The only question in this phase is, how do I get more people to know what I’m doing? Answer that every day and you’re fine.' },
      { type: 'h', text: "3. Get around other people doing what you do. Even the ones you'd call competitors." },
      { type: 'p', text: "This is the one I wish I'd done better when I started." },
      { type: 'p', text: "Building a business by yourself is hard. It's lonely. It wears on your personal life in ways you don't notice until it's already happened. And the longer I've been in this industry, the more I've seen that a lot of brokers don't need another course or another lead source. They need people around them. People to support them, learn with them, grow with them." },
      { type: 'p', text: 'Some of those people will technically be your competition. Get around them anyway. Learning from someone who has already been through the exact phase you’re standing in right now is worth more than treating them like a rival.' },
      { type: 'p', text: "Here's why it matters so much. You can't shortcut time in this industry. The knowledge that comes from years of doing the work only comes from years of doing the work. There's no hack for that. But there is one way to close the gap, and it's being around people who already have that time in. They'll hand you perspective you could not have reached on your own, no matter how smart you are or how hard you grind solo." },
      { type: 'h', text: '4. Make the carrier reps your teachers.' },
      { type: 'p', text: 'Befriend your carrier reps and learn everything you can from them.' },
      { type: 'p', text: 'Their job, at the end of the day, is to help you learn their products and the market as fast as possible. They are paid to train you, teach you, and support you. So let them. An agent who puts real time in here learns faster and understands the market quicker than the one trying to figure it all out alone.' },
      { type: 'p', text: "But there's a right way to do it. These reps talk to a lot of brokers. A lot. Most of them show up with nothing, ask lazy questions, and forget the answers. So come prepared. Bring good questions. Show up curious and ready to learn." },
      { type: 'p', text: 'That alone sets you apart from most of the brokers they deal with, and reps remember the agents who take it seriously. The better the questions you ask, the faster you grow.' },
      { type: 'p', text: "And the real payoff shows up once you've sat with enough of them. It wasn't one rep who changed how I see this business. It was meeting many of them, hearing their plans, their read on the market, where they think things are heading. String enough of those conversations together and you start to see the whole picture. Where the market here has been, and where it's going over the next few years." },
      { type: 'p', text: "You can read it in the moves the carriers make. What products they're rolling out. What areas they're pushing into. What benefits they're leaning on. Ask why behind each of those decisions and it tells you a story about where they think the market is going next." },
      { type: 'p', text: "Pay attention to the reps themselves too. Which ones are leaving, where they're going, how they talk about the company they're at. That is market intelligence you cannot get any other way, and most agents walk right past it because they only see the rep as the person who answers product questions." },
    ],
    why: [
      "None of this is exciting. A Google page. Telling people what you do. Sitting with other agents. Asking your rep better questions. It's boring, it's slow, and it compounds. That's exactly why most people skip it and go chasing the shortcut instead.",
      "If I were starting over tomorrow, I'd set up the Google page this week, tell ten people what I do, find one other agent to build alongside, and walk into my next carrier call with three real questions. The order matters less than starting. That's it. That's the whole plan. — AT",
    ],
    actions: [
      'Set up your Google Business Profile this week, then ask every single client for a review. No exceptions.',
      'Tell ten people what you do. Warm outreach first, cold outreach to widen the net if you want it.',
      'Open the second door: get in front of financial advisors, accountants, and employers whose clients are turning 65, and explain how you help their people.',
      'Find one other agent to build alongside, even a competitor, and learn from someone a phase ahead of you.',
      'Walk into your next carrier call with three real questions written down, and pay attention to what the carriers and reps are doing, not just the product answers.',
    ],
  },
  {
    slug: 'aep-game-plan',
    title: 'The AEP Game Plan',
    category: 'market',
    date: '2026-06-24',
    readTime: '6 min read',
    summary:
      'AEP is still months out, but it should sit in the back of everything you do until then. Here is the five-part game plan: stay in front of clients year-round, know your book cold before September, get into advisor mode now, out-prepare every appointment, and map your outreach before the mail hits.',
    author: AUSTIN,
    takeaways: [
      'The brokers who win AEP started preparing early. The ones who fall behind almost always did not.',
      'Know your book cold before September. Your Med Supp vs MA split, carrier breakdown, and growth all shape how you prep.',
      'Have a plan to reach every client before the mail and the calls hit. Get to them first.',
    ],
    whatTitle: 'The game plan',
    what: [
      { type: 'p', text: "I woke up this morning with this on my mind, so I'm writing it down while it's fresh." },
      { type: 'p', text: "AEP is still months out. I know that. But it should be in the back of everything you do between now and then. The brokers who win AEP are the ones who started preparing for it early. The ones who fall behind are almost always the ones who didn't." },
      { type: 'p', text: "Here's how I think about getting ready." },
      { type: 'h', text: "1. Don't let AEP be the only time your clients hear from you" },
      { type: 'p', text: "Your life in the fall gets so much easier when you've nurtured those relationships the other ten months of the year." },
      { type: 'p', text: 'A few ways I think about it:' },
      { type: 'ul', items: [
        'A newsletter, physical or digital',
        'A birthday card, an email, or both',
        'A simple check-in. A text, an email, a phone call.',
      ] },
      { type: 'p', text: 'None of that costs you anything but time. Automate the ones you can and it barely costs you that. But it makes a real difference in retention when AEP comes around.' },
      { type: 'h', text: '2. Know your book cold before September' },
      { type: 'p', text: "You can't prep for AEP if you don't actually know what you're prepping for. Know your numbers:" },
      { type: 'ul', items: [
        'Your Med Supp vs Medicare Advantage split. This is what lets you segment your AEP outreach come early September.',
        "Your carrier breakdown. This tells you who needs your attention first. If a carrier makes a big change and 40% of your book sits with that carrier, those are the people you reach out to early and get on the calendar. And know this: plan changes and uncertainty are exactly what newer agents use to get a senior's attention. Get out in front of them first.",
        'Your year-over-year growth.',
        'Where most of your business actually comes from.',
      ] },
      { type: 'p', text: 'Every one of these shapes how you prepare. Not every broker preps the same way. Someone with a big Med Supp book does not get ready the same way as someone with a big DSNP MAPD book.' },
      { type: 'h', text: '3. Get into advisor mode now, not in October' },
      { type: 'p', text: "During AEP you're about to sit with a lot of seniors who need your help. They also have friends and family who need it." },
      { type: 'p', text: "Treat every client like they're your only client." },
      { type: 'p', text: "Ask every person you meet who else they know you can help. They talk to their friends. They talk about their day. You want them telling those friends they've got an advisor now, and that they need to get with one too." },
      { type: 'p', text: "Give more value than necessary. The bar for being a great Medicare advisor is low. Embarrassingly low. Listen. Know their name. Tell them things about their coverage nobody else bothered to tell them. And do what you said you'd do. If you tell them you'll follow up in a few days, follow up in a few days." },
      { type: 'h', text: '4. Be the most prepared person in every appointment' },
      { type: 'p', text: 'Walk into every client and lead conversation knowing their plan inside and out, and knowing exactly what changed on it for the coming year. You should also be able to show how their plan stacks up against the other carriers.' },
      { type: 'p', text: 'What to study on every plan:' },
      { type: 'ul', items: [
        'Formulary',
        'Copay structure',
        'Networks',
        'Star rating',
      ] },
      { type: 'p', text: "When you know these cold, you're confident in the room, and the client feels that confidence. Be the expert. Be a student of the industry and the game." },
      { type: 'h', text: "5. Decide how you'll reach everyone before the mail hits" },
      { type: 'p', text: "Build your outreach plan now. Decide today how you're going to reach every client come September. Their mailbox and their phone are about to light up, and you don't want them wondering whether you still have a pulse. Get to them first." },
      { type: 'p', text: 'Work through the logistics before the rush, not during it:' },
      { type: 'ul', items: [
        'How are you handling scheduling, phone or in person?',
        'How long is each appointment?',
        'Are you pulling doctors and meds before the call, or during it?',
        'How are you walking them through their plan changes?',
        "How are you framing a recommendation that's grounded in what's actually best for the client?",
      ] },
      { type: 'p', text: 'Get out ahead of all of it. Tell your clients early what to expect this AEP, both from the market and from you as their advisor.' },
    ],
    why: [
      "AEP is when a lot of brokers make their biggest gains of the year. It's also when a lot of brokers fall behind and get discouraged. Almost every time, it's the same reason. They didn't prepare. They walked in without a gameplan.",
      "If any part of this made you feel behind, or unsure where to start, reach out. This is what we do. We'll sit down, walk through your situation, and help you think it through. — AT",
    ],
    actions: [
      'Set up year-round touchpoints now: a newsletter, birthday cards, and simple check-ins. Automate the ones you can.',
      'Pull your book’s numbers before September: your Med Supp vs MA split, carrier breakdown, year-over-year growth, and where your business comes from.',
      'Flag any carrier holding a big share of your book. If they announce big changes, those clients get reached first.',
      'For every plan you write, study the formulary, copay structure, networks, and star rating until you know them cold.',
      'Build your September outreach plan now: scheduling, appointment length, pulling doctors and meds, and how you will walk clients through their changes.',
    ],
  },
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
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
