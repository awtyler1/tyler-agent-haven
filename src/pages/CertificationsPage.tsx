import { useEffect, useState } from 'react';
import {
  ahip,
  ahipModules,
  ahipFinalReview,
  carrierCerts,
  certYear,
  type CarrierCert,
} from '@/data/certificationContent';

function initial(name: string) {
  return name[0].toUpperCase();
}

// Compact carrier row. The how-to steps expand inline on click, so the resting
// state stays a single line so all carriers fit above the fold.
function CarrierRow({ c }: { c: CarrierCert }) {
  const open = c.status === 'open';
  const [showHow, setShowHow] = useState(false);
  const hasHow = !!(c.howTo && c.howTo.length);
  return (
    <div className={`ct-row-wrap ${open ? '' : 'ct-row-wrap--dim'}`}>
      <div className="ct-row" style={{ ['--bc' as string]: c.color }}>
        <span className="ct-row__mark" style={{ background: c.color }}>{initial(c.name)}</span>
        <span className="ct-row__nm">{c.name}</span>
        <span className={`ct-row__stat ${open ? '' : 'ct-row__stat--soon'}`}>
          <span className="ct-row__dot" />
          {c.opensLabel ?? (open ? 'Available now' : 'Coming soon')}
        </span>
        <span className="ct-row__acts">
          {hasHow ? (
            <button
              type="button"
              className={`ct-row__how ${showHow ? 'ct-row__how--on' : ''}`}
              onClick={() => setShowHow((v) => !v)}
              aria-expanded={showHow}
            >
              📄 How-to
            </button>
          ) : c.howToUrl ? (
            <a className="ct-row__how" href={c.howToUrl} target="_blank" rel="noopener noreferrer">📄 How-to</a>
          ) : (
            <span className="ct-row__how ct-row__how--dim">📄 How-to</span>
          )}
          {open && c.portalUrl ? (
            <a className="ct-row__cert" href={c.portalUrl} target="_blank" rel="noopener noreferrer">Certify ↗</a>
          ) : (
            <span className="ct-row__cert ct-row__cert--dim">Portal ↗</span>
          )}
        </span>
      </div>
      {showHow && hasHow && (
        <div className="ct-row__how-panel">
          <div className="ct-how__h">How to certify {c.name}</div>
          <ol className="ct-how__steps">
            {c.howTo!.map((s, i) => <li key={i}>{s}</li>)}
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
          <span className="ct-sub">AHIP first, then certify each carrier for {certYear}.</span>
        </div>

        {/* Two-column top: AHIP (Step 1) + study material */}
        <div className="ct-top">
          {/* Step 1 — AHIP */}
          <div className="ct-ahip">
            <span className="ct-ahip__ic" aria-hidden="true">🎓</span>
            <div className="ct-ahip__b">
              <div className="ct-ahip__t">Step 1: {ahip.title}</div>
              <div className="ct-ahip__s">{ahip.note}</div>
              {ahip.details && ahip.details.length > 0 && (
                <ul className="ct-ahip__details">
                  {ahip.details.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              )}
              <div className="ct-ahip__r">
                {ahip.opensLabel && <span className="ct-ahip__open">{ahip.opensLabel}</span>}
                <a className="ct-btn-gold" href={ahip.url} target="_blank" rel="noopener noreferrer">Go to AHIP ↗</a>
              </div>
            </div>
          </div>

          {/* AHIP exam prep — review by module */}
          <div className="ct-study">
            <div className="ct-seclbl">
              <span>AHIP exam prep: review by module</span>
              <span>Study &amp; keep</span>
            </div>
            <div className="ct-mods">
              {ahipModules.map((m) => (
                <a
                  className="ct-mod"
                  key={m.n}
                  href={m.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`AHIP Module ${m.n} final review, open or download PDF`}
                >
                  <span className="ct-mod__n" aria-hidden="true">{m.n}</span>
                  <span className="ct-mod__t">Module {m.n}</span>
                  <span className="ct-mod__s">Final review</span>
                  <span className="ct-mod__dl" aria-hidden="true">↓ PDF</span>
                </a>
              ))}
            </div>
            <a
              className="ct-finalrev"
              href={ahipFinalReview.file}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="AHIP full final review, open or download PDF"
            >
              <span className="ct-finalrev__ic" aria-hidden="true">🏁</span>
              <span className="ct-finalrev__b">
                <span className="ct-finalrev__t">{ahipFinalReview.title}</span>
                <span className="ct-finalrev__s">Every module in one. Your last stop before the exam.</span>
              </span>
              <span className="ct-finalrev__btn">↓ PDF</span>
            </a>
          </div>
        </div>

        {/* Step 2 — carriers as a compact list */}
        <div className="ct-seclbl ct-seclbl--rows">
          <span>Step 2: Carrier certifications</span>
          <span>{openCount > 0 ? `${openCount} open · ` : ''}{carrierCerts.length - openCount} not open yet</span>
        </div>
        <div className="ct-rows">
          {carrierCerts.map((c) => (
            <CarrierRow key={c.id} c={c} />
          ))}
        </div>

        {/* Tracker — folded into a slim footer link */}
        <a
          className="ct-track-link"
          href="/forms/2027-certification-tracker.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span aria-hidden="true">📋</span>
          <span><b>Download the {certYear} Certification Tracker</b>: a fillable one-pager to check off each cert, add the date, and save or print.</span>
        </a>

        <p className="ct-note">
          New carrier windows appear here as they open. Certification questions? Caroline Horn can help;
          find her on <a href="/contacts">Contacts</a>.
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
  -webkit-font-smoothing:antialiased; padding:20px 32px 16px;
}
.ct *{ box-sizing:border-box; }
.ct-max{ max-width:1100px; margin:0 auto; }
.ct-head{ display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; margin-bottom:14px; }
.ct-h1{ font-size:23px; font-weight:700; letter-spacing:-.02em; margin:0; }
.ct-sub{ font-size:12.5px; color:var(--muted); }

/* two-column top */
.ct-top{ display:grid; grid-template-columns:1.05fr 1fr; gap:15px; align-items:stretch; margin-bottom:11px; }

/* AHIP */
.ct-ahip{ display:flex; align-items:center; gap:15px; background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone);
  border-radius:15px; padding:16px 20px; position:relative; overflow:hidden; flex-wrap:wrap; }
.ct-ahip:before{ content:""; position:absolute; top:-70px; right:-50px; width:240px; height:240px; background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); }
.ct-ahip__ic{ font-size:22px; position:relative; }
.ct-ahip__b{ position:relative; flex:1; min-width:200px; }
.ct-ahip__t{ font-size:16px; font-weight:700; }
.ct-ahip__s{ font-size:12px; color:rgba(244,241,232,.72); margin-top:3px; }
.ct-ahip__details{ margin:8px 0 0; padding:0; list-style:none; }
.ct-ahip__details li{ position:relative; padding-left:14px; font-size:11.5px; line-height:1.5; color:rgba(244,241,232,.82); margin-top:3px; }
.ct-ahip__details li:before{ content:""; position:absolute; left:2px; top:7px; width:4px; height:4px; border-radius:50%; background:var(--gold); }
.ct-ahip__r{ display:flex; align-items:center; gap:11px; margin-top:12px; flex-wrap:wrap; }
.ct-ahip__open{ font-size:12px; font-weight:700; color:var(--em); background:linear-gradient(135deg,#e7cf86,var(--gold)); padding:6px 12px; border-radius:8px; }
.ct-btn-gold{ display:inline-flex; align-items:center; gap:7px; background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em);
  font-weight:700; font-size:12.5px; padding:10px 16px; border-radius:8px; text-decoration:none; transition:.15s; }
.ct-btn-gold:hover{ transform:translateY(-1px); box-shadow:0 8px 20px rgba(168,128,31,.3); }

/* study column */
.ct-study{ display:flex; flex-direction:column; gap:8px; }
.ct-mods{ display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
.ct-mod{ display:flex; flex-direction:column; align-items:flex-start; gap:5px; background:var(--card); border:1px solid var(--line);
  border-radius:11px; padding:9px 10px 9px; text-decoration:none; color:var(--ink); position:relative; overflow:hidden; transition:.15s;
  box-shadow:0 1px 3px rgba(0,0,0,.03); }
.ct-mod:before{ content:""; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,var(--gold2),var(--gold)); opacity:.85; }
.ct-mod:hover{ border-color:var(--gold); transform:translateY(-2px); box-shadow:0 12px 24px rgba(168,128,31,.14); }
.ct-mod__n{ width:28px; height:28px; flex-shrink:0; border-radius:8px; display:flex; align-items:center; justify-content:center;
  font-size:13px; font-weight:800; color:var(--em); background:linear-gradient(135deg,#e7cf86,var(--gold)); }
.ct-mod__t{ font-size:11.5px; font-weight:700; line-height:1.1; }
.ct-mod__s{ font-size:9.5px; color:var(--muted); margin-top:-3px; }
.ct-mod__dl{ margin-top:1px; font-size:9.5px; font-weight:700; color:var(--gold2); border:1px solid var(--line);
  border-radius:6px; padding:4px 9px; transition:.15s; }
.ct-mod:hover .ct-mod__dl{ border-color:var(--gold); background:rgba(201,168,76,.08); }

/* full final review capstone */
.ct-finalrev{ display:flex; align-items:center; gap:12px; padding:10px 15px; text-decoration:none; color:var(--bone);
  background:linear-gradient(135deg,#10362a,#0a2c22); border:1px solid rgba(201,168,76,.4); border-radius:12px; position:relative; overflow:hidden; transition:.15s; }
.ct-finalrev:before{ content:""; position:absolute; top:-70px; right:-50px; width:240px; height:240px; background:radial-gradient(circle,rgba(201,168,76,.18),transparent 60%); pointer-events:none; }
.ct-finalrev:hover{ transform:translateY(-1px); box-shadow:0 12px 26px rgba(10,44,34,.28); border-color:rgba(201,168,76,.7); }
.ct-finalrev__ic{ font-size:20px; flex-shrink:0; position:relative; }
.ct-finalrev__b{ flex:1; min-width:0; position:relative; }
.ct-finalrev__t{ display:block; font-size:13.5px; font-weight:700; }
.ct-finalrev__s{ display:block; font-size:11px; color:rgba(244,241,232,.72); margin-top:1px; line-height:1.4; }
.ct-finalrev__btn{ flex-shrink:0; position:relative; font-size:11.5px; font-weight:700; color:var(--em); white-space:nowrap;
  background:linear-gradient(135deg,#e7cf86,var(--gold)); padding:8px 14px; border-radius:8px; }

/* section label */
.ct-seclbl{ font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin:0 0 9px; display:flex; justify-content:space-between; gap:10px; }
.ct-seclbl--rows{ margin-top:2px; }

/* carrier rows */
.ct-rows{ display:flex; flex-direction:column; gap:5px; }
.ct-row-wrap{ background:var(--card); border:1px solid var(--line); border-radius:11px; overflow:hidden; transition:.15s; box-shadow:0 1px 3px rgba(0,0,0,.03); }
.ct-row-wrap:hover{ border-color:rgba(201,168,76,.55); }
.ct-row-wrap--dim{ opacity:.6; filter:grayscale(.9); }
.ct-row-wrap--dim:hover{ border-color:var(--line); }
.ct-row{ display:flex; align-items:center; gap:13px; padding:7px 15px; position:relative; }
.ct-row:before{ content:""; position:absolute; left:0; top:8px; bottom:8px; width:3px; border-radius:2px; background:var(--bc); }
.ct-row__mark{ width:28px; height:28px; border-radius:8px; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; flex-shrink:0; margin-left:4px; }
.ct-row__nm{ font-size:14px; font-weight:700; min-width:150px; }
.ct-row__stat{ display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:700; color:var(--gold2); }
.ct-row__stat--soon{ color:var(--muted); }
.ct-row__dot{ width:7px; height:7px; border-radius:50%; background:var(--green); flex-shrink:0; }
.ct-row__stat--soon .ct-row__dot{ background:var(--amber); }
.ct-row__acts{ margin-left:auto; display:flex; gap:8px; flex-shrink:0; }
.ct-row__how{ font-family:inherit; cursor:pointer; font-size:11.5px; font-weight:600; color:var(--ink); background:transparent;
  border:1px solid var(--line); border-radius:8px; padding:7px 13px; transition:.15s; white-space:nowrap; }
.ct-row__how:hover{ border-color:var(--gold); }
.ct-row__how--on{ border-color:var(--gold); background:rgba(201,168,76,.1); color:var(--gold2); }
.ct-row__how--dim{ color:var(--muted); opacity:.55; cursor:not-allowed; }
.ct-row__cert{ font-size:11.5px; font-weight:700; color:var(--bone); background:var(--em); border:1px solid var(--em);
  border-radius:8px; padding:7px 15px; text-decoration:none; white-space:nowrap; transition:.15s; }
.ct-row__cert:hover{ filter:brightness(1.15); }
.ct-row__cert--dim{ color:var(--muted); background:transparent; border-color:var(--line); opacity:.6; }

/* inline how-to panel (expanded on click) */
.ct-row__how-panel{ padding:2px 16px 14px 52px; animation:ctHow .15s ease; }
@keyframes ctHow{ from{ opacity:0; transform:translateY(-3px); } to{ opacity:1; transform:translateY(0); } }
.ct-how__h{ font-size:10px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--gold2); margin-bottom:8px; }
.ct-how__steps{ margin:0 0 2px; padding:0; list-style:none; counter-reset:s; }
.ct-how__steps li{ position:relative; padding-left:25px; font-size:12px; line-height:1.4; color:var(--ink); margin-bottom:7px; counter-increment:s; }
.ct-how__steps li:last-child{ margin-bottom:0; }
.ct-how__steps li:before{ content:counter(s); position:absolute; left:0; top:0; width:17px; height:17px; border-radius:50%; background:var(--em); color:#fff; font-size:9.5px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.ct-how__link{ display:inline-block; margin-top:9px; font-size:11.5px; font-weight:700; color:var(--gold2); text-decoration:none; }
.ct-how__link:hover{ text-decoration:underline; }

/* tracker footer link */
.ct-track-link{ display:flex; align-items:center; gap:9px; margin-top:11px; font-size:12px; color:var(--muted); text-decoration:none; line-height:1.4; }
.ct-track-link b{ color:var(--gold2); font-weight:700; }
.ct-track-link:hover b{ text-decoration:underline; }

.ct-note{ font-size:12px; color:var(--muted); margin-top:8px; line-height:1.5; }
.ct-note a{ color:var(--gold2); font-weight:600; text-decoration:none; }
.ct-note a:hover{ text-decoration:underline; }

@media(max-width:900px){
  .ct-top{ grid-template-columns:1fr; }
  .ct-mods{ grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); }
}
@media(max-width:560px){
  .ct{ padding:20px; }
  .ct-row{ flex-wrap:wrap; }
  .ct-row__acts{ width:100%; margin-left:0; }
  .ct-row__how, .ct-row__cert{ flex:1; text-align:center; }
  .ct-row__how-panel{ padding-left:16px; }
}
`;
