// ============================================================================
// TIG LANDING PAGE CONTENT  — "TIG Blend" (emerald, founder-led, blunt voice)
// ----------------------------------------------------------------------------
// Everything editable on the public landing lives here. Edit copy + redeploy.
//
// FOUNDER PHOTOS live in /public/images/founders/. The hero shows them flanking
// the headline; if a file is missing it falls back to gold-on-emerald initials.
// ============================================================================

export const tig = {
  name: "Tyler Insurance Group",
  short: "TIG",
  tagline: "Independent Medicare FMO · Nationwide",
  recruitingEmail: "join@tylerinsurancegroup.com",
};

export const navLinks = [
  { label: "Why TIG", href: "#honest" },
  { label: "Insights", href: "/insights" },
  { label: "What you get", href: "#get" },
];

// ── Sticky announcement bar (top of page) ─────────────────────────────────────
export const announcement = {
  badge: "NEW",
  text: "Now contracting for 2027 AEP:",
  linkText: "see if you're a fit →",
  href: "/join",
};

// ── Hero ──────────────────────────────────────────────────────────────────────
// The headline renders uppercase; `titleHi` is the emphasized word.
export const hero = {
  titlePre: "Do you want to ",
  titleHi: "scale",
  titlePost: " your Medicare business?",
  sub: "Build with a team that's written 1,000+ policies in 4 years. None of it alone, and you won't be either.",
  primaryCta: { label: "I'm Ready to Grow", href: "/join" },
  secondaryCta: { label: "Agent Login", href: "/auth" },
};

// ── The honest version (blunt truths) ────────────────────────────────────────
export const truths: { claim: string; clarifier: string }[] = [
  {
    claim: "We're not the biggest. Good.",
    clarifier:
      "Big never sold a single policy. We'd rather make our agents better than recruit thousands and forget their names.",
  },
  {
    claim: "We already paid the tuition.",
    clarifier:
      "We've made the expensive mistakes — hired wrong, lost deals, burned cash. You just get the lessons.",
  },
  {
    claim: "Overrides don't grow books.",
    clarifier:
      "Skill, reps, and the right tools do. That's all we obsess over. If you came for the biggest override, we're not your shop.",
  },
  {
    claim: "If you don't grow, we don't.",
    clarifier:
      "That's not a slogan. It's the math. So we won't waste your time, and we won't waste ours.",
  },
];

// ── What you actually get ─────────────────────────────────────────────────────
export const valueItems: { title: string; desc: string }[] = [
  { title: "Top contracts, fast releases", desc: "Competitive comp with nearly every carrier. Table stakes, done right." },
  { title: "Free tech: quoting, enrollment, CRM", desc: "SunFire, Connecture, and a real CRM, at no cost to you." },
  { title: "Coaching past “pass AHIP”", desc: "How to actually grow and keep a book, then build your own team." },
  { title: "The playbooks that built our books", desc: "What worked, what didn't, and what to copy. No gatekeeping." },
  { title: "Our actual cell numbers", desc: "You call a founder, not a ticket queue. Same-day, every time." },
  { title: "Operators who still sell", desc: "Advice from people doing it this season, not a memo from 2015." },
];

// ── Founder note (first person) ───────────────────────────────────────────────
export const founderNote = {
  // The part wrapped between | and | renders gold-emphasized.
  lines: [
    "Whatever we know, you'll know. |We just hand it over.| No gatekeeping.",
    "We've learned most of this the hard way. You don't have to.",
  ],
  sign: "— Austin & Andrew, Founders",
};

// ── Founders (shown flanking the hero) ────────────────────────────────────────
export interface Founder {
  name: string;
  credential?: string;
  title: string;
  photo: string;
  initials: string;
}

export const founders: Founder[] = [
  {
    name: "Austin Tyler",
    credential: "MBA",
    title: "Founder",
    photo: "/images/founders/atyler-headshot.jpg",
    initials: "AT",
  },
  {
    name: "Andrew Horn",
    credential: "MHA",
    title: "Founder",
    photo: "/images/founders/andrew-horn.png",
    initials: "AH",
  },
];

export const closingCta = {
  heading: "Ready to scale your Medicare business?",
  sub: "Top contracts, the full toolkit, and us in it with you. If that's the team you've been looking for, let's see if it's a fit.",
  primaryCta: { label: "I'm Ready to Grow", href: "/join" },
};
