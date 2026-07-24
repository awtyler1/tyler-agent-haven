import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { whatsNew } from '@/data/whatsNew';
import { articles } from '@/data/articles';
import { KNOWLEDGE_META } from '@/data/knowledgeContent';

// ============================================================================
// WHAT'S NEW BELL — the hub's notification center.
// ----------------------------------------------------------------------------
// A bell in the hub header with a gold count of unread items, opening a
// running, dated, newest-first log: manual entries from src/data/whatsNew.ts
// merged with published articles. Nothing is ever removed; items simply lose
// their "New" chip once read.
//
// Read state is PER ITEM and durable. The source of truth is the
// whats_new_reads table in Supabase, keyed by a lightweight agent identity:
// the name they enter once (shared-login MVP, same approach and same stored
// name as the AEP training board). That makes read history follow the agent
// across devices and survive cleared browser storage. localStorage is kept as
// a fast local cache and as the fallback when the agent hasn't added a name
// yet or the network is down. An item is marked read when the agent clicks
// its link, taps its ✓, or uses "Mark all as read" — never just because the
// panel was opened. Backstop: items older than NEW_WINDOW_DAYS stop counting
// as new even if unclicked, so one ignored item can't leave a permanent badge.
// ============================================================================

const READ_KEY = 'tig-whatsnew-read'; // local cache: JSON array of read ids
const NAME_KEY = 'tig-aep-board-name'; // shared "who am I" with the AEP board
const NEW_WINDOW_DAYS = 30;
const MAX_ROWS = 60;

const readsTable = () => (supabase as any).from('whats_new_reads');
const noop = () => {};

