// ============================================================================
// PRERENDER STEP (runs after `vite build` and `vite build --ssr`)
// ----------------------------------------------------------------------------
// Renders each public marketing route to static HTML and writes it into dist/
// as <route>/index.html, so AI answer-engine crawlers (which do not execute
// JavaScript) and search engines get real content in the raw HTML response.
// Also generates dist/sitemap.xml from the same route list.
//
// The SPA runtime is unchanged: the client still boots via src/main.tsx and
// re-renders on mount (React createRoot replaces the prerendered markup). No
// hydration contract, so no mismatch risk. Non-prerendered routes (the whole
// authenticated app) keep falling back to the SPA index.html via vercel.json.
// ============================================================================

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = join(root, 'dist');
const ssrEntry = join(root, 'dist-ssr', 'entry-server.js');

// ----------------------------------------------------------------------------
// Browser-global shims. The Supabase client (imported by a couple of marketing
// pages) reads `localStorage` at module-init time. Set stubs BEFORE importing
// the SSR bundle so that init does not throw in Node. These are never used to
// store anything during render.
// ----------------------------------------------------------------------------
function installBrowserShims() {
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => void store.set(k, String(v)),
      removeItem: (k) => void store.delete(k),
      clear: () => store.clear(),
      key: (i) => Array.from(store.keys())[i] ?? null,
      get length() {
        return store.size;
      },
    };
  }
  if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
  if (typeof globalThis.self === 'undefined') globalThis.self = globalThis;
}

installBrowserShims();

const { render, routes, SITE } = await import(pathToFileURL(ssrEntry).href);

const template = readFileSync(join(distDir, 'index.html'), 'utf8');

// --- head rewriting helpers -------------------------------------------------
const escAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Replace a tag matched by `re` using a function replacer (avoids `$` in the
// replacement being interpreted as a backreference).
function sub(html, re, value) {
  return html.replace(re, () => value);
}

function applyHead(html, meta, canonicalUrl) {
  let out = html;
  out = sub(out, /<title>[\s\S]*?<\/title>/, `<title>${escText(meta.title)}</title>`);
  out = sub(
    out,
    /<meta name="description" content="[\s\S]*?"\s*\/>/,
    `<meta name="description" content="${escAttr(meta.description)}" />`,
  );
  out = sub(
    out,
    /<link rel="canonical" href="[\s\S]*?"\s*\/>/,
    `<link rel="canonical" href="${escAttr(canonicalUrl)}" />`,
  );
  out = sub(
    out,
    /<meta property="og:title" content="[\s\S]*?"\s*\/>/,
    `<meta property="og:title" content="${escAttr(meta.title)}" />`,
  );
  out = sub(
    out,
    /<meta property="og:description" content="[\s\S]*?"\s*\/>/,
    `<meta property="og:description" content="${escAttr(meta.description)}" />`,
  );
  out = sub(
    out,
    /<meta property="og:url" content="[\s\S]*?"\s*\/>/,
    `<meta property="og:url" content="${escAttr(canonicalUrl)}" />`,
  );
  out = sub(
    out,
    /<meta name="twitter:title" content="[\s\S]*?"\s*\/>/,
    `<meta name="twitter:title" content="${escAttr(meta.title)}" />`,
  );
  out = sub(
    out,
    /<meta name="twitter:description" content="[\s\S]*?"\s*\/>/,
    `<meta name="twitter:description" content="${escAttr(meta.description)}" />`,
  );
  if (meta.jsonld) {
    const block = `<script type="application/ld+json">\n${JSON.stringify(meta.jsonld, null, 2)}\n</script>\n  </head>`;
    out = sub(out, /\s*<\/head>/, `\n    ${block}`);
  }
  return out;
}

function outPathFor(url) {
  // '/' -> dist/index.html ; '/insights/foo' -> dist/insights/foo/index.html
  if (url === '/') return join(distDir, 'index.html');
  return join(distDir, url.replace(/^\//, ''), 'index.html');
}

// --- render every route -----------------------------------------------------
const all = routes();
let count = 0;
for (const meta of all) {
  const appHtml = render(meta.url);
  const canonicalUrl = meta.url === '/' ? `${SITE}/` : `${SITE}${meta.url}`;

  let html = meta.keepTemplateHead ? template : applyHead(template, meta, canonicalUrl);
  html = sub(html, /<div id="root"><\/div>/, `<div id="root">${appHtml}</div>`);

  const outPath = outPathFor(meta.url);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  count += 1;
}

// --- sitemap.xml ------------------------------------------------------------
const urls = all
  .map((m) => {
    const loc = m.url === '/' ? `${SITE}/` : `${SITE}${m.url}`;
    const lastmod = m.lastmod ? `\n    <lastmod>${m.lastmod}</lastmod>` : '';
    const priority = m.priority != null ? `\n    <priority>${m.priority.toFixed(1)}</priority>` : '';
    return `  <url>\n    <loc>${escText(loc)}</loc>${lastmod}${priority}\n  </url>`;
  })
  .join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
writeFileSync(join(distDir, 'sitemap.xml'), sitemap, 'utf8');

console.log(`[prerender] wrote ${count} static route(s) + sitemap.xml (${all.length} urls)`);
