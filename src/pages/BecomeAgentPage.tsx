import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['New to Medicare', 'Experienced producer', 'I lead a team'];

const COOLDOWN_MS = 10 * 60 * 1000;

export default function BecomeAgentPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      toast.error('Please fill in your name, email, and phone.');
      return;
    }

    const last = localStorage.getItem('tig_join_last');
    if (last && Date.now() - Number(last) < COOLDOWN_MS) {
      toast.error("We've got your request — give us a few minutes before sending another.");
      return;
    }

    setSubmitting(true);
    try {
      const name = `${firstName.trim()} ${lastName.trim()}`.trim();
      const message = `Where they are: ${status}`;

      const { error } = await supabase.functions.invoke('send-agent-inquiry', {
        body: { name, email: email.trim(), phone: phone.trim(), message },
      });
      if (error) throw error;

      localStorage.setItem('tig_join_last', String(Date.now()));
      setSubmitted(true);
    } catch (err) {
      // Surface the HTTP status to help diagnose (404 = not deployed,
      // 401 = auth, 500 = server/missing email key).
      console.error('Become-an-agent submit failed:', err);
      const ctx = (err as { context?: { status?: number } })?.context;
      const status = ctx && typeof ctx.status === 'number' ? ` (error ${ctx.status})` : '';
      toast.error(`Couldn't send that${status}. Please try again, or text Austin at (859) 619-6672.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ba">
      <style>{CSS}</style>

      <nav className="ba-nav">
        <div className="ba-nav__in">
          <Link to="/" className="ba-brand">
            <span className="ba-brand__mk">T</span> Tyler Insurance Group
          </Link>
          <span style={{ flex: 1 }} />
          <Link to="/" className="ba-nav__lk">← Back to site</Link>
        </div>
      </nav>

      <header className="ba-hero">
        <div className="ba-hero__glow" aria-hidden="true" />
        <div className="ba-hero__in">
          <div className="ba-eyebrow">Become a TIG Agent</div>
          <h1 className="ba-h1">
            You're ready to grow. <span className="ba-g">Let's make sure we're the right team to do it with.</span>
          </h1>
          <p className="ba-hero__p">
            Tell us where you are. If it's a fit, we'll set up a quick 10 minute call. No pressure, no
            pitch, and we move fast when we're aligned.
          </p>
        </div>
      </header>

      <div className="ba-formwrap">
        {submitted ? (
          <div className="ba-thanks">
            <div className="ba-thanks__ic" aria-hidden="true" />
            <h2 className="ba-thanks__t">Thanks, we've got it.</h2>
            <p className="ba-thanks__p">
              Your note went straight to Austin and Andrew. If there's a fit, we'll reach out within a
              couple business days to set up your 10 minute call. Talk soon.
            </p>
            <Link to="/" className="ba-btn ba-btn--inline">Back to site</Link>
          </div>
        ) : (
          <>
            <div className="ba-formwrap__lbl">Start the conversation</div>
            <h2 className="ba-formwrap__h">Tell us about you</h2>
            <div className="ba-formwrap__sub">Goes straight to Austin and Andrew. We read every one personally.</div>

            <form className="ba-form" onSubmit={onSubmit}>
              <div className="ba-row">
                <div className="ba-fld"><label>First name</label><input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
                <div className="ba-fld"><label>Last name</label><input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
              </div>
              <div className="ba-row">
                <div className="ba-fld"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="ba-fld"><label>Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
              </div>
              <div className="ba-fld">
                <label>Where you are today</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <p className="ba-honest">
                We don't contract everyone, and that's the point. One conversation and we'll both know.
              </p>
              <button className="ba-btn" type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Request a conversation →'}
              </button>
              <div className="ba-micro">If it's a fit, we'll reach out within a couple business days to set up your call.</div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const CSS = `
.ba{
  --em:#0E3B2E; --em2:#0a2c22; --bone:#F4F1E8; --card:#fff; --line:#e1d9c8; --muted:#5f6b62; --ink:#16201b; --gold:#C9A84C; --gold2:#A8801F;
  min-height:100vh; background:var(--bone); color:var(--ink);
  font-family:'Outfit','Inter',system-ui,-apple-system,sans-serif; -webkit-font-smoothing:antialiased;
}
.ba *{ box-sizing:border-box; }

.ba-nav{ position:absolute; top:0; left:0; right:0; z-index:50; }
.ba-nav__in{ max-width:1080px; margin:0 auto; padding:0 32px; height:64px; display:flex; align-items:center; gap:12px; }
.ba-brand{ display:flex; align-items:center; gap:10px; color:#fff; font-weight:700; font-size:15px; text-decoration:none; }
.ba-brand__mk{ width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); font-weight:800; display:flex; align-items:center; justify-content:center; }
.ba-nav__lk{ color:rgba(244,241,232,.8); font-size:14px; font-weight:500; text-decoration:none; }
.ba-nav__lk:hover{ color:#fff; }

.ba-hero{ background:linear-gradient(165deg,var(--em),var(--em2)); color:var(--bone); position:relative; overflow:hidden; padding:120px 0 64px; text-align:center; }
.ba-hero__glow{ position:absolute; top:-140px; left:50%; transform:translateX(-50%); width:1000px; height:560px; background:radial-gradient(circle,rgba(201,168,76,.18),transparent 60%); pointer-events:none; }
.ba-hero__in{ max-width:760px; margin:0 auto; padding:0 32px; position:relative; }
.ba-eyebrow{ font-size:12px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:var(--gold); margin-bottom:18px; }
.ba-h1{ font-size:clamp(32px,5.2vw,54px); font-weight:800; letter-spacing:-.03em; line-height:1.05; margin:0; }
.ba-g{ color:transparent; background:linear-gradient(110deg,#f3e6b8,var(--gold)); -webkit-background-clip:text; background-clip:text; }
.ba-hero__p{ font-size:17px; color:rgba(244,241,232,.82); line-height:1.65; margin:18px auto 0; max-width:46ch; }

.ba-formwrap{ max-width:560px; margin:44px auto 70px; padding:0 28px; position:relative; z-index:2; }
.ba-formwrap__lbl{ text-align:center; font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--gold2); margin-bottom:8px; }
.ba-formwrap__h{ text-align:center; font-size:24px; font-weight:700; letter-spacing:-.02em; margin-bottom:6px; }
.ba-formwrap__sub{ text-align:center; font-size:13px; color:var(--muted); margin-bottom:22px; }
.ba-form{ background:#fff; border:1px solid var(--line); border-radius:18px; padding:28px; box-shadow:0 20px 50px rgba(20,30,24,.07); }
.ba-row{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.ba-fld{ margin-bottom:14px; }
.ba label{ display:block; font-size:12px; font-weight:600; color:var(--ink); margin-bottom:6px; }
.ba input,.ba select,.ba textarea{ width:100%; font-family:inherit; font-size:14px; padding:11px 13px; border:1px solid var(--line); border-radius:9px; background:#fff; color:var(--ink); outline:none; transition:.15s; }
.ba input:focus,.ba select:focus,.ba textarea:focus{ border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,.15); }
.ba textarea{ min-height:84px; resize:vertical; }
.ba-btn{ width:100%; margin-top:8px; font-family:inherit; font-size:15px; font-weight:700; padding:14px; border:none; border-radius:10px; background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); cursor:pointer; transition:.15s; text-decoration:none; display:inline-block; text-align:center; }
.ba-btn:hover:not(:disabled){ transform:translateY(-1px); box-shadow:0 10px 24px rgba(168,128,31,.3); }
.ba-btn:disabled{ opacity:.6; cursor:not-allowed; }
.ba-btn--inline{ width:auto; padding:12px 26px; margin-top:18px; }
.ba-honest{ font-size:12.5px; color:var(--muted); text-align:center; line-height:1.55; margin:18px 0 4px; padding-top:16px; border-top:1px solid var(--line); }
.ba-micro{ font-size:11.5px; color:var(--muted); text-align:center; margin-top:12px; line-height:1.5; }

.ba-thanks{ background:#fff; border:1px solid var(--line); border-radius:18px; padding:46px 32px; text-align:center; box-shadow:0 20px 50px rgba(20,30,24,.07); }
.ba-thanks__ic{ width:52px; height:52px; border-radius:50%; background:var(--em); position:relative; margin:0 auto 16px; }
.ba-thanks__ic:after{ content:""; position:absolute; left:19px; top:13px; width:10px; height:19px; border:solid var(--gold); border-width:0 3px 3px 0; transform:rotate(45deg); }
.ba-thanks__t{ font-size:24px; font-weight:700; letter-spacing:-.02em; margin:0 0 10px; }
.ba-thanks__p{ font-size:15px; color:var(--muted); line-height:1.65; max-width:46ch; margin:0 auto; }

@media(max-width:760px){
  .ba-row{ grid-template-columns:1fr; }
  .ba-hero{ padding:104px 0 64px; }
}
`;
