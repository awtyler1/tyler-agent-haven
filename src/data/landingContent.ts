// ============================================================================
// TIG LANDING PAGE CONTENT  — "TIG Blend" (emerald, founder-led, real-talk voice)
// ----------------------------------------------------------------------------
// Everything editable on the public landing lives here. Edit copy + redeploy.
//
// FOUNDER PHOTOS: drop the two headshots in /public/images/founders/ as
//   austin-tyler.jpg  and  andrew-horn.jpg
// Until then, the page shows clean initial placeholders automatically.
// ============================================================================

export const tig = {
  name: "Tyler Insurance Group",
  short: "TIG",
  tagline: "Independent Medicare FMO · Nationwide",
  recruitingEmail: "join@tylerinsurancegroup.com",
};

export const navLinks = [
  { label: "Why TIG", href: "#honest" },
  { label: "What you get", href: "#get" },
  { label: "Founders", href: "#founders" },
];

export const hero = {
  eyebrow: "Tyler Insurance Group · Independent Medicare FMO · Nationwide",
  titleLines: ["The FMO built for", "where Medicare is going."],
  sub: "Real talk: most FMOs hand you a login, pitch you on overrides, and disappear. We've spent 10+ years growing our own books — winning, failing, and paying for the lessons. We'll just give them to you.",
  // The line that defines the model. The part after | is gold-emphasized.
  punch: "We don't win by signing more agents. | We win when you write more business.",
  primaryCta: { label: "Become a TIG Agent", href: "mailto:join@tylerinsurancegroup.com" },
  secondaryCta: { label: "Agent Login", href: "/auth" },
};

// ── The honest version (blunt truths) ────────────────────────────────────────
export const truths: { claim: string; clarifier: string }[] = [
  {
    claim: "We're not the biggest FMO.",
    clarifier:
      "Doesn't matter. “Big” never made anybody a single sale. We'd rather make our agents better than recruit thousands and forget their names.",
  },
  {
    claim: "We've made expensive mistakes.",
    clarifier:
      "We've hired wrong, lost deals, and burned cash figuring this out. You get the lessons. We already paid the tuition.",
  },
  {
    claim: "Overrides won't grow your book.",
    clarifier:
      "Skills, reps, and the right tools will. So that's all we obsess over. If you came for the biggest override, we're probably not your shop.",
  },
  {
    claim: "If you don't grow, we don't grow.",
    clarifier:
      "That's not a slogan — it's the math. So we're not going to waste your time, and we're not going to waste ours.",
  },
];

// ── What you actually get ─────────────────────────────────────────────────────
export const valueItems: { title: string; desc: string }[] = [
  { title: "Top contracts, nearly every carrier", desc: "Competitive comp and fast releases — table stakes, done right." },
  { title: "SunFire + Connecture + a real CRM", desc: "The quoting, enrollment, and tracking stack — at no cost to you." },
  { title: "Coaching past “pass AHIP”", desc: "How to actually grow and keep a book — and build your own team." },
  { title: "The playbooks that grew our books", desc: "What worked, what didn't, and what to copy — no gatekeeping." },
  { title: "Our actual cell numbers", desc: "You call a founder, not a ticket queue. Same-day, every time." },
  { title: "Operators who still sell", desc: "Advice from people doing it this season — not a memo from 2015." },
];

// ── Founder note (first person) ───────────────────────────────────────────────
export const founderNote = {
  // The part wrapped between | and | renders gold-emphasized.
  lines: [
    "We didn't start TIG because the world needed another FMO. We started it because the ones above us took their cut and |left us to figure it out alone.|",
    "So we did — for over a decade. Now we just give you the shortcut we never got.",
  ],
  sign: "— Austin & Andrew, Co-Founders",
};

// ── Founders ──────────────────────────────────────────────────────────────────
export interface Founder {
  name: string;
  credential?: string; // e.g. "MBA"
  title: string;
  photo: string;
  initials: string;
  blurb: string;
}

export const founders: Founder[] = [
  {
    name: "Austin Tyler",
    credential: "MBA",
    title: "Co-Founder",
    photo: "/images/founders/austin-tyler.jpg",
    initials: "AT",
    blurb: "Grew a book and built agencies the hard way — so the advice you get is current and earned, not theoretical.",
  },
  {
    name: "Andrew Horn",
    title: "Co-Founder",
    photo: "/images/founders/andrew-horn.jpg",
    initials: "AH",
    blurb: "Obsessed with the tools and training that actually move an agent's numbers — and stay close to every agent he brings on.",
  },
];

export const closingCta = {
  heading: "Come build with operators who'll actually pick up.",
  sub: "Top contracts, the full toolkit, and founders in it with you. If that's the FMO you've been looking for, let's talk.",
  primaryCta: { label: "Become a TIG Agent", href: "mailto:join@tylerinsurancegroup.com" },
};
