import { Link } from 'react-router-dom';
import {
  boardMeta,
  boardItems,
  dockLinks,
  newThisWeek,
  aep,
  type BoardItem,
} from '@/data/hubContent';
import { calendarEvents } from '@/data/calendarContent';

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

function DockLink({ icon, label, href }: { icon: string; label: string; href: string }) {
  if (href.startsWith('http')) {
    return (
      <a className="hub-dk" href={href} target="_blank" rel="noopener noreferrer">
        <span className="hub-dk__i" aria-hidden="true">{icon}</span>
        {label}
      </a>
    );
  }
  return (
    <Link className="hub-dk" to={href}>
      <span className="hub-dk__i" aria-hidden="true">{icon}</span>
      {label}
    </Link>
  );
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

  // Upcoming = next TIG/carrier happenings from the shared calendar
  // (skips holidays/OOO — those aren't "events to attend").
  const upcoming = calendarEvents
    .filter((e) => e.date >= todayKey && e.category !== 'holiday' && e.category !== 'ooo')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

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

        {/* ── The Dock ── */}
        <div className="hub-dock">
          {dockLinks.map((d) => (
            <DockLink key={d.label} {...d} />
          ))}
        </div>

        {/* ── The Board ── */}
        <section className="hub-board" aria-label="Bulletin board">
          <div className="hub-board__head">
            <span className="hub-board__title">📌 The Board</span>
            {boardItems.length > 0 && (
              <span className="hub-board__meta">
                Posted by {boardMeta.postedBy} · {formatPostedOn(boardMeta.postedOn)}
              </span>
            )}
          </div>
          {boardItems.length === 0 ? (
            <div className="hub-board__empty">Nothing urgent right now. Check back soon.</div>
          ) : (
            boardItems.map((item) => {
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
          })
          )}
        </section>

        {/* ── Two quiet cards ── */}
        <div className="hub-two">
          <section className="hub-card">
            <h2 className="hub-card__h">
              🗓 Upcoming <Link to="/calendar" className="hub-card__more">Calendar →</Link>
            </h2>
            {upcoming.length === 0 ? (
              <div className="hub-empty">Nothing scheduled. Check back Monday.</div>
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
                      <div className="hub-ev__t">{ev.title}</div>
                      <div className="hub-ev__s">
                        {ev.detail ?? ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          <section className="hub-card">
            <h2 className="hub-card__h">
              🆕 New this week <Link to="/industry-updates" className="hub-card__more">All updates →</Link>
            </h2>
            {newThisWeek.length === 0 ? (
              <div className="hub-empty">Nothing new yet this week.</div>
            ) : (
              newThisWeek.map((n) => {
                const inner = (
                  <>
                    <div className="hub-new__cat">{n.category}</div>
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
              })
            )}
          </section>
        </div>
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

/* dock */
.hub-dock{ display:flex; gap:10px; margin-bottom:22px; flex-wrap:wrap; }
.hub-dk{ display:flex; align-items:center; gap:9px; background:var(--card); border:1px solid var(--line); border-radius:11px;
  padding:11px 16px; font-size:13.5px; font-weight:600; color:var(--ink); text-decoration:none; transition:.15s;
  box-shadow:0 1px 3px rgba(0,0,0,.03); }
.hub-dk:hover{ border-color:var(--gold); transform:translateY(-2px); }
.hub-dk__i{ font-size:16px; }

/* board */
.hub-board{ background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone); border-radius:18px; padding:22px 24px;
  margin-bottom:22px; position:relative; overflow:hidden; }
.hub-board:before{ content:""; position:absolute; top:-90px; right:-60px; width:340px; height:340px;
  background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); pointer-events:none; }
.hub-board__head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; position:relative; flex-wrap:wrap; gap:6px; }
.hub-board__title{ font-size:15px; font-weight:700; }
.hub-board__meta{ font-size:11px; color:rgba(244,241,232,.55); }
.hub-board__empty{ font-size:13px; color:rgba(244,241,232,.6); padding:6px 0 2px; position:relative; }
.hub-bitem{ display:flex; align-items:center; gap:13px; padding:12px 0; border-top:1px solid rgba(255,255,255,.1); position:relative; font-size:14px; }
.hub-bitem__kind{ flex-shrink:0; width:96px; font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; display:flex; align-items:center; gap:7px; }
.hub-bitem__dot{ width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.hub-bitem__body{ min-width:0; }
.hub-bitem__title{ font-weight:600; }
.hub-bitem__note{ font-size:12px; color:rgba(244,241,232,.55); margin-top:1px; }
.hub-bitem__when{ margin-left:auto; text-align:right; flex-shrink:0; }
.hub-bitem__whenBig{ font-size:15px; font-weight:700; color:var(--gold); }
.hub-bitem__whenSub{ font-size:10.5px; color:rgba(244,241,232,.55); }

/* two cards */
.hub-two{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.hub-card{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:18px 20px; box-shadow:0 1px 3px rgba(0,0,0,.03); }
.hub-card__h{ font-size:13.5px; font-weight:700; display:flex; align-items:center; justify-content:space-between; margin:0 0 12px; }
.hub-card__more{ font-size:12px; font-weight:500; color:var(--gold2); text-decoration:none; }
.hub-card__more:hover{ text-decoration:underline; }
.hub-empty{ font-size:13px; color:var(--muted); padding:8px 0; }

.hub-ev{ display:flex; gap:12px; padding:9px 0; border-bottom:1px solid var(--line); }
.hub-ev:last-child{ border-bottom:none; }
.hub-ev__date{ width:40px; text-align:center; background:var(--bone); border-radius:8px; padding:4px 0; flex-shrink:0; }
.hub-ev__mo{ font-size:9px; font-weight:700; text-transform:uppercase; color:var(--muted); }
.hub-ev__dy{ font-size:15px; font-weight:700; }
.hub-ev__t{ font-size:13px; font-weight:600; }
.hub-ev__s{ font-size:11.5px; color:var(--muted); }

.hub-new{ display:block; padding:9px 0; border-bottom:1px solid var(--line); text-decoration:none; color:var(--ink); }
.hub-new:last-child{ border-bottom:none; }
.hub-new--link:hover .hub-new__t{ color:var(--gold2); }
.hub-new__cat{ font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--gold2); }
.hub-new__t{ font-size:13px; font-weight:600; margin-top:2px; transition:color .15s; }

@media(max-width:760px){
  .hub{ padding:20px; }
  .hub-two{ grid-template-columns:1fr; }
  .hub-bitem__kind{ display:none; }
}
`;
