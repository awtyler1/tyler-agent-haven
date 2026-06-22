import { useEffect, useMemo, useState } from 'react';
import { trainingItems, type TrainingItem, type TrainingType } from '@/data/trainingContent';

// ── type → tab label + card glyph ────────────────────────────────────────────
const TYPE_LABEL: Record<TrainingType, string> = {
  guide: 'One-Pager',
  video: 'Video',
  article: 'Article',
  playbook: 'Playbook',
  'case-study': 'Case study',
};
const TAB_LABEL: Record<TrainingType, string> = {
  guide: 'One-Pagers',
  video: 'Videos',
  article: 'Articles',
  playbook: 'Playbooks',
  'case-study': 'Case Studies',
};
// canonical tab order
const TYPE_ORDER: TrainingType[] = ['guide', 'video', 'playbook', 'article', 'case-study'];

// small deterministic hash so each doc gets its own bar pattern
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// the graphic that sits behind every card — never flat
function Thumb({ item }: { item: TrainingItem }) {
  if (item.type === 'guide' || item.type === 'article') {
    const h = hash(item.id);
    const goldFirst = h % 2 === 0;
    const widths = [82, 60, 92, 70, 88, 64]; // line widths, rotated by hash
    const off = h % widths.length;
    return (
      <div className={`tr-th tr-th--doc`}>
        <span className="tr-th__corner" aria-hidden="true" />
        <span className="tr-badge tr-badge--doc">{item.type === 'guide' ? '1-page guide' : 'Article'}</span>
        <div className="tr-paper" aria-hidden="true">
          <span className={`tr-paper__bar ${goldFirst ? 'g' : ''}`} />
          <span className={`tr-paper__bar ${goldFirst ? '' : 'g'}`} style={{ width: '56%' }} />
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="tr-paper__ln" style={{ width: `${widths[(off + i) % widths.length]}%` }} />
          ))}
        </div>
      </div>
    );
  }
  if (item.type === 'video') {
    return (
      <div className="tr-th tr-th--vid">
        <Rings />
        <span className="tr-badge tr-badge--vid">Video</span>
        <span className="tr-play">▶</span>
        {item.duration && <span className="tr-dur">{item.duration}</span>}
      </div>
    );
  }
  // playbook / case-study
  const isCase = item.type === 'case-study';
  return (
    <div className={`tr-th ${isCase ? 'tr-th--case' : 'tr-th--play'}`}>
      <Rings light />
      <span className="tr-badge tr-badge--play">{TYPE_LABEL[item.type]}</span>
      <span className="tr-play tr-play--sq">{isCase ? '📊' : '📘'}</span>
    </div>
  );
}

// faint concentric-ring motif so video / playbook thumbs feel designed
function Rings({ light = false }: { light?: boolean }) {
  const c = light ? 'rgba(255,255,255,.16)' : 'rgba(201,168,76,.22)';
  return (
    <svg className="tr-rings" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle cx="158" cy="22" r="60" fill="none" stroke={c} strokeWidth="1.4" />
      <circle cx="158" cy="22" r="40" fill="none" stroke={c} strokeWidth="1.4" />
      <circle cx="158" cy="22" r="22" fill="none" stroke={c} strokeWidth="1.4" />
      <circle cx="22" cy="104" r="34" fill="none" stroke={c} strokeWidth="1.4" />
    </svg>
  );
}

function Card({ item }: { item: TrainingItem }) {
  return (
    <a className="tr-card" href={item.href} target="_blank" rel="noopener noreferrer">
      {item.isNew && <span className="tr-new">New</span>}
      <Thumb item={item} />
      <div className="tr-cb">
        <div className="tr-ct">{item.title}</div>
        <div className="tr-cm">
          {TYPE_LABEL[item.type]}
          {item.duration ? ` · ${item.duration}` : ''}
          {item.category ? ` · ${item.category}` : ''}
        </div>
      </div>
    </a>
  );
}

