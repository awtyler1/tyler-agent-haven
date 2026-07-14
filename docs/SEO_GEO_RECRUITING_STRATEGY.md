# TIG Public Site: SEO, GEO & Recruiting-Funnel Strategy

**Prepared:** July 14, 2026
**Scope:** Reposition and rearchitect the public-facing site (tigagenthub.com) to rank, get cited by AI assistants, and convert serious Medicare agents and agency principals into contracted, producing downline. Recruiting funnel, not beneficiary marketing.
**Status:** Strategy of record. Research-backed. Items needing a TIG decision are flagged `[NEEDS INPUT]`.

> **A note on what this is optimizing for.** The searcher here is a business decision-maker choosing where to place their book, not a senior choosing a plan. Every recommendation below is measured in contracted agents, retained production, and override growth. It is not measured in beneficiary leads. The whole document assumes that distinction.

> **Implementation log (July 14, 2026 — shipped on `claude/medicare-fmo-seo-strategy-4k3q1i`):** The gating technical work is done. The five public marketing routes now prerender to static HTML at build time (`src/prerender/entry-server.tsx` + `scripts/prerender.mjs`), so AI crawlers and search engines receive real content, per-page title/description/canonical, and Article JSON-LD instead of an empty `<div id="root">`. Also shipped: Organization + WebSite entity schema in `index.html`, a Kentucky-first default title/description with absolute OG tags, a build-generated `sitemap.xml`, and a `robots.txt` that explicitly allows the AI answer-engine crawlers. The SPA runtime (authenticated agent + admin app) is unchanged.
>
> **Content shipped (same date):** three high-intent transparency/comp articles, each targeting a query cluster the strategy identified and each now prerendered with its own metadata: "Who owns your book of business?" (`/insights/who-owns-your-book`), "How Medicare FMO commissions actually work" (`/insights/how-fmo-commissions-work`), and "Medicare agent commissions in Kentucky: 2026 and 2027" (`/insights/kentucky-medicare-commissions-2027`). Comp figures use the verified CMS caps; no invented release terms; no over-cap inducement framing. One line in the book-ownership piece asserts TIG's release terms are in writing and the direct-pay/you-own-it model. Confirm that sentence matches TIG's actual contract before relying on it publicly. Remaining work is content and positioning, tracked in Action Items below.

---

## Executive Summary

TIG has strong raw material and a broken distribution layer. The founders are named and credentialed, the voice is honest and distinctive, there are eleven substantive agent-facing articles, and there is a working book-value tool. That is more genuine operator proof than most competitors put on the page. But almost none of it is reaching the channels where agents now make FMO decisions, for three compounding reasons:

1. **The site is invisible to AI assistants.** tigagenthub.com is a client-rendered single-page app. The public routes ship an empty `<div id="root">` and paint content with JavaScript. In 2026, ChatGPT, Claude, and Perplexity crawlers fetch raw HTML and do not execute JavaScript. To the exact tools agents now use to build FMO shortlists, the site is a blank page. This single fact caps everything else and is the top priority.

2. **The site is thin and mistargeted for search.** Five public routes, one static `<title>` and meta description serving every page, no `sitemap.xml`, no structured data, no per-article social tags. The content that exists is good but under-built for the high-intent queries agents actually type.

3. **The positioning leaves the market's biggest opening on the table.** Across roughly twenty competitors, almost nobody publishes their real commission grid, their release policy as a standalone page, or original survey data. That transparency gap is the single most defensible wedge in the channel, and it happens to be exactly what agents say they fear most (getting trapped, not owning their book). TIG is positioned to own it and currently does not.

The strategic thesis: **win on radical transparency and operator-built infrastructure, in a defined geography first, published as static HTML that both Google and AI assistants can actually read.** Not on "biggest overrides," which is now both a credibility loser and a live compliance risk.

The highest-leverage first move is not a content calendar. It is making the marketing pages render as real HTML, then publishing three transparency assets (release policy, an honest FMO-selection pillar, and one original data report) that no competitor has. Everything else compounds off that.

---

## Current Situation

**What exists on the public site today** (from the codebase):

| Route | What it is | SEO/GEO state |
|-------|-----------|---------------|
| `/` (LandingPage) | Founder-led recruiting pitch, blunt voice, "1,000+ policies in 4 years" | Client-rendered; single global meta tag |
| `/join` (BecomeAgentPage) | Inquiry form, routes to founders | No indexable content of value; fine as a conversion page |
| `/book-value` (BookEstimatorPage) | Interactive book-value estimator, sets its own `document.title` | Good asset, invisible to non-JS crawlers |
| `/insights` (InsightsPage) | Article index, 8 cards, category filters | Client-rendered feed |
| `/insights/:slug` (InsightsArticlePage) | Full articles (What / Why / Do template) | 11 article bodies in `articles.ts`, client-rendered |

Everything else (`/hub`, `/admin/*`, training, carrier resources, contracting) is correctly auth-gated and out of scope for public SEO.

**Content quality is genuinely good.** "What a Medicare FMO really does, and how to pick one that grows you" already targets a top-intent recruiting query and answers it honestly, including the override economics and a "read the release terms before you sign" instruction. The CMS 2027 commissions article is factually accurate (verified against the June 1, 2026 CMS memo: $725 initial / $363 renewal MA, $130 / $65 PDP). The voice clears the CLAUDE.md True / Useful / Clear bar. This is an asset to amplify, not rewrite.

