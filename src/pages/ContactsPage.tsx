import { useState } from 'react';

// ============================================================================
// THE TIG TEAM — edit this array to add people or update info.
// `helps` is the "reach out for…" line; leave it '' to hide.
// Photos live in /public/images/founders/.
// ============================================================================
interface TeamMember {
  name: string;
  credential?: string;
  title: string;
  photo: string;
  initials: string;
  phone?: string; // shown as call + text buttons
  email: string;
  helps?: string;
}

const TEAM: TeamMember[] = [
  {
    name: 'Austin Tyler',
    credential: 'MBA',
    title: 'Broker Development',
    photo: '/images/founders/atyler-headshot.jpg',
    initials: 'AT',
    phone: '(859) 619-6672',
    email: 'austin@tylerinsurancegroup.com',
  },
  {
    name: 'Andrew Horn',
    credential: 'MHA',
    title: 'Broker Development',
    photo: '/images/founders/andrew-horn.png',
    initials: 'AH',
    phone: '(210) 722-5597',
    email: 'andrew@tylerinsurancegroup.com',
  },
  {
    name: 'Caroline Horn',
    title: 'Head of Contracting',
    photo: '/images/founders/caroline-horn.jpg',
    initials: 'CH',
    email: 'caroline@tylerinsurancegroup.com',
    helps: 'Contracting, SunFire, Connecture, and BOSS CRM setup',
  },
];

function Photo({ m }: { m: TeamMember }) {
  const [errored, setErrored] = useState(false);
  if (errored || !m.photo) {
    return (
      <div className="tm-photo tm-photo--ph" aria-hidden="true">
        <span>{m.initials}</span>
      </div>
    );
  }
  return (
    <img className="tm-photo" src={m.photo} alt={m.name} loading="lazy" onError={() => setErrored(true)} />
  );
}

export default function ContactsPage() {
  return (
    <div className="tm">
      <style>{CSS}</style>
      <div className="tm-max">
        <div className="tm-head">
          <h1 className="tm-h1">The TIG Team</h1>
          <p className="tm-sub">Real people, real numbers. Call, text, or email us anytime.</p>
        </div>

        <div className="tm-grid">
          {TEAM.map((m) => (
            <div className="tm-card" key={m.name}>
              <Photo m={m} />
              <div className="tm-body">
                <h2 className="tm-nm">
                  {m.name}
                  {m.credential && <span className="tm-cred">, {m.credential}</span>}
                </h2>
                <div className="tm-title">{m.title}</div>
                {m.helps && <p className="tm-helps">Reach out for: {m.helps}</p>}
                <div className="tm-acts">
                  {m.phone && (
                    <>
                      <a className="tm-btn tm-btn--gold" href={`tel:${m.phone.replace(/\D/g, '')}`}>
                        📞 {m.phone}
                      </a>
                      <a className="tm-btn" href={`sms:${m.phone.replace(/\D/g, '')}`}>
                        💬 Text
                      </a>
                    </>
                  )}
                  <a className="tm-btn" href={`mailto:${m.email}`}>
                    ✉️ Email
                  </a>
                </div>
                <a className="tm-em" href={`mailto:${m.email}`}>{m.email}</a>
              </div>
            </div>
          ))}
        </div>

        <p className="tm-note">
          Looking for a carrier contact? Broker support lines and managers live on the{' '}
          <a href="/carrier-resources">Carriers page</a>.
        </p>
      </div>
    </div>
  );
}

const CSS = `
.tm{
  --em:#0E3B2E; --bone:#F4F1E8; --card:#fff; --line:#e7e0cf; --muted:#6b6457;
  --ink:#1b2620; --gold:#C9A84C; --gold2:#A8801F;
  flex:1 1 auto; min-height:0; overflow-y:auto; background:var(--bone);
  font-family:'Outfit','Inter',system-ui,sans-serif; color:var(--ink);
  -webkit-font-smoothing:antialiased; padding:30px 36px 44px;
}
.tm *{ box-sizing:border-box; }
.tm-max{ max-width:920px; margin:0 auto; }

.tm-head{ margin-bottom:20px; }
.tm-h1{ font-size:25px; font-weight:700; letter-spacing:-.02em; margin:0; }
.tm-sub{ font-size:13px; color:var(--muted); margin:3px 0 0; }

.tm-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.tm-card{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:20px; text-align:center;
  box-shadow:0 1px 3px rgba(0,0,0,.03); transition:.18s; }
.tm-card:hover{ transform:translateY(-3px); box-shadow:0 14px 30px rgba(20,30,24,.08); }
.tm-photo{ width:108px; height:108px; border-radius:14px; object-fit:cover; object-position:center 18%; margin:0 auto 14px; display:block; background:#eae4d6; }
.tm-photo--ph{ display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#10362a,#0a2c22); }
.tm-photo--ph span{ font-weight:700; font-size:30px; color:var(--gold); }
.tm-nm{ font-size:18px; font-weight:700; margin:0; letter-spacing:-.01em; }
.tm-cred{ font-weight:500; color:var(--muted); font-size:14px; }
.tm-title{ font-size:12px; font-weight:600; color:var(--gold2); margin:3px 0 0; }
.tm-helps{ font-size:12.5px; color:var(--muted); line-height:1.55; margin:10px 0 0; }
.tm-acts{ display:flex; gap:7px; justify-content:center; flex-wrap:wrap; margin-top:14px; }
.tm-btn{ display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:700; padding:9px 13px; border-radius:9px;
  border:1px solid var(--line); color:var(--ink); text-decoration:none; transition:.15s; white-space:nowrap; }
.tm-btn:hover{ border-color:var(--gold); transform:translateY(-1px); }
.tm-btn--gold{ background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); border-color:transparent; }
.tm-em{ display:block; font-size:11.5px; color:var(--muted); margin-top:12px; text-decoration:none; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.tm-em:hover{ color:var(--gold2); }

.tm-note{ font-size:12.5px; color:var(--muted); margin-top:22px; }
.tm-note a{ color:var(--gold2); font-weight:600; text-decoration:none; }
.tm-note a:hover{ text-decoration:underline; }

@media(max-width:820px){
  .tm{ padding:20px; }
  .tm-grid{ grid-template-columns:1fr; }
}
`;
