import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { trainingItems, type TrainingItem, type TrainingType, type TrainingMotif } from '@/data/trainingContent';

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

const DEFAULT_MOTIF: Record<TrainingType, TrainingMotif> = {
  guide: 'doc',
  article: 'doc',
  playbook: 'book',
  'case-study': 'chart',
  video: 'play',
};

// the graphic behind every card — a topic-matched motif with its own gradient,
// so the row reads varied instead of flat. 'doc' sits on parchment (dark ink).
function Thumb({ item }: { item: TrainingItem }) {
  const motif: TrainingMotif = item.motif ?? DEFAULT_MOTIF[item.type];
  const dark = motif === 'doc';
  return (
    <div className={`tr-th tr-th--${motif}`}>
      <Rings tone={dark ? 'rgba(14,59,46,.09)' : 'rgba(255,255,255,.16)'} />
      <span className={`tr-badge ${dark ? 'tr-badge--ink' : 'tr-badge--ondark'}`}>{TYPE_LABEL[item.type]}</span>
      <Motif name={motif} dark={dark} />
      {motif === 'play' && item.duration && <span className="tr-dur">{item.duration}</span>}
    </div>
  );
}

// faint concentric-ring backdrop so every thumb has depth
function Rings({ tone }: { tone: string }) {
  return (
    <svg className="tr-rings" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle cx="162" cy="20" r="58" fill="none" stroke={tone} strokeWidth="1.4" />
      <circle cx="162" cy="20" r="38" fill="none" stroke={tone} strokeWidth="1.4" />
      <circle cx="22" cy="106" r="32" fill="none" stroke={tone} strokeWidth="1.4" />
    </svg>
  );
}

// the foreground icon, drawn to match the topic
function Motif({ name, dark }: { name: TrainingMotif; dark: boolean }) {
  const s = dark ? '#0E3B2E' : '#ffffff';
  const p = { fill: 'none', stroke: s, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let inner: ReactNode;
  switch (name) {
    case 'calendar':
      inner = (<>
        <rect x="9" y="11" width="30" height="28" rx="4" {...p} />
        <path d="M9 18 H39" {...p} />
        <path d="M17 7 V13 M31 7 V13" {...p} />
        <path d="M16 28 l4 4 l9 -10" {...p} />
      </>); break;
    case 'compare':
      inner = (<>
        <rect x="6" y="12" width="15" height="25" rx="2.5" {...p} />
        <rect x="27" y="12" width="15" height="25" rx="2.5" {...p} />
        <path d="M10 19 H17 M10 24 H17 M10 29 H15" {...p} />
        <path d="M31 19 H38 M31 24 H38 M31 29 H36" {...p} />
      </>); break;
    case 'layers':
      inner = (<>
        <path d="M24 7 L41 16 L24 25 L7 16 Z" {...p} />
        <path d="M7 23 L24 32 L41 23" {...p} />
        <path d="M7 30 L24 39 L41 30" {...p} />
      </>); break;
    case 'shield':
      inner = (<>
        <path d="M24 6 L39 12 V22 C39 31 32 36 24 38 C16 36 9 31 9 22 V12 Z" {...p} />
        <path d="M24 17 V27 M19 22 H29" {...p} />
      </>); break;
    case 'book':
      inner = (<>
        <path d="M24 13 C20 10 14 10 9 11 V34 C14 33 20 33 24 36" {...p} />
        <path d="M24 13 C28 10 34 10 39 11 V34 C34 33 28 33 24 36" {...p} />
        <path d="M24 13 V36" {...p} />
      </>); break;
    case 'chart':
      inner = (<>
        <path d="M9 39 H40" {...p} />
        <rect x="13" y="25" width="6" height="12" {...p} />
        <rect x="22" y="19" width="6" height="18" {...p} />
        <rect x="31" y="13" width="6" height="24" {...p} />
      </>); break;
    case 'play':
      inner = (<>
        <circle cx="24" cy="24" r="15" {...p} />
        <path d="M21 18 L31 24 L21 30 Z" fill={s} stroke={s} strokeWidth="2" strokeLinejoin="round" />
      </>); break;
    case 'doc':
    default:
      inner = (<>
        <path d="M15 8 H28 L34 14 V40 H15 Z" {...p} />
        <path d="M28 8 V14 H34" {...p} />
        <path d="M19 23 H30 M19 28 H30 M19 33 H26" {...p} />
      </>); break;
  }
  return <svg className="tr-motif" viewBox="0 0 48 48" aria-hidden="true">{inner}</svg>;
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

/* thumbnail graphics — one gradient + icon per motif so the row reads varied */
.tr-th{ position:relative; height:128px; display:flex; align-items:center; justify-content:center; overflow:hidden; }
.tr-th--calendar{ background:linear-gradient(135deg,#d9c389,#a8801f); }
.tr-th--compare { background:linear-gradient(135deg,#1d5d49,#0a2c22); }
.tr-th--layers  { background:linear-gradient(135deg,#2f8f6e,#12463a); }
.tr-th--shield  { background:linear-gradient(135deg,#6f9484,#3c574a); }
.tr-th--book    { background:linear-gradient(135deg,#cdb978,#9b7a23); }
.tr-th--chart   { background:linear-gradient(135deg,#9db3a6,#566f60); }
.tr-th--play    { background:linear-gradient(135deg,#1d5d49,#0a2c22); }
.tr-th--doc     { background:linear-gradient(155deg,#f4efe2,#e6dcc1); border-bottom:1px solid var(--line); }
.tr-rings{ position:absolute; inset:0; width:100%; height:100%; }
.tr-motif{ position:relative; z-index:2; width:60px; height:60px; filter:drop-shadow(0 3px 8px rgba(0,0,0,.18)); }
.tr-th--doc .tr-motif{ filter:none; }
.tr-badge{ position:absolute; top:9px; left:9px; z-index:3; font-size:9px; font-weight:700; letter-spacing:.05em;
  text-transform:uppercase; padding:3px 8px; border-radius:20px; }
.tr-badge--ondark{ background:rgba(0,0,0,.42); color:#fff; }
.tr-badge--ink{ background:rgba(14,59,46,.9); color:#fff; }
.tr-dur{ position:absolute; bottom:9px; right:9px; z-index:3; font-size:10px; font-weight:600;
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
