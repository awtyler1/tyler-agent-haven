import { useState, useEffect } from 'react';
import { calendarEvents, CATEGORY_META, type CalEvent } from '@/data/calendarContent';

function ymKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatFullDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Consistent detail popout — every event opens this same layout.
function EventModal({ event, onClose }: { event: CalEvent; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const meta = CATEGORY_META[event.category];
  const description = event.description ?? event.detail;

  return (
    <div className="cal-modal" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title" onClick={onClose}>
      <div className="cal-modal__card" onClick={(e) => e.stopPropagation()}>
        <button className="cal-modal__x" onClick={onClose} aria-label="Close">×</button>

        <div className="cal-modal__cat">
          <span
            className="cal-modal__dot"
            style={meta.dashed ? { border: `1.5px dashed ${meta.color}` } : { background: meta.color }}
          />
          {meta.label}
        </div>
        <h2 className="cal-modal__title" id="cal-modal-title">{event.title}</h2>
        <div className="cal-modal__date">{formatFullDate(event.date)}</div>

        {event.recap && (
          <div className="cal-recap">
            <div className="cal-recap__h">📝 Recap</div>
            {event.recap.summary && <p className="cal-recap__s">{event.recap.summary}</p>}
            {event.recap.points && event.recap.points.length > 0 && (
              <ul className="cal-recap__list">
                {event.recap.points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
            {event.recap.documents && event.recap.documents.length > 0 && (
              <div className="cal-recap__docs">
                {event.recap.documents.map((d, i) => (
                  <a key={i} href={d.url} target="_blank" rel="noopener noreferrer">📄 {d.name} ↗</a>
                ))}
              </div>
            )}
          </div>
        )}

        {description && (
          <div className="cal-modal__sec">
            <div className="cal-modal__h">Description</div>
            <p className="cal-modal__p">{description}</p>
          </div>
        )}

        {event.location && (
          <div className="cal-modal__sec">
            <div className="cal-modal__h">Location</div>
            <p className="cal-modal__p">📍 {event.location}</p>
          </div>
        )}

        {event.time && (
          <div className="cal-modal__sec">
            <div className="cal-modal__h">Time</div>
            <p className="cal-modal__p">🕕 {event.time}</p>
          </div>
        )}

        <div className="cal-modal__sec">
          <div className="cal-modal__h">Documents to review beforehand</div>
          {event.documents && event.documents.length > 0 ? (
            <ul className="cal-modal__docs">
              {event.documents.map((d, i) => (
                <li key={i}>
                  <a href={d.url} target="_blank" rel="noopener noreferrer">📄 {d.name} ↗</a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cal-modal__none">Nothing to review ahead of this one.</p>
          )}
        </div>

        {event.link && (
          <div className="cal-modal__sec">
            <div className="cal-modal__h">Meeting link</div>
            <a className="cal-modal__join" href={event.link} target="_blank" rel="noopener noreferrer">
              💻 {event.linkLabel ?? 'Join the meeting'} ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const now = new Date();
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState<CalEvent | null>(null);

  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const monthTitle = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayKey = ymKey(now.getFullYear(), now.getMonth(), now.getDate());

  const eventsByDate = calendarEvents.reduce<Record<string, CalEvent[]>>((acc, ev) => {
    (acc[ev.date] = acc[ev.date] || []).push(ev);
    return acc;
  }, {});

  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysInPrev = new Date(y, m, 0).getDate();
  const totalCells = firstDow + daysInMonth;
  const trailing = (7 - (totalCells % 7)) % 7;

  const move = (n: number) => setCursor(new Date(y, m + n, 1));
  const goToday = () => setCursor(new Date(now.getFullYear(), now.getMonth(), 1));

  return (
    <div className="cal">
      <style>{CSS}</style>
      <div className="cal-max">
        {/* ── Header ── */}
        <div className="cal-head">
          <div>
            <h1 className="cal-h1">Calendar</h1>
            <div className="cal-sub">Deadlines, certs, events, and time off — all in one place.</div>
          </div>
          <div className="cal-mnav">
            <button onClick={() => move(-1)} aria-label="Previous month">‹</button>
            <span className="cal-mo">{monthTitle}</span>
            <button onClick={() => move(1)} aria-label="Next month">›</button>
            <button className="cal-today" onClick={goToday}>Today</button>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="cal-legend">
          {Object.values(CATEGORY_META).map((c) => (
            <span className="cal-lg" key={c.label}>
              <span
                className="cal-lg__d"
                style={c.dashed ? { border: `1.5px dashed ${c.color}` } : { background: c.color }}
              />
              {c.label}
            </span>
          ))}
        </div>

        {/* ── Grid ── */}
        <div className="cal-board">
          <div className="cal-dow">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="cal-grid">
            {/* leading days from previous month */}
            {Array.from({ length: firstDow }, (_, i) => (
              <div className="cal-cell dim" key={`p${i}`}>
                <span className="cal-dn">{daysInPrev - firstDow + 1 + i}</span>
              </div>
            ))}
            {/* current month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const key = ymKey(y, m, d);
              const evs = eventsByDate[key] || [];
              return (
                <div className={`cal-cell${key === todayKey ? ' today' : ''}`} key={key}>
                  <span className="cal-dn">{d}</span>
                  {evs.map((ev) => {
                    const meta = CATEGORY_META[ev.category];
                    const tip = ev.detail ? `${ev.title} — ${ev.detail}` : ev.title;
                    const style = meta.dashed
                      ? { borderColor: meta.color, color: meta.color }
                      : { background: meta.color };
                    return (
                      <button
                        type="button"
                        className={`cal-evt${meta.dashed ? ' soft' : ''}`}
                        key={ev.id}
                        title={`${tip} (click for ${ev.recap ? 'recap' : 'details'})`}
                        style={style}
                        onClick={() => setSelected(ev)}
                      >
                        {ev.recap ? '📝 ' : ''}{ev.title}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {/* trailing days from next month */}
            {Array.from({ length: trailing }, (_, i) => (
              <div className="cal-cell dim" key={`n${i}`}>
                <span className="cal-dn">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const CSS = `
.cal{
  --em:#0E3B2E; --bone:#F4F1E8; --card:#fff; --line:#e7e0cf; --muted:#6b6457; --ink:#1b2620; --gold:#C9A84C; --gold2:#A8801F;
  flex:1 1 auto; min-height:0; overflow-y:auto; background:var(--bone);
  font-family:'Outfit','Inter',system-ui,sans-serif; color:var(--ink);
  -webkit-font-smoothing:antialiased; padding:30px 36px 44px;
}
.cal *{ box-sizing:border-box; }
.cal-max{ max-width:1020px; margin:0 auto; }

.cal-head{ display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:14px; }
.cal-h1{ font-size:25px; font-weight:700; letter-spacing:-.02em; margin:0; }
.cal-sub{ font-size:12.5px; color:var(--muted); margin-top:2px; }
.cal-mnav{ display:flex; align-items:center; gap:10px; }
.cal-mo{ font-size:17px; font-weight:700; min-width:150px; text-align:center; }
.cal-mnav button{ width:34px; height:34px; border-radius:9px; border:1px solid var(--line); background:var(--card);
  cursor:pointer; font-size:15px; color:var(--ink); font-family:inherit; transition:.15s; }
.cal-mnav button:hover{ border-color:var(--gold); }
.cal-today{ width:auto !important; padding:0 13px; font-size:12px; font-weight:600; }

.cal-legend{ display:flex; gap:14px; flex-wrap:wrap; margin-bottom:14px; font-size:11.5px; color:var(--muted); }
.cal-lg{ display:flex; align-items:center; gap:6px; }
.cal-lg__d{ width:8px; height:8px; border-radius:50%; }

.cal-board{ background:var(--card); border:1px solid var(--line); border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.03); }
.cal-dow{ display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); border-bottom:1px solid var(--line); background:#fbf9f4; }
.cal-dow div{ padding:9px 10px; font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
/* minmax(0,1fr) — not 1fr — so a long event pill can't stretch its column and
   skew the grid. Columns stay equal; the pill truncates with its own ellipsis. */
.cal-grid{ display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); }
.cal-cell{ min-width:0; min-height:92px; border-right:1px solid var(--line); border-bottom:1px solid var(--line); padding:7px 8px; }
.cal-cell:nth-child(7n){ border-right:none; }
.cal-cell.dim{ background:#faf8f2; }
.cal-cell.dim .cal-dn{ color:#c4bcab; }
.cal-dn{ font-size:11.5px; font-weight:600; color:var(--muted); }
.cal-cell.today .cal-dn{ display:inline-flex; align-items:center; justify-content:center; width:21px; height:21px;
  border-radius:50%; background:var(--em); color:var(--bone); }
.cal-evt{ display:block; width:100%; margin-top:4px; font-size:10.5px; font-weight:600; padding:3px 7px; border-radius:6px; color:#fff;
  border:none; font-family:inherit; text-align:left; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; cursor:pointer; transition:.12s; }
.cal-evt:hover{ filter:brightness(1.08); box-shadow:0 1px 6px rgba(0,0,0,.18); }
.cal-evt.soft{ background:transparent; border:1.5px dashed; }

/* event detail popout */
.cal-modal{ position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:20px;
  background:rgba(14,32,26,.55); backdrop-filter:blur(3px); animation:calFade .15s ease; }
@keyframes calFade{ from{ opacity:0; } to{ opacity:1; } }
.cal-modal__card{ background:var(--card); border-radius:18px; width:100%; max-width:460px; max-height:88vh; overflow-y:auto;
  padding:24px; position:relative; box-shadow:0 24px 60px rgba(0,0,0,.3); animation:calPop .16s ease; }
@keyframes calPop{ from{ opacity:0; transform:translateY(8px) scale(.98); } to{ opacity:1; transform:none; } }
.cal-modal__x{ position:absolute; top:14px; right:14px; width:30px; height:30px; border-radius:8px; border:1px solid var(--line);
  background:var(--card); cursor:pointer; font-size:18px; line-height:1; color:var(--muted); font-family:inherit; transition:.15s; }
.cal-modal__x:hover{ border-color:var(--gold); color:var(--ink); }
.cal-modal__cat{ display:inline-flex; align-items:center; gap:7px; font-size:11px; font-weight:700; letter-spacing:.06em;
  text-transform:uppercase; color:var(--muted); }
.cal-modal__dot{ width:9px; height:9px; border-radius:50%; }
.cal-modal__title{ font-size:21px; font-weight:700; letter-spacing:-.02em; margin:8px 0 3px; padding-right:30px; }
.cal-modal__date{ font-size:13px; color:var(--gold2); font-weight:600; }
/* recap callout — stands apart from the prep fields */
.cal-recap{ margin-top:14px; background:rgba(14,59,46,.05); border:1px solid rgba(14,59,46,.16); border-radius:12px; padding:14px 16px; }
.cal-recap__h{ font-size:11px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--em); margin-bottom:7px; }
.cal-recap__s{ font-size:13px; line-height:1.55; color:var(--ink); margin:0; }
.cal-recap__list{ margin:9px 0 0; padding-left:18px; }
.cal-recap__list li{ font-size:12.5px; line-height:1.5; color:var(--ink); margin-bottom:5px; }
.cal-recap__list li:last-child{ margin-bottom:0; }
.cal-recap__docs{ display:flex; flex-direction:column; gap:5px; margin-top:10px; }
.cal-recap__docs a{ font-size:12.5px; font-weight:700; color:var(--gold2); text-decoration:none; }
.cal-recap__docs a:hover{ text-decoration:underline; }

.cal-modal__sec{ margin-top:16px; }
.cal-modal__h{ font-size:10.5px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--gold2); margin-bottom:5px; }
.cal-modal__p{ font-size:13.5px; line-height:1.55; color:var(--ink); margin:0; }
.cal-modal__none{ font-size:12.5px; color:var(--muted); font-style:italic; margin:0; }
.cal-modal__docs{ margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:6px; }
.cal-modal__docs a{ font-size:13px; font-weight:600; color:var(--gold2); text-decoration:none; }
.cal-modal__docs a:hover{ text-decoration:underline; }
.cal-modal__join{ display:inline-flex; align-items:center; gap:7px; background:var(--em); color:var(--bone);
  font-size:13px; font-weight:700; padding:11px 18px; border-radius:10px; text-decoration:none; transition:.15s; }
.cal-modal__join:hover{ filter:brightness(1.1); transform:translateY(-1px); }

@media(max-width:760px){
  .cal{ padding:18px; }
  .cal-cell{ min-height:64px; padding:5px 5px; }
  .cal-evt{ font-size:0; padding:0; height:7px; width:7px; border-radius:50%; display:inline-block; margin:4px 2px 0 0; }
}
`;