**The technical and structural problems:**

- **Client-side rendering.** `index.html` ships `<div id="root"></div>` and one `<script type="module">`. Content only exists after JS runs. Confirmed against source; a live crawl-view fetch was blocked by this environment's egress policy, but the source is dispositive.
- **One static meta block for the entire site.** Every route inherits the same `<title>` ("Tyler Insurance Group | Independent Medicare FMO") and description from `index.html`. Per-page titles are set client-side via `document.title`, which non-JS crawlers never see.
- **No `sitemap.xml`.** `robots.txt` exists but only `Allow`s a handful of social/search bots and says nothing to the AI crawlers.
- **No structured data.** No Organization, Person, FAQ, or Article JSON-LD anywhere.
- **`og:image` is a relative path** (`/tyler-logo.webp`), which many scrapers will not resolve to an absolute URL.
- **Split brand identity.** The product lives at tigagenthub.com; email and legal identity are tylerinsurancegroup.com. For entity resolution (which AI assistants lean on heavily) this dilutes the footprint.
- **"Nationwide" tagline.** `landingContent.ts` reads "Independent Medicare FMO · Nationwide," yet CLAUDE.md notes Kentucky-specific carrier data and the founders operate from a 859 (Lexington KY) area code. Claiming nationwide surrenders the one thing a small FMO can actually win: a defensible geography.

**Positioning inputs, as inferred from the codebase** (confirm the flagged ones):

- **Brand:** Tyler Insurance Group (TIG)
- **Segment:** growth-minded 1 to 3 year agents and small downline builders ("scale your Medicare business")
- **Geography:** Kentucky first. **DECIDED (July 2026):** commit to the Kentucky wedge, retire "Nationwide," expand regionally only after owning the state.
- **Upline / ecosystem:** Pinnacle (the RTS import pipeline points to Pinnacle) `[NEEDS INPUT: confirm]`
- **Signature differentiator:** operator-built infrastructure. TIG literally built this agent platform (CRM, contracting wizard, book tracking, RTS import). That is the persona's ideal claim made real: "operator-grade infrastructure the agent could not build alone." This is the moat and it is underused on the public site.
- **Release / vesting stance:** copy asserts "fast releases" and "your book is yours," but no standalone page states the actual terms `[NEEDS INPUT: exact written release + vesting terms]`
- **Transparency depth:** **DECIDED (July 2026):** publish release policy, vesting/book-ownership stance, AND an honest override/street comp-economics explainer (Crowe-style), without publishing a proprietary commission grid. Strong differentiation, manageable exposure.
- **Public brand domain:** **DECIDED (July 2026):** target `agents.` or `join.tylerinsurancegroup.com` as a subdomain of the preferred brand domain, pointed at the existing Vercel deployment. This requires only one DNS record and does NOT touch or redesign the existing consumer-facing tylerinsurancegroup.com site. Fallback if DNS access is inconvenient: keep the site on tigagenthub.com and unify entity signals (consistent NAP, `sameAs` schema linking both domains as one organization, consistent branding). Not a blocker for any other workstream.
- **Proof assets:** 1,000+ policies in 4 years; named founders (Austin Tyler MBA, Andrew Horn MHA); the platform itself; 11 articles; the book-value tool.

---

## Industry Trends

- **The comp framework re-stabilized, then deregulated.** The 2024 CMS rule that would have folded administrative payments into the cap and banned volume-based FMO contract terms was vacated by the N.D. Texas court in August 2025 and not appealed. The pre-2024 FMV framework governs again. CY2026 caps are in effect ($694/$347 MA, $114/$57 PDP national); CY2027 is announced ($725/$363, $130/$65), with the largest PDP raise in years, a signal CMS wants agents writing drug plans.
- **Marketing rules loosened for 2027.** The CY2027 final rule (published April 6, 2026, marketing provisions effective October 1, 2026) removed the 48-hour SOA waiting period, dropped the SHIP reference from the TPMO disclaimer, and eliminated the 12-hour educational-to-marketing separation. The regulatory posture is now deregulatory.
- **Consolidation fatigue is real and loud.** Integrity Marketing Group's roll-up of Agent Pipeline, Premier, Western, NAA, and others has produced a visible agent backlash: "burn and churn," no operational cohesion, staff who cannot explain onboarding, and monopoly concern. This is a positioning gift for an independent, operator-run shop.
- **Agents are actively shopping uplines.** Spark Advisors' 2026 Medicare Agent Needs Report headline: 50% of Medicare brokers are considering switching uplines this year. Half the market is in motion.
- **Enforcement moved from CMS rulemaking to DOJ and FTC.** With the comp restrictions gone, the risk center of gravity shifted to the False Claims Act (the eHealth / GoHealth / SelectQuote kickback case survived dismissal in March 2026) and FTC earnings-claims enforcement against recruiting representations. Details in Compliance Risks.
- **B2B discovery is shifting into AI assistants.** 51% of B2B software buyers now start research with an AI chatbot more often than Google (G2, 2026); AI chatbots are the number one influence on vendor shortlists; and 95% of the time the winning vendor was already on the Day-One shortlist (6sense). Being in the AI's consideration set before first contact is most of the game.

---

