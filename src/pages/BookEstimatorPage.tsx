import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Lean MVP model: annual renewals = MAPD lives x ~$330, times a retention-driven
// multiple. Output a range, never a fake-precise number. Educational estimate.
const MAPD_RENEWAL = 330;
const COOLDOWN_MS = 10 * 60 * 1000;

const RETENTION = [
  { label: 'A fair number leave', sub: '~75% stay', mult: 0.8 },
  { label: 'Most stick around', sub: '~85% stay', mult: 1.0 },
  { label: 'Very loyal', sub: '~92% stay', mult: 1.15 },
  { label: 'Almost never leave', sub: '95%+ stay', mult: 1.25 },
];

const fmt = (n: number) => '$' + Math.round(n).toLocaleString();

function tierFor(v: number): { title: string; msg: string; celebrate: boolean } {
  if (v >= 300000) return { title: "A career's work.", msg: "You've built what most independent agents never do. That deserves a real conversation.", celebrate: true };
  if (v >= 150000) return { title: 'A serious book.', msg: 'This is a real asset you built yourself. Protect it and keep growing.', celebrate: true };
  if (v >= 60000) return { title: "You've built something real.", msg: 'The foundation is there. Now compound it.', celebrate: false };
  if (v >= 20000) return { title: "You're on your way.", msg: 'Every big book started right here.', celebrate: false };
  return { title: "You're just getting started.", msg: 'The best time to build is now.', celebrate: false };
}

function burst() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#C9A84C', '#e7cf86', '#46d39a', '#ffffff'];
  for (let i = 0; i < 70; i++) {
    const d = document.createElement('div');
    d.className = 'be-confetti';
    d.style.left = Math.random() * 100 + 'vw';
    d.style.background = colors[i % 4];
    document.body.appendChild(d);
    d.animate(
      [
        { top: '-10px', opacity: 1, transform: 'rotate(0)' },
        { top: '100vh', opacity: 0.9, transform: `rotate(${360 + Math.random() * 360}deg)` },
      ],
      { duration: 1600 + Math.random() * 1200, easing: 'cubic-bezier(.3,.6,.5,1)' },
    );
    setTimeout(() => d.remove(), 2900);
  }
}

