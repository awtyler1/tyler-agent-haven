import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { knowledgeItems, KNOWLEDGE_META, type KnowledgeCategory } from '@/data/knowledgeContent';
import { articles } from '@/data/articles';

const CATEGORIES = ['All', ...Object.values(KNOWLEDGE_META).map((m) => m.label)];

// Unified feed entry — either an internal article (`to`) or an external/text link (`href`).
interface FeedEntry {
  id: string;
  title: string;
  category: KnowledgeCategory;
  date: string;
  source?: string;
  summary?: string;
  href?: string;
  to?: string;
  pinned?: boolean;
}

function buildFeed(): FeedEntry[] {
  const external: FeedEntry[] = knowledgeItems.map((k) => ({
    id: k.id, title: k.title, category: k.category, date: k.date,
    source: k.source, summary: k.summary, href: k.href, pinned: k.pinned,
  }));
  const internal: FeedEntry[] = articles.map((a) => ({
    id: a.slug, title: a.title, category: a.category, date: a.date,
    source: 'TIG', summary: a.summary, to: `/knowledge/${a.slug}`,
  }));
  return [...external, ...internal];
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupItems(items: FeedEntry[]) {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const buckets: { label: string; items: FeedEntry[] }[] = [];
  const push = (label: string, item: FeedEntry) => {
    let b = buckets.find((x) => x.label === label);
    if (!b) { b = { label, items: [] }; buckets.push(b); }
    b.items.push(item);
  };
  for (const it of items) {
    const d = new Date(it.date + 'T00:00:00');
    if (d >= weekAgo) push('This week', it);
    else if (it.date.slice(0, 7) === thisMonth) push('Earlier this month', it);
    else push(d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), it);
  }
  return buckets;
}

