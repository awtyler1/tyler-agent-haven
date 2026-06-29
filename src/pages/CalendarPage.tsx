import { useState } from 'react';
import { calendarEvents, CATEGORY_META, type CalEvent } from '@/data/calendarContent';

function ymKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const now = new Date();
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));

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
                    return ev.link ? (
                      <a
                        className={`cal-evt cal-evt--link${meta.dashed ? ' soft' : ''}`}
                        key={ev.id}
                        href={ev.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${tip} (click to ${ev.linkLabel ?? 'join'})`}
                        style={style}
                      >
                        {ev.title}
                      </a>
                    ) : (
                      <span
                        className={`cal-evt${meta.dashed ? ' soft' : ''}`}
                        key={ev.id}
                        title={tip}
                        style={style}
                      >
                        {ev.title}
                      </span>
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
.cal-dow{ display:grid; grid-template-columns:repeat(7,1fr); border-bottom:1px solid var(--line); background:#fbf9f4; }
.cal-dow div{ padding:9px 10px; font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
.cal-grid{ display:grid; grid-template-columns:repeat(7,1fr); }
.cal-cell{ min-height:92px; border-right:1px solid var(--line); border-bottom:1px solid var(--line); padding:7px 8px; }
.cal-cell:nth-child(7n){ border-right:none; }
.cal-cell.dim{ background:#faf8f2; }
.cal-cell.dim .cal-dn{ color:#c4bcab; }
.cal-dn{ font-size:11.5px; font-weight:600; color:var(--muted); }
.cal-cell.today .cal-dn{ display:inline-flex; align-items:center; justify-content:center; width:21px; height:21px;
  border-radius:50%; background:var(--em); color:var(--bone); }
.cal-evt{ display:block; margin-top:4px; font-size:10.5px; font-weight:600; padding:3px 7px; border-radius:6px; color:#fff;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; cursor:default; }
.cal-evt.soft{ background:transparent; border:1.5px dashed; }
.cal-evt--link{ cursor:pointer; text-decoration:none; }
.cal-evt--link:hover{ filter:brightness(1.08); box-shadow:0 1px 6px rgba(0,0,0,.18); }

@media(max-width:760px){
  .cal{ padding:18px; }
  .cal-cell{ min-height:64px; padding:5px 5px; }
  .cal-evt{ font-size:0; padding:0; height:7px; width:7px; border-radius:50%; display:inline-block; margin:4px 2px 0 0; }
}
`;
