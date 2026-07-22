import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// AEP TRAINING BOARD — agents tell Austin & Andrew what to cover in the
// AEP training sessions. A slim call-out card on the hub opens a popup with:
//   • preset topics agents tap to vote (live tallies)
//   • a write-in box (optional name) whose ideas pin to this board
//   • remove for anything submitted from this browser
// ----------------------------------------------------------------------------
// Flip BOARD_OPEN to false (and redeploy) when the training plan is locked —
// the card disappears, no other cleanup needed. Data lives in the
// aep_training_requests table (see the 20260707 migration).
// ============================================================================

// Flip to false (and redeploy) when the training plan is locked. When true, the
// training drive takes the hub's Spotlight zone ahead of the featured item.
export const AEP_TRAINING_OPEN = true;

// Preset topics — edit labels freely; keys are what's stored in the table.
const TOPICS: { key: string; label: string }[] = [
  { key: 'plan-changes', label: '2027 plan changes & ANOC walkthroughs' },
  { key: 'dsnp', label: 'D-SNP / dual-eligible changes' },
  { key: 'compliance', label: 'Compliance refresh: SOA, recording, TPMO' },
  { key: 'objections', label: 'Objection handling & appointment scripts' },
];

interface BoardRow {
  id: string;
  kind: 'vote' | 'idea';
  topic_key: string | null;
  idea_text: string | null;
  agent_name: string | null;
  client_token: string;
  created_at: string;
}

// Per-browser identity (shared-login MVP): lets an agent remove what they
// submitted from this device without real per-user auth.
function clientToken(): string {
  const KEY = 'tig-aep-board-token';
  let t = localStorage.getItem(KEY);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(KEY, t);
  }
  return t;
}

const table = () => (supabase as any).from('aep_training_requests');

export function AepTrainingBoard() {
  const [open, setOpen] = useState(false);

  if (!AEP_TRAINING_OPEN) return null;

  return (
    <>
      <style>{CARD_CSS}</style>
      <button type="button" className="atb-card" onClick={() => setOpen(true)}>
        <span className="atb-card__ic" aria-hidden="true">🎯</span>
        <span className="atb-card__body">
          <span className="atb-card__t">Help shape our AEP training</span>
          <span className="atb-card__s">
            Austin &amp; Andrew are mapping out the AEP sessions now and want to hear from you.
            Vote on topics or write in what you'd like covered.
          </span>
        </span>
        <span className="atb-card__btn">Add your voice →</span>
      </button>
      {open && <AepTrainingModal onClose={() => setOpen(false)} />}
    </>
  );
}