interface FeedRow {
  id: string;
  date: string;
  category: string;
  title: string;
  note?: string;
  href?: string;
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

/** Normalized identity key: trimmed, lowercased, single-spaced. */
function toAgentKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function loadCache(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveCache(read: Set<string>, feedIds: Set<string>) {
  try {
    // Persist only ids still in the feed so the cache can't grow forever.
    localStorage.setItem(READ_KEY, JSON.stringify([...read].filter((id) => feedIds.has(id))));
  } catch { /* private mode */ }
}

/** Fire-and-forget server write; silent when offline or pre-migration. */
function pushReads(agentKey: string, ids: string[]) {
  if (!agentKey || ids.length === 0) return;
  try {
    readsTable()
      .upsert(ids.map((item_id) => ({ agent_key: agentKey, item_id })), {
        onConflict: 'agent_key,item_id',
        ignoreDuplicates: true,
      })
      .then(noop, noop);
  } catch { /* never let read-state sync break the hub */ }
}

export function WhatsNewBell() {
  const [open, setOpen] = useState(false);
  const feed = useMemo(buildFeed, []);
  const feedIds = useMemo(() => new Set(feed.map((r) => r.id)), [feed]);

  const [name, setName] = useState<string>(() => {
    try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; }
  });
  const agentKey = toAgentKey(name);

  const [read, setRead] = useState<Set<string>>(loadCache);
  const readRef = useRef(read);
  readRef.current = read;

  // With an identity: pull their server-side read history and merge, and push
  // up anything this device marked while offline or before the name was set.
  useEffect(() => {
    if (!agentKey) return;
    let cancelled = false;
    pushReads(agentKey, [...readRef.current]);
    (async () => {
      try {
        const { data, error } = await readsTable().select('item_id').eq('agent_key', agentKey);
        if (cancelled || error || !Array.isArray(data)) return;
        setRead((prev) => {
          const next = new Set(prev);
          data.forEach((r: { item_id: string }) => next.add(r.item_id));
          saveCache(next, feedIds);
          return next;
        });
      } catch { /* offline or table not migrated yet: cache carries it */ }
    })();
    return () => { cancelled = true; };
  }, [agentKey, feedIds]);

  const isUnread = (r: FeedRow) => ageInDays(r.date) <= NEW_WINDOW_DAYS && !read.has(r.id);
  const unreadCount = feed.filter(isUnread).length;

  const markRead = (ids: string[]) => {
    setRead((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      saveCache(next, feedIds);
      return next;
    });
    pushReads(agentKey, ids);
  };

  // First save of a name adopts this device's history; switching to a
  // different name starts from that person's server history instead.
  const saveIdentity = (newName: string) => {
    const clean = newName.trim().replace(/\s+/g, ' ');
    if (!clean) return;
    const newKey = toAgentKey(clean);
    const switching = !!agentKey && newKey !== agentKey;
    try { localStorage.setItem(NAME_KEY, clean); } catch { /* private mode */ }
    if (switching) {
      const empty = new Set<string>();
      setRead(empty);
      saveCache(empty, feedIds);
    }
    setName(clean);
  };

  const clearIdentity = () => {
    try { localStorage.removeItem(NAME_KEY); } catch { /* private mode */ }
    setName('');
  };

  return (
    <>
      <style>{CSS}</style>
      <button
        type="button"
        className="wn-bell"
        onClick={() => setOpen(true)}
        aria-label={unreadCount > 0 ? `What's new, ${unreadCount} unread` : "What's new"}
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="wn-bell__count" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <Panel
          feed={feed}
          isUnread={isUnread}
          unreadCount={unreadCount}
          identityName={name}
          onSaveIdentity={saveIdentity}
          onClearIdentity={clearIdentity}
          onRead={(id) => markRead([id])}
          onReadAll={() => markRead(feed.filter(isUnread).map((r) => r.id))}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function Panel({
  feed,
  isUnread,
  unreadCount,
  identityName,
  onSaveIdentity,
  onClearIdentity,
  onRead,
  onReadAll,
  onClose,
}: {
  feed: FeedRow[];
  isUnread: (r: FeedRow) => boolean;
  unreadCount: number;
  identityName: string;
  onSaveIdentity: (name: string) => void;
  onClearIdentity: () => void;
  onRead: (id: string) => void;
  onReadAll: () => void;
  onClose: () => void;
}) {
  const [draftName, setDraftName] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Freeze the fresh/earlier grouping at open so rows don't jump around as the
  // agent marks things read; the chips and badge still update live.
  const [freshIds] = useState<Set<string>>(
    () => new Set(feed.filter(isUnread).map((r) => r.id))
  );
  const fresh = feed.filter((r) => freshIds.has(r.id));
  const older = feed.filter((r) => !freshIds.has(r.id));

  return (
    <div className="wn-modal" role="dialog" aria-modal="true" aria-labelledby="wn-title" onClick={onClose}>
      <div className="wn-modal__card" onClick={(e) => e.stopPropagation()}>
        <button className="wn-modal__x" onClick={onClose} aria-label="Close">×</button>
        <div className="wn-modal__kicker">🔔 What's New</div>
        <h2 className="wn-modal__title" id="wn-title">
          {unreadCount > 0 ? `${unreadCount} new since your last check` : "You're all caught up"}
        </h2>
        <p className="wn-modal__note">
          A running log of everything we add or update: forms, events, carrier news, features, and articles.
          Open an item or tap its ✓ to mark it read.
        </p>

        {identityName ? (
          <div className="wn-ident">
            Read history saves for <b>{identityName}</b> and follows you on any device.
            <button type="button" className="wn-ident__change" onClick={onClearIdentity}>Not you?</button>
          </div>
        ) : (
          <div className="wn-claim">
            <div className="wn-claim__t">Add your name so your read history follows you on any device.</div>
            <div className="wn-claim__row">
              <input
                className="wn-claim__input"
                placeholder="Your first name"
                value={draftName}
                maxLength={60}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { onSaveIdentity(draftName); setDraftName(''); } }}
              />
              <button
                type="button"
                className="wn-claim__go"
                disabled={!draftName.trim()}
                onClick={() => { onSaveIdentity(draftName); setDraftName(''); }}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {unreadCount > 0 && (
          <button type="button" className="wn-markall" onClick={onReadAll}>
            ✓ Mark all as read
          </button>
        )}

        <div className="wn-list">
          {fresh.map((r) => (
            <Row key={r.id} row={r} unread={isUnread(r)} onRead={onRead} />
          ))}
          {fresh.length > 0 && older.length > 0 && (
            <div className="wn-caughtup" aria-hidden="true"><span>earlier</span></div>
          )}
          {older.map((r) => (
            <Row key={r.id} row={r} unread={false} onRead={onRead} />
          ))}
          {feed.length === 0 && <div className="wn-empty">Nothing posted yet. Check back soon.</div>}
        </div>
      </div>
    </div>
  );
}

function Row({ row, unread, onRead }: { row: FeedRow; unread: boolean; onRead: (id: string) => void }) {
  const body = (
    <>
      <div className="wn-row__top">
        <span className="wn-row__cat">{row.category}</span>
        {unread && <span className="wn-row__new">New</span>}
        <span className="wn-row__date">{formatDate(row.date)}</span>
      </div>
      <div className="wn-row__t">{row.title}</div>
      {row.note && <div className="wn-row__n">{row.note}</div>}
    </>
  );
  const mainCls = `wn-row__main${row.href ? ' wn-row__main--link' : ''}`;
  return (
    <div className={`wn-row${unread ? ' wn-row--new' : ''}`}>
      {row.href ? (
        row.href.startsWith('http') ? (
          <a className={mainCls} href={row.href} target="_blank" rel="noopener noreferrer" onClick={() => onRead(row.id)}>
            {body}
          </a>
        ) : (
          <Link className={mainCls} to={row.href} onClick={() => onRead(row.id)}>
            {body}
          </Link>
        )
      ) : (
        <div className={mainCls}>{body}</div>
      )}
      {unread && (
        <button
          type="button"
          className="wn-row__check"
          onClick={() => onRead(row.id)}
          aria-label={`Mark "${row.title}" as read`}
          title="Mark as read"
        >
          ✓
        </button>
      )}
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

/* identity */
.wn-ident{ margin-top:12px; font-size:11.5px; color:#6b6457; }
.wn-ident b{ color:#1b2620; }
.wn-ident__change{ margin-left:7px; font-family:inherit; font-size:11px; font-weight:700; color:#A8801F;
  background:none; border:none; cursor:pointer; padding:0; text-decoration:underline; }
.wn-claim{ margin-top:12px; background:#faf8f2; border:1px solid #e7e0cf; border-radius:11px; padding:11px 13px; }
.wn-claim__t{ font-size:11.5px; font-weight:600; color:#1b2620; }
.wn-claim__row{ display:flex; gap:8px; margin-top:8px; }
.wn-claim__input{ flex:1; min-width:0; font-family:inherit; font-size:12.5px; color:#1b2620; background:#fff;
  border:1px solid #e7e0cf; border-radius:9px; padding:8px 11px; outline:none; transition:.15s; }
.wn-claim__input:focus{ border-color:#C9A84C; }
.wn-claim__go{ flex-shrink:0; font-family:inherit; font-size:12px; font-weight:700; color:#F4F1E8; background:#0E3B2E;
  border:none; border-radius:9px; padding:8px 16px; cursor:pointer; transition:.15s; }
.wn-claim__go:hover:not(:disabled){ filter:brightness(1.15); }
.wn-claim__go:disabled{ opacity:.45; cursor:not-allowed; }

.wn-markall{ margin-top:12px; font-family:inherit; font-size:11.5px; font-weight:700; color:#A8801F; cursor:pointer;
  background:rgba(201,168,76,.1); border:1px solid rgba(201,168,76,.45); border-radius:8px; padding:7px 13px; transition:.15s; }
.wn-markall:hover{ background:rgba(201,168,76,.18); border-color:#C9A84C; }

/* list */
.wn-list{ margin-top:14px; display:flex; flex-direction:column; gap:7px; }
.wn-row{ display:flex; align-items:flex-start; gap:9px; background:#faf8f2; border:1px solid #e7e0cf; border-radius:11px;
  padding:10px 13px; transition:background .2s, border-color .2s; }
.wn-row--new{ background:rgba(201,168,76,.09); border-color:rgba(201,168,76,.5); }
.wn-row__main{ flex:1; min-width:0; display:block; text-decoration:none; color:#1b2620; }
.wn-row__main--link{ cursor:pointer; }
.wn-row__main--link:hover .wn-row__t{ color:#A8801F; }
.wn-row__top{ display:flex; align-items:center; gap:7px; }
.wn-row__cat{ font-size:9px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:#A8801F; }
.wn-row__new{ background:#C9A84C; color:#1b2620; font-size:8px; font-weight:800; letter-spacing:.05em;
  padding:1px 6px; border-radius:12px; text-transform:uppercase; }
.wn-row__date{ margin-left:auto; font-size:10px; color:#928b7c; flex-shrink:0; }
.wn-row__t{ font-size:12.5px; font-weight:700; margin-top:3px; line-height:1.3; transition:color .15s; }
.wn-row__n{ font-size:11px; color:#6b6457; line-height:1.45; margin-top:2px; }
.wn-row__check{ flex-shrink:0; width:26px; height:26px; margin-top:1px; border-radius:8px; cursor:pointer;
  border:1px solid rgba(201,168,76,.55); background:#fff; color:#A8801F; font-size:13px; line-height:1;
  font-family:inherit; transition:.15s; }
.wn-row__check:hover{ background:#C9A84C; color:#1b2620; border-color:#C9A84C; }

/* divider between the fresh group and earlier items */
.wn-caughtup{ display:flex; align-items:center; gap:10px; padding:4px 0; }
.wn-caughtup:before, .wn-caughtup:after{ content:""; flex:1; height:1px; background:#e7e0cf; }
.wn-caughtup span{ font-size:9px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#928b7c; }

.wn-empty{ font-size:12.5px; color:#6b6457; font-style:italic; padding:8px 0; text-align:center; }
`;
