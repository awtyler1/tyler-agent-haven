import { useEffect, useState } from 'react';
import { ahip, carrierCerts, certYear, type CarrierCert } from '@/data/certificationContent';

function initial(name: string) {
  return name[0].toUpperCase();
}

function CarrierCard({ c }: { c: CarrierCert }) {
  const open = c.status === 'open';
  const [showHow, setShowHow] = useState(false);
  return (
    <div className={`ct-cc ${open ? 'ct-cc--live' : 'ct-cc--dead'}`} style={{ ['--bc' as string]: c.color }}>
      <div className="ct-cc__top">
        <span className="ct-cc__mark" style={{ background: c.color }}>{initial(c.name)}</span>
        <div>
          <div className="ct-cc__nm">{c.name}</div>
          <div className="ct-cc__yr">{certYear} certification</div>
        </div>
      </div>
      {c.opensLabel && (
        <div className="ct-cc__date">
          <span className="ct-cc__date-ic" aria-hidden="true">{open ? '✓' : '📅'}</span>
          {c.opensLabel}
        </div>
      )}
      <div className="ct-cc__acts">
        {c.howTo ? (
          <button
            type="button"
            className={`ct-ca ${showHow ? 'ct-ca--on' : ''}`}
            onClick={() => setShowHow((v) => !v)}
            aria-expanded={showHow}
          >
            📄 How-to
          </button>
        ) : c.howToUrl ? (
          <a className="ct-ca" href={c.howToUrl} target="_blank" rel="noopener noreferrer">📄 How-to</a>
        ) : (
          <span className="ct-ca ct-ca--dim">📄 How-to</span>
        )}
        {open && c.portalUrl ? (
          <a className="ct-ca ct-ca--go" href={c.portalUrl} target="_blank" rel="noopener noreferrer">Certify ↗</a>
        ) : (
          <span className="ct-ca ct-ca--dim">Portal ↗</span>
        )}
      </div>
      {showHow && c.howTo && (
        <div className="ct-how">
          <div className="ct-how__h">How to certify</div>
          <ol className="ct-how__steps">
            {c.howTo.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          {c.portalUrl && (
            <a className="ct-how__link" href={c.portalUrl} target="_blank" rel="noopener noreferrer">
              Open the {c.name} portal ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function CertificationsPage() {
  useEffect(() => {
    document.title = `${certYear} Certifications | Tyler Insurance Group`;
  }, []);

  const openCount = carrierCerts.filter((c) => c.status === 'open').length;

  return (
    <div className="ct">
      <style>{CSS}</style>
      <div className="ct-max">
        <div className="ct-head">
          <h1 className="ct-h1">{certYear} Certifications</h1>
          <div className="ct-sub">AHIP first, then certify each carrier for {certYear}.</div>
        </div>

        {/* Step 1 — AHIP */}
        <div className="ct-ahip">
          <span className="ct-ahip__ic" aria-hidden="true">🎓</span>
          <div className="ct-ahip__b">
            <div className="ct-ahip__t">Step 1 — {ahip.title}</div>
            <div className="ct-ahip__s">{ahip.note}</div>
          </div>
          <div className="ct-ahip__r">
            {ahip.opensLabel && <span className="ct-ahip__open">{ahip.opensLabel}</span>}
            <a className="ct-btn-gold" href={ahip.url} target="_blank" rel="noopener noreferrer">Go to AHIP ↗</a>
          </div>
        </div>

        {/* Step 2 — carriers */}
        <div className="ct-seclbl">
          <span>Step 2 — Carrier certifications</span>
          <span>{openCount > 0 ? `${openCount} open · ` : ''}{carrierCerts.length - openCount} not open yet</span>
        </div>
        <div className="ct-grid">
          {carrierCerts.map((c) => (
            <CarrierCard key={c.id} c={c} />
          ))}
        </div>

        {/* ── Printable tracker ── */}
        <a
          className="ct-tracker"
          href="/forms/2027-certification-tracker.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="ct-tracker__ic" aria-hidden="true">📋</span>
          <span className="ct-tracker__body">
            <span className="ct-tracker__t">{certYear} Certification Tracker</span>
            <span className="ct-tracker__s">
              A fillable one-pager of this page — check off each cert, add the date, and save it to your computer or print it.
            </span>
          </span>
          <span className="ct-tracker__btn">↓ Download</span>
        </a>

        <p className="ct-note">
          Dates and certification links are added as each carrier opens its {certYear} window.
          Questions? Caroline Horn handles contracting &amp; certification — find her on{' '}
          <a href="/contacts">Contacts</a>.
        </p>
      </div>
    </div>
  );
}

const CSS = `
.ct{
  --em:#0E3B2E; --bone:#F4F1E8; --card:#fff; --line:#e7e0cf; --muted:#6b6457; --ink:#1b2620; --gold:#C9A84C; --gold2:#A8801F;
  --green:#5b7d44; --amber:#b07f33;
  flex:1 1 auto; min-height:0; overflow-y:auto; background:var(--bone);
  font-family:'Outfit','Inter',system-ui,sans-serif; color:var(--ink);
  -webkit-font-smoothing:antialiased; padding:30px 36px 44px;
}
.ct *{ box-sizing:border-box; }
.ct-max{ max-width:1000px; margin:0 auto; }
.ct-head{ margin-bottom:16px; }
.ct-h1{ font-size:25px; font-weight:700; letter-spacing:-.02em; margin:0; }
.ct-sub{ font-size:12.5px; color:var(--muted); margin-top:2px; }

/* AHIP */
.ct-ahip{ display:flex; align-items:center; gap:16px; background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone);
  border-radius:16px; padding:18px 22px; margin-bottom:24px; position:relative; overflow:hidden; flex-wrap:wrap; }
.ct-ahip:before{ content:""; position:absolute; top:-70px; right:-50px; width:260px; height:260px; background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); }
.ct-ahip__ic{ font-size:24px; position:relative; }
.ct-ahip__b{ position:relative; flex:1; min-width:200px; }
.ct-ahip__t{ font-size:18px; font-weight:700; }
.ct-ahip__s{ font-size:12.5px; color:rgba(244,241,232,.72); margin-top:3px; }
.ct-ahip__r{ position:relative; display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
.ct-ahip__open{ font-size:12.5px; font-weight:700; color:var(--em); background:linear-gradient(135deg,#e7cf86,var(--gold)); padding:7px 13px; border-radius:9px; }
.ct-btn-gold{ display:inline-flex; align-items:center; gap:7px; background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em);
  font-weight:700; font-size:13px; padding:11px 18px; border-radius:9px; text-decoration:none; transition:.15s; }
.ct-btn-gold:hover{ transform:translateY(-1px); box-shadow:0 8px 20px rgba(168,128,31,.3); }

/* section label */
.ct-seclbl{ font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin:0 0 12px; display:flex; justify-content:space-between; gap:10px; }

/* grid + cards */
.ct-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
.ct-cc{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:18px; position:relative; overflow:hidden; transition:.18s; box-shadow:0 1px 3px rgba(0,0,0,.03); }
.ct-cc:before{ content:""; position:absolute; top:0; left:0; right:0; height:3px; background:var(--bc); }
/* live carrier — full color, gently emphasized so it pops against the dimmed ones */
.ct-cc--live{ border-color:rgba(201,168,76,.5); box-shadow:0 4px 16px rgba(168,128,31,.12); }
.ct-cc--live:hover{ transform:translateY(-3px); box-shadow:0 16px 32px rgba(168,128,31,.18); }
/* not released yet — dimmed and inert until the carrier opens its window */
.ct-cc--dead{ opacity:.6; filter:grayscale(.92); box-shadow:none; }
.ct-cc--dead:hover{ transform:none; box-shadow:0 1px 3px rgba(0,0,0,.03); }
.ct-cc__top{ display:flex; align-items:center; gap:11px; margin-bottom:14px; }
.ct-cc__mark{ width:38px; height:38px; border-radius:10px; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; flex-shrink:0; }
.ct-cc__nm{ font-size:16px; font-weight:700; }
.ct-cc__yr{ font-size:11px; color:var(--muted); }
.ct-cc__date{ display:inline-flex; align-items:center; gap:7px; margin-bottom:14px; background:rgba(201,168,76,.14); border:1px solid rgba(201,168,76,.45);
  color:var(--gold2); font-family:'Outfit',sans-serif; font-weight:700; font-size:13px; padding:7px 12px; border-radius:9px; }
.ct-cc__date-ic{ font-size:13px; line-height:1; }
.ct-cc__acts{ display:flex; gap:8px; }
.ct-ca{ flex:1; display:flex; align-items:center; justify-content:center; gap:6px; font-size:11.5px; font-weight:600; padding:9px; border-radius:8px; border:1px solid var(--line); color:var(--ink); text-decoration:none; transition:.15s; background:transparent; font-family:inherit; cursor:pointer; }
.ct-ca:hover{ border-color:var(--gold); }
.ct-ca--on{ border-color:var(--gold); background:rgba(201,168,76,.1); color:var(--gold2); }
.ct-ca--go{ background:var(--em); color:var(--bone); border-color:var(--em); }
.ct-ca--dim{ color:var(--muted); opacity:.5; cursor:not-allowed; }

/* inline how-to */
.ct-how{ margin-top:11px; background:rgba(14,59,46,.04); border:1px solid var(--line); border-radius:10px; padding:12px 14px; animation:ctHow .15s ease; }
@keyframes ctHow{ from{ opacity:0; transform:translateY(-3px); } to{ opacity:1; transform:translateY(0); } }
.ct-how__h{ font-size:10px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--gold2); margin-bottom:8px; }
.ct-how__steps{ margin:0 0 2px; padding:0; list-style:none; counter-reset:s; }
.ct-how__steps li{ position:relative; padding-left:25px; font-size:12px; line-height:1.4; color:var(--ink); margin-bottom:7px; counter-increment:s; }
.ct-how__steps li:last-child{ margin-bottom:0; }
.ct-how__steps li:before{ content:counter(s); position:absolute; left:0; top:0; width:17px; height:17px; border-radius:50%; background:var(--em); color:#fff; font-size:9.5px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.ct-how__link{ display:inline-block; margin-top:9px; font-size:11.5px; font-weight:700; color:var(--gold2); text-decoration:none; }
.ct-how__link:hover{ text-decoration:underline; }

/* printable tracker strip */
.ct-tracker{ display:flex; align-items:center; gap:13px; margin-top:16px; background:var(--card); border:1px solid var(--line);
  border-radius:14px; padding:14px 18px; text-decoration:none; color:var(--ink); transition:.15s; }
.ct-tracker:hover{ border-color:var(--gold); transform:translateY(-1px); box-shadow:0 8px 18px rgba(20,30,24,.06); }
.ct-tracker__ic{ font-size:20px; flex-shrink:0; }
.ct-tracker__body{ flex:1; min-width:0; }
.ct-tracker__t{ display:block; font-size:13.5px; font-weight:700; }
.ct-tracker__s{ display:block; font-size:11.5px; color:var(--muted); margin-top:1px; }
.ct-tracker__btn{ display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:700; color:var(--gold2);
  border:1px solid var(--line); border-radius:8px; padding:8px 14px; flex-shrink:0; white-space:nowrap; transition:.15s; }
.ct-tracker:hover .ct-tracker__btn{ border-color:var(--gold); }

.ct-note{ font-size:12.5px; color:var(--muted); margin-top:22px; line-height:1.6; }
.ct-note a{ color:var(--gold2); font-weight:600; text-decoration:none; }
.ct-note a:hover{ text-decoration:underline; }

@media(max-width:900px){ .ct-grid{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:560px){ .ct{ padding:20px; } .ct-grid{ grid-template-columns:1fr; } }
`;
