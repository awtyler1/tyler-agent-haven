import { Link } from 'react-router-dom';
import { season, featured, aep } from '@/data/hubContent';
import { articles } from '@/data/articles';
import { KNOWLEDGE_META } from '@/data/knowledgeContent';
import { WhatsNewBell } from '@/components/hub/WhatsNewBell';
import { ONE_ON_ONE_CALENDLY_URL } from '@/data/booking';
import { buildNeedsYou, buildLanes, type NeedsYouItem, type LaneItem } from '@/lib/hubFeed';

// ============================================================================
// THE HUB HOME — two questions, in order.
// ----------------------------------------------------------------------------
//   ① "What needs me?"    → the Needs You strip. Dated, actionable, capped at
//                           three, sorted by date, each row chipped with where
//                           it came from. This is the only urgent surface.
//   ② "What's going on?"  → two lanes, split by SOURCE, because that is how
//                           everything here arrives: it is either OURS (a TIG
//                           training, meeting, or team event) or a CARRIER'S
//                           (an event or update we relay). Different sources
//                           ask the agent for different decisions: ours means
//                           "your team expects you", theirs means "does this
//                           apply to my carriers, in my market?".
//
// Below that, two quiet rails: what's worth reading, and the tools. Nothing
// appears in more than one place — see src/lib/hubFeed.ts for the routing.
//
// ROW GRAMMAR (every row on this page, no exceptions):
//   [source chip] [what it is, short] [when, right-aligned] [one action]
// Long explanations belong in the event popout on the Calendar, not here.
// ============================================================================

function eventDate(iso: string): { mo: string; dy: string } {
  const d = new Date(iso + 'T00:00:00');
  return {
    mo: d.toLocaleDateString('en-US', { month: 'short' }),
    dy: d.toLocaleDateString('en-US', { day: 'numeric' }),
  };
}

function daysSince(iso: string, todayIso: string): number {
  return Math.round(
    (new Date(todayIso + 'T00:00:00').getTime() - new Date(iso + 'T00:00:00').getTime()) / 86_400_000,
  );
}

// ── Rows ─────────────────────────────────────────────────────────────────────
function NeedsYouRow({ item }: { item: NeedsYouItem }) {
  return (
    <div className="nr">
      <span className={`chip chip--${item.source}`}>
        <span className="chip__d" aria-hidden="true" />
        {item.badge}
      </span>
      <div className="nr__m">
        <div className="nr__t">{item.title}</div>
        {item.note && <div className="nr__s">{item.note}</div>}
      </div>
      <div className="nr__w">
        <b>{item.when}</b>
        {item.whenSub && <i>{item.whenSub}</i>}
      </div>
      {item.link ? (
        <a className="nr__a" href={item.link} target="_blank" rel="noopener noreferrer">
          {item.linkLabel ?? 'Open'} ↗
        </a>
      ) : (
        <Link className="nr__a" to="/calendar">
          Details →
        </Link>
      )}
    </div>
  );
}

