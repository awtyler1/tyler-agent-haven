# Measurement Runbook: SEO, GEO & Recruiting Signals

**How to tell whether the public site is working, week one and every month after.**
Companion to `docs/SEO_GEO_RECRUITING_STRATEGY.md` and `docs/CONTENT_WORKFLOW.md`. Last updated: July 2026.

The point of this doc: the goal is not traffic, it is **contracted agents**. Search Console and Bing measure discovery; they do not measure whether an AI assistant recommends TIG or whether an agent contracts. So this runbook tracks three layers: (1) is the site indexed and crawlable, (2) is it getting cited by AI, (3) is it producing recruiting outcomes. Do not confuse layer 1 (easy to measure) with the actual goal (layer 3).

---

## Week one (right after submitting the sitemap)

Week one is about **indexing and coverage**, not traffic. You will not have meaningful clicks yet. That is normal. Check these five, in order.

**1. Google Search Console → Indexing → Pages (the main event).**
- Good: the "Indexed" count climbing toward ~18 (all public pages) over the first days.
- Normal-while-waiting: pages sitting in *Discovered - currently not indexed* or *Crawled - currently not indexed*. Both are expected for a new site and usually clear in days to two weeks. Requesting indexing on a page speeds it up.
- Real red flags: *Excluded by noindex* (we set none, so investigate if it appears), *Duplicate, Google chose different canonical* (our canonicals are explicit, so unlikely), *server error (5xx)*, or *redirect error*.
- Expected and fine: auth pages (`/hub`, `/admin*`, `/auth*`) crawled but not indexed. They are not in the sitemap and should not rank. Ignore them.

**2. Sitemaps.** Confirm status flips to **Success** with ~18 discovered pages (usually within 48h). "Couldn't fetch" right after submission is almost always transient; do not resubmit repeatedly. Once it is Success, you never touch it again. New articles are picked up automatically.

**3. URL Inspection on the money pages.** Spot-check `/choosing-a-medicare-fmo` and `/kentucky-medicare-market-report`. Want to see: *URL is on Google*, a recent last-crawl date, and under *View Crawled Page* that Google received the real content. That is proof the prerender is landing with the crawler.

**4. Performance → Search results (will be sparse, that is fine).**
- Look for: the first impressions, and which queries trigger them. Early impressions are almost all **branded** ("tyler insurance group"). Non-branded, high-intent queries take weeks.
- Ignore week one: click counts (near zero is normal), average position (volatile with tiny data).

**5. Manual Actions + Security.** Both should say **No issues**. Confirm once. A manual penalty stops everything, so you want to know immediately if one ever appears.

**Skip week one:** Core Web Vitals / Page Experience (says "no data" until there is traffic; revisit in a month).

**The one number that matters most week one:** indexed page count. If all ~18 public pages index within two weeks, activation succeeded. If several are stuck in *Crawled - not indexed* past ~3 weeks, that is a thin-content signal worth diagnosing.

---

## The AI scoreboard (do the baseline NOW, before citations exist)

Google does not report whether AI assistants recommend TIG, and that is the actual goal. Measure it manually.

**Baseline (one time, immediately):** open ChatGPT, Claude, Perplexity, and Gemini and ask the questions below. Screenshot every answer. This is the "before" snapshot. Without it, you cannot prove the GEO work landed.

**The standard question set (re-run monthly, same questions every time):**
1. "Which Medicare FMO in Kentucky should I look at?"
2. "Is Tyler Insurance Group a good FMO to work with?"
3. "What should I look for when choosing a Medicare FMO?"
4. "How do I get released from my Medicare FMO?"
5. "Who owns my book of business as a Medicare agent?"
6. "Best Medicare FMO for a new agent in Kentucky."

**Log for each, each month:** Is TIG named? Is it cited/linked? Is what it says accurate? Which of our pages (if any) is the source? The first month any assistant names TIG for these is the day the GEO work paid off, and you will only see it if you have the baseline to compare against.

**Bing Webmaster → AI Performance tab (beta):** the closest thing to a Copilot/AI-citation report. Check it as data accumulates. Bing feeds ChatGPT and Copilot, so it is the most measurable AI surface.

**Brave check:** search a distinctive phrase from the site on search.brave.com. Brave is Claude's retrieval index, and almost nobody checks it.

---

## Monthly cadence (once activated)

| Check | Where | What you are looking for |
|-------|-------|--------------------------|
| Indexed pages | GSC → Pages | All public pages indexed; new articles appearing |
| Query growth | GSC → Performance | Non-branded, high-intent queries starting to show impressions |
| Top pages | GSC → Performance → Pages | Which pages earn impressions/clicks; double down on winners |
| Position trend | GSC → Performance | Movement on target queries (release, book ownership, choose an FMO, KY commissions) |
| Bing performance | Bing Webmaster → Search Performance | Same, for the ChatGPT/Copilot index |
| AI citations | Manual question set + Bing AI Performance | Is TIG named and cited, and by which page |
| Rich results | Rich Results Test (search.google.com/test/rich-results) on `/choosing-a-medicare-fmo` | FAQ schema detected/eligible |
| Core Web Vitals | GSC → Core Web Vitals | Once there is traffic: pass/fail on the report |

---

## KPIs that actually matter (recruiting, not vanity)

Ranking and impressions are inputs. These are the outcomes the whole effort is for. Track them wherever the funnel data lives (CRM, form submissions, contracting records), not in Search Console.

- **Qualified agent inquiries** (form + call), by source.
- **Contracting starts.**
- **Contract-to-production rate** (percent of contracted agents who write within 90 days).
- **Agent retention / release rate.**
- **Override revenue per recruited agent.**
- **Branded search volume** and **"TIG reviews" visibility** (GSC + manual).
- **AI-citation presence** (share of "which FMO" answers naming TIG across the four assistants).
- **Share of voice vs. named competitors** (Ritter, Spark, Redbird, Pinnacle) on the target query set.

The honest attribution note: AI-assisted research is invisible to analytics. An agent may read about TIG inside ChatGPT and then arrive by typing the URL directly or searching the brand name. So a rise in **direct + branded traffic** that tracks with AI-citation gains is a real signal, even though it will not show a chatbot as the referrer. Do not dismiss it as unattributed.

---

## Realistic timeline

- **Days 1-3:** sitemap goes Success; first pages index; first branded impressions.
- **Week 1-2:** most or all public pages indexed; branded queries appear; maybe the first long-tail impressions.
- **Weeks 2-6:** non-branded impressions grow; positions stabilize; first AI citations become possible (they lag indexing).
- **Months 2-4:** the transparency cluster and the Kentucky report are the strongest early-citation candidates because they are the most sourced and answer-shaped.

Do not read silence in the first few weeks as failure. Indexing and especially AI-citation pickup lag. Publish, link, measure, repeat.
