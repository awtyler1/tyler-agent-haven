// ============================================================================
// SERVER-RENDER ENTRY (build-time prerender only — NOT shipped to the browser)
// ----------------------------------------------------------------------------
// This module exists so the public marketing routes can be rendered to static
// HTML at build time. AI answer-engine crawlers (GPTBot, ClaudeBot,
// PerplexityBot, etc.) fetch raw HTML and do NOT execute JavaScript, so a
// client-only SPA is an empty page to them. Prerendering the marketing routes
// puts real content in the raw HTML response.
//
// IMPORTANT: this file is used only by `scripts/prerender.mjs` after the normal
// client build. It does NOT change the app's runtime entry (src/main.tsx) or
// the SPA behavior. The authenticated app (agent + admin) is untouched.
// ============================================================================

import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Routes, Route } from 'react-router-dom';

import LandingPage from '../pages/LandingPage';
import BecomeAgentPage from '../pages/BecomeAgentPage';
import BookEstimatorPage from '../pages/BookEstimatorPage';
import InsightsPage from '../pages/InsightsPage';
import InsightsArticlePage from '../pages/InsightsArticlePage';

import { insights } from '../data/insights';

export const SITE = 'https://www.tigagenthub.com';

// Render one marketing URL to an HTML body string.
export function render(url: string): string {
  return renderToString(
    <StaticRouter location={url}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<BecomeAgentPage />} />
        <Route path="/book-value" element={<BookEstimatorPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/insights/:slug" element={<InsightsArticlePage />} />
      </Routes>
    </StaticRouter>,
  );
}

export interface RouteMeta {
  url: string;
  title: string;
  description: string;
  /** Homepage keeps the head already baked into index.html. */
  keepTemplateHead?: boolean;
  /** Extra JSON-LD injected before </head> (Article schema on posts). */
  jsonld?: Record<string, unknown>;
  /** For the sitemap. */
  lastmod?: string;
  /** Sitemap priority hint. */
  priority?: number;
}

// The full list of routes to prerender, with per-page head metadata.
export function routes(): RouteMeta[] {
  const staticRoutes: RouteMeta[] = [
    {
      url: '/',
      title: 'Tyler Insurance Group | Medicare FMO Built in Kentucky',
      description:
        'A Medicare FMO run by operators who still sell. Top contracts, fast written releases, day-one book ownership, and a full tech stack at no cost.',
      keepTemplateHead: true,
      priority: 1.0,
    },
    {
      url: '/insights',
      title: 'Insights: Medicare Agent Playbooks & Industry Updates | Tyler Insurance Group',
      description:
        'Straight talk for Medicare agents: how to choose an FMO, own your book, run AEP, read the CMS commission changes, and build an agency worth selling.',
      priority: 0.8,
    },
    {
      url: '/book-value',
      title: 'What Is Your Medicare Book of Business Worth? | Tyler Insurance Group',
      description:
        'Estimate what your Medicare book of business is worth with a free, no-login tool. Educational estimate based on lives, renewals, and retention.',
      priority: 0.7,
    },
    {
      url: '/join',
      title: 'Become a TIG Agent | Tyler Insurance Group',
      description:
        'Talk to the founders about contracting with Tyler Insurance Group. Top contracts, fast releases, day-one book ownership, and operators in it with you.',
      priority: 0.6,
    },
  ];

  const articleRoutes: RouteMeta[] = insights.map((p) => {
    const description = p.excerpt.length > 300 ? `${p.excerpt.slice(0, 297)}...` : p.excerpt;
    return {
      url: `/insights/${p.slug}`,
      title: `${p.title} | Tyler Insurance Group`,
      description,
      lastmod: p.date,
      priority: 0.7,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: p.title,
        description,
        datePublished: p.date,
        author: { '@type': 'Person', name: p.author.name },
        publisher: {
          '@type': 'Organization',
          name: 'Tyler Insurance Group',
          '@id': `${SITE}/#organization`,
        },
        mainEntityOfPage: `${SITE}/insights/${p.slug}`,
        isAccessibleForFree: true,
      },
    };
  });

  return [...staticRoutes, ...articleRoutes];
}
