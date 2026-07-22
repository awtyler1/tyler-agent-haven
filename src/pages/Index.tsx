import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  boardMeta,
  boardItems,
  season,
  featured,
  newThisWeek,
  aep,
  type BoardItem,
} from '@/data/hubContent';
import { calendarEvents, CATEGORY_META } from '@/data/calendarContent';
import { articles } from '@/data/articles';
import { KNOWLEDGE_META } from '@/data/knowledgeContent';
import { BoardZone } from '@/components/hub/BoardZone';
import { AEP_TRAINING_OPEN, AepTrainingModal } from '@/components/hub/AepTrainingBoard';

// ── Helpers ──────────────────────────────────────────────────────────────────
const KIND_COLORS: Record<BoardItem['kind'], string> = {
  deadline: '#e0795f',
  action: '#e0a85f',
  open: '#88b06a',
};
const KIND_LABELS: Record<BoardItem['kind'], string> = {
  deadline: 'Deadline',
  action: 'Action',
  open: 'Now open',
};

function daysUntil(iso: string): number {
  const target = new Date(iso + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

function eventDate(iso: string): { mo: string; dy: string } {
  const d = new Date(iso + 'T00:00:00');
  return {
    mo: d.toLocaleDateString('en-US', { month: 'short' }),
    dy: d.toLocaleDateString('en-US', { day: 'numeric' }),
  };
}

// ── Zone content rows ────────────────────────────────────────────────────────
function SeasonBanner() {
  return (
    <div className="season">
      <span className="season__ic" aria-hidden="true">{season.emoji}</span>
      <div className="season__body">
        <div className="season__t">{season.title}</div>
        <p className="season__b">{season.body}</p>
        <Link className="season__cta" to={season.ctaHref}>{season.ctaLabel} →</Link>
      </div>
    </div>
  );
}

function BoardItemRow({ item }: { item: BoardItem }) {
  const days = item.date ? daysUntil(item.date) : null;
  const sub = days !== null ? (days <= 0 ? 'today' : `${days} day${days === 1 ? '' : 's'}`) : item.whenSub ?? '';
  return (
    <div className="bitem">
      <span className="bitem__kind" style={{ color: KIND_COLORS[item.kind] }}>
        <span className="bitem__dot" style={{ background: KIND_COLORS[item.kind] }} />
        {KIND_LABELS[item.kind]}
      </span>
      <div className="bitem__main">
        <div className="bitem__t">{item.title}</div>
        {item.note && <div className="bitem__n">{item.note}</div>}
        {item.link && (
          <a className="bitem__join" href={item.link} target="_blank" rel="noopener noreferrer">
            {item.linkLabel ?? 'Join'} ↗
          </a>
        )}
      </div>
      <div className="bitem__when">
        <div className="bitem__wb">{item.when}</div>
        <div className="bitem__ws">{sub}</div>
      </div>
    </div>
  );
}

type CalEventLike = (typeof calendarEvents)[number];
function EventRow({ ev }: { ev: CalEventLike }) {
  const d = eventDate(ev.date);
  return (
    <div className="ev">
      <div className="ev__d">
        <div className="ev__mo">{d.mo}</div>
        <div className="ev__dy">{d.dy}</div>
      </div>
      <div className="ev__main">
        <div className="ev__t">
          <span className="ev__dot" style={{ background: CATEGORY_META[ev.category].color }} />
          {ev.title}
        </div>
        <div className="ev__s">{ev.detail ?? CATEGORY_META[ev.category].label}</div>
      </div>
    </div>
  );
}

type NewsRow = { id: string; category: string; title: string; href?: string; isNew: boolean };
function NewsItemRow({ n }: { n: NewsRow }) {
  const inner = (
    <>
      <div className="new__c">
        {n.category}
        {n.isNew && <span className="new__badge">New</span>}
      </div>
      <div className="new__t">{n.title}</div>
    </>
  );
  if (!n.href) return <div className="new">{inner}</div>;
  return n.href.startsWith('http') ? (
    <a className="new new--link" href={n.href} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <Link className="new new--link" to={n.href}>{inner}</Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const todayKey = now.toISOString().slice(0, 10);
  const weekKey = new Date(now.getTime() + 7 * 86_400_000).toISOString().slice(0, 10);

  // AEP phase
  const year = now.getFullYear();
  const aepStart = new Date(year, aep.startMonth - 1, aep.startDay);
  const aepEnd = new Date(year, aep.endMonth - 1, aep.endDay);
  const daysToAep = Math.ceil((aepStart.getTime() - now.getTime()) / 86_400_000);
  const daysLeftAep = Math.ceil((aepEnd.getTime() - now.getTime()) / 86_400_000);
  const inAep = now >= aepStart && now <= aepEnd;

  // This Week: near-term calendar events (cert milestones exempt from the window).
  const upcoming = calendarEvents
    .filter((e) => {
      if (e.date < todayKey) return false;
      if (e.category === 'cert') return true;
      return e.date <= weekKey;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Board items: dated calls/meetings only surface when 7 days out or less.
  const visibleBoardItems = boardItems.filter((item) =>
    item.link && item.date ? item.date >= todayKey && item.date <= weekKey : true
  );

  // New this week = articles published in the last 7 days + manual items.
  const recentArticles: NewsRow[] = articles
    .filter((a) => { const d = daysUntil(a.date); return d <= 0 && d >= -6; })
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((a) => ({
      id: a.slug,
      category: KNOWLEDGE_META[a.category]?.label ?? 'Update',
      title: a.title,
      href: `/knowledge/${a.slug}`,
      isNew: daysUntil(a.date) === 0,
    }));
  const newsItems: NewsRow[] = [
    ...recentArticles,
    ...newThisWeek.map((n) => ({ id: n.id, category: n.category, title: n.title, href: n.href, isNew: false })),
  ];

  // Spotlight: the training drive outranks the featured item while it's live.
  const [trainingOpen, setTrainingOpen] = useState(false);
  const spotlightMode: 'training' | 'featured' | 'none' =
    AEP_TRAINING_OPEN ? 'training' : featured.show ? 'featured' : 'none';

  return (
    <div className="hub">
      <style>{CSS}</style>

      {/* ── Header (fixed part of the frame) ── */}
      <header className="hub-head">
        <div>
          <div className="hub-date">{dateStr} · Updated weekly</div>
          <h1 className="hub-h1">Here's what matters this week.</h1>
        </div>
        <div className="hub-aep" role="status">
          🗓{' '}
          {inAep ? (
            <>AEP: <b>{daysLeftAep <= 0 ? 'last day' : `${daysLeftAep} days left`}</b></>
          ) : (
            <>AEP in <b>{daysToAep} days</b></>
          )}
        </div>
      </header>

      {/* ── The Cockpit: four permanent zones, fixed order, fills the viewport ── */}
      <div className="hub-grid">
        {/* ① The Board */}
        <BoardZone
          variant="dark"
          icon="📌"
          title="The Board"
          meta={`${boardMeta.postedBy} · ${new Date(boardMeta.postedOn + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          fixed={season.show ? <SeasonBanner /> : undefined}
          items={visibleBoardItems}
          cap={2}
          itemKey={(it) => it.id}
          renderItem={(it) => <BoardItemRow item={it} />}
          empty="Nothing urgent this week. The season note holds this space."
          viewAll={{ label: (n) => `View all ${n} this week →`, to: '/calendar' }}
        />

        {/* ② This Week */}
        <BoardZone
          variant="card"
          icon="🗓"
          title="This Week"
          hint="next 7 days"
          more={{ label: 'Calendar →', to: '/calendar' }}
          items={upcoming}
          cap={3}
          itemKey={(ev) => ev.id}
          renderItem={(ev) => <EventRow ev={ev} />}
          empty="Nothing on the calendar in the next 7 days."
          viewAll={{ label: () => 'View full calendar →', to: '/calendar' }}
        />

        {/* ③ Spotlight — one rotating thing worth everyone's attention */}
        <BoardZone variant="card" icon="⭑" title="Spotlight">
          {spotlightMode === 'training' ? (
            <button type="button" className="spot spot--btn" onClick={() => setTrainingOpen(true)}>
              <div className="spot__e">🎯 Help shape AEP training</div>
              <div className="spot__t">What should we cover this AEP?</div>
              <p className="spot__b">
                Austin &amp; Andrew are building the AEP sessions now. Vote on topics or write in
                what you'd like covered. It all posts to the board for the whole team.
              </p>
              <span className="spot__cta">Add your voice →</span>
            </button>
          ) : spotlightMode === 'featured' ? (
            <Link className="spot" to={featured.ctaHref}>
              <div className="spot__e">⭑ {featured.eyebrow}</div>
              <div className="spot__t">{featured.title}</div>
              <p className="spot__b">{featured.body}</p>
              <span className="spot__cta">{featured.ctaLabel} →</span>
            </Link>
          ) : (
            <div className="zone__list">
              <div className="zone__rest">Nothing in the spotlight this week.</div>
            </div>
          )}
        </BoardZone>

        {/* ④ New this week */}
        <BoardZone
          variant="card"
          icon="🆕"
          title="New this week"
          more={{ label: 'All updates →', to: '/industry-updates' }}
          items={newsItems}
          cap={3}
          itemKey={(n) => n.id}
          renderItem={(n) => <NewsItemRow n={n} />}
          empty="No new posts this week. We'll surface them here as they land."
          viewAll={{ label: () => 'All updates →', to: '/industry-updates' }}
        />
      </div>

      {trainingOpen && <AepTrainingModal onClose={() => setTrainingOpen(false)} />}
    </div>
  );
}

// ── Scoped styles (emerald cockpit) ──────────────────────────────────────────
const CSS = `
.hub{
  --em:#0E3B2E; --bone:#F4F1E8; --bone2:#EDE7DB; --card:#fff; --line:#e2dcc9; --line2:#efeadb;
  --muted:#6b6457; --faint:#928b7c; --ink:#1b2620; --gold:#C9A84C; --gold2:#A8801F;
  --deadline:#d06a50; --action:#d69a45; --open:#7ba05a;
  flex:1 1 auto; min-height:0; min-width:0; display:flex; flex-direction:column; overflow:hidden;
  background:radial-gradient(120% 80% at 50% 0%, #f7f3ea, var(--bone));
  font-family:'Outfit','Inter',system-ui,sans-serif; color:var(--ink);
  -webkit-font-smoothing:antialiased; padding:20px 26px 22px;
}
.hub *{ box-sizing:border-box; }

/* header — the only fixed strip; the grid fills the rest */
.hub-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-shrink:0; margin-bottom:14px; }
.hub-date{ font-size:12px; color:var(--muted); }
.hub-h1{ font-size:23px; font-weight:700; letter-spacing:-.02em; margin:1px 0 0; }
.hub-aep{ display:inline-flex; align-items:center; gap:6px; background:var(--em); color:var(--bone);
  padding:8px 14px; border-radius:24px; font-size:12.5px; flex-shrink:0; }
.hub-aep b{ color:var(--gold); }

/* the 2x2 cockpit grid fills all remaining height, no page scroll */
.hub-grid{ flex:1 1 auto; min-height:0; display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:14px; }

/* ── Zone primitive ── */
.zone{ min-height:0; min-width:0; display:flex; flex-direction:column; border-radius:14px; overflow:hidden; }
.zone--dark{ background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone); position:relative; }
.zone--dark:before{ content:""; position:absolute; top:-70px; right:-50px; width:240px; height:240px;
  background:radial-gradient(circle,rgba(201,168,76,.15),transparent 60%); pointer-events:none; }
.zone--card{ background:var(--card); border:1px solid var(--line); box-shadow:0 1px 3px rgba(20,30,24,.05); }
.zone__h{ display:flex; align-items:center; gap:8px; padding:13px 16px 10px; flex-shrink:0; font-size:13px; font-weight:700; position:relative; z-index:1; }
.zone--card .zone__h{ border-bottom:1px solid var(--line2); }
.zone__ic{ flex-shrink:0; }
.zone__hint{ font-size:9.5px; font-weight:600; color:var(--muted); background:var(--bone); padding:2px 8px; border-radius:12px; }
.zone__meta{ margin-left:auto; font-size:10px; font-weight:400; color:rgba(244,241,232,.5); }
.zone__more{ margin-left:auto; font-size:11.5px; font-weight:600; color:var(--gold2); text-decoration:none; }
.zone__more:hover{ text-decoration:underline; }
.zone__body{ flex:1 1 auto; min-height:0; padding:12px 16px 14px; display:flex; flex-direction:column; position:relative; z-index:1; overflow:hidden; }
.zone__list{ display:flex; flex-direction:column; min-height:0; }
.zone--card .zone__list{ flex:1 1 auto; }
.zone__list--divided{ margin-top:9px; padding-top:2px; border-top:1px solid rgba(255,255,255,.12); }
.zone__rest{ margin:auto 0; text-align:center; font-size:11.5px; font-style:italic; color:var(--faint);
  border:1px dashed var(--line); border-radius:9px; padding:14px; }
.zone--dark .zone__rest{ color:rgba(244,241,232,.5); border-color:rgba(244,241,232,.16); }
.zone__viewall{ margin-top:auto; padding-top:9px; }
.zone__viewall-link{ font-size:11px; font-weight:700; color:var(--gold2); text-decoration:none; }
.zone--dark .zone__viewall-link{ color:var(--gold); }
.zone__viewall-link:hover{ text-decoration:underline; }

/* ── Board content (season + items) ── */
.season{ display:flex; gap:10px; align-items:flex-start; padding-bottom:11px; }
.season__ic{ font-size:17px; flex-shrink:0; line-height:1.2; }
.season__body{ min-width:0; }
.season__t{ font-size:12.5px; font-weight:700; }
.season__b{ font-size:11px; color:rgba(244,241,232,.8); line-height:1.45; margin:2px 0 0; }
.season__cta{ display:inline-block; margin-top:8px; font-size:10.5px; font-weight:700; color:var(--em);
  background:linear-gradient(135deg,#e7cf86,var(--gold)); padding:6px 11px; border-radius:7px; text-decoration:none; transition:.15s; }
.season__cta:hover{ filter:brightness(1.05); }
.zone__item + .zone__item .bitem{ border-top:1px solid rgba(255,255,255,.08); }
.bitem{ display:flex; gap:11px; align-items:flex-start; padding:10px 0; }
.bitem__kind{ font-size:8.5px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; width:62px; flex-shrink:0;
  display:flex; align-items:center; gap:6px; padding-top:2px; }
.bitem__dot{ width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.bitem__main{ min-width:0; }
.bitem__t{ font-size:12.5px; font-weight:600; line-height:1.25; }
.bitem__n{ font-size:10.5px; color:rgba(244,241,232,.6); margin-top:2px; line-height:1.4; }
.bitem__join{ display:inline-block; margin-top:7px; font-size:10px; font-weight:700; color:var(--em);
  background:linear-gradient(135deg,#e7cf86,var(--gold)); padding:5px 9px; border-radius:6px; text-decoration:none; }
.bitem__when{ margin-left:auto; text-align:right; flex-shrink:0; }
.bitem__wb{ font-size:12.5px; font-weight:700; color:var(--gold); }
.bitem__ws{ font-size:9px; color:rgba(244,241,232,.5); }

/* ── This Week content ── */
.zone__item + .zone__item .ev{ border-top:1px solid var(--line); }
.ev{ display:flex; gap:11px; padding:9px 0; }
.ev__d{ width:36px; text-align:center; background:var(--bone); border-radius:7px; padding:4px 0; flex-shrink:0; }
.ev__mo{ font-size:8px; font-weight:700; text-transform:uppercase; color:var(--muted); }
.ev__dy{ font-size:14px; font-weight:700; }
.ev__main{ min-width:0; }
.ev__t{ font-size:12px; font-weight:600; display:flex; align-items:center; gap:6px; }
.ev__dot{ width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.ev__s{ font-size:10px; color:var(--muted); margin-top:1px; }

/* ── Spotlight content ── */
.spot{ flex:1 1 auto; display:flex; flex-direction:column; justify-content:center; text-decoration:none; color:var(--ink); }
.spot--btn{ background:none; border:none; padding:0; margin:0; text-align:left; font-family:inherit; cursor:pointer; width:100%; }
.spot__e{ font-size:9px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--gold2); }
.spot__t{ font-size:16px; font-weight:700; line-height:1.2; margin-top:5px; letter-spacing:-.01em; }
.spot__b{ font-size:11.5px; color:var(--muted); line-height:1.5; margin:6px 0 0; }
.spot__cta{ display:inline-block; align-self:flex-start; margin-top:11px; font-size:11px; font-weight:700; color:var(--em);
  background:linear-gradient(135deg,#e7cf86,var(--gold)); padding:8px 13px; border-radius:8px; transition:.15s; }
.spot:hover .spot__cta, .spot--btn:hover .spot__cta{ filter:brightness(1.05); }

/* ── New this week content ── */
.zone__item + .zone__item .new{ border-top:1px solid var(--line); }
.new{ display:block; padding:8px 0; text-decoration:none; color:var(--ink); }
.new--link:hover .new__t{ color:var(--gold2); }
.new__c{ font-size:9px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--gold2); }
.new__badge{ margin-left:6px; background:var(--gold); color:#1b2620; font-size:7.5px; font-weight:800; padding:1px 6px;
  border-radius:12px; text-transform:uppercase; vertical-align:middle; }
.new__t{ font-size:11.5px; font-weight:600; margin-top:1px; transition:color .15s; }

/* ── Responsive: below 900px the cockpit collapses to the fixed-order stack ──
   Desktop fills the viewport with no scroll; the stack takes natural height and
   the page scrolls, but the zones keep their fixed order so nothing moves. ── */
@media(max-width:900px){
  .hub{ overflow-y:auto; padding:18px 20px 28px; }
  .hub-head{ flex-direction:column; align-items:flex-start; gap:10px; }
  .hub-h1{ font-size:20px; }
  .hub-grid{ display:flex; flex-direction:column; flex:0 0 auto; gap:14px; }
  .zone{ overflow:visible; }
  .zone__body{ overflow:visible; }
  .spot{ justify-content:flex-start; }
}
`;
