import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  boardItems,
  season,
  featured,
  aep,
  type BoardItem,
} from '@/data/hubContent';
import { calendarEvents, CATEGORY_META } from '@/data/calendarContent';
import { articles } from '@/data/articles';
import { KNOWLEDGE_META } from '@/data/knowledgeContent';
import { BoardZone } from '@/components/hub/BoardZone';
import { AEP_TRAINING_OPEN, AepTrainingModal } from '@/components/hub/AepTrainingBoard';
import { WhatsNewBell } from '@/components/hub/WhatsNewBell';
import { ONE_ON_ONE_CALENDLY_URL } from '@/data/booking';

// ============================================================================
// THE HUB HOME — two jobs, two zones (see HOMESTEAD.md § 14 THE COCKPIT).
//   ① "This Week"     — what NEEDS you: dated, actionable. Season reminder +
//                       pinned bulletins + the next-7-day calendar, merged and
//                       de-duplicated so nothing shows twice.
//   ② "Worth reading" — what's worth KNOWING: one lead (the training drive when
//                       live, else the featured item) + recent updates.
// Tools live in the sidebar; the 1:1 lives in the sidebar footer. Not here.
// ============================================================================

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
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);

// ── Zone content rows ────────────────────────────────────────────────────────
function SeasonStrip() {
  return (
    <div className="wk-season">
      <span className="wk-season__ic" aria-hidden="true">{season.emoji}</span>
      <div>
        <span className="wk-season__t">{season.title} </span>
        <span className="wk-season__b">{season.body} </span>
        <Link className="wk-season__cta" to={season.ctaHref}>{season.ctaLabel} →</Link>
      </div>
    </div>
  );
}

function PinRow({ item }: { item: BoardItem }) {
  return (
    <div className="row">
      <span className="row__flag" style={{ color: KIND_COLORS[item.kind] }}>
        <span className="row__dot" style={{ background: KIND_COLORS[item.kind] }} />
        {KIND_LABELS[item.kind]}
      </span>
      <div className="row__main">
        <div className="row__t">{item.title}</div>
        {item.note && <div className="row__sub">{item.note}</div>}
        {item.link && (
          <a className="row__act" href={item.link} target="_blank" rel="noopener noreferrer">
            {item.linkLabel ?? 'Open'} ↗
          </a>
        )}
      </div>
      <div className="row__when">
        <div className="row__when-b">{item.when}</div>
        {item.whenSub && <div className="row__when-s">{item.whenSub}</div>}
      </div>
    </div>
  );
}

type CalEventLike = (typeof calendarEvents)[number];
function EventRow({ ev }: { ev: CalEventLike }) {
  const d = eventDate(ev.date);
  const meta = CATEGORY_META[ev.category];
  return (
    <div className="row">
      <div className="row__date">
        <div className="row__date-mo">{d.mo}</div>
        <div className="row__date-dy">{d.dy}</div>
      </div>
      <div className="row__main">
        <div className="row__t">
          <span className="row__dot" style={{ background: meta.color }} />
          {ev.title}
        </div>
        <div className="row__sub">{ev.detail ?? meta.label}</div>
        {ev.link && (
          <a className="row__act" href={ev.link} target="_blank" rel="noopener noreferrer">
            {ev.linkLabel ?? 'Join'} ↗
          </a>
        )}
      </div>
    </div>
  );
}

