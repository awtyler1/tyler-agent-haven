import { Link } from 'react-router-dom';
import {
  boardMeta,
  boardItems,
  welcome,
  season,
  featured,
  newThisWeek,
  aep,
  type BoardItem,
} from '@/data/hubContent';
import { calendarEvents, CATEGORY_META } from '@/data/calendarContent';
import { articles } from '@/data/articles';
import { KNOWLEDGE_META } from '@/data/knowledgeContent';
import { AepTrainingBoard } from '@/components/hub/AepTrainingBoard';
import { ONE_ON_ONE_CALENDLY_URL } from '@/data/booking';

// ── Helpers ──────────────────────────────────────────────────────────────────
const KIND_COLORS: Record<BoardItem['kind'], { dot: string; label: string }> = {
  deadline: { dot: '#e0795f', label: 'Deadline' },
  action: { dot: '#e0a85f', label: 'Action' },
  open: { dot: '#88b06a', label: 'Now open' },
};

function daysUntil(iso: string): number {
  const target = new Date(iso + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

function formatPostedOn(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function eventDate(iso: string): { mo: string; dy: string } {
  const d = new Date(iso + 'T00:00:00');
  return {
    mo: d.toLocaleDateString('en-US', { month: 'short' }),
    dy: d.toLocaleDateString('en-US', { day: 'numeric' }),
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const todayKey = now.toISOString().slice(0, 10);

  // AEP phase
  const year = now.getFullYear();
  const aepStart = new Date(year, aep.startMonth - 1, aep.startDay);
  const aepEnd = new Date(year, aep.endMonth - 1, aep.endDay);
  const daysToAep = Math.ceil((aepStart.getTime() - now.getTime()) / 86_400_000);
  const daysLeftAep = Math.ceil((aepEnd.getTime() - now.getTime()) / 86_400_000);
  const inAep = now >= aepStart && now <= aepEnd;

  // Upcoming card. Calls/meetings (tig + carrier) only surface here when they're
  // 7 days out or less, so the dashboard stays focused on the near term. Cert
  // milestones (e.g. AHIP launch) are exempt — they can show further out.
  const weekKey = new Date(now.getTime() + 7 * 86_400_000).toISOString().slice(0, 10);
  const upcoming = calendarEvents
    .filter((e) => {
      if (e.date < todayKey) return false;
      if (e.category === 'cert') return true;
      return e.date <= weekKey;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Board items that are calls/meetings (a join link tied to a date) follow the
  // same rule — only show on the dashboard when they're 7 days out or less.
  // Everything else on the Board (open items, deadlines, AHIP) is left alone.
  const visibleBoardItems = boardItems.filter((item) =>
    item.link && item.date ? item.date >= todayKey && item.date <= weekKey : true
  );

  // New this week = articles published in the last 7 days (auto-surfaced from
  // the same articles that power Knowledge & Updates), newest first, plus any
  // manual items. Articles posted today get a "New" badge.
  type NewsRow = { id: string; category: string; title: string; href?: string; isNew: boolean };
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

  return (
    <div className="hub">
      <style>{CSS}</style>
      <div className="hub-max">
        {/* ── Header ── */}
        <div className="hub-head">
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
        </div>

        {/* ── The Board — cockpit priority: season banner + this-week items ── */}
        <section className="hub-board" aria-label="Bulletin board">
          <div className="hub-board__head">
            <span className="hub-board__title">📌 The Board</span>
            <span className="hub-board__meta">
              Posted by {boardMeta.postedBy} · {formatPostedOn(boardMeta.postedOn)}
            </span>
          </div>

          {welcome.show && (
            <div className="hub-welcome">
              <div className="hub-welcome__t">{welcome.title}</div>
              <p className="hub-welcome__b">{welcome.body}</p>
              <div className="hub-welcome__sign">{welcome.sign}</div>
            </div>
          )}

          {season.show && (
            <div className="hub-season">
              <span className="hub-season__ic" aria-hidden="true">{season.emoji}</span>
              <div className="hub-season__body">
                <div className="hub-season__t">{season.title}</div>
                <p className="hub-season__b">{season.body}</p>
                <Link className="hub-season__cta" to={season.ctaHref}>{season.ctaLabel} →</Link>
              </div>
            </div>
          )}

          {visibleBoardItems.length > 0 && (
            <div className={season.show || welcome.show ? 'hub-bitems hub-bitems--divided' : 'hub-bitems'}>
              {visibleBoardItems.map((item) => {
                const kc = KIND_COLORS[item.kind];
                const days = item.date ? daysUntil(item.date) : null;
                return (
                  <div className="hub-bitem" key={item.id}>
                    <span className="hub-bitem__kind" style={{ color: kc.dot }}>
                      <span className="hub-bitem__dot" style={{ background: kc.dot }} />
                      {kc.label}
                    </span>
                    <div className="hub-bitem__body">
                      <div className="hub-bitem__title">{item.title}</div>
                      {item.note && <div className="hub-bitem__note">{item.note}</div>}
                      {item.details && item.details.length > 0 && (
                        <ul className="hub-bitem__details">
                          {item.details.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      )}
                      {item.link && (
                        <a className="hub-bitem__join" href={item.link} target="_blank" rel="noopener noreferrer">
                          {item.linkLabel ?? 'Join'} ↗
                        </a>
                      )}
                    </div>
                    <div className="hub-bitem__when">
                      <div className="hub-bitem__whenBig">{item.when}</div>
                      <div className="hub-bitem__whenSub">
                        {days !== null
                          ? days <= 0
                            ? 'today'
                            : `${days} day${days === 1 ? '' : 's'}`
                          : item.whenSub ?? ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!season.show && !welcome.show && visibleBoardItems.length === 0 && (
            <div className="hub-board__empty">Nothing urgent right now. Check back soon.</div>
          )}
        </section>

        {/* ── Featured highlight — one spotlight item under the Board ── */}
        {featured.show && (
          <Link className="hub-feat" to={featured.ctaHref}>
            <div className="hub-feat__body">
              <div className="hub-feat__eyebrow">⭑ {featured.eyebrow}</div>
              <div className="hub-feat__t">{featured.title}</div>
              <p className="hub-feat__b">{featured.body}</p>
              <span className="hub-feat__cta">{featured.ctaLabel} →</span>
            </div>
          </Link>
        )}

        {/* ── Cockpit row: book your 1:1 + upcoming ── */}
        <div className="hub-two">
          {/* Book your 1:1 */}
          <a className="hub-oo" href={ONE_ON_ONE_CALENDLY_URL} target="_blank" rel="noopener noreferrer">
            <div className="hub-oo__top">
              <span className="hub-oo__badge" aria-hidden="true">1:1</span>
              <span className="hub-oo__t">Your monthly 1:1 with Austin &amp; Andrew</span>
            </div>
            <p className="hub-oo__s">
              A full hour, once a month. Your pipeline, your blockers, next month's number.
              Slots go fast, so book early.
            </p>
            <span className="hub-oo__btn">Book your 1:1 →</span>
          </a>

          {/* Upcoming */}
          <section className="hub-card">
            <h2 className="hub-card__h">
              🗓 Upcoming <span className="hub-card__hint">next 7 days</span>
              <Link to="/calendar" className="hub-card__more">Calendar →</Link>
            </h2>
            {upcoming.length === 0 ? (
              <div className="hub-empty">Nothing on the calendar in the next 7 days.</div>
            ) : (
              upcoming.map((ev) => {
                const d = eventDate(ev.date);
                return (
                  <div className="hub-ev" key={ev.id}>
                    <div className="hub-ev__date">
                      <div className="hub-ev__mo">{d.mo}</div>
                      <div className="hub-ev__dy">{d.dy}</div>
                    </div>
                    <div>
                      <div className="hub-ev__t">
                        <span className="hub-ev__dot" style={{ background: CATEGORY_META[ev.category].color }} />
                        {ev.title}
                      </div>
                      <div className="hub-ev__s">{ev.detail ?? CATEGORY_META[ev.category].label}</div>
                      {ev.link && (
                        <a className="hub-ev__join" href={ev.link} target="_blank" rel="noopener noreferrer">
                          {ev.linkLabel ?? 'Join'} ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>

        {/* ── Below the fold: training input + what's new ── */}
        {/* Flip BOARD_OPEN off in AepTrainingBoard when the training plan is locked. */}
        <AepTrainingBoard />

        {newsItems.length > 0 && (
          <section className="hub-card hub-new-wk">
            <h2 className="hub-card__h">
              🆕 New this week <Link to="/industry-updates" className="hub-card__more">All updates →</Link>
            </h2>
            {newsItems.map((n) => {
              const inner = (
                <>
                  <div className="hub-new__cat">
                    {n.category}
                    {n.isNew && <span className="hub-new__badge">New</span>}
                  </div>
                  <div className="hub-new__t">{n.title}</div>
                </>
              );
              return n.href ? (
                n.href.startsWith('http') ? (
                  <a className="hub-new hub-new--link" key={n.id} href={n.href} target="_blank" rel="noopener noreferrer">{inner}</a>
                ) : (
                  <Link className="hub-new hub-new--link" key={n.id} to={n.href}>{inner}</Link>
                )
              ) : (
                <div className="hub-new" key={n.id}>{inner}</div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}

// ── Scoped styles (emerald hub) ──────────────────────────────────────────────
const CSS = `
.hub{
  --em:#0E3B2E; --bone:#F4F1E8; --card:#fff; --line:#e7e0cf; --muted:#6b6457;
  --ink:#1b2620; --gold:#C9A84C; --gold2:#A8801F;
  flex:1 1 auto; min-height:0; overflow-y:auto; background:var(--bone);
  font-family:'Outfit','Inter',system-ui,sans-serif; color:var(--ink);
  -webkit-font-smoothing:antialiased; padding:32px 40px 48px;
}
.hub *{ box-sizing:border-box; }
.hub-max{ max-width:920px; margin:0 auto; }

/* header */
.hub-head{ display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:18px; }
.hub-date{ font-size:12.5px; color:var(--muted); }
.hub-h1{ font-size:27px; font-weight:700; letter-spacing:-.025em; margin:2px 0 0; }
.hub-aep{ display:inline-flex; align-items:center; gap:8px; background:var(--em); color:var(--bone); padding:9px 15px; border-radius:30px; font-size:13px; }
.hub-aep b{ color:var(--gold); }

/* board */
.hub-board{ background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone); border-radius:18px; padding:22px 24px;
  margin-bottom:22px; position:relative; overflow:hidden; }
.hub-board:before{ content:""; position:absolute; top:-90px; right:-60px; width:340px; height:340px;
  background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); pointer-events:none; }
.hub-board__head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; position:relative; flex-wrap:wrap; gap:6px; }
.hub-board__title{ font-size:15px; font-weight:700; }
.hub-board__meta{ font-size:11px; color:rgba(244,241,232,.55); }
.hub-board__empty{ font-size:13px; color:rgba(244,241,232,.6); padding:6px 0 2px; position:relative; }
.hub-welcome{ position:relative; padding-bottom:15px; margin-bottom:2px; }
.hub-welcome__t{ font-size:16px; font-weight:700; }
.hub-welcome__b{ font-size:13.5px; color:rgba(244,241,232,.82); line-height:1.6; margin:6px 0 0; max-width:64ch; }
.hub-welcome__sign{ font-size:12.5px; color:var(--gold); font-weight:600; margin-top:10px; }
.hub-bitem{ display:flex; align-items:flex-start; gap:13px; padding:12px 0; border-top:1px solid rgba(255,255,255,.1); position:relative; font-size:14px; }
.hub-bitem__kind{ flex-shrink:0; width:96px; font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; display:flex; align-items:center; gap:7px; padding-top:2px; }
.hub-bitem__details{ margin:7px 0 0; padding:0; list-style:none; }
.hub-bitem__details li{ font-size:12px; color:rgba(244,241,232,.8); line-height:1.5; padding-left:14px; position:relative; margin-bottom:3px; }
.hub-bitem__details li:before{ content:""; position:absolute; left:2px; top:6px; width:4px; height:4px; border-radius:50%; background:var(--gold); }
.hub-bitem__dot{ width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.hub-bitem__body{ min-width:0; }
.hub-bitem__title{ font-weight:600; }
.hub-bitem__note{ font-size:12px; color:rgba(244,241,232,.55); margin-top:1px; }
.hub-bitem__join{ display:inline-flex; align-items:center; gap:5px; margin-top:10px; font-size:12px; font-weight:700;
  color:var(--em); background:linear-gradient(135deg,#e7cf86,var(--gold)); padding:7px 13px; border-radius:8px; text-decoration:none; }
.hub-bitem__join:hover{ filter:brightness(1.05); transform:translateY(-1px); }
.hub-bitem__when{ margin-left:auto; text-align:right; flex-shrink:0; }
.hub-bitem__whenBig{ font-size:15px; font-weight:700; color:var(--gold); }
.hub-bitem__whenSub{ font-size:10.5px; color:rgba(244,241,232,.55); }

/* season banner — slim, always-on cert reminder at the top of the Board */
.hub-season{ display:flex; align-items:flex-start; gap:13px; position:relative; }
.hub-season__ic{ font-size:22px; line-height:1.1; flex-shrink:0; }
.hub-season__body{ flex:1; min-width:0; }
.hub-season__t{ font-size:15px; font-weight:700; }
.hub-season__b{ font-size:13px; color:rgba(244,241,232,.82); line-height:1.55; margin:3px 0 0; max-width:66ch; }
.hub-season__cta{ display:inline-flex; align-items:center; gap:6px; margin-top:11px; font-size:12.5px; font-weight:700;
  color:var(--em); background:linear-gradient(135deg,#e7cf86,var(--gold)); padding:8px 14px; border-radius:8px; text-decoration:none; transition:.15s; }
.hub-season__cta:hover{ filter:brightness(1.05); transform:translateY(-1px); }
.hub-bitems--divided{ margin-top:14px; padding-top:4px; border-top:1px solid rgba(255,255,255,.1); }

/* featured highlight — bright spotlight card under the board */
.hub-feat{ display:block; text-decoration:none; color:var(--ink); background:var(--card); border:1px solid var(--line);
  border-left:5px solid var(--gold); border-radius:16px; padding:18px 22px; margin-bottom:22px; position:relative;
  overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.03); transition:transform .15s, box-shadow .15s; }
.hub-feat:before{ content:""; position:absolute; top:-70px; right:-40px; width:230px; height:230px;
  background:radial-gradient(circle,rgba(201,168,76,.12),transparent 60%); pointer-events:none; }
.hub-feat:hover{ transform:translateY(-1px); box-shadow:0 12px 26px rgba(20,30,24,.08); }
.hub-feat__body{ position:relative; }
.hub-feat__eyebrow{ font-size:10.5px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--gold2); margin-bottom:6px; }
.hub-feat__t{ font-size:17px; font-weight:700; letter-spacing:-.01em; line-height:1.25; }
.hub-feat__b{ font-size:13px; line-height:1.6; color:var(--muted); margin:6px 0 0; max-width:72ch; }
.hub-feat__cta{ display:inline-flex; align-items:center; gap:6px; margin-top:13px; font-size:12.5px; font-weight:700;
  color:var(--em); background:linear-gradient(135deg,#e7cf86,var(--gold)); padding:9px 15px; border-radius:9px; }

/* two cards */
.hub-two{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.hub-card{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:18px 20px; box-shadow:0 1px 3px rgba(0,0,0,.03); }
.hub-card__h{ font-size:13.5px; font-weight:700; display:flex; align-items:center; gap:8px; margin:0 0 12px; }
.hub-card__hint{ font-size:10.5px; font-weight:600; color:var(--muted); background:var(--bone); padding:2px 8px; border-radius:20px; }
.hub-card__more{ margin-left:auto; font-size:12px; font-weight:500; color:var(--gold2); text-decoration:none; }
.hub-card__more:hover{ text-decoration:underline; }
.hub-empty{ font-size:13px; color:var(--muted); padding:8px 0; }

/* monthly 1:1 — cockpit card (sits in the hub-two grid, emerald against white) */
.hub-oo{ display:flex; flex-direction:column; text-decoration:none; color:var(--bone);
  background:linear-gradient(135deg,#10362a,#0a2c22); border:1px solid rgba(201,168,76,.3); border-radius:16px;
  padding:18px 20px; position:relative; overflow:hidden; transition:transform .15s, box-shadow .15s; }
.hub-oo:before{ content:""; position:absolute; top:-70px; right:-50px; width:240px; height:240px;
  background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); pointer-events:none; }
.hub-oo:hover{ transform:translateY(-1px); box-shadow:0 12px 26px rgba(10,44,34,.28); }
.hub-oo__top{ display:flex; align-items:center; gap:11px; position:relative; }
.hub-oo__badge{ flex-shrink:0; width:38px; height:38px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;
  font-size:13px; font-weight:800; letter-spacing:.02em; color:var(--em); background:linear-gradient(135deg,#e7cf86,var(--gold)); }
.hub-oo__t{ font-size:14.5px; font-weight:700; line-height:1.25; }
.hub-oo__s{ font-size:12px; line-height:1.5; color:rgba(244,241,232,.82); margin:11px 0 0; position:relative; }
.hub-oo__btn{ align-self:flex-start; margin-top:14px; font-size:12.5px; font-weight:700; color:var(--em);
  background:linear-gradient(135deg,#e7cf86,var(--gold)); padding:10px 16px; border-radius:9px; position:relative; }

/* below-fold "new this week" spacing */
.hub-new-wk{ margin-top:16px; }

.hub-ev{ display:flex; gap:12px; padding:9px 0; border-bottom:1px solid var(--line); }
.hub-ev:last-child{ border-bottom:none; }
.hub-ev__date{ width:40px; text-align:center; background:var(--bone); border-radius:8px; padding:4px 0; flex-shrink:0; }
.hub-ev__mo{ font-size:9px; font-weight:700; text-transform:uppercase; color:var(--muted); }
.hub-ev__dy{ font-size:15px; font-weight:700; }
.hub-ev__t{ font-size:13px; font-weight:600; display:flex; align-items:center; gap:7px; }
.hub-ev__dot{ width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.hub-ev__s{ font-size:11.5px; color:var(--muted); }
.hub-ev__join{ display:inline-block; margin-top:4px; font-size:11.5px; font-weight:700; color:var(--gold2); text-decoration:none; }
.hub-ev__join:hover{ text-decoration:underline; }

.hub-new{ display:block; padding:9px 0; border-bottom:1px solid var(--line); text-decoration:none; color:var(--ink); }
.hub-new:last-child{ border-bottom:none; }
.hub-new--link:hover .hub-new__t{ color:var(--gold2); }
.hub-new__cat{ font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--gold2); }
.hub-new__badge{ margin-left:8px; background:var(--gold); color:#1b2620; font-size:9px; font-weight:800; letter-spacing:.06em; padding:2px 7px; border-radius:20px; text-transform:uppercase; vertical-align:middle; }
.hub-new__t{ font-size:13px; font-weight:600; margin-top:2px; transition:color .15s; }

@media(max-width:760px){
  .hub{ padding:20px; }
  .hub-two{ grid-template-columns:1fr; }
  .hub-bitem__kind{ display:none; }
}
`;