export default function BookEstimatorPage() {
  const [lives, setLives] = useState(350);
  const [retIdx, setRetIdx] = useState(2);
  const [revealed, setRevealed] = useState(false);
  const [display, setDisplay] = useState(0);

  // acquisition contact flow (inside the takeover)
  const [acqOpen, setAcqOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const raf = useRef(0);

  const mult = RETENTION[retIdx].mult;
  const safeLives = Math.max(0, lives || 0);
  const est = safeLives * MAPD_RENEWAL * mult;
  const low = safeLives * MAPD_RENEWAL * Math.max(0.5, mult - 0.2);
  const tier = tierFor(est);

  useEffect(() => {
    document.title = 'What is your book worth? | Tyler Insurance Group';
  }, []);

  // Count-up + confetti when the takeover opens.
  useEffect(() => {
    if (!revealed) { setDisplay(0); return; }
    const target = est;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(target);
      if (tier.celebrate) burst();
      return;
    }
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 1300);
      const e = 1 - Math.pow(1 - k, 4);
      setDisplay(target * e);
      if (k < 1) raf.current = requestAnimationFrame(tick);
      else { setDisplay(target); if (tier.celebrate) burst(); }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  const step = (n: number) => setLives((v) => Math.max(0, (v || 0) + n));

  const startOver = () => {
    setRevealed(false);
    setAcqOpen(false);
  };

  const onAcqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error('Please add your name, email, and phone.');
      return;
    }
    const last = localStorage.getItem('tig_book_last');
    if (last && Date.now() - Number(last) < COOLDOWN_MS) {
      toast.error("We've got your note. Give us a few minutes before sending another.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send-book-inquiry', {
        body: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          lives: safeLives,
          retention: RETENTION[retIdx].label,
          estimate: `${fmt(low)} to ${fmt(est)}`,
        },
      });
      if (error) throw error;
      localStorage.setItem('tig_book_last', String(Date.now()));
      setSubmitted(true);
    } catch (err) {
      console.error('Book inquiry submit failed:', err);
      const ctx = (err as { context?: { status?: number } })?.context;
      const status = ctx && typeof ctx.status === 'number' ? ` (error ${ctx.status})` : '';
      toast.error(`Couldn't send that${status}. Please try again, or text Austin at (859) 619-6672.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="be">
      <style>{CSS}</style>

      <nav className="be-nav">
        <Link to="/" className="be-brand">
          <img className="be-crest" src="/tyler-crest.png" alt="" aria-hidden="true" /> Tyler Insurance Group
        </Link>
        <span style={{ flex: 1 }} />
        <Link to="/" className="be-nav__lk">← Back to site</Link>
      </nav>

      <div className="be-wrap">
        <div className="be-eyebrow">Book Estimator</div>
        <h1 className="be-h1">You built it. Let's value it.</h1>
        <div className="be-sub">Two questions. One number most agents have never seen.</div>

        <div className="be-card">
          <div className="be-lbl">Active MAPD members</div>
          <div className="be-stepper">
            <button type="button" onClick={() => step(-25)} aria-label="Fewer">−</button>
            <input
              type="number"
              value={lives}
              onChange={(e) => setLives(Math.max(0, parseInt(e.target.value, 10) || 0))}
            />
            <button type="button" onClick={() => step(25)} aria-label="More">+</button>
          </div>

          <div className="be-lbl">How loyal are your clients?</div>
          <div className="be-seg">
            {RETENTION.map((r, i) => (
              <button
                type="button"
                key={r.label}
                className={`be-seg__b${i === retIdx ? ' is-sel' : ''}`}
                onClick={() => setRetIdx(i)}
              >
                <div className="be-seg__t">{r.label}</div>
                <div className="be-seg__s">{r.sub}</div>
              </button>
            ))}
          </div>

          <button type="button" className="be-reveal" onClick={() => setRevealed(true)}>
            Reveal my book value →
          </button>
          <div className="be-disc">Educational estimate, not a formal appraisal or an offer.</div>
        </div>
      </div>

      {/* ── Takeover reveal ── */}
      {revealed && (
        <div className="be-take">
          <div className="be-tin">
            <div className="be-tlabel">Your estimated book value</div>
            <div className="be-tnum">{fmt(display)}</div>
            <div className="be-trange">Likely range {fmt(low)} to {fmt(est)}</div>
            <div className="be-ttier">{tier.title}</div>
            <div className="be-tmsg">{tier.msg}</div>

            {!acqOpen && !submitted && (
              <div className="be-fork">
                <Link to="/join" className="be-fcard be-fcard--gold">
                  <div className="be-fcard__t">Grow it bigger</div>
                  <div className="be-fcard__s">See what a real FMO does for your book and your numbers.</div>
                </Link>
                <button type="button" className="be-fcard be-fcard--ghost" onClick={() => setAcqOpen(true)}>
                  <div className="be-fcard__t">Talk to our acquisition team</div>
                  <div className="be-fcard__s">Curious what it's worth to sell? Have a private, no-pressure conversation.</div>
                </button>
              </div>
            )}

            {acqOpen && !submitted && (
              <form className="be-acq" onSubmit={onAcqSubmit}>
                <div className="be-acq__h">Let's talk, privately.</div>
                <div className="be-acq__s">Goes straight to Austin. No pressure, no obligation.</div>
                <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <button type="submit" className="be-acq__btn" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Request a conversation →'}
                </button>
                <button type="button" className="be-back" onClick={() => setAcqOpen(false)}>← Back</button>
              </form>
            )}

            {submitted && (
              <div className="be-done">
                <div className="be-done__t">Thanks, we've got it.</div>
                <div className="be-done__s">
                  Austin will reach out personally for a private, no-pressure conversation. Talk soon.
                </div>
              </div>
            )}

            {!submitted && (
              <button type="button" className="be-again" onClick={startOver}>Start over</button>
            )}
            <div className="be-tdisc">Educational estimate, not a formal appraisal or an offer.</div>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
.be{
  --em:#0E3B2E; --em2:#08251c; --bone:#F4F1E8; --paper:#f3f1ea; --line:#e1d9c8; --dline:#1d4a3a;
  --muted:#5f6b62; --dmuted:#9fb4a8; --ink:#16201b; --gold:#C9A84C; --gold2:#A8801F; --up:#46d39a;
  min-height:100vh; background:#fbfaf6; color:var(--ink);
  font-family:'Outfit','Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased;
}
.be *{ box-sizing:border-box; }
.be a{ text-decoration:none; }
.be-nav{ height:64px; display:flex; align-items:center; gap:10px; max-width:600px; margin:0 auto; padding:0 24px; }
.be-brand{ display:flex; align-items:center; gap:10px; color:var(--em); font-weight:700; font-size:15px; }
.be-crest{ height:28px; width:auto; display:block; }
.be-nav__lk{ color:var(--muted); font-size:14px; font-weight:500; }
.be-nav__lk:hover{ color:var(--em); }

.be-wrap{ max-width:540px; margin:0 auto; padding:24px 24px 90px; text-align:center; }
.be-eyebrow{ font-size:12px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:var(--gold2); }
.be-h1{ font-weight:800; font-size:clamp(28px,5.5vw,40px); letter-spacing:-.03em; margin:10px 0 6px; }
.be-sub{ color:var(--muted); font-size:15px; margin-bottom:26px; }
.be-card{ background:#fff; border:1px solid var(--line); border-radius:22px; padding:28px; box-shadow:0 18px 50px rgba(20,30,24,.08); text-align:left; }
.be-lbl{ font-size:13px; font-weight:700; color:var(--ink); margin-bottom:10px; }
.be-stepper{ display:flex; border:1px solid var(--line); border-radius:13px; overflow:hidden; margin-bottom:24px; }
.be-stepper button{ width:52px; height:56px; background:var(--paper); border:none; color:var(--em); font-size:24px; cursor:pointer; }
.be-stepper input{ flex:1; height:56px; border:none; text-align:center; font-family:'Outfit'; font-weight:900; font-size:26px; outline:none; color:var(--ink); width:100%; }
.be-seg{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:6px; }
.be-seg__b{ text-align:left; border:1.5px solid var(--line); background:#fff; border-radius:12px; padding:13px 14px; cursor:pointer; transition:.15s; }
.be-seg__b:hover{ border-color:var(--gold2); }
.be-seg__b.is-sel{ border-color:var(--gold2); background:rgba(201,168,76,.1); }
.be-seg__t{ font-family:'Outfit'; font-weight:700; font-size:14px; color:var(--ink); }
.be-seg__s{ font-size:11.5px; color:var(--muted); margin-top:1px; }
.be-reveal{ width:100%; margin-top:24px; font-family:'Outfit'; font-weight:800; font-size:17px; padding:18px; border:none; border-radius:14px; background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); cursor:pointer; }
.be-disc{ font-size:11.5px; color:var(--muted); margin-top:16px; line-height:1.5; }

/* takeover */
.be-take{ position:fixed; inset:0; z-index:90; background:radial-gradient(120% 80% at 50% 0%,#0f4233,#06201a); color:var(--bone); display:flex; align-items:center; justify-content:center; padding:30px; overflow-y:auto; animation:beFade .5s ease both; }
@keyframes beFade{ from{ opacity:0; } to{ opacity:1; } }
.be-tin{ max-width:460px; width:100%; text-align:center; animation:bePop .7s cubic-bezier(.2,.7,.3,1) both; }
@keyframes bePop{ from{ opacity:0; transform:scale(.94) translateY(16px); } to{ opacity:1; transform:none; } }
.be-tlabel{ font-size:12px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--dmuted); }
.be-tnum{ font-family:'Outfit'; font-weight:900; font-size:clamp(54px,16vw,100px); letter-spacing:-.04em; line-height:1; margin:12px 0 8px; color:#fff; text-shadow:0 0 50px rgba(201,168,76,.35); }
.be-trange{ font-size:15px; color:var(--up); font-weight:700; }
.be-ttier{ display:inline-block; margin-top:20px; background:rgba(201,168,76,.16); border:1px solid rgba(201,168,76,.45); color:var(--gold); font-size:14px; font-weight:700; padding:8px 18px; border-radius:30px; }
.be-tmsg{ color:var(--dmuted); font-size:14.5px; margin:14px auto 0; max-width:34ch; line-height:1.55; }
.be-fork{ display:grid; gap:12px; margin-top:30px; text-align:left; }
.be-fcard{ display:block; width:100%; border:none; text-align:left; border-radius:16px; padding:20px; cursor:pointer; font-family:inherit; }
.be-fcard--gold{ background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); }
.be-fcard--ghost{ background:rgba(255,255,255,.05); border:1px solid var(--dline); color:var(--bone); }
.be-fcard__t{ font-family:'Outfit'; font-weight:800; font-size:17px; }
.be-fcard__s{ font-size:13px; margin-top:3px; opacity:.88; line-height:1.45; }
.be-acq{ margin-top:28px; text-align:left; }
.be-acq__h{ font-family:'Outfit'; font-weight:800; font-size:20px; }
.be-acq__s{ font-size:13px; color:var(--dmuted); margin:4px 0 16px; }
.be-acq input{ width:100%; font-family:inherit; font-size:16px; padding:14px; margin-bottom:10px; border-radius:11px; border:1px solid var(--dline); background:rgba(255,255,255,.06); color:#fff; outline:none; }
.be-acq input::placeholder{ color:var(--dmuted); }
.be-acq input:focus{ border-color:var(--gold); }
.be-acq__btn{ width:100%; margin-top:6px; font-family:'Outfit'; font-weight:800; font-size:16px; padding:16px; border:none; border-radius:13px; background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); cursor:pointer; }
.be-acq__btn:disabled{ opacity:.6; cursor:not-allowed; }
.be-back{ background:none; border:none; color:var(--dmuted); font-size:13px; margin-top:14px; cursor:pointer; }
.be-done{ margin-top:28px; text-align:center; }
.be-done__t{ font-family:'Outfit'; font-weight:800; font-size:22px; color:#fff; }
.be-done__s{ color:var(--dmuted); font-size:14.5px; margin-top:10px; line-height:1.55; max-width:36ch; margin-left:auto; margin-right:auto; }
.be-again{ display:block; margin:18px auto 0; background:none; border:none; font-size:13px; color:var(--dmuted); cursor:pointer; text-decoration:underline; }
.be-tdisc{ font-size:11.5px; color:var(--dmuted); margin-top:18px; line-height:1.5; }

@media(max-width:540px){ .be-seg{ grid-template-columns:1fr; } }
.be-confetti{ position:fixed; top:-10px; width:9px; height:14px; z-index:95; pointer-events:none; border-radius:2px; }
`;