export default function TrainingLibrary() {
  const [tab, setTab] = useState<'all' | TrainingType>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    document.title = 'Learning Center | Tyler Insurance Group';
  }, []);

  const hasContent = trainingItems.length > 0;

  // which type tabs to show, in canonical order, with counts
  const tabs = useMemo(() => {
    const present = TYPE_ORDER.filter((t) => trainingItems.some((i) => i.type === t));
    return present.map((t) => ({ type: t, label: TAB_LABEL[t], count: trainingItems.filter((i) => i.type === t).length }));
  }, []);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return trainingItems
      .filter((i) => (tab === 'all' ? true : i.type === tab))
      .filter((i) =>
        !needle
          ? true
          : i.title.toLowerCase().includes(needle) ||
            (i.category || '').toLowerCase().includes(needle) ||
            (i.blurb || '').toLowerCase().includes(needle),
      )
      .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  }, [tab, q]);

  return (
    <div className="tr">
      <style>{CSS}</style>
      <div className="tr-bg" aria-hidden="true" />
      <div className="tr-max">
        <div className="tr-top">
          <div>
            <h1 className="tr-h1">Learning Center</h1>
            <div className="tr-sub">Filter by what you need: one-pagers to hand a client, videos to learn, playbooks to run.</div>
          </div>
          {hasContent && (
            <label className="tr-search">
              <span aria-hidden="true">🔍</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search the library…"
                aria-label="Search training library"
              />
            </label>
          )}
        </div>

        {!hasContent ? (
          <div className="tr-soon">
            <div className="tr-soon__glow" aria-hidden="true" />
            <div className="tr-soon__ic" aria-hidden="true">🎓</div>
            <div className="tr-soon__lbl">Coming soon</div>
            <h2 className="tr-soon__t">We're building the library.</h2>
            <p className="tr-soon__p">
              One-pagers, training videos, playbooks, and case studies — on product knowledge, your CRM, and
              growing your book — are on the way. Check back soon.
            </p>
          </div>
        ) : (
          <>
            <div className="tr-tabs" role="tablist">
              <button className={`tr-tab ${tab === 'all' ? 'on' : ''}`} onClick={() => setTab('all')} role="tab" aria-selected={tab === 'all'}>
                All <span className="n">{trainingItems.length}</span>
              </button>
              {tabs.map((t) => (
                <button
                  key={t.type}
                  className={`tr-tab ${tab === t.type ? 'on' : ''}`}
                  onClick={() => setTab(t.type)}
                  role="tab"
                  aria-selected={tab === t.type}
                >
                  {t.label} <span className="n">{t.count}</span>
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="tr-empty">No matches{q ? ` for “${q}”` : ''}. Try another tab or search.</div>
            ) : (
              <div className="tr-grid">
                {visible.map((item) => (
                  <Card key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const CSS = `
.tr{
  --em:#0E3B2E; --em2:#0a2c22; --bone:#F4F1E8; --card:#fff; --line:#e7e0cf; --muted:#6b6457; --ink:#1b2620; --gold:#C9A84C; --gold2:#A8801F;
  position:relative; flex:1 1 auto; min-height:0; overflow-y:auto;
  font-family:'Outfit','Inter',system-ui,sans-serif; color:var(--ink);
  -webkit-font-smoothing:antialiased; padding:30px 36px 56px;
  background:
    radial-gradient(900px 440px at 100% -6%, rgba(201,168,76,.16), transparent 60%),
    radial-gradient(760px 480px at -8% 112%, rgba(14,59,46,.12), transparent 56%),
    linear-gradient(180deg,#f7f3ea 0%, #efe9da 100%);
}
.tr *{ box-sizing:border-box; }
/* faint dot-grid texture so the page never reads flat */
.tr-bg{ position:absolute; inset:0; pointer-events:none; z-index:0;
  background-image:radial-gradient(rgba(14,59,46,.05) 1px, transparent 1.4px);
  background-size:22px 22px; mask-image:linear-gradient(180deg,#000,transparent 88%); }
.tr-max{ position:relative; z-index:1; max-width:1060px; margin:0 auto; }

.tr-top{ display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap; margin-bottom:6px; }
.tr-h1{ font-size:25px; font-weight:700; letter-spacing:-.02em; margin:0; }
.tr-sub{ font-size:12.5px; color:var(--muted); margin-top:3px; max-width:60ch; }
.tr-search{ display:flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--line);
  border-radius:11px; padding:9px 13px; min-width:250px; box-shadow:0 1px 0 rgba(0,0,0,.02); }
.tr-search input{ border:0; outline:0; background:transparent; font-size:16px; width:100%; color:var(--ink); font-family:inherit; }
.tr-search input::placeholder{ color:var(--muted); }

/* tabs */
.tr-tabs{ display:flex; gap:7px; flex-wrap:wrap; margin-top:18px; border-bottom:1px solid var(--line); }
.tr-tab{ font-family:inherit; font-size:13px; font-weight:600; color:var(--muted); background:transparent;
  border:1px solid transparent; border-bottom:none; padding:9px 15px; border-radius:10px 10px 0 0;
  cursor:pointer; position:relative; top:1px; transition:.12s; }
.tr-tab:hover{ color:var(--em); }
.tr-tab .n{ font-size:11px; opacity:.65; margin-left:5px; }
.tr-tab.on{ color:var(--em); background:#fff; border-color:var(--line); }
.tr-tab.on:after{ content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:var(--em); }

/* grid + cards */
.tr-grid{ margin-top:20px; display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
.tr-card{ position:relative; background:#fff; border:1px solid var(--line); border-radius:14px; overflow:hidden;
  text-decoration:none; color:var(--ink); box-shadow:0 1px 0 rgba(0,0,0,.02); transition:.16s; }
.tr-card:hover{ transform:translateY(-3px); box-shadow:0 12px 26px rgba(14,59,46,.12); border-color:#dcd3bd; }
.tr-new{ position:absolute; top:9px; right:9px; z-index:3; font-size:9.5px; font-weight:800; letter-spacing:.04em;
  text-transform:uppercase; color:var(--em2); background:linear-gradient(135deg,#e7cf86,var(--gold)); padding:3px 9px; border-radius:20px;
  box-shadow:0 2px 6px rgba(168,128,31,.3); }

/* thumbnail graphics */
.tr-th{ position:relative; height:128px; display:flex; align-items:center; justify-content:center; overflow:hidden; }
.tr-th--doc{ background:linear-gradient(155deg,#f4efe2,#e6dcc1); border-bottom:1px solid var(--line); }
.tr-th--vid{ background:linear-gradient(135deg,#1d5d49,#0a2c22); }
.tr-th--play{ background:linear-gradient(135deg,#d9c389,#a8801f); }
.tr-th--case{ background:linear-gradient(135deg,#b9cbbf,#5e7d6e); }
.tr-th__corner{ position:absolute; top:0; right:0; border-width:0 22px 22px 0; border-style:solid;
  border-color:#fff #fbf8f0 transparent transparent; filter:drop-shadow(-1px 1px 0 var(--line)); }
.tr-rings{ position:absolute; inset:0; width:100%; height:100%; }
.tr-paper{ position:relative; width:74px; height:92px; background:#fff; border:1px solid #ddd2b8; border-radius:3px;
  padding:9px 8px; box-shadow:0 4px 11px rgba(0,0,0,.12); }
.tr-paper__bar{ display:block; height:4px; border-radius:2px; background:var(--em); margin-bottom:4px; width:80%; }
.tr-paper__bar.g{ background:var(--gold); }
.tr-paper__ln{ display:block; height:2.5px; border-radius:2px; background:#d8d2c4; margin-bottom:3.5px; }
.tr-play{ position:relative; z-index:2; width:42px; height:42px; border-radius:50%; background:rgba(255,255,255,.94);
  color:var(--em); display:flex; align-items:center; justify-content:center; font-size:15px; box-shadow:0 4px 12px rgba(0,0,0,.2); }
.tr-play--sq{ border-radius:11px; }
.tr-badge{ position:absolute; top:9px; left:9px; z-index:2; font-size:9px; font-weight:700; letter-spacing:.05em;
  text-transform:uppercase; color:#fff; padding:3px 8px; border-radius:20px; }
.tr-badge--doc{ background:rgba(14,59,46,.88); }
.tr-badge--vid{ background:rgba(0,0,0,.5); }
.tr-badge--play{ background:rgba(14,59,46,.55); }
.tr-dur{ position:absolute; bottom:9px; right:9px; z-index:2; font-size:10px; font-weight:600;
  background:rgba(0,0,0,.6); color:#fff; padding:2px 7px; border-radius:5px; }

.tr-cb{ padding:11px 13px 14px; }
.tr-ct{ font-size:13.5px; font-weight:600; line-height:1.3; }
.tr-cm{ font-size:11px; color:var(--muted); margin-top:5px; }

.tr-empty{ margin-top:30px; text-align:center; color:var(--muted); font-size:13.5px; }

/* coming soon */
.tr-soon{ position:relative; overflow:hidden; margin-top:22px; background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone);
  border-radius:20px; padding:54px 40px; text-align:center; }
.tr-soon__glow{ position:absolute; top:-100px; left:50%; transform:translateX(-50%); width:560px; height:380px;
  background:radial-gradient(circle,rgba(201,168,76,.18),transparent 60%); pointer-events:none; }
.tr-soon__ic{ position:relative; font-size:40px; margin-bottom:14px; }
.tr-soon__lbl{ position:relative; font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--gold); margin-bottom:10px; }
.tr-soon__t{ position:relative; font-size:26px; font-weight:700; letter-spacing:-.02em; margin:0 0 12px; }
.tr-soon__p{ position:relative; font-size:14.5px; color:rgba(244,241,232,.78); line-height:1.65; max-width:52ch; margin:0 auto; }

@media(max-width:980px){ .tr-grid{ grid-template-columns:repeat(3,1fr); } }
@media(max-width:720px){
  .tr{ padding:20px; }
  .tr-grid{ grid-template-columns:repeat(2,1fr); gap:13px; }
  .tr-search{ min-width:0; width:100%; }
  .tr-soon{ padding:40px 22px; }
}
@media(max-width:430px){ .tr-grid{ grid-template-columns:1fr; } }
`;