// Exported so the hub Spotlight zone can host the voting flow directly. The
// modal injects its own styles, so it works wherever it's mounted.
export function AepTrainingModal({ onClose }: { onClose: () => void }) {
  const token = clientToken();
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ideaText, setIdeaText] = useState('');
  const [name, setName] = useState(() => localStorage.getItem('tig-aep-board-name') || '');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fetchRows = async () => {
    try {
      const { data, error: err } = await table()
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setRows((data || []) as BoardRow[]);
      setError(false);
    } catch (e) {
      console.error('Training board fetch failed:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const votesFor = (key: string) => rows.filter((r) => r.kind === 'vote' && r.topic_key === key);
  const myVote = (key: string) => votesFor(key).find((r) => r.client_token === token);
  const ideas = rows.filter((r) => r.kind === 'idea');

  const toggleVote = async (key: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const mine = myVote(key);
      if (mine) {
        const { error: err } = await table().delete().eq('id', mine.id);
        if (err) throw err;
        setRows((rs) => rs.filter((r) => r.id !== mine.id));
      } else {
        const { data, error: err } = await table()
          .insert({ kind: 'vote', topic_key: key, agent_name: name.trim() || null, client_token: token })
          .select()
          .single();
        if (err) throw err;
        setRows((rs) => [data as BoardRow, ...rs]);
      }
    } catch (e) {
      console.error('Vote failed:', e);
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const submitIdea = async () => {
    const text = ideaText.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      localStorage.setItem('tig-aep-board-name', name.trim());
      const { data, error: err } = await table()
        .insert({ kind: 'idea', idea_text: text, agent_name: name.trim() || null, client_token: token })
        .select()
        .single();
      if (err) throw err;
      setRows((rs) => [data as BoardRow, ...rs]);
      setIdeaText('');
    } catch (e) {
      console.error('Idea submit failed:', e);
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const removeIdea = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const { error: err } = await table().delete().eq('id', id);
      if (err) throw err;
      setRows((rs) => rs.filter((r) => r.id !== id));
    } catch (e) {
      console.error('Remove failed:', e);
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const postedOn = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <>
    <style>{MODAL_CSS}</style>
    <div className="atb-modal" role="dialog" aria-modal="true" aria-labelledby="atb-title" onClick={onClose}>
      <div className="atb-modal__card" onClick={(e) => e.stopPropagation()}>
        <button className="atb-modal__x" onClick={onClose} aria-label="Close">×</button>

        <div className="atb-modal__kicker">🎯 AEP Training Board</div>
        <h2 className="atb-modal__title" id="atb-title">What should we cover?</h2>
        <p className="atb-modal__note">
          Austin &amp; Andrew here — we're building the AEP training sessions right now.
          Vote the topics you want, or write in your own below. Everything posts to this
          board so the whole team can see it, and you can remove yours anytime.
        </p>

        {error && (
          <div className="atb-error">
            The board isn't reachable right now. Give it a minute and try again — or let Caroline know.
          </div>
        )}

        {/* ── Vote the topics ── */}
        <div className="atb-h">Vote the topics</div>
        <div className="atb-topics">
          {TOPICS.map((t) => {
            const votes = votesFor(t.key).length;
            const mine = !!myVote(t.key);
            return (
              <button
                key={t.key}
                type="button"
                className={`atb-topic${mine ? ' on' : ''}`}
                onClick={() => toggleVote(t.key)}
                disabled={loading || busy}
                aria-pressed={mine}
              >
                <span className="atb-topic__l">{mine ? '✓ ' : ''}{t.label}</span>
                <span className="atb-topic__c">{loading ? '·' : votes}</span>
              </button>
            );
          })}
        </div>

        {/* ── Write in your own ── */}
        <div className="atb-h">Or write in your own</div>
        <textarea
          className="atb-input atb-input--area"
          placeholder="What would make AEP training actually useful for you this year?"
          value={ideaText}
          onChange={(e) => setIdeaText(e.target.value)}
          rows={3}
          maxLength={500}
        />
        <div className="atb-submitrow">
          <input
            className="atb-input"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
          />
          <button
            type="button"
            className="atb-go"
            onClick={submitIdea}
            disabled={!ideaText.trim() || busy || loading}
          >
            Pin it to the board
          </button>
        </div>

        {/* ── On the board ── */}
        <div className="atb-h">
          On the board {ideas.length > 0 && <span className="atb-h__c">{ideas.length}</span>}
        </div>
        {loading ? (
          <div className="atb-empty">Loading the board…</div>
        ) : ideas.length === 0 ? (
          <div className="atb-empty">Nothing pinned yet — be the first.</div>
        ) : (
          <div className="atb-ideas">
            {ideas.map((i) => (
              <div className="atb-idea" key={i.id}>
                <div className="atb-idea__body">
                  <div className="atb-idea__t">{i.idea_text}</div>
                  <div className="atb-idea__m">
                    {i.agent_name || 'Anonymous'} · {postedOn(i.created_at)}
                  </div>
                </div>
                {i.client_token === token && (
                  <button
                    type="button"
                    className="atb-idea__x"
                    onClick={() => removeIdea(i.id)}
                    aria-label="Remove your idea"
                    title="Remove your idea"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

const CARD_CSS = `
/* call-out card on the hub */
.atb-card{ display:flex; align-items:center; gap:13px; width:100%; margin-bottom:22px; text-align:left;
  background:linear-gradient(135deg,#fdf8ec,#f7efd8); border:1px solid rgba(201,168,76,.55); border-radius:16px;
  padding:15px 18px; cursor:pointer; font-family:inherit; color:#1b2620; transition:.15s; }
.atb-card:hover{ transform:translateY(-1px); box-shadow:0 10px 22px rgba(168,128,31,.14); border-color:#C9A84C; }
.atb-card__ic{ font-size:21px; flex-shrink:0; }
.atb-card__body{ flex:1; min-width:0; }
.atb-card__t{ display:block; font-size:14px; font-weight:700; }
.atb-card__s{ display:block; font-size:11.5px; color:#6b6457; margin-top:1px; }
.atb-card__btn{ flex-shrink:0; font-size:12px; font-weight:700; color:#0E3B2E; background:linear-gradient(135deg,#e7cf86,#C9A84C);
  padding:9px 15px; border-radius:9px; white-space:nowrap; }
@media(max-width:560px){
  .atb-card{ flex-wrap:wrap; }
  .atb-card__btn{ width:100%; text-align:center; }
}
`;

const MODAL_CSS = `
/* modal */
.atb-modal{ position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:20px;
  background:rgba(14,32,26,.55); backdrop-filter:blur(3px); animation:atbFade .15s ease; }
@keyframes atbFade{ from{ opacity:0; } to{ opacity:1; } }
.atb-modal__card{ background:#fff; border-radius:18px; width:100%; max-width:520px; max-height:88vh; overflow-y:auto;
  padding:24px; position:relative; box-shadow:0 24px 60px rgba(0,0,0,.3); animation:atbPop .16s ease;
  font-family:'Outfit','Inter',system-ui,sans-serif; color:#1b2620; }
@keyframes atbPop{ from{ opacity:0; transform:translateY(8px) scale(.98); } to{ opacity:1; transform:none; } }
.atb-modal__x{ position:absolute; top:14px; right:14px; width:30px; height:30px; border-radius:8px; border:1px solid #e7e0cf;
  background:#fff; cursor:pointer; font-size:18px; line-height:1; color:#6b6457; font-family:inherit; transition:.15s; }
.atb-modal__x:hover{ border-color:#C9A84C; color:#1b2620; }
.atb-modal__kicker{ font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#A8801F; }
.atb-modal__title{ font-size:21px; font-weight:700; letter-spacing:-.02em; margin:6px 0 0; padding-right:30px; }
.atb-modal__note{ font-size:12.5px; line-height:1.55; color:#6b6457; margin:8px 0 0; }

.atb-error{ margin-top:14px; background:rgba(184,80,63,.08); border:1px solid rgba(184,80,63,.3); color:#b8503f;
  font-size:12px; border-radius:9px; padding:9px 12px; }

.atb-h{ font-size:10.5px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#A8801F; margin:18px 0 8px; }
.atb-h__c{ font-weight:700; color:#A8801F; background:rgba(168,128,31,.1); padding:1px 7px; border-radius:10px; font-size:10px; margin-left:4px; }

.atb-topics{ display:flex; flex-direction:column; gap:7px; }
.atb-topic{ display:flex; align-items:center; justify-content:space-between; gap:10px; width:100%; text-align:left;
  font-family:inherit; font-size:12.5px; font-weight:600; color:#1b2620; background:#faf8f2; border:1px solid #e7e0cf;
  border-radius:10px; padding:10px 13px; cursor:pointer; transition:.15s; }
.atb-topic:hover{ border-color:#C9A84C; }
.atb-topic.on{ background:rgba(201,168,76,.13); border-color:#C9A84C; color:#0E3B2E; }
.atb-topic:disabled{ opacity:.6; cursor:wait; }
.atb-topic__c{ flex-shrink:0; min-width:26px; text-align:center; font-size:11px; font-weight:800; color:#A8801F;
  background:#fff; border:1px solid #e7e0cf; border-radius:20px; padding:2px 8px; }
.atb-topic.on .atb-topic__c{ background:#0E3B2E; color:#F4F1E8; border-color:#0E3B2E; }

.atb-input{ width:100%; font-family:inherit; font-size:13px; color:#1b2620; background:#fff; border:1px solid #e7e0cf;
  border-radius:10px; padding:10px 12px; outline:none; transition:.15s; }
.atb-input:focus{ border-color:#C9A84C; }
.atb-input--area{ resize:vertical; min-height:64px; }
.atb-submitrow{ display:flex; gap:8px; margin-top:8px; }
.atb-submitrow .atb-input{ flex:1; }
.atb-go{ flex-shrink:0; font-family:inherit; font-size:12.5px; font-weight:700; color:#F4F1E8; background:#0E3B2E;
  border:none; border-radius:10px; padding:10px 16px; cursor:pointer; transition:.15s; }
.atb-go:hover:not(:disabled){ filter:brightness(1.15); }
.atb-go:disabled{ opacity:.45; cursor:not-allowed; }

.atb-empty{ font-size:12.5px; color:#6b6457; font-style:italic; padding:6px 0; }
.atb-ideas{ display:flex; flex-direction:column; gap:7px; }
.atb-idea{ display:flex; align-items:flex-start; gap:10px; background:#faf8f2; border:1px solid #e7e0cf; border-radius:10px; padding:10px 13px; }
.atb-idea__body{ flex:1; min-width:0; }
.atb-idea__t{ font-size:12.5px; line-height:1.5; }
.atb-idea__m{ font-size:10.5px; color:#6b6457; margin-top:3px; }
.atb-idea__x{ flex-shrink:0; width:24px; height:24px; border-radius:7px; border:1px solid #e7e0cf; background:#fff;
  color:#6b6457; font-size:15px; line-height:1; cursor:pointer; font-family:inherit; transition:.15s; }
.atb-idea__x:hover{ border-color:#b8503f; color:#b8503f; }

@media(max-width:560px){
  .atb-submitrow{ flex-direction:column; }
}
`;
