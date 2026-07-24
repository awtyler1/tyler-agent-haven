import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { whatsNew } from '@/data/whatsNew';
import { articles } from '@/data/articles';
import { KNOWLEDGE_META } from '@/data/knowledgeContent';

// ============================================================================
// WHAT'S NEW BELL — the hub's notification center.
// ----------------------------------------------------------------------------
// A bell in the hub header with a gold count of what this browser hasn't seen,
// opening a running, dated, newest-first log: manual entries from
// src/data/whatsNew.ts merged with published articles. Nothing is ever
// removed; items simply lose their "New" chip once seen.
//
// "Seen" is per-browser via localStorage (shared-login MVP, same approach as
// the AEP training board): we store the date the panel was last closed. An
// item is NEW when it's newer than that date AND at most NEW_WINDOW_DAYS old,
// so a first visit or a long absence never opens to a wall of flags.
// ============================================================================

const SEEN_KEY = 'tig-whatsnew-seen'; // 'YYYY-MM-DD' the panel was last closed
const NEW_WINDOW_DAYS = 30;
const MAX_ROWS = 60;

interface FeedRow {
  id: string;
  date: string;
  category: string;
  title: string;
  note?: string;
  href?: string;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function ageInDays(iso: string): number {
  const d = new Date(iso + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((now.getTime() - d.getTime()) / 86_400_000);
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-US', sameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildFeed(): FeedRow[] {
  const entries: FeedRow[] = whatsNew.map((n) => ({
    id: `wn-${n.id}`,
    date: n.date,
    category: n.category,
    title: n.title,
    note: n.note,
    href: n.href,
  }));
  const posts: FeedRow[] = articles.map((a) => ({
    id: `art-${a.slug}`,
    date: a.date,
    category: KNOWLEDGE_META[a.category]?.label ?? 'Update',
    title: a.title,
    href: `/knowledge/${a.slug}`,
  }));
  return [...entries, ...posts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_ROWS);
}

function isNewSince(date: string, seen: string | null): boolean {
  if (ageInDays(date) > NEW_WINDOW_DAYS) return false;
  return !seen || date > seen;
}

function Row({ row, isNew }: { row: FeedRow; isNew: boolean }) {
  const inner = (
    <>
      <div className="wn-row__top">
        <span className="wn-row__cat">{row.category}</span>
        {isNew && <span className="wn-row__new">New</span>}
        <span className="wn-row__date">{formatDate(row.date)}</span>
      </div>
      <div className="wn-row__t">{row.title}</div>
      {row.note && <div className="wn-row__n">{row.note}</div>}
    </>
  );
  const cls = `wn-row${isNew ? ' wn-row--new' : ''}${row.href ? ' wn-row--link' : ''}`;
  if (!row.href) return <div className={cls}>{inner}</div>;
  return row.href.startsWith('http') ? (
    <a className={cls} href={row.href} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <Link className={cls} to={row.href}>{inner}</Link>
  );
}

export function WhatsNewBell() {
  const [open, setOpen] = useState(false);
  // Frozen at mount so the chips stay visible while browsing this session;
  // updated when the panel closes so the badge clears immediately.
  const [seen, setSeen] = useState<string | null>(() => {
    try { return localStorage.getItem(SEEN_KEY); } catch { return null; }
  });

  const feed = useMemo(buildFeed, []);
  const unseenCount = feed.filter((r) => isNewSince(r.date, seen)).length;

  const close = () => {
    try { localStorage.setItem(SEEN_KEY, todayKey()); } catch { /* private mode */ }
    setSeen(todayKey());
    setOpen(false);
  };

  return (
    <>
      <style>{CSS}</style>
      <button
        type="button"
        className="wn-bell"
        onClick={() => setOpen(true)}
        aria-label={unseenCount > 0 ? `What's new, ${unseenCount} unread` : "What's new"}
      >
        <span aria-hidden="true">🔔</span>
        {unseenCount > 0 && (
          <span className="wn-bell__count" aria-hidden="true">
            {unseenCount > 9 ? '9+' : unseenCount}
          </span>
        )}
      </button>
      {open && <Panel feed={feed} seen={seen} onClose={close} />}
    </>
  );
}

function Panel({ feed, seen, onClose }: { feed: FeedRow[]; seen: string | null; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fresh = feed.filter((r) => isNewSince(r.date, seen));
  const older = feed.filter((r) => !isNewSince(r.date, seen));

  return (
    <div className="wn-modal" role="dialog" aria-modal="true" aria-labelledby="wn-title" onClick={onClose}>
      <div className="wn-modal__card" onClick={(e) => e.stopPropagation()}>
        <button className="wn-modal__x" onClick={onClose} aria-label="Close">×</button>
        <div className="wn-modal__kicker">🔔 What's New</div>
        <h2 className="wn-modal__title" id="wn-title">
          {fresh.length > 0 ? `${fresh.length} new since your last check` : "You're all caught up"}
        </h2>
        <p className="wn-modal__note">
          A running log of everything we add or update: forms, events, carrier news, features, and articles. Newest first.
        </p>

        <div className="wn-list">
          {fresh.map((r) => <Row key={r.id} row={r} isNew />)}
          {fresh.length > 0 && older.length > 0 && (
            <div className="wn-caughtup" aria-hidden="true"><span>you're caught up</span></div>
          )}
          {older.map((r) => <Row key={r.id} row={r} isNew={false} />)}
          {feed.length === 0 && <div className="wn-empty">Nothing posted yet. Check back soon.</div>}
        </div>
      </div>
    </div>
  );
}

const CSS = `
/* bell */
.wn-bell{ position:relative; width:37px; height:37px; border-radius:50%; border:none; cursor:pointer;
  background:#0E3B2E; color:#F4F1E8; font-size:15px; line-height:1; display:inline-flex; align-items:center;
  justify-content:center; font-family:inherit; transition:.15s; flex-shrink:0; }
.wn-bell:hover{ filter:brightness(1.2); }
.wn-bell__count{ position:absolute; top:-4px; right:-5px; min-width:17px; height:17px; padding:0 4px; border-radius:10px;
  background:linear-gradient(135deg,#e7cf86,#C9A84C); color:#1b2620; border:2px solid #F4F1E8;
  font-size:9px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; box-sizing:content-box; }

/* modal */
.wn-modal{ position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:20px;
  background:rgba(14,32,26,.55); backdrop-filter:blur(3px); animation:wnFade .15s ease; }
@keyframes wnFade{ from{ opacity:0; } to{ opacity:1; } }
.wn-modal__card{ background:#fff; border-radius:18px; width:100%; max-width:560px; max-height:86vh; overflow-y:auto;
  padding:24px; position:relative; box-shadow:0 24px 60px rgba(0,0,0,.3); animation:wnPop .16s ease;
  font-family:'Outfit','Inter',system-ui,sans-serif; color:#1b2620; box-sizing:border-box; }
.wn-modal__card *{ box-sizing:border-box; }
@keyframes wnPop{ from{ opacity:0; transform:translateY(8px) scale(.98); } to{ opacity:1; transform:none; } }
.wn-modal__x{ position:absolute; top:14px; right:14px; width:30px; height:30px; border-radius:8px; border:1px solid #e7e0cf;
  background:#fff; cursor:pointer; font-size:18px; line-height:1; color:#6b6457; font-family:inherit; transition:.15s; }
.wn-modal__x:hover{ border-color:#C9A84C; color:#1b2620; }
.wn-modal__kicker{ font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#A8801F; }
.wn-modal__title{ font-size:21px; font-weight:700; letter-spacing:-.02em; margin:6px 0 0; padding-right:30px; }
.wn-modal__note{ font-size:12.5px; line-height:1.55; color:#6b6457; margin:8px 0 0; }

/* list */
.wn-list{ margin-top:16px; display:flex; flex-direction:column; gap:7px; }
.wn-row{ display:block; background:#faf8f2; border:1px solid #e7e0cf; border-radius:11px; padding:10px 13px;
  text-decoration:none; color:#1b2620; transition:.15s; }
.wn-row--new{ background:rgba(201,168,76,.09); border-color:rgba(201,168,76,.5); }
.wn-row--link:hover{ border-color:#C9A84C; }
.wn-row--link:hover .wn-row__t{ color:#A8801F; }
.wn-row__top{ display:flex; align-items:center; gap:7px; }
.wn-row__cat{ font-size:9px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:#A8801F; }
.wn-row__new{ background:#C9A84C; color:#1b2620; font-size:8px; font-weight:800; letter-spacing:.05em;
  padding:1px 6px; border-radius:12px; text-transform:uppercase; }
.wn-row__date{ margin-left:auto; font-size:10px; color:#928b7c; flex-shrink:0; }
.wn-row__t{ font-size:12.5px; font-weight:700; margin-top:3px; line-height:1.3; transition:color .15s; }
.wn-row__n{ font-size:11px; color:#6b6457; line-height:1.45; margin-top:2px; }

/* caught-up divider */
.wn-caughtup{ display:flex; align-items:center; gap:10px; padding:4px 0; }
.wn-caughtup:before, .wn-caughtup:after{ content:""; flex:1; height:1px; background:#e7e0cf; }
.wn-caughtup span{ font-size:9px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#928b7c; }

.wn-empty{ font-size:12.5px; color:#6b6457; font-style:italic; padding:8px 0; text-align:center; }
`;
