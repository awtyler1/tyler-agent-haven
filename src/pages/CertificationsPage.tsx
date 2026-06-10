import { useEffect } from 'react';
import { ahip, carrierCerts, certYear, type CarrierCert } from '@/data/certificationContent';

function initial(name: string) {
  return name[0].toUpperCase();
}

function CarrierCard({ c }: { c: CarrierCert }) {
  const open = c.status === 'open';
  return (
    <div className="ct-cc" style={{ ['--bc' as string]: c.color }}>
      <div className="ct-cc__top">
        <span className="ct-cc__mark" style={{ background: c.color }}>{initial(c.name)}</span>
        <div>
          <div className="ct-cc__nm">{c.name}</div>
          <div className="ct-cc__yr">{certYear} certification</div>
        </div>
      </div>
      <div className="ct-cc__status">
        <span className={`ct-pill ${open ? 'ct-pill--open' : 'ct-pill--tbd'}`}>
          {open ? 'Open now' : 'Not open yet'}
        </span>
        {c.opensLabel && <span className="ct-cc__when">{c.opensLabel}</span>}
      </div>
      <div className="ct-cc__acts">
        {c.howToUrl ? (
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
.ct-ahip__open{ font-size:12px; color:rgba(244,241,232,.72); font-weight:600; }
.ct-btn-gold{ display:inline-flex; align-items:center; gap:7px; background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em);
  font-weight:700; font-size:13px; padding:11px 18px; border-radius:9px; text-decoration:none; transition:.15s; }
.ct-btn-gold:hover{ transform:translateY(-1px); box-shadow:0 8px 20px rgba(168,128,31,.3); }

/* section label */
.ct-seclbl{ font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin:0 0 12px; display:flex; justify-content:space-between; gap:10px; }

/* grid + cards */
.ct-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
.ct-cc{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:18px; position:relative; overflow:hidden; transition:.18s; box-shadow:0 1px 3px rgba(0,0,0,.03); }
.ct-cc:hover{ transform:translateY(-3px); box-shadow:0 14px 30px rgba(20,30,24,.08); }
.ct-cc:before{ content:""; position:absolute; top:0; left:0; right:0; height:3px; background:var(--bc); }
.ct-cc__top{ display:flex; align-items:center; gap:11px; margin-bottom:14px; }
.ct-cc__mark{ width:38px; height:38px; border-radius:10px; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; flex-shrink:0; }
.ct-cc__nm{ font-size:16px; font-weight:700; }
.ct-cc__yr{ font-size:11px; color:var(--muted); }
.ct-cc__status{ display:flex; align-items:center; gap:8px; margin-bottom:14px; font-size:12px; }
.ct-pill{ font-size:10px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; padding:3px 9px; border-radius:20px; }
.ct-pill--open{ background:rgba(91,125,68,.15); color:var(--green); }
.ct-pill--tbd{ background:rgba(176,127,51,.14); color:var(--amber); }
.ct-cc__when{ color:var(--muted); }
.ct-cc__acts{ display:flex; gap:8px; }
.ct-ca{ flex:1; display:flex; align-items:center; justify-content:center; gap:6px; font-size:11.5px; font-weight:600; padding:9px; border-radius:8px; border:1px solid var(--line); color:var(--ink); text-decoration:none; transition:.15s; }
.ct-ca:hover{ border-color:var(--gold); }
.ct-ca--go{ background:var(--em); color:var(--bone); border-color:var(--em); }
.ct-ca--dim{ color:var(--muted); opacity:.5; cursor:not-allowed; }

.ct-note{ font-size:12.5px; color:var(--muted); margin-top:22px; line-height:1.6; }
.ct-note a{ color:var(--gold2); font-weight:600; text-decoration:none; }
.ct-note a:hover{ text-decoration:underline; }

@media(max-width:900px){ .ct-grid{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:560px){ .ct{ padding:20px; } .ct-grid{ grid-template-columns:1fr; } }
`;