function FeedItem({ item }: { item: FeedEntry }) {
  const meta = KNOWLEDGE_META[item.category];
  const external = item.href?.startsWith('http');
  const style = { ['--ec' as string]: meta.color };
  const inner = (
    <>
      <div className="kn-item__body">
        <div className="kn-item__top">
          <span className="kn-item__cat" style={{ color: meta.color }}>{meta.label}</span>
          {item.source && <span className="kn-item__src">· {item.source}</span>}
        </div>
        <div className="kn-item__t">{item.title}</div>
        {item.summary && <div className="kn-item__s">{item.summary}</div>}
      </div>
      <span className="kn-item__date">{formatDate(item.date)}</span>
      {external && <span className="kn-item__ext" aria-hidden="true">↗</span>}
    </>
  );

  if (item.to) return <Link className="kn-item" style={style} to={item.to}>{inner}</Link>;
  if (item.href) {
    return (
      <a className="kn-item" style={style} href={item.href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {inner}
      </a>
    );
  }
  return <div className="kn-item" style={style}>{inner}</div>;
}

export default function IndustryUpdatesPage() {
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    document.title = 'Knowledge & Updates | Tyler Insurance Group';
  }, []);

  const all = buildFeed();
  const hasContent = all.length > 0;
  const filtered = all
    .filter((i) => filter === 'All' || KNOWLEDGE_META[i.category].label === filter)
    .sort((a, b) => b.date.localeCompare(a.date));
  const pinned = filtered.find((i) => i.pinned);
  const rest = filtered.filter((i) => i !== pinned);
  const groups = groupItems(rest);

  return (
    <div className="kn">
      <style>{CSS}</style>
      <div className="kn-max">
        <div className="kn-head">
          <h1 className="kn-h1">Knowledge &amp; Updates</h1>
          <div className="kn-sub">What's happening in Medicare — and what it means for you.</div>
        </div>

        {!hasContent ? (
          <div className="kn-soon">
            <div className="kn-soon__glow" aria-hidden="true" />
            <div className="kn-soon__ic" aria-hidden="true">📈</div>
            <div className="kn-soon__lbl">Coming soon</div>
            <h2 className="kn-soon__t">Industry insights are on the way.</h2>
            <p className="kn-soon__p">
              We'll post the CMS rulings, carrier news, market trends, and compliance reminders that
              actually affect your book — with our plain-English take. Check back soon.
            </p>
            <div className="kn-soon__chips">
              {Object.values(KNOWLEDGE_META).map((m) => (
                <span className="kn-soon__chip" key={m.label}>{m.label}</span>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="kn-filters">
              {CATEGORIES.map((c) => (
                <button key={c} className={`kn-f${filter === c ? ' on' : ''}`} onClick={() => setFilter(c)}>{c}</button>
              ))}
            </div>

            {pinned && (
              pinned.to ? (
                <Link className="kn-pinned" to={pinned.to}>
                  <div className="kn-pinned__lbl">📌 Pinned</div>
                  <div className="kn-pinned__t">{pinned.title}</div>
                  {pinned.summary && <div className="kn-pinned__s">{pinned.summary}</div>}
                  <div className="kn-pinned__m">{KNOWLEDGE_META[pinned.category].label}{pinned.source ? ` · ${pinned.source}` : ''} · {formatDate(pinned.date)}</div>
                </Link>
              ) : (
                <a className="kn-pinned" href={pinned.href || undefined} {...(pinned.href?.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  <div className="kn-pinned__lbl">📌 Pinned</div>
                  <div className="kn-pinned__t">{pinned.title}</div>
                  {pinned.summary && <div className="kn-pinned__s">{pinned.summary}</div>}
                  <div className="kn-pinned__m">{KNOWLEDGE_META[pinned.category].label}{pinned.source ? ` · ${pinned.source}` : ''} · {formatDate(pinned.date)}</div>
                </a>
              )
            )}

            {groups.length === 0 && !pinned ? (
              <div className="kn-empty">Nothing in this category yet.</div>
            ) : (
              groups.map((g) => (
                <div key={g.label}>
                  <div className="kn-group">{g.label}</div>
                  {g.items.map((it) => <FeedItem key={it.id} item={it} />)}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

const CSS = `
.kn{
  --em:#0E3B2E; --bone:#F4F1E8; --card:#fff; --line:#e7e0cf; --muted:#6b6457; --ink:#1b2620; --gold:#C9A84C; --gold2:#A8801F;
  flex:1 1 auto; min-height:0; overflow-y:auto; background:var(--bone);
  font-family:'Outfit','Inter',system-ui,sans-serif; color:var(--ink);
  -webkit-font-smoothing:antialiased; padding:30px 36px 44px;
}
.kn *{ box-sizing:border-box; }
.kn-max{ max-width:760px; margin:0 auto; }
.kn-head{ margin-bottom:14px; }
.kn-h1{ font-size:25px; font-weight:700; letter-spacing:-.02em; margin:0; }
.kn-sub{ font-size:12.5px; color:var(--muted); margin-top:2px; }

.kn-soon{ position:relative; overflow:hidden; background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone); border-radius:20px; padding:54px 40px; text-align:center; margin-top:6px; }
.kn-soon__glow{ position:absolute; top:-100px; left:50%; transform:translateX(-50%); width:560px; height:380px; background:radial-gradient(circle,rgba(201,168,76,.18),transparent 60%); pointer-events:none; }
.kn-soon__ic{ position:relative; font-size:40px; margin-bottom:14px; }
.kn-soon__lbl{ position:relative; font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--gold); margin-bottom:10px; }
.kn-soon__t{ position:relative; font-size:26px; font-weight:700; letter-spacing:-.02em; margin:0 0 12px; }
.kn-soon__p{ position:relative; font-size:14.5px; color:rgba(244,241,232,.78); line-height:1.65; max-width:54ch; margin:0 auto 24px; }
.kn-soon__chips{ position:relative; display:flex; gap:9px; justify-content:center; flex-wrap:wrap; }
.kn-soon__chip{ font-size:12px; font-weight:600; color:rgba(244,241,232,.85); background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.14); padding:7px 14px; border-radius:30px; }

.kn-filters{ display:flex; gap:7px; flex-wrap:wrap; margin-bottom:18px; }
.kn-f{ font-family:inherit; font-size:11.5px; font-weight:600; padding:6px 13px; border-radius:20px; background:var(--card); border:1px solid var(--line); color:var(--muted); cursor:pointer; transition:.15s; }
.kn-f:hover{ border-color:var(--gold); }
.kn-f.on{ background:var(--em); border-color:var(--em); color:var(--bone); }

.kn-pinned{ display:block; background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone); border-radius:16px; padding:20px 22px; margin-bottom:20px; position:relative; overflow:hidden; text-decoration:none; }
.kn-pinned:before{ content:""; position:absolute; top:-70px; right:-50px; width:260px; height:260px; background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); }
.kn-pinned__lbl{ font-size:10.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--gold); margin-bottom:8px; position:relative; }
.kn-pinned__t{ font-size:19px; font-weight:700; line-height:1.25; position:relative; }
.kn-pinned__s{ font-size:13px; color:rgba(244,241,232,.74); margin-top:7px; line-height:1.55; position:relative; }
.kn-pinned__m{ font-size:11.5px; color:rgba(244,241,232,.55); margin-top:11px; position:relative; }

.kn-group{ font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin:22px 0 10px; }
.kn-item{ display:flex; gap:14px; background:var(--card); border:1px solid var(--line); border-radius:13px; padding:15px 17px; margin-bottom:9px; border-left:4px solid var(--ec); transition:.15s; text-decoration:none; color:var(--ink); }
.kn-item:hover{ transform:translateY(-2px); box-shadow:0 10px 22px rgba(20,30,24,.07); }
.kn-item__body{ flex:1; min-width:0; }
.kn-item__top{ display:flex; align-items:center; gap:9px; margin-bottom:4px; }
.kn-item__cat{ font-size:10px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; }
.kn-item__src{ font-size:11px; color:var(--muted); }
.kn-item__t{ font-size:14px; font-weight:600; line-height:1.35; }
.kn-item__s{ font-size:12.5px; color:var(--muted); margin-top:4px; line-height:1.5; }
.kn-item__date{ flex-shrink:0; text-align:right; font-size:11px; color:var(--muted); white-space:nowrap; align-self:flex-start; padding-top:2px; }
.kn-item__ext{ flex-shrink:0; align-self:center; color:var(--muted); font-size:15px; }
.kn-empty{ font-size:13px; color:var(--muted); font-style:italic; padding:20px 0; }

@media(max-width:760px){ .kn{ padding:20px; } .kn-soon{ padding:40px 22px; } }
`;