type NewsRow = { id: string; category: string; title: string; href?: string; isNew: boolean };
function NewsItemRow({ n }: { n: NewsRow }) {
  const inner = (
    <>
      <div className="upd__c">{n.category}{n.isNew && <span className="upd__badge">New</span>}</div>
      <div className="upd__t">{n.title}</div>
    </>
  );
  if (!n.href) return <div className="upd">{inner}</div>;
  return n.href.startsWith('http') ? (
    <a className="upd upd--link" href={n.href} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <Link className="upd upd--link" to={n.href}>{inner}</Link>
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

  // "This Week": the team's pinned bulletins + the next-7-day calendar, merged.
  // Board bulletins are richer (why-it-matters + a CTA), so when a bulletin and a
  // calendar event describe the same thing, we keep the bulletin and drop the
  // event. That's what removes the "Aetna shows twice" duplication.
  // Bulletins with a `date` auto-drop the day after it passes (they show
  // through their date, then disappear); undated bulletins stay until removed
  // from hubContent.ts.
  const pins = boardItems.filter((b) => !b.date || b.date >= todayKey);
  const pinNorms = pins.map((b) => norm(b.title));
  const upcoming = calendarEvents
    .filter((e) => {
      if (e.date < todayKey) return false;
      if (e.hubHide) return false; // opted out of the hub board
      if (e.category === 'cert') return true;
      if (e.hubBoard) return true; // flagged to surface early
      return e.date <= weekKey;
    })
    .filter((e) => {
      const en = norm(e.title);
      return !pinNorms.some((bn) => bn.startsWith(en) || en.startsWith(bn));
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // "Worth reading": recent articles + manual items.
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
  // Manual announcements live in the What's New feed (the bell); this list is
  // reading material only.
  const newsItems: NewsRow[] = recentArticles;

  // Worth-reading lead: the featured item (the Market Report) is the showcase.
  // The AEP training drive rides along as a slim secondary CTA while it's live,
  // so it isn't lost.
  const [trainingOpen, setTrainingOpen] = useState(false);
  const hasLead = featured.show || AEP_TRAINING_OPEN;

  const ReadingLead = (
    <div className="lead">
      {featured.show && (
        <Link className="lead__card" to={featured.ctaHref}>
          <div className="lead__e">⭑ {featured.eyebrow}</div>
          <div className="lead__t">{featured.title}</div>
          <p className="lead__b">{featured.body}</p>
          <span className="lead__cta">{featured.ctaLabel} →</span>
        </Link>
      )}
      {AEP_TRAINING_OPEN && (
        <button type="button" className="lead__mini" onClick={() => setTrainingOpen(true)}>
          <span className="lead__mini-ic" aria-hidden="true">🎯</span>
          <span className="lead__mini-b">
            <span className="lead__mini-t">Help shape our AEP training</span>
            <span className="lead__mini-s">Vote on topics or write in what to cover.</span>
          </span>
          <span className="lead__mini-cta">Add your voice →</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="hub">
      <style>{CSS}</style>

      <header className="hub-head">
        <div>
          <div className="hub-date">{dateStr} · Updated weekly</div>
          <h1 className="hub-h1">Here's what matters this week.</h1>
        </div>
        <div className="hub-head__r">
          <WhatsNewBell />
          <div className="hub-aep" role="status">
            🗓{' '}
            {inAep ? (
              <>AEP: <b>{daysLeftAep <= 0 ? 'last day' : `${daysLeftAep} days left`}</b></>
            ) : (
              <>AEP in <b>{daysToAep} days</b></>
            )}
          </div>
        </div>
      </header>

      <div className="hub-grid">
        {/* ① This Week — what needs you */}
        <BoardZone
          variant="dark"
          icon="🗓"
          title="This Week"
          hint="what needs you"
          more={{ label: 'Calendar →', to: '/calendar' }}
          fixed={
            <>
              {season.show && <SeasonStrip />}
              {pins.map((p) => <div className="zone__item" key={p.id}><PinRow item={p} /></div>)}
            </>
          }
          items={upcoming}
          cap={4}
          itemKey={(ev) => ev.id}
          renderItem={(ev) => <EventRow ev={ev} />}
          empty="Nothing else dated in the next 7 days."
          viewAll={{ label: () => 'View full calendar →', to: '/calendar' }}
        />

        {/* ② Worth reading — what's worth knowing */}
        <BoardZone
          variant="card"
          icon="📖"
          title="Worth reading"
          more={{ label: 'All updates →', to: '/industry-updates' }}
          fixed={hasLead ? ReadingLead : undefined}
          items={newsItems}
          cap={4}
          itemKey={(n) => n.id}
          renderItem={(n) => <NewsItemRow n={n} />}
          empty="No new posts this week. We'll surface them here as they land."
          viewAll={{ label: () => 'All updates →', to: '/industry-updates' }}
        />
      </div>

      {/* Standing invitation: book the monthly 1:1. A slim strip, not a zone. */}
      <a className="oneone" href={ONE_ON_ONE_CALENDLY_URL} target="_blank" rel="noopener noreferrer">
        <span className="oneone__badge" aria-hidden="true">1:1</span>
        <div className="oneone__text">
          <span className="oneone__t">Book your monthly 1:1 with Austin &amp; Andrew</span>
          <span className="oneone__s">A full hour on your pipeline, your blockers, and next month's number. Slots go fast.</span>
        </div>
        <span className="oneone__btn">Book your 1:1 →</span>
      </a>

      {trainingOpen && <AepTrainingModal onClose={() => setTrainingOpen(false)} />}
    </div>
  );
}

// ── Scoped styles (emerald cockpit, two zones) ───────────────────────────────
const CSS = `
.hub{
  --em:#0E3B2E; --bone:#F4F1E8; --bone2:#EDE7DB; --card:#fff; --line:#e2dcc9; --line2:#efeadb;
  --muted:#6b6457; --faint:#928b7c; --ink:#1b2620; --gold:#C9A84C; --gold2:#A8801F;
  flex:1 1 auto; min-height:0; min-width:0; display:flex; flex-direction:column; overflow:hidden;
  background:radial-gradient(120% 80% at 50% 0%, #f7f3ea, var(--bone));
  font-family:'Outfit','Inter',system-ui,sans-serif; color:var(--ink);
  -webkit-font-smoothing:antialiased; padding:20px 26px 22px;
}
.hub *{ box-sizing:border-box; }

.hub-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-shrink:0; margin-bottom:14px; }
.hub-date{ font-size:12px; color:var(--muted); }
.hub-h1{ font-size:23px; font-weight:700; letter-spacing:-.02em; margin:1px 0 0; }
.hub-head__r{ display:flex; align-items:center; gap:10px; flex-shrink:0; }
.hub-aep{ display:inline-flex; align-items:center; gap:6px; background:var(--em); color:var(--bone);
  padding:8px 14px; border-radius:24px; font-size:12.5px; flex-shrink:0; }
.hub-aep b{ color:var(--gold); }

/* two-zone cockpit: wide "needs you" + reading rail. The grid hugs its content
   and sits at the top (equal-height cards), so a light week reads as calm space,
   not a stretched void. Caps keep the busiest week above the fold. */
.hub-grid{ flex:0 0 auto; display:grid; grid-template-columns:1.42fr 1fr; gap:14px; align-items:stretch; }

/* ── Zone primitive ── */
.zone{ min-height:0; min-width:0; display:flex; flex-direction:column; border-radius:14px; overflow:hidden; }
.zone--dark{ background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone); position:relative; }
.zone--dark:before{ content:""; position:absolute; top:-70px; right:-50px; width:260px; height:260px;
  background:radial-gradient(circle,rgba(201,168,76,.15),transparent 60%); pointer-events:none; }
.zone--card{ background:var(--card); border:1px solid var(--line); box-shadow:0 1px 3px rgba(20,30,24,.05); }
.zone__h{ display:flex; align-items:center; gap:8px; padding:14px 18px 11px; flex-shrink:0; font-size:13.5px; font-weight:700; position:relative; z-index:1; }
.zone--card .zone__h{ border-bottom:1px solid var(--line2); }
.zone__ic{ flex-shrink:0; }
.zone__hint{ font-size:9.5px; font-weight:600; letter-spacing:.02em; }
.zone--dark .zone__hint{ color:var(--gold); background:rgba(201,168,76,.14); padding:2px 8px; border-radius:12px; }
.zone--card .zone__hint{ color:var(--muted); background:var(--bone); padding:2px 8px; border-radius:12px; }
.zone__meta{ margin-left:auto; font-size:10px; font-weight:400; color:rgba(244,241,232,.5); }
.zone__more{ margin-left:auto; font-size:11.5px; font-weight:600; text-decoration:none; }
.zone--dark .zone__more{ color:var(--gold); }
.zone--card .zone__more{ color:var(--gold2); }
.zone__more:hover{ text-decoration:underline; }
.zone__body{ flex:1 1 auto; min-height:0; padding:12px 18px 15px; display:flex; flex-direction:column; position:relative; z-index:1; overflow:hidden; }
.zone__list{ display:flex; flex-direction:column; min-height:0; }
.zone__list--divided{ margin-top:10px; padding-top:4px; border-top:1px solid rgba(255,255,255,.12); }
.zone--card .zone__list--divided{ border-top-color:var(--line2); }
.zone--card .zone__list{ flex:1 1 auto; }
.zone__rest{ margin:auto 0; text-align:center; font-size:11.5px; font-style:italic; color:var(--faint);
  border:1px dashed var(--line); border-radius:9px; padding:14px; }
.zone--dark .zone__rest{ color:rgba(244,241,232,.5); border-color:rgba(244,241,232,.16); }
.zone__viewall{ margin-top:auto; padding-top:10px; }
.zone__viewall-link{ font-size:11px; font-weight:700; text-decoration:none; color:var(--gold2); }
.zone--dark .zone__viewall-link{ color:var(--gold); }
.zone__viewall-link:hover{ text-decoration:underline; }

/* ── Season strip (compact, top of This Week) ── */
.wk-season{ display:flex; gap:9px; align-items:flex-start; padding-bottom:11px; }
.wk-season__ic{ font-size:15px; flex-shrink:0; line-height:1.4; }
.wk-season__t{ font-size:12px; font-weight:700; }
.wk-season__b{ font-size:11.5px; color:rgba(244,241,232,.7); line-height:1.5; }
.wk-season__cta{ font-size:11.5px; font-weight:700; color:var(--gold); text-decoration:none; white-space:nowrap; }
.wk-season__cta:hover{ text-decoration:underline; }

/* ── Unified "This Week" rows (pins + events, compact) ── */
.zone__item + .zone__item .row{ border-top:1px solid rgba(255,255,255,.09); }
.row{ display:flex; gap:11px; align-items:flex-start; padding:9px 0; }
.row__flag{ width:58px; flex-shrink:0; font-size:8.5px; font-weight:800; letter-spacing:.05em; text-transform:uppercase;
  display:flex; align-items:center; gap:6px; padding-top:2px; }
.row__date{ width:34px; flex-shrink:0; text-align:center; background:rgba(255,255,255,.08); border-radius:7px; padding:3px 0; }
.row__date-mo{ font-size:8px; font-weight:700; text-transform:uppercase; color:rgba(244,241,232,.6); }
.row__date-dy{ font-size:14px; font-weight:700; }
.row__dot{ width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.row__main{ min-width:0; flex:1; }
.row__t{ font-size:12.5px; font-weight:600; line-height:1.3; display:flex; align-items:center; gap:6px;
  overflow:hidden; text-overflow:ellipsis; }
.row__sub{ font-size:10.5px; color:rgba(244,241,232,.6); margin-top:2px; line-height:1.4;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.row__act{ display:inline-block; margin-top:5px; font-size:10px; font-weight:700; color:var(--gold);
  text-decoration:none; }
.row__act:hover{ text-decoration:underline; }
.row__when{ margin-left:auto; text-align:right; flex-shrink:0; }
.row__when-b{ font-size:12px; font-weight:700; color:var(--gold); }
.row__when-s{ font-size:9px; color:rgba(244,241,232,.5); }

/* ── Worth reading: lead + updates ── */
.lead{ display:flex; flex-direction:column; gap:9px; padding-bottom:12px; }
.lead__card{ display:block; text-align:left; width:100%; text-decoration:none; color:var(--ink);
  background:linear-gradient(135deg,#fdf8ec,#f7efd8); border:1px solid rgba(201,168,76,.5); border-radius:12px;
  padding:15px 16px; transition:transform .15s, box-shadow .15s; }
.lead__card--btn{ font-family:inherit; cursor:pointer; }
.lead__card:hover{ transform:translateY(-1px); box-shadow:0 10px 22px rgba(168,128,31,.14); }
.lead__e{ font-size:9.5px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:var(--gold2); }
.lead__t{ font-size:15.5px; font-weight:700; line-height:1.2; margin-top:4px; letter-spacing:-.01em; }
.lead__b{ font-size:11px; color:var(--muted); line-height:1.5; margin:5px 0 0;
  display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.lead__cta{ display:inline-block; margin-top:9px; font-size:10.5px; font-weight:700; color:var(--em);
  background:linear-gradient(135deg,#e7cf86,var(--gold)); padding:7px 12px; border-radius:8px; }
/* slim secondary CTA riding under the showcase lead */
.lead__mini{ display:flex; align-items:center; gap:10px; width:100%; text-align:left; font-family:inherit; cursor:pointer;
  background:var(--card); border:1px solid var(--line); border-radius:11px; padding:9px 12px; transition:.15s; }
.lead__mini:hover{ border-color:var(--gold); background:rgba(201,168,76,.05); }
.lead__mini-ic{ font-size:15px; flex-shrink:0; }
.lead__mini-b{ flex:1; min-width:0; display:flex; flex-direction:column; }
.lead__mini-t{ font-size:11.5px; font-weight:700; color:var(--ink); }
.lead__mini-s{ font-size:10px; color:var(--muted); margin-top:1px; }
.lead__mini-cta{ flex-shrink:0; font-size:10px; font-weight:700; color:var(--gold2); white-space:nowrap; }

.zone__item + .zone__item .upd{ border-top:1px solid var(--line); }
.upd{ display:block; padding:8px 0; text-decoration:none; color:var(--ink); }
.upd--link:hover .upd__t{ color:var(--gold2); }
.upd__c{ font-size:9px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--gold2); }
.upd__badge{ margin-left:6px; background:var(--gold); color:#1b2620; font-size:7.5px; font-weight:800; padding:1px 6px;
  border-radius:12px; text-transform:uppercase; vertical-align:middle; }
.upd__t{ font-size:11.5px; font-weight:600; margin-top:1px; line-height:1.35; transition:color .15s;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

/* ── Book your 1:1 — slim standing invitation strip under the zones ── */
.oneone{ flex:0 0 auto; margin-top:14px; display:flex; align-items:center; gap:14px; text-decoration:none;
  color:var(--bone); background:linear-gradient(135deg,#10362a,#0a2c22); border:1px solid rgba(201,168,76,.3);
  border-radius:14px; padding:13px 18px; position:relative; overflow:hidden; transition:transform .15s, box-shadow .15s; }
.oneone:before{ content:""; position:absolute; top:-80px; right:-40px; width:240px; height:240px;
  background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); pointer-events:none; }
.oneone:hover{ transform:translateY(-1px); box-shadow:0 12px 26px rgba(10,44,34,.28); }
.oneone__badge{ flex-shrink:0; width:38px; height:38px; border-radius:50%; display:inline-flex; align-items:center;
  justify-content:center; font-size:12.5px; font-weight:800; letter-spacing:.02em; color:var(--em);
  background:linear-gradient(135deg,#e7cf86,var(--gold)); position:relative; }
.oneone__text{ min-width:0; position:relative; }
.oneone__t{ display:block; font-size:13.5px; font-weight:700; line-height:1.2; }
.oneone__s{ display:block; font-size:11px; color:rgba(244,241,232,.72); margin-top:2px; line-height:1.4;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.oneone__btn{ flex-shrink:0; margin-left:auto; font-size:12px; font-weight:700; color:var(--em); white-space:nowrap;
  background:linear-gradient(135deg,#e7cf86,var(--gold)); padding:9px 15px; border-radius:9px; position:relative; }

/* ── Responsive: below 900px the two zones stack in the same fixed order ── */
@media(max-width:900px){
  .hub{ overflow-y:auto; padding:18px 20px 28px; }
  .hub-head{ flex-direction:column; align-items:flex-start; gap:10px; }
  .hub-h1{ font-size:20px; }
  .hub-grid{ display:flex; flex-direction:column; flex:0 0 auto; gap:14px; }
  .zone{ overflow:visible; }
  .zone__body{ overflow:visible; }
  .row__sub{ white-space:normal; }
  .oneone{ flex-wrap:wrap; }
  .oneone__s{ white-space:normal; }
  .oneone__btn{ margin-left:0; width:100%; text-align:center; }
}
`;
