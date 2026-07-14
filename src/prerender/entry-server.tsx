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
import AboutPage from '../pages/AboutPage';
import ChoosingFmoPage from '../pages/ChoosingFmoPage';
import KentuckyReportPage from '../pages/KentuckyReportPage';

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
        <Route path="/about" element={<AboutPage />} />
        <Route path="/choosing-a-medicare-fmo" element={<ChoosingFmoPage />} />
        <Route path="/kentucky-medicare-market-report" element={<KentuckyReportPage />} />
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
      url: '/choosing-a-medicare-fmo',
      title: 'How to Choose a Medicare FMO (and How to Leave One) | Tyler Insurance Group',
      description:
        'The honest framework for choosing a Medicare FMO: how you are paid, who owns your book, release policy, carrier access, tech, and support. Plus the questions to ask before you sign and how to leave one.',
      priority: 0.9,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is the most important thing to look for in a Medicare FMO?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Whether you own your book of business. If you are paid directly by the carrier at the full CMS commission and your renewals follow you when you leave, you own it. If your commissions are assigned to the agency, they own it. Everything else is secondary to that.',
            },
          },
          {
            '@type': 'Question',
            name: 'Do all FMOs pay the same commission?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'At street level, effectively yes. CMS sets a maximum commission each year, and a good FMO pays you that full amount directly from the carrier. The FMO earns a separate override from the carrier on top of your check, and that override is roughly the same everywhere. So "we pay the most" is usually a myth. Judge FMOs on what they do with the override, not on the number itself.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do I get released from my FMO?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Request the release in writing from a principal officer of the agency. Fair FMOs state their release policy up front. Note two things: many uplines pause releases during AEP (September 1 to December 31), and for most carriers you can change your hierarchy once a year around your contract anniversary without any release at all. If an upline refuses to release you, carriers generally allow a self-release after a waiting period, commonly six months.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is the difference between direct pay and LOA?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Direct pay means the carrier pays you the full commission and you own the book. LOA, or licensed-only-agent, means the carrier pays the agency and the agency pays you a share, usually while keeping ownership of the book. Some agents take an LOA deal early for leads or salary. Just know the trade you are making.',
            },
          },
        ],
      },
    },
    {
      url: '/kentucky-medicare-market-report',
      title: 'The Kentucky Medicare Market: An Agent’s 2026 Report | Tyler Insurance Group',
      description:
        'Original data report: Kentucky has ~900,000 Medicare beneficiaries, ~55% in Medicare Advantage, an aging and less-healthy senior population, and a disrupted 2026 market. What the numbers mean for Medicare agents, fully sourced.',
      priority: 0.9,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'Report',
        headline: 'The Kentucky Medicare Market: An Agent’s 2026 Report',
        description:
          'A sourced synthesis of public CMS, KFF, Census, and industry data on the Kentucky Medicare market, compiled for Medicare agents.',
        datePublished: '2026-07-14',
        author: { '@type': 'Organization', name: 'Tyler Insurance Group', '@id': `${SITE}/#organization` },
        publisher: { '@type': 'Organization', name: 'Tyler Insurance Group', '@id': `${SITE}/#organization` },
        mainEntityOfPage: `${SITE}/kentucky-medicare-market-report`,
        about: [
          { '@type': 'Thing', name: 'Medicare in Kentucky' },
          { '@type': 'Thing', name: 'Medicare Advantage' },
          { '@type': 'Thing', name: 'Medicare insurance agents' },
        ],
        isAccessibleForFree: true,
      },
    },
    {
      url: '/about',
      title: 'About Tyler Insurance Group | Medicare FMO Built in Kentucky',
      description:
        'Tyler Insurance Group is a Kentucky-built Medicare FMO run by operators who still sell. Meet the founders, and see what we believe about transparency, book ownership, and how an FMO should treat its agents.',
      priority: 0.7,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        mainEntity: { '@id': `${SITE}/#organization` },
        about: [
          {
            '@type': 'Person',
            name: 'Austin Tyler',
            jobTitle: 'Broker Development',
            honorificSuffix: 'MBA',
            worksFor: { '@id': `${SITE}/#organization` },
          },
          {
            '@type': 'Person',
            name: 'Andrew Horn',
            jobTitle: 'Broker Development',
            honorificSuffix: 'MHA',
            worksFor: { '@id': `${SITE}/#organization` },
          },
        ],
      },
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