function LaneRow({ item }: { item: LaneItem }) {
  const { event: ev } = item;
  const d = eventDate(ev.date);
  const tags = [item.market, item.alsoCount > 0 ? `+${item.alsoCount} more` : null].filter(Boolean);
  return (
    <div className="lr">
      <div className="lr__d">
        <span className="lr__mo">{d.mo}</span>
        <span className="lr__dy">{d.dy}</span>
      </div>
      <div className="lr__m">
        <div className="lr__t">{ev.title}</div>
        {tags.length > 0 && (
          <div className="lr__tags">
            {tags.map((t) => (
              <span className="tag" key={t as string}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* The date block already carries the date, so this column carries the
          time (or the cadence for a recurring series) — never a second date. */}
      <div className="lr__w">
        {ev.seriesLabel ? <b>{ev.seriesLabel}</b> : ev.time ? <b>{ev.time.replace(/ ?ET$/, '')}</b> : null}
      </div>
    </div>
  );
}

function Lane({
  kind,
  title,
  sub,
  items,
  empty,
  viewAll,
  children,
}: {
  kind: 'tig' | 'carrier';
  title: string;
  sub: string;
  items: LaneItem[];
  empty: string;
  viewAll?: { label: string; to: string };
  children?: React.ReactNode;
}) {
  return (
    <section className={`lane lane--${kind}`} aria-label={title}>
      <div className="lane__h">
        <span className="lane__t">{title}</span>
        <span className="lane__s">{sub}</span>
      </div>
      {children}
      <div className="lane__b">
        {items.length > 0 ? (
          items.map((i) => <LaneRow item={i} key={i.event.id} />)
        ) : (
          <div className="lane__rest">{empty}</div>
        )}
        {viewAll && (
          <Link className="lane__all" to={viewAll.to}>
            {viewAll.label}
          </Link>
        )}
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // AEP phase
  const year = now.getFullYear();
  const aepStart = new Date(year, aep.startMonth - 1, aep.startDay);
  const aepEnd = new Date(year, aep.endMonth - 1, aep.endDay);
  const daysToAep = Math.ceil((aepStart.getTime() - now.getTime()) / 86_400_000);
  const daysLeftAep = Math.ceil((aepEnd.getTime() - now.getTime()) / 86_400_000);
  const inAep = now >= aepStart && now <= aepEnd;

  // ① What needs you, and ② what's going on — routed so nothing repeats.
  const { items: needsYou, usedEventIds } = buildNeedsYou(todayKey, 3);
  const lanes = buildLanes(todayKey, usedEventIds, 3);

  const headline =
    needsYou.length === 0
      ? "You're clear this week."
      : needsYou.length === 1
        ? 'One thing needs you this week.'
        : `${needsYou.length === 2 ? 'Two' : 'Three'} things need you this week.`;

  // Worth reading: the newest published pieces, always filled.
  const reading = articles
    .filter((a) => a.date <= todayKey)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, featured.show ? 2 : 3);

  return (
    <div className="hub">
      <style>{CSS}</style>

      <header className="hub-head">
        <div>
          <div className="hub-date">{dateStr}</div>
          <h1 className="hub-h1">{headline}</h1>
        </div>
        <div className="hub-head__r">
          <WhatsNewBell />
          <div className="hub-aep" role="status">
            🗓{' '}
            {inAep ? (
              <>
                AEP: <b>{daysLeftAep <= 0 ? 'last day' : `${daysLeftAep} days left`}</b>
              </>
            ) : (
              <>
                AEP in <b>{daysToAep} days</b>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ① Needs you — the only urgent surface on the page */}
      <section className="strip" aria-label="Needs you">
        <div className="strip__h">
          <span className="strip__ic" aria-hidden="true">
            ⚡
          </span>
          <span className="strip__t">Needs you</span>
          <span className="strip__hint">next 7 days</span>
          <Link className="strip__more" to="/calendar">
            Full calendar →
          </Link>
        </div>
        <div className="strip__b">
          {season.show && (
            <div className="strip__season">
              <span aria-hidden="true">{season.emoji}</span>
              <span>
                <b>{season.title}</b> {season.body}
              </span>
              <Link to={season.ctaHref}>{season.ctaLabel} →</Link>
            </div>
          )}
          {needsYou.length > 0 ? (
            needsYou.map((i) => <NeedsYouRow item={i} key={i.key} />)
          ) : (
            <div className="strip__rest">
              Nothing due in the next seven days. Good week to work your plan.
            </div>
          )}
        </div>
      </section>

      {/* ② Two lanes — ours, and our carriers' */}
      <div className="lanes">
        <Lane
          kind="tig"
          title="From TIG"
          sub="our trainings, meetings, and team events"
          items={lanes.tig}
          empty={
            needsYou.some((i) => i.source === 'tig')
              ? 'Everything from us this week is up top.'
              : 'Nothing else on our calendar right now.'
          }
          viewAll={{ label: 'All TIG events →', to: '/calendar' }}
        />
        <Lane
          kind="carrier"
          title="From your carriers"
          sub="events and updates we relay"
          items={lanes.carrier}
          empty="No carrier events on the calendar right now."
          viewAll={
            lanes.carrierTotal > lanes.carrier.length
              ? { label: `All carrier events (${lanes.carrierTotal}) →`, to: '/calendar' }
              : undefined
          }
        />
      </div>

      {/* Worth reading — quiet rail */}
      <section className="read" aria-label="Worth reading">
        {featured.show && (
          <Link className="read__lead" to={featured.ctaHref}>
            <span className="read__e">⭑ {featured.eyebrow}</span>
            <span className="read__t">{featured.title}</span>
            <span className="read__cta">{featured.ctaLabel} →</span>
          </Link>
        )}
        {reading.map((a) => {
          const fresh = daysSince(a.date, todayKey) <= 7;
          return (
            <Link className="read__card" to={`/knowledge/${a.slug}`} key={a.slug}>
              <span className="read__e read__e--m">
                {KNOWLEDGE_META[a.category]?.label ?? 'Update'}
                {fresh && <i>New</i>}
              </span>
              <span className="read__t">{a.title}</span>
              <span className="read__meta">{a.readTime}</span>
            </Link>
          );
        })}
        <Link className="read__more" to="/industry-updates">
          All updates →
        </Link>
      </section>

      {/* The 1:1 — a standing invitation, not a tools rail. Forms, certs,
          portals, and CRMs all live in the sidebar; repeating them here just
          duplicates navigation the agent already has on screen. */}
      <a className="oneone" href={ONE_ON_ONE_CALENDLY_URL} target="_blank" rel="noopener noreferrer">
        <span className="oneone__badge" aria-hidden="true">
          1:1
        </span>
        <span className="oneone__text">
          <b>Book your monthly 1:1 with Austin &amp; Andrew</b>
          <i>A full hour on your pipeline, your blockers, and next month's number.</i>
        </span>
        <span className="oneone__btn">Book your 1:1 →</span>
      </a>
    </div>
  );
}

// ── Scoped styles ────────────────────────────────────────────────────────────
// The page grows with its content and scrolls inside the shell's main column.
// Never lock it to the viewport (overflow:hidden) — content volume changes
// every week, and clipping forces users to zoom out. Priority comes from
// ORDER and WEIGHT, not from squeezing everything onto one screen.
const CSS = `
.hub{
  --em:#0E3B2E; --bone:#F4F1E8; --card:#fff; --line:#e2dcc9; --line2:#efeadb;
  --muted:#6b6457; --faint:#928b7c; --ink:#1b2620; --gold:#C9A84C; --gold2:#A8801F;
  --tig:#5B7D44; --tig-d:#3f5c2f; --car:#5e7d9e; --car-d:#3f6285;
  flex:1 0 auto; min-width:0; display:flex; flex-direction:column; gap:13px;
  background:radial-gradient(120% 80% at 50% 0%, #f7f3ea, var(--bone));
  font-family:'Outfit','Inter',system-ui,sans-serif; color:var(--ink);
  -webkit-font-smoothing:antialiased; padding:20px 26px 26px;
}
.hub *{ box-sizing:border-box; }

/* ── Header ── */
.hub-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.hub-date{ font-size:12px; color:var(--muted); }
.hub-h1{ font-size:23px; font-weight:700; letter-spacing:-.02em; margin:1px 0 0; }
.hub-head__r{ display:flex; align-items:center; gap:10px; flex-shrink:0; }
.hub-aep{ display:inline-flex; align-items:center; gap:6px; background:var(--em); color:var(--bone);
  padding:8px 14px; border-radius:24px; font-size:12.5px; flex-shrink:0; white-space:nowrap; }
.hub-aep b{ color:var(--gold); }

/* ── ① Needs you ── */
.strip{ border-radius:14px; overflow:hidden; position:relative;
  background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone); }
.strip:before{ content:""; position:absolute; top:-70px; right:-50px; width:260px; height:260px;
  background:radial-gradient(circle,rgba(201,168,76,.15),transparent 60%); pointer-events:none; }
.strip__h{ display:flex; align-items:center; gap:8px; padding:13px 18px 10px; position:relative; z-index:1;
  font-size:13.5px; font-weight:700; }
.strip__hint{ font-size:9.5px; font-weight:600; color:var(--gold); background:rgba(201,168,76,.14);
  padding:2px 8px; border-radius:12px; }
.strip__more{ margin-left:auto; font-size:11.5px; font-weight:600; color:var(--gold); text-decoration:none; }
.strip__more:hover{ text-decoration:underline; }
.strip__b{ padding:0 18px 14px; position:relative; z-index:1; }
.strip__season{ display:flex; gap:8px; align-items:baseline; flex-wrap:wrap; padding:0 0 10px;
  font-size:11.5px; color:rgba(244,241,232,.72); line-height:1.5; }
.strip__season b{ color:var(--bone); font-weight:700; }
.strip__season a{ color:var(--gold); font-weight:700; text-decoration:none; white-space:nowrap; }
.strip__rest{ text-align:center; font-size:11.5px; font-style:italic; color:rgba(244,241,232,.55);
  border:1px dashed rgba(244,241,232,.16); border-radius:9px; padding:16px; }
.strip__all{ display:inline-block; margin-top:9px; font-size:11px; font-weight:700; color:var(--gold);
  text-decoration:none; }
.strip__all:hover{ text-decoration:underline; }

/* Needs-you row — the page's row grammar, at its loudest */
.nr{ display:flex; gap:11px; align-items:center; padding:10px 0; }
.nr + .nr{ border-top:1px solid rgba(255,255,255,.1); }
.nr__m{ min-width:0; flex:1; }
.nr__t{ font-size:13.5px; font-weight:600; line-height:1.3; }
.nr__s{ font-size:10.5px; color:rgba(244,241,232,.62); margin-top:2px; line-height:1.45;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.nr__w{ text-align:right; flex-shrink:0; font-variant-numeric:tabular-nums; min-width:64px; }
.nr__w b{ font-size:12px; font-weight:700; color:var(--gold); display:block; white-space:nowrap; }
.nr__w i{ font-style:normal; font-size:9px; color:rgba(244,241,232,.55); white-space:nowrap; }
.nr__a{ flex-shrink:0; font-size:10.5px; font-weight:700; text-decoration:none; white-space:nowrap;
  color:var(--em); background:linear-gradient(135deg,#e7cf86,var(--gold)); padding:7px 12px; border-radius:8px; }
.nr__a:hover{ filter:brightness(1.06); }

/* Source chip — the one piece of encoding the whole page depends on */
.chip{ display:inline-flex; align-items:center; gap:5px; flex-shrink:0; white-space:nowrap;
  font-size:9px; font-weight:800; letter-spacing:.07em; text-transform:uppercase;
  padding:3px 9px; border-radius:11px; }
.chip__d{ width:5px; height:5px; border-radius:50%; }
.chip--tig{ background:rgba(143,190,121,.2); color:#c5dfb4; }
.chip--tig .chip__d{ background:#8FBE79; }
.chip--carrier{ background:rgba(156,190,221,.2); color:#c2d9ec; }
.chip--carrier .chip__d{ background:#9CBEDD; }
.chip--key{ background:rgba(201,168,76,.2); color:#e3cf9b; }
.chip--key .chip__d{ background:var(--gold); }

/* ── ② Lanes ── */
.lanes{ display:grid; grid-template-columns:1fr 1fr; gap:13px; align-items:start; }
.lane{ background:var(--card); border:1px solid var(--line); border-radius:13px; overflow:hidden;
  box-shadow:0 1px 3px rgba(20,30,24,.05); }
.lane--tig{ border-top:3px solid var(--tig); }
.lane--carrier{ border-top:3px solid var(--car); }
.lane__h{ display:flex; align-items:baseline; gap:9px; padding:11px 16px 9px; flex-wrap:wrap;
  border-bottom:1px solid var(--line2); }
.lane__t{ font-size:13px; font-weight:700; }
.lane--tig .lane__t{ color:var(--tig-d); }
.lane--carrier .lane__t{ color:var(--car-d); }
.lane__s{ font-size:10px; color:var(--faint); }
.lane__b{ padding:6px 16px 13px; }
.lane__rest{ text-align:center; font-size:11px; font-style:italic; color:var(--faint);
  border:1px dashed var(--line); border-radius:9px; padding:14px; margin-top:7px; }
.lane__all{ display:inline-block; margin-top:9px; font-size:10.5px; font-weight:700;
  color:var(--gold2); text-decoration:none; }
.lane__all:hover{ text-decoration:underline; }

.lr{ display:flex; gap:11px; align-items:center; padding:9px 0; }
.lr + .lr{ border-top:1px solid var(--line2); }
.lr__d{ width:34px; flex-shrink:0; text-align:center; background:var(--bone); border-radius:7px; padding:3px 0; }
.lr__mo{ display:block; font-size:8px; font-weight:700; text-transform:uppercase; color:var(--muted); }
.lr__dy{ display:block; font-size:14px; font-weight:700; line-height:1.1; }
.lr__m{ min-width:0; flex:1; }
.lr__t{ font-size:12.5px; font-weight:600; line-height:1.3; }
.lr__tags{ display:flex; gap:5px; margin-top:3px; flex-wrap:wrap; }
.tag{ font-size:9px; font-weight:600; color:var(--muted); background:var(--bone);
  border:1px solid var(--line2); padding:1px 7px; border-radius:9px; white-space:nowrap; }
.lr__w{ text-align:right; flex-shrink:0; font-variant-numeric:tabular-nums; }
.lr__w b{ font-size:11px; font-weight:700; color:var(--gold2); display:block; white-space:nowrap; }
.lr__w i{ font-style:normal; font-size:9px; color:var(--faint); white-space:nowrap; }

/* ── Worth reading ── */
.read{ display:grid; grid-template-columns:1.3fr 1fr 1fr auto; gap:11px; align-items:stretch; }
.read__lead, .read__card{ display:flex; flex-direction:column; gap:4px; text-decoration:none; color:var(--ink);
  border-radius:11px; padding:11px 13px; transition:transform .14s, box-shadow .14s; min-width:0; }
.read__lead{ background:linear-gradient(135deg,#fdf8ec,#f7efd8); border:1px solid rgba(201,168,76,.5); }
.read__card{ background:var(--card); border:1px solid var(--line); }
.read__lead:hover, .read__card:hover{ transform:translateY(-1px); box-shadow:0 8px 18px rgba(20,30,24,.08); }
.read__e{ font-size:8.5px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:var(--gold2);
  display:flex; align-items:center; gap:6px; }
.read__e i{ font-style:normal; background:var(--gold); color:#1b2620; font-size:7.5px; font-weight:800;
  padding:1px 6px; border-radius:9px; }
.read__t{ font-size:12px; font-weight:700; line-height:1.3; letter-spacing:-.005em;
  display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.read__lead .read__t{ font-size:13.5px; -webkit-line-clamp:2; }
.read__cta{ margin-top:auto; font-size:10px; font-weight:700; color:var(--gold2); }
.read__meta{ margin-top:auto; font-size:9.5px; color:var(--faint); }
.read__more{ align-self:center; font-size:10.5px; font-weight:700; color:var(--gold2);
  text-decoration:none; white-space:nowrap; padding:0 4px; }
.read__more:hover{ text-decoration:underline; }

/* ── The 1:1 invitation ── */
.oneone{ display:flex; align-items:center; gap:14px; text-decoration:none; color:var(--bone);
  background:linear-gradient(135deg,#10362a,#0a2c22); border:1px solid rgba(201,168,76,.3);
  border-radius:13px; padding:13px 18px; position:relative; overflow:hidden;
  transition:transform .15s, box-shadow .15s; }
.oneone:before{ content:""; position:absolute; top:-80px; right:-40px; width:240px; height:240px;
  background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); pointer-events:none; }
.oneone:hover{ transform:translateY(-1px); box-shadow:0 12px 26px rgba(10,44,34,.28); }
.oneone__badge{ flex-shrink:0; width:38px; height:38px; border-radius:50%; display:inline-flex;
  align-items:center; justify-content:center; font-size:12.5px; font-weight:800; color:var(--em);
  background:linear-gradient(135deg,#e7cf86,var(--gold)); position:relative; }
.oneone__text{ min-width:0; position:relative; display:flex; flex-direction:column; }
.oneone__text b{ font-size:13.5px; font-weight:700; line-height:1.2; }
.oneone__text i{ font-style:normal; font-size:11px; color:rgba(244,241,232,.72); margin-top:2px;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.oneone__btn{ flex-shrink:0; margin-left:auto; font-size:12px; font-weight:700; color:var(--em);
  white-space:nowrap; background:linear-gradient(135deg,#e7cf86,var(--gold));
  padding:9px 15px; border-radius:9px; position:relative; }

/* ── Responsive ── */
@media(max-width:1080px){
  .read{ grid-template-columns:1fr 1fr; }
  .read__more{ grid-column:1 / -1; align-self:start; }
}
@media(max-width:900px){
  .hub{ padding:18px 20px 28px; }
  .hub-head{ flex-direction:column; align-items:flex-start; gap:10px; }
  .hub-h1{ font-size:20px; }
  .lanes{ grid-template-columns:1fr; }
  .read{ grid-template-columns:1fr; }
  .nr{ flex-wrap:wrap; }
  .nr__m{ flex-basis:100%; order:2; }
  .nr__w{ order:1; margin-left:auto; text-align:right; }
  .nr__a{ order:3; margin-left:auto; }
  .oneone{ flex-wrap:wrap; }
  .oneone__text i{ white-space:normal; }
  .oneone__btn{ margin-left:0; width:100%; text-align:center; }
}
`;