## SEO Analysis

**The competitive SERP for agent queries is weakly contested and almost entirely self-promotional.** For "best Medicare FMO 2026," the results are FMO-owned "criteria guides" pretending to be rankings, plus Redbird's aggregator listicle. No independent editorial authority ranks. This is a soft field. Concrete openings by query cluster:

- **"how to get released from FMO"** — roughly half the top results are Insurance Forums threads. When forums outrank businesses, Google is telling you no one wrote the authoritative page. This is the highest-opportunity query in the channel and it maps directly to agents' number one fear.
- **"first day vesting Medicare FMO"** — no page owns the term. Open keyword.
- **"who owns my book of business Medicare"** — a Michigan GA (Action Benefits) owns it with a plain exact-match title. Beatable.
- **"FMO vs IMO vs NMO"** — Ritter owns this in text, podcast, and course form. Do not fight here; reference it and move on.
- **"Medicare agent commissions 2026/2027"** — everyone republishes the same CMS table. Redbird differentiates with an interactive calculator. The opening is analysis (street vs. override vs. LOA, what the number means for take-home), which almost nobody adds.
- **Local: "best Medicare FMO in [city] 2026"** — only TMS Brokerage is running geo-modified posts. A wide-open, low-competition tactic that suits a geographically-focused FMO perfectly.

**On-page reality for TIG:** the site cannot compete on these queries until (a) pages render as HTML and (b) each target query has a dedicated, well-titled page. Right now there is neither. The good news is that the content voice and depth needed to win are already demonstrated in `articles.ts`; the gap is architecture and coverage, not writing ability.

**Structured-data and hygiene gaps** (all currently missing): per-page `<title>`/description, canonical tags, `sitemap.xml`, Organization + Person schema (entity disambiguation), Article schema on posts, FAQ schema on the pillar pages, absolute `og:image` URLs, and submission to Bing Webmaster Tools (feeds ChatGPT and Copilot retrieval) and attention to Brave (feeds Claude), not just Google.

---

## AI Search (GEO) Analysis

This is where the largest gap and the largest opportunity both live.

**The gating fact: AI crawlers do not render JavaScript.** Multiple 2026 server-log analyses agree that GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, and PerplexityBot fetch raw HTML with no rendering pass. GPTBot downloads JS files in a minority of requests but never executes them. Googlebot is the only major crawler that fully renders JS. So a client-rendered SPA can still rank in Google yet appear as an empty container to ChatGPT, Claude, and Perplexity. TIG's marketing pages are in exactly that state today. **Nothing else in GEO matters until this is fixed.**

**Which engine reads which index** (so you optimize the right substrate, not "AI" in the abstract):

| Assistant | Retrieval substrate | Implication |
|-----------|--------------------|-------------|
| ChatGPT / Copilot | Bing index (+ Google Shopping for product carousels) | Get indexed and performing in **Bing** |
| Gemini / Google AI Overviews / AI Mode | Google index, passage-level "query fan-out" | Google technical SEO still matters |
| Claude | Brave Search index | Check **Brave** rankings, which almost no one does |
| Perplexity | Own crawl, near-real-time | Fresh content can be cited within hours |

**What actually earns AI citations** (measured, strongest first):

1. **On-page GEO edits** (the one peer-reviewed study, Princeton/Georgia Tech/AI2, KDD 2024): adding statistics (+~41% visibility), citing authoritative sources inline, and adding quotations lifted generative-engine visibility 30 to 40%, with the biggest gains going to lower-ranked sites (up to +115% for a site ranked around fifth). GEO tactics disproportionately help small brands. This is directly actionable in TIG's existing article template.
2. **Digital PR / earned media**: distributing content across third-party news sites produced a 239% median lift in AI citations (Stacker/Scrunch, 2026); roughly a quarter of LLM citations come from earned media. Best-measured off-page tactic.
3. **Presence in the third-party listicles AI engines cite** (Peec AI, ~200k AI responses). For finance-adjacent verticals like this one, being present across many cited lists matters more than ranking first within one. Tactic: get TIG onto Redbird's list, UplineReview's state pages, Lead Heroes' directory, and any "best FMO in Kentucky" roundup.
4. **Original first-party data**: original research is cited at roughly 3 to 10x the rate of standard blog posts and creates a citation "terminus" models trace back to you. Almost no FMO does this (Spark is the exception).
5. **Brand mentions and YouTube**: unlinked brand web mentions and YouTube presence correlate with AI visibility about 3x more strongly than backlinks; YouTube is the most-cited domain in Google AI Overviews. A genuine TIG YouTube channel hits both signals.
6. **Reddit and community**: Reddit is the single most-cited source across engines. Authentic participation in r/InsuranceAgent-type threads is real leverage; astroturfing is a ban-and-blowback risk, so it must be genuine.

**What to treat as cheap hygiene, not strategy:** `llms.txt` (roughly 10% adoption, no measured correlation with citations, no major provider committed to it) and schema markup (no measured correlation with LLM citations in independent studies, though still worth doing for Google-side entity hygiene). Do both because they are nearly free; do not expect them to move the needle by themselves.

**The scoreboard changed.** AI referral traffic is still only about 1% of total web traffic, but AI-search visitors convert at roughly 4.4x traditional organic, and half of B2B buyers now start in a chatbot. So the near-term goal is not sessions. It is being the entity the assistant names when an agent asks "which Medicare FMO should I look at in Kentucky?" Measure citations and branded demand, not raw clicks.

