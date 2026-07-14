# Content Workflow: Articles & YouTube

**How to add public content to the TIG site so it ranks, gets cited by AI, and converts agents.**
Companion to `docs/SEO_GEO_RECRUITING_STRATEGY.md`. Last updated: July 2026.

The public marketing site prerenders to static HTML at build time (`src/prerender/`), so anything you add here is readable by search engines AND by AI crawlers (which do not run JavaScript). The pipeline handles the technical parts automatically. Your job is the writing and the linking.

---

## The quality bar (every piece, no exceptions)

From `CLAUDE.md`. If a draft fails these, it is not done.

- **True.** Every fact sourced or verified. No invented numbers. For commissions, use the current CMS caps. Never state release terms we have not confirmed in writing.
- **Useful / actionable.** The reader can *do* something with it. Answer "so what, for me?"
- **Clear.** High signal, low noise. Cut anything not pulling its weight.
- **No em dashes.** Use a period, comma, colon, or parentheses.

**Compliance guardrails (recruiting content):**
- Do not lead with "highest paying" / "marketing money" / bonus inducements. That framing is the exact pattern under DOJ and FTC enforcement. Sell transparency, tools, and support instead.
- Income examples must be defensible and framed as typical, not best-case. No "make six figures."
- Keep it agent-facing. This is recruiting content, not beneficiary marketing. Do not co-mingle plan-benefit sales content.

---

## Adding an article

An article in the `/insights` feed is **two data edits**. No routing, no schema by hand, no build config.

### 1. Write the body — `src/data/articles.ts`

Add an `Article` object. Follow the What / Why / Do template already in the file:
- `takeaways`: 3 one-liners (the whole point in 10 seconds). **These render near the top, which is the zone AI engines cite from. Make them quotable and specific.**
- `what`: paragraphs (`{type:'p'}`), subheads (`{type:'h'}`), bullet lists (`{type:'ul'}`).
- `why`: the broker-impact beat (renders in the dark callout).
- `actions`: "do this now" steps.

### 2. Add the feed card — `src/data/insights.ts`

Add an `InsightPost` with the **same `slug`** and set `articleSlug` to the article's slug (usually identical). Fields: `slug`, `title`, `excerpt`, `category`, `author`, `date`, `readTime`, `articleSlug`.

- **`cover` is optional.** Leave it off and the card gets a sensible motif for its `category` automatically (see `CATEGORY_COVER`). Only set an explicit `cover` for a cornerstone piece you want to stand out, and if you do, make it a unique motif (a dev warning fires if two pieces set the *same* explicit cover).

### 3. SEO habits that matter (do these while writing)

- **Title = an exact query an agent types.** "How to get released from an FMO," not "Thoughts on releases."
- **Front-load the answer.** The first lines and the takeaways should answer the question outright. Add a statistic or two with its source; stat-dense, definitive copy gets cited more.
- **Link it in.** This is the step people skip and it is the biggest multiplier:
  - Add the article to the relevant hub cluster (usually the *Go deeper* grid in `src/pages/ChoosingFmoPage.tsx`).
  - Cross-reference it from one or two related articles (mention them by title in the prose).

### 4. Ship

```bash
npm run build   # auto-prerenders the new /insights/<slug> page,
                # auto-generates its Article JSON-LD, updates sitemap.xml
```

Commit, push, open a PR, merge to `main`. Vercel deploys from `main`.

### 5. After it is live (once per publish)

Re-submit the sitemap in Google Search Console and Bing Webmaster Tools so it is picked up quickly (see the SEO strategy doc's activation section).

---

## Adding a YouTube video

YouTube presence is the single strongest correlate of AI-search visibility, so treat the channel as a first-class surface and **mirror every video onto the site** so the site earns the signal too.

### On YouTube

- **Title** = an exact-match query, same discipline as an article.
- **Description** = a real 150+ word writeup of the key points, with a link back to the matching page on the site. Not "like and subscribe."
- **Cadence beats polish.** One recurring format (a weekly live session, recorded and reposted) compounds. This is the proven FMO playbook.

### On the site (this is the part that compounds)

For each video, put it on a page that has all three of these:

1. **The embed** (a YouTube iframe) so a human can watch it.
2. **A text summary or transcript.** AI crawlers do not run JavaScript, so the iframe is invisible to them. The *text* is what they read and cite. This is non-negotiable for the video to count for GEO.
3. **`VideoObject` JSON-LD** (name, description, thumbnailUrl, uploadDate, embedUrl, duration) injected at prerender time, so the video is eligible for video rich results and reinforces the brand entity.

> The reusable video-embed component + `VideoObject` schema support is not built yet (deferred until the first real video so it can be verified end to end). When you have a video URL, that is a ~1-file addition following the same prerender pattern as the article pages.

### The loop

Record → clip → post to YouTube (optimized title + description) → embed + summarize on the site → link from the relevant article and hub. One production, several placements, both channel and site get stronger.

---

## What the pipeline does for you automatically

So you know what you do *not* have to touch:

- Prerenders every public route to static HTML (`scripts/prerender.mjs`).
- Generates per-article Article JSON-LD from the insights data.
- Generates `sitemap.xml` from the route list.
- Serves an AI-crawler-friendly `robots.txt`.
- Injects Organization / WebSite entity schema site-wide.

You add the content and the internal links. The pipeline makes it machine-readable.