---

## Brand / Positioning Analysis

**TIG's real, ownable position:** *the transparent, operator-built FMO for agents who want to grow, run by people who still sell and who built the infrastructure themselves.* Three pillars, all backed by assets TIG already has:

1. **Radical transparency.** Publish the release policy, the vesting stance, and how the override economics actually work, as content. This is the market's biggest gap and agents' biggest fear. It is also, conveniently, the compliance-safe way to talk about money (see below).
2. **Operator-built infrastructure.** TIG built the CRM, contracting wizard, book tracking, and RTS import that agents usually duct-tape together. That is provable, demonstrable (screenshots, demos, a "what our back-office actually does" walkthrough), and nearly impossible for a brochureware competitor to fake.
3. **Founder access and mentorship.** Named founders, real cell numbers, "operators who still sell." Already in the copy; underleveraged as proof (video, case studies with numbers).

**Positioning changes to make:**

- **Retire "Nationwide"; claim Kentucky (DECIDED).** "The Medicare FMO built in Kentucky, for agents who want to grow" is defensible; "Nationwide" is not, for a small shop. Own the state, then the region, then expand.
- **Reframe away from override/comp size.** The current copy already does this well ("Overrides don't grow books"), which is both smart positioning and, as it turns out, the compliant posture. Lean in. Make transparency the headline, not comp.
- **Unify the entity (DECIDED: subdomain preferred).** Preferred path: serve the recruiting site from `agents.` or `join.tylerinsurancegroup.com` (one DNS record; does not touch the existing consumer site). Fallback: keep tigagenthub.com and unify signals. Either way, make NAP, the About/leadership page, off-site mentions, and `sameAs` schema consistent so both domains resolve to one organization. The domain string matters far less than consistent entity signals; do not let the DNS ask block anything.
- **Build the missing About/leadership page.** There is founder content on the landing page but no dedicated, schema-marked leadership/entity page with verifiable track record. This is a core GEO entity asset and it does not exist yet.

**Tone read:** the blunt, no-hype voice is a genuine differentiator. Health1's "No-BS Guide" wins its query almost entirely on tone in a field of bland copy, and Spark wins mindshare with adversarial "dark side of FMO contracting" thought leadership. TIG's voice is already in that register. Use it.

---

## Competitive Analysis

**The field, and where each leaves an opening:**

- **Ritter Insurance Marketing** — the content incumbent. Owns definitional queries via a ~1,550-episode podcast, Knight School training, and deep blog. Notably, Ritter publishes its release policy (open release, postponed 6 months for new agents, paused Sept 1 to Dec 31). *Do not fight Ritter on "what is an FMO." Beat them on transparency depth (actual grid, not just release timing) and on being local and operator-run rather than a large marketing org.*
- **Spark Advisors** — the strategic outlier. VC-backed, recruits agencies, publishes original research (the 50%-switching stat) and adversarial thought leadership. *Their weakness: they barely rank for generic queries and target agencies, not individual 1 to 3 year agents. That segment is TIG's.*
- **Redbird Agents** — the aggregator. Ranks 1 to 2 for nearly every "top FMO" query with a listicle FMOs treat as a badge, plus a commission calculator. *Action: get TIG evaluated for their list; build a better calculator.*
- **Pinnacle Financial, Crowe, Applied GA, PSM, TMS, Lourie, The Brokerage (Inc and Resource), New Horizons** — volume-SEO and criteria-guide players. Crowe is unusually transparent on comp (states every contract is full street, paid direct, agent owns the book). TMS runs the geo-modified "best FMO in [city]" tactic. *Most are beatable on depth and honesty; borrow Crowe's transparency and TMS's local play.*
- **Health1** — single "No-BS Guide" winning on tone. *Proof that voice beats volume in this SERP. TIG can out-execute this with a fuller, equally honest library.*

**Cross-cutting white space (what almost nobody does):**

1. Publish the **actual commission grid**.
2. Publish the **release policy as a standalone, indexed page** (Ritter is the only one close).
3. Publish **original survey/benchmark data** (Spark alone).
4. Build **interactive tools** (Redbird's calculator alone; TIG already has the book-value estimator, a head start).
5. Own the **release / vesting / book-ownership query cluster**, currently ceded to forums.

TIG can credibly take four of these five in six months.

**The reputation layer: UplineReview.** NPN-verified reviews across seven categories (commissions, support, training, compliance, transparency, technology, reporting), with programmatic state pages ("Best Medicare FMOs in [state]"). It is a two-sided platform (it also lets FMOs flag agents with chargeback debt). *Actions: establish a TIG presence, encourage genuine verified reviews from real producing agents, and monitor it. One caveat worth noting internally: UplineReview's ownership is not disclosed anywhere public, so treat its "rankings" with appropriate skepticism even while participating.*

---

## The Crowe Playbook (steal-worthy, from a friendly operator)

Ed Crowe (Crowe & Associates, Brookfield CT, working through the Pinnacle ecosystem) has grown almost entirely through organic agent-side content. He is a friendly operator, not a competitor in TIG's geography, so his playbook is a model to learn from directly. The core lesson: **he built a compounding library of exact-match, agent-intent pages and made radical comp transparency the ranking strategy itself.** The same page that ranks for "Medicare FMO compensation" is the one that says "we take 0% of your commission." Below are the highest-value, most-replicable moves, mapped to TIG's plan. (Page content observed via search snippets; verify live figures before reuse.)

**Structural lessons:**

- **Two-namespace site:** newer optimized "money" pages at the root (`/best-fmo-for-medicare-agents/`, `/medicare-commissions-2026/`) plus a deep evergreen back-catalog under `/agentblog/`. The moat is *volume plus vintage*: hundreds of dated pages compounding since ~2015. TIG cannot fake the vintage, but it can start the compounding now and win on depth-per-topic where Crowe wins on breadth.
- **Agent-only audience focus.** Nearly everything targets the agent/recruit, not the beneficiary. TIG's public site is already correctly agent-only; keep that discipline.
- **The exact-match title discipline** (title and slug mirror the query verbatim). Cheap and effective. (Crowe also prefixes titles with a literal "1" as a SERP pattern-interrupt. Distinctive but unproven; adopt the exact-match discipline, skip the gimmick.)

**The specific assets to build (ranked by value, all evidenced to work for Crowe):**

1. **A state-by-state commission table, refreshed and re-slugged every year.** Real CMS FMV dollars in a per-state chart (`/medicare-commissions-2026/` model). Ranks for "Medicare commissions [year]" and doubles as a trust flag. Spin a fresh year-stamped URL each year, leave prior years live to keep catching "[old year] commissions" searches. For TIG this is a natural fit with a Kentucky-first framing and pairs with the CMS 2027 article already written.
2. **The "who owns your book of business" explainer**, contrasting direct-carrier-pay (you own renewals, they follow you on release) vs. upline-owned commissions, including how release and once-a-year hierarchy changes actually work. This is the transparency centerpiece and the recruiting pitch in one page. Already prioritized in TIG's transparency cluster; Crowe's version is the template.
3. **Worked first-year and second-year income math** for a named state (e.g., "80 MAPD in year one → roughly $X, then $Y in year two with renewals"). Answers "how much can I actually make." Build two near-duplicates to catch both "how much can a Medicare agent earn" and "how much do Medicare agents make." Keep every number defensible and framed as typical, not best-case (see Compliance Risks: FTC earnings-claims exposure).
4. **A seasonal AHIP / certification traffic magnet, published every June** when AHIP opens. Enormous new-agent search volume; a top-of-funnel net that pulls in agents before they have chosen an FMO. Frame it as a compliant "how to pass / module walkthrough," not answer-sharing (Crowe's version pushes into exam-answer territory that TIG should not copy).
5. **The "how the hierarchy works" education cluster** (overrides, street vs. true-up, becoming a general agency with overrides, "what does ready-to-sell mean"). Owning the boring plumbing queries positions TIG as the honest broker and catches agents researching whether to switch.
6. **Compliance content as authority and timeliness bait** (TPMO disclaimer, CMS call-recording, one-to-one consent, compliant sales events), refreshed whenever CMS rules change. Agents search these urgently each season. Note the 2027 marketing-rule changes are a fresh hook right now.
7. **A weekly live webinar to evergreen-YouTube loop.** Crowe runs fixed-time live sessions (Wed/Thu 1pm ET), records them, and reposts to YouTube and an on-demand library. One weekly production yields perpetual ranking video plus a recruiting library that answers "how do I sell Medicare." This is also TIG's single best lever for the YouTube signal (the strongest measured correlate of AI visibility) and it plays to TIG's "operators who still sell" positioning.
8. **A money-back conversion offer stated in plain dollars** as the primary CTA, dropped inside every educational article, with the catch disclosed. Crowe uses lead-cost reimbursement and new-agent licensing-cost reimbursement, and the transparency about the condition (Crowe must be the upline) is part of why it converts. TIG should state whatever its real offer is in specific numbers, not vague "marketing support," and keep the claim defensible.

**What TIG should NOT copy:** the "1"-prefix title gimmick (unproven), the AHIP exam-answer framing (compliance and reputation risk), and the sprawl of thin near-duplicate pages (Google's tolerance for that is falling; TIG should win on fewer, deeper, more honest pages). And keep the comp content anchored to *caps and how pay works*, never to inducement dollars (see Compliance Risks).

---

## Compliance Risks

The regulatory picture materially changes what TIG should and should not say. Verified as of July 2026:

- **Comp caps are settled and safe to cite.** CY2026 and CY2027 FMV figures are published and firm. TIG's existing CMS article is accurate. Citing the caps is low-risk.
- **The 2024 comp restrictions are dead.** Vacated August 2025, not appealed. Administrative payments and overrides are outside the cap again, subject only to the pre-existing "not more than the value of the service" standard.
- **But the enforcement risk moved, it did not disappear.** Two live exposures now govern recruiting content:
  1. **DOJ False Claims Act / Anti-Kickback.** The eHealth / GoHealth / SelectQuote case (alleging kickbacks disguised as "marketing," "co-op," and "sponsorship" payments to steer enrollments) survived nearly all motions to dismiss in March 2026. The theory is now judicially endorsed. **Implication:** any recruiting pitch that touts "marketing money," override size, or carrier-funded bonuses as the reason to join echoes the exact pattern under enforcement. Avoid making inducement dollars the headline.
  2. **FTC earnings-claims enforcement.** The FTC's Labor Task Force is actively hitting unsubstantiated income and earnings claims made to recruits (multiple 2026 actions). A proposed Earnings Claim Rule is pending. **Implication:** "make six figures," "free leads," and similar claims must be true, substantiated with typical (not best-case) results, and non-misleading. Prefer provable specifics ("1,000+ policies in 4 years," which is a factual production claim, not an income promise) over hype.

- **Keep agent-facing and beneficiary-facing content cleanly separated.** No new CMS rule mandates a specific separation, but the operative principle stands: recruiting content aimed at agents sits outside the Medicare marketing definition and must not be co-mingled with pages carrying plan-benefit content a beneficiary could act on. The current site is correctly agent-only; keep it that way.
- **State (Kentucky):** no KY-specific agent-recruiting or commission-disclosure rule found. Standard anti-rebating and appointment law applies. Nothing blocks the transparency strategy.

**Net:** the transparency-first, comp-size-quiet positioning is not only better marketing, it is the lower-risk posture. The two align.

---

## Opportunities (ranked)

1. **Own the transparency cluster.** Release policy page, vesting page, "who owns your book" page, honest comp-economics explainer. Highest strategic value, directly on agents' top fear, and the market's biggest gap.
2. **Make the site machine-readable.** Prerender/SSG the marketing pages so Google and every AI crawler can read them. Unlocks everything else.
3. **Publish one original data report.** A "Kentucky (or regional) Medicare Agent Report" or an override/support-transparency benchmark. The single strongest durable GEO moat in a channel of recycled "what is an FMO" posts.
4. **Own the local queries.** "Best Medicare FMO in Kentucky / Lexington / Louisville 2026" pages. Near-zero competition.
5. **Turn the operator-built platform into proof content.** Demos, screenshots, a "what our back-office actually does" walkthrough. Nearly impossible to fake.
6. **Build a real YouTube presence.** Founder POV, FMO-trap teardowns, tool walkthroughs. Strongest measured correlate of AI visibility.
7. **Get onto the listicles and review platforms AI ingests.** Redbird's list, UplineReview, Lead Heroes directory, local roundups.
8. **Upgrade the book-value tool into a lead-capturing, citable asset** and add a commission/override calculator.

---

## Short-term Strategy (0 to 6 months)

**Theme: make the site readable, then plant the transparency flag.**

1. **Prerender the marketing pages.** Convert `/`, `/insights`, `/insights/:slug`, `/book-value`, `/join`, and new marketing routes to static HTML at build time. Options in Technical Recommendations. Keep the authenticated app as an SPA. **This is item zero; sequence it first.**
2. **Per-page meta + structured data.** Unique `<title>`, description, canonical, absolute `og:image` per route; Organization + Person schema on an About page; Article schema on posts; FAQ schema on pillars.
3. **Ship `sitemap.xml`; fix `robots.txt`** to explicitly allow OAI-SearchBot, ChatGPT-User, GPTBot, PerplexityBot, ClaudeBot, Google-Extended, and Bingbot, and confirm no CDN/WAF rule is silently 403-ing them. Submit to Bing Webmaster Tools and Google Search Console.
4. **Build the transparency assets** (the three that beat the whole field):
   - **Release policy page** stating TIG's actual terms plainly. `[NEEDS INPUT: exact terms]`
   - **"How to choose a Medicare FMO (and how to leave one)"** pillar, expanded from the existing article, statistic-dense and answer-shaped in the top third (per the GEO evidence).
   - **"Who owns your book of business?"** page targeting that exact query.
5. **Build the About / leadership page** with named founders, credentials, verifiable track record, and Person schema. Core entity asset; currently missing.
6. **Apply GEO edits to existing articles:** add statistics, inline authoritative citations, and quotable one-sentence answers near the top of each. Low effort, measured 30 to 40% visibility lift.
7. **Retire "Nationwide"; stand up one Kentucky local page** as a pilot for the geo play. Reframe the landing tagline to a Kentucky-first line (e.g., "The Medicare FMO built in Kentucky, for agents who want to grow"). Edit `landingContent.ts` (`tig.tagline`).
8. **Set up the brand subdomain (when DNS access is convenient).** Add `agents.` or `join.tylerinsurancegroup.com` in Vercel and point it at the existing deployment. One DNS record; no consumer-site changes. Non-blocking; do it whenever the favor is easy to ask.

## Medium-term Strategy (6 to 18 months)

**Theme: build the data moat and the multi-channel footprint.**

1. **Publish the first original data report** (agent survey or override/support benchmark) and pitch it as digital PR. This is the GEO engine and the digital-PR hook in one.
2. **Launch YouTube** with a consistent cadence: founder POV, FMO-trap teardowns, tool demos, honest carrier reviews.
3. **Complete the transparency cluster:** vesting page, comp-economics explainer, an FMO due-diligence checklist, and "questions to ask before you contract."
4. **Expand local pages** across the target region; add the commission/override calculator; upgrade the book-value tool to capture qualified inquiries.
5. **Earn presence on review/aggregator platforms:** get real verified reviews on UplineReview, pursue inclusion on Redbird and directory lists, seed authentic community participation.
6. **Digital PR flywheel:** syndicate data and commentary to insurance trade outlets to build the earned-media citations that drive the measured +239% AI-citation lift.

## Long-term Strategy (2 to 5 years)

**Theme: durable, sellable brand equity.**

1. **Become the cited authority for the segment and geography.** The goal state: when an agent asks any AI assistant "which Medicare FMO in Kentucky should I look at," TIG is named, with transparency and operator-built tech as the reasons.
2. **Make original research an annual franchise** (the regional Medicare Agent Report, year over year). Compounding citations and press.
3. **Build the content ecosystem into an owned audience:** newsletter, podcast or video series, community. Reduces dependence on any single algorithm.
4. **Pursue entity permanence:** Wikidata entity, consistent NAP everywhere, enough earned coverage to clear notability if a Wikipedia page ever becomes viable.
5. **Expand geography deliberately,** state by state, each with the same local-authority playbook, never as thin doorway pages.

---

## Specific Action Items

**Engineering (unblocks everything):**
- [x] **SHIPPED** Prerender marketing routes to static HTML. `src/prerender/entry-server.tsx` + `scripts/prerender.mjs`; build now runs client build, SSR build, then prerender. SPA runtime unchanged.
- [x] **SHIPPED** Per-page `<title>`, meta description, canonical, absolute `og:image` on all five marketing routes (injected at prerender time).
- [x] **SHIPPED** Generate `sitemap.xml` from the route list at build time. *Still to do: submit it in Search Console + Bing Webmaster Tools after deploy.*
- [x] **SHIPPED** Rewrite `robots.txt` for AI crawlers. *Still to do post-deploy: confirm no Vercel/WAF 403s against the AI-crawler user agents.*
- [x] **SHIPPED** Organization + WebSite JSON-LD in `index.html`; Article JSON-LD on posts. *Still to do: Person schema on the About page (page not built yet) and FAQ schema on the pillar pages (not built yet).*
- [ ] Submit to Bing Webmaster Tools + Google Search Console; check Brave. `[MEDIUM IMPACT / LOW EFFORT]` *(post-deploy)*
- [ ] Verify a preview deploy: fetch a marketing route as a bot user-agent and confirm content is in the raw HTML; smoke-test the authenticated app still boots. `[HIGH IMPACT / LOW EFFORT]`

**Content (plant the flag):**
- [ ] Release policy page. `[HIGH IMPACT / LOW EFFORT once terms are confirmed]`
- [ ] "How to choose an FMO (and how to leave one)" pillar. `[HIGH IMPACT / MEDIUM EFFORT]`
- [ ] "Who owns your book" page. `[HIGH IMPACT / LOW EFFORT]`
- [ ] About / leadership page with schema. `[HIGH IMPACT / MEDIUM EFFORT]`
- [ ] GEO-edit existing 11 articles (stats, citations, top-of-page answers). `[HIGH IMPACT / LOW EFFORT]`
- [ ] One Kentucky local page (pilot). `[MEDIUM IMPACT / LOW EFFORT]`
- [ ] First original data report. `[HIGH IMPACT / HIGH EFFORT]`

**Positioning / decisions:**
- [x] **DECIDED:** Geography = Kentucky first. Retire "Nationwide."
- [x] **DECIDED:** Transparency depth = release + vesting + honest comp-economics explainer (no proprietary grid).
- [x] **DECIDED:** Domain = target `agents.`/`join.tylerinsurancegroup.com` subdomain (one DNS record, no consumer-site redesign); fallback keep tigagenthub.com with unified entity signals. Non-blocking.
- [ ] `[NEEDS INPUT]` Exact written release and vesting terms (needed to author the release policy page).
- [ ] `[NEEDS INPUT]` Confirm upline/ecosystem (Pinnacle) and whether it can be named.

---

## Priority Matrix

**Done (shipped July 14, 2026):**
- ~~Prerender the marketing site~~ · ~~per-page meta + canonical + absolute OG~~ · ~~`sitemap.xml` + AI-crawler `robots.txt`~~ · ~~Organization/WebSite/Article JSON-LD~~

**High Impact / Low Effort (do next):**
- Release policy page (once terms confirmed)
- "Who owns your book" page
- GEO edits to existing articles (stats, inline citations, top-of-page answers)
- Annual Kentucky commission table (Crowe Playbook #1)

**High Impact / High Effort (fund and schedule):**
- FMO-selection pillar ("how to choose an FMO, and how to leave one")
- About/leadership page (Person schema)
- First original data report
- Weekly webinar to evergreen-YouTube loop (Crowe Playbook #7)

**Medium Impact (steady build):**
- JSON-LD across pages
- Kentucky + regional local pages
- Commission/override calculator; book-tool upgrade
- YouTube channel
- Bing/Brave presence and review-platform footprint

**Low Priority (nice to have):**
- `llms.txt` (cheap hygiene, no measured effect)
- Wikidata entity (low cost, unmeasured benefit)
- Advanced schema types beyond the core set

---

## Expected Business Impact

Framed in recruiting terms, not beneficiary leads. Directional, not guaranteed; the channel is under-instrumented and these are planning estimates.

- **Near-term (0 to 6 mo):** the crawlability fix plus transparency pages should move TIG from effectively unindexed to competitive on low-competition, high-intent queries (release, book ownership, vesting, local FMO). Realistic near-term outcome: a measurable lift in qualified agent inquiries from organic and a first wave of AI citations for the transparency cluster. The mechanism is being present in the shortlist, not raw traffic volume.
- **Medium-term (6 to 18 mo):** the data report and multi-channel footprint should establish TIG as a named entity in AI answers for the segment/geography, improving contract-to-production quality (agents who arrive via honest, high-consideration content self-select for fit) and lowering release rate (transparency sets accurate expectations up front).
- **Long-term (2 to 5 yr):** durable authority compounds into a steady organic recruiting pipeline, higher retention, and override growth from a book of better-fit, longer-tenured agents. The brand equity itself becomes a sellable asset, which aligns with the "build an asset, not a job" thesis TIG already preaches to its agents.

---

## KPIs

Anchor on recruiting outcomes, not vanity metrics:
- Qualified agent inquiries (form + call), by source
- Contracting starts
- Contract-to-production rate (percent of contracted agents who write within 90 days)
- Agent retention rate / release rate
- Override revenue per recruited agent
- Branded search volume + "TIG reviews" visibility
- AI-citation presence (share of "which FMO" answers naming TIG across ChatGPT, Claude, Perplexity, Gemini)
- Share of voice vs. named competitors (Ritter, Spark, Redbird, Pinnacle) on the target query set

## Metrics to Monitor

- Indexation and crawl status in Google Search Console + Bing Webmaster Tools (confirm the prerender fix worked; watch for AI-crawler 403s)
- Rankings for the target query clusters (release, vesting, book ownership, local FMO, commissions)
- AI-referral traffic and conversion rate (segment separately; expect low volume, high intent)
- Citations and brand mentions across AI engines (via a GEO-tracking tool)
- UplineReview presence and rating trend
- YouTube growth and, specifically, whether videos start appearing as AI-Overview citations
- Original-report pickups (earned-media placements, backlinks, citations)

## Potential Obstacles

- **Engineering bandwidth.** The prerender migration is real work on a live SPA. Mitigate by scoping it to marketing routes only and leaving the authenticated app untouched.
- **Release/comp transparency is sensitive.** Publishing real terms and (ideally) a grid may feel exposing. But it is the single biggest differentiator and the compliance-safe posture. The ask is honesty, not disclosure of anything proprietary about upline economics.
- **Content velocity.** Winning requires sustained publishing. The existing article engine and voice make this feasible, but it needs an owner and a cadence.
- **AI measurement is immature.** Citation tracking is noisy and platform-specific. Accept directional signals; do not over-optimize to any single tool.
- **Egress/verification.** Some live-competitor and live-site checks in this research were blocked by environment egress policy; competitive on-page specifics are from search snippets, not full-page reads. Re-verify key competitor claims before publishing anything comparative.

## Future Risks

- **Regulatory whiplash.** The comp framework is in active legal flux. A future rule could re-impose administrative-payment limits or FMO contract-term restrictions. Keep comp claims verifiable and current; never encode over-cap or inducement-style economics into positioning.
- **Enforcement escalation.** The eHealth FCA case and FTC earnings-claims posture could expand. The transparency-first, comp-size-quiet strategy is resilient to this by design.
- **Platform dependence.** AI engines change retrieval logic frequently. The hedge is owned audience (newsletter, video, community) and original data, which travel across algorithm changes.
- **Consolidation pressure.** If Integrity-scale roll-ups keep absorbing FMOs, independence becomes rarer, which is a positioning tailwind, but carrier-access and override economics could tighten for small shops. Monitor upline stability.
- **Zero-click erosion.** As AI Overviews and chat answers absorb more informational intent (position-1 organic CTR already down ~58% when an AI Overview appears), the value of ranking shifts further toward being cited. Plan content to be quotable, not merely rankable.

---

## Appendix: Selected Evidence

- CMS agent/broker compensation (CY2026 $694/$347 MA, $114/$57 PDP; CY2027 $725/$363, $130/$65): CMS HPMS memos, corroborated by Ritter, PSM, Action Benefits.
- 2024 comp rule vacated (N.D. Tex., Aug 18 2025, not appealed): Healthcare Dive, Health Law Advisor, Medicare Rights.
- eHealth/GoHealth/SelectQuote FCA case survived dismissal (Mar 25 2026): DOJ; Sheppard Mullin; Georgetown Litigation Tracker.
- CY2027 final rule marketing deregulation (48-hr SOA removed, etc.; eff. Oct 1 2026): Federal Register 2026-06600; CMS fact sheet; Holland & Knight.
- AI crawlers do not render JavaScript: Vercel/MERJ log analyses, 2026.
- On-page GEO edits +30 to 40% visibility (stats/citations/quotations), larger for lower-ranked sites: Princeton/Georgia Tech/AI2, KDD 2024.
- Earned media +239% median AI-citation lift: Stacker/Scrunch, 2026.
- 51% of B2B buyers start research in a chatbot; AI chat is the #1 shortlist influence: G2 2026 AI Search Insight Report.
- 95% of B2B wins were already on the Day-One shortlist: 6sense Buyer Experience Report.
- 50% of Medicare brokers considering switching uplines: Spark Advisors 2026 Medicare Agent Needs Report.
- Position-1 organic CTR down ~58% with AI Overviews present: Ahrefs, Dec 2025.

*Full source URLs are retained in the research working notes for this engagement and available on request.*
