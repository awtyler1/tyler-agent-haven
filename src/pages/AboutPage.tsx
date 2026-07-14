import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { tig, founders } from '@/data/landingContent';

// ============================================================================
// ABOUT / LEADERSHIP — public entity + trust page (/about)
// ----------------------------------------------------------------------------
// Two jobs: (1) give a serious agent the operator-credibility proof they need
// before contracting, and (2) give search + AI a clean, schema-marked entity
// page (Person schema is injected at prerender time via scripts/prerender.mjs).
//
// NOTE FOR TIG: the founder bios below are written to be true and modest, not
// invented. Expand them with real specifics (years in the business, where you
// started, production milestones) whenever you like — more concrete proof is
// strictly better here.
// ============================================================================

function FounderPhoto({ photo, initials, name }: { photo?: string; initials: string; name: string }) {
  const [err, setErr] = useState(false);
  if (err || !photo) return <span className="ab-fphoto ab-fphoto--ph">{initials}</span>;
  return <img className="ab-fphoto" src={photo} alt={name} onError={() => setErr(true)} />;
}

const FOUNDER_BIOS: Record<string, string> = {
  'Austin Tyler':
    'Austin leads broker development at TIG. He is one of the operators behind the platform TIG runs on, from contracting to book tracking, and he still writes Medicare business every season. His focus is simple: hand agents the infrastructure and coaching he wishes he had starting out.',
  'Andrew Horn':
    'Andrew leads broker development at TIG. He pairs a healthcare background with real time in the field, and he spends most of his week where it counts, on the phone with agents working live cases. His focus: make sure no TIG agent ever feels like a number.',
};

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="ab-nav">
      <div className="ab-nav__in">
        <RouterLink to="/" className="ab-brand">
          <img className="ab-crest" src="/tyler-crest.png" alt="" aria-hidden="true" /> {tig.name}
        </RouterLink>
        <nav className="ab-nav__lks">
          <RouterLink to="/#honest" className="ab-nav__lk">Why TIG</RouterLink>
          <RouterLink to="/choosing-a-medicare-fmo" className="ab-nav__lk">Choosing an FMO</RouterLink>
          <RouterLink to="/insights" className="ab-nav__lk">Insights</RouterLink>
          <RouterLink to="/about" className="ab-nav__lk is-active">About</RouterLink>
        </nav>
        <div className="ab-nav__act">
          <RouterLink to="/auth" className="ab-btn ab-btn--ghost">Agent Login</RouterLink>
          <RouterLink to="/join" className="ab-btn ab-btn--gold">I'm Ready to Grow</RouterLink>
        </div>
        <button
          className={`ab-burger${menuOpen ? ' is-open' : ''}`}
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>
      {menuOpen && (
        <div className="ab-mmenu" onClick={() => setMenuOpen(false)}>
          <RouterLink to="/#honest" className="ab-mmenu__lk">Why TIG</RouterLink>
          <RouterLink to="/choosing-a-medicare-fmo" className="ab-mmenu__lk">Choosing an FMO</RouterLink>
          <RouterLink to="/insights" className="ab-mmenu__lk">Insights</RouterLink>
          <RouterLink to="/about" className="ab-mmenu__lk">About</RouterLink>
          <RouterLink to="/auth" className="ab-mmenu__lk">Agent Login</RouterLink>
          <RouterLink to="/join" className="ab-btn ab-btn--gold ab-mmenu__cta">I'm Ready to Grow</RouterLink>
        </div>
      )}
    </header>
  );
}

const BELIEFS: { h: string; p: string }[] = [
  {
    h: 'Transparency beats the pitch.',
    p: 'We put how you are paid and how you get released in writing. If an FMO will not tell you plainly, that silence is the answer.',
  },
  {
    h: 'You should own your book.',
    p: 'You are paid directly by the carrier at the full commission, and your book is yours. If you ever leave, it goes with you. That is the whole point of building.',
  },
  {
    h: 'Overrides do not grow books.',
    p: 'Skill, reps, and the right tools do. The override is about the same at every FMO. What matters is what we do with it, and we reinvest it in you.',
  },
  {
    h: 'Small on purpose.',
    p: 'We would rather make our agents better than recruit thousands and forget their names. When you grow, we grow. That is not a slogan, it is the math.',
  },
];

export default function AboutPage() {
  useEffect(() => {
    document.title = 'About Tyler Insurance Group | Medicare FMO Built in Kentucky';
  }, []);

  return (
    <div className="ab">
      <style>{CSS}</style>
      <Nav />

      <section className="ab-hero">
        <div className="ab-hero__in">
          <div className="ab-kick">About Tyler Insurance Group</div>
          <h1 className="ab-h1">An FMO run by operators who still sell.</h1>
          <p className="ab-lead">
            We are a Kentucky-built Medicare FMO. Our team has written more than 1,000 policies in
            four years, and we built the tools our agents run on. No call center, no ticket queue,
            no recruiter who disappears the day you sign. Here is who we are and what we believe.
          </p>
        </div>
      </section>

      <section className="ab-founders">
        <h2 className="ab-h2">The people you actually talk to</h2>
        <div className="ab-fgrid">
          {founders.map((f) => (
            <div className="ab-fcard" key={f.name}>
              <FounderPhoto photo={f.photo} initials={f.initials} name={f.name} />
              <div className="ab-fname">
                {f.name}{f.credential ? <span className="ab-fcred">, {f.credential}</span> : null}
              </div>
              <div className="ab-ftitle">{f.title} · Tyler Insurance Group</div>
              <p className="ab-fbio">{FOUNDER_BIOS[f.name] ?? ''}</p>
            </div>
          ))}
        </div>
        <p className="ab-fnote">
          You get our actual cell numbers. When you call, a founder picks up. Same day, every time.
        </p>
      </section>

      <section className="ab-beliefs">
        <div className="ab-beliefs__in">
          <h2 className="ab-h2 ab-h2--light">What we believe</h2>
          <div className="ab-bgrid">
            {BELIEFS.map((b, i) => (
              <div className="ab-bcard" key={i}>
                <div className="ab-bnum">{String(i + 1).padStart(2, '0')}</div>
                <div className="ab-bh">{b.h}</div>
                <p className="ab-bp">{b.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ab-links">
        <h2 className="ab-h2">Read before you contract anywhere</h2>
        <p className="ab-linksub">
          We would tell you to do this even if you were looking at someone else. Know how the money
          and the ownership work before you sign.
        </p>
        <div className="ab-lgrid">
          <RouterLink className="ab-lcard" to="/choosing-a-medicare-fmo">
            <div className="ab-lcard__t">How to choose a Medicare FMO</div>
            <div className="ab-lcard__d">The full framework, and how to know if you can leave.</div>
          </RouterLink>
          <RouterLink className="ab-lcard" to="/insights/who-owns-your-book">
            <div className="ab-lcard__t">Who owns your book of business?</div>
            <div className="ab-lcard__d">The one word in your contract that decides it.</div>
          </RouterLink>
          <RouterLink className="ab-lcard" to="/insights/how-fmo-commissions-work">
            <div className="ab-lcard__t">How FMO commissions actually work</div>
            <div className="ab-lcard__d">Street, override, and why "we pay the most" is a myth.</div>
          </RouterLink>
          <RouterLink className="ab-lcard" to="/kentucky-medicare-market-report">
            <div className="ab-lcard__t">The Kentucky Medicare Market Report</div>
            <div className="ab-lcard__d">Our sourced 2026 data report on the market we build in.</div>
          </RouterLink>
        </div>
      </section>

      <section className="ab-cta">
        <div className="ab-cta__in">
          <h2 className="ab-ctah">Want to see if it is a fit?</h2>
          <p className="ab-ctap">
            Top contracts, the full toolkit, and us in it with you. Talk to a founder before you
            decide anything.
          </p>
          <RouterLink className="ab-btn ab-btn--gold ab-btn--lg" to="/join">I'm Ready to Grow</RouterLink>
        </div>
      </section>

      <div className="ab-foot">
        Powered by <b>Tyler Insurance Group</b> · {tig.tagline}
      </div>
    </div>
  );
}

const CSS = `
.ab{
  --em:#0E3B2E; --em2:#0a2c22; --bone:#F4F1E8; --line:#e1d9c8; --muted:#5f6b62; --ink:#16201b; --gold:#C9A84C; --gold2:#A8801F;
  font-family:'Inter',system-ui,sans-serif; background:var(--bone); color:var(--ink); -webkit-font-smoothing:antialiased; min-height:100vh; display:flex; flex-direction:column;
}
.ab *{ box-sizing:border-box; }
.ab a{ text-decoration:none; }
.ab h1,.ab h2,.ab h3{ font-family:'Outfit','Inter',sans-serif; }

.ab-nav{ background:rgba(14,59,46,.96); position:sticky; top:0; z-index:50; }
.ab-nav__in{ max-width:1140px; margin:0 auto; padding:0 32px; height:66px; display:flex; align-items:center; gap:26px; }
.ab-brand{ display:flex; align-items:center; gap:10px; color:#fff; font-weight:700; font-size:15px; }
.ab-crest{ height:30px; width:auto; display:block; }
.ab-nav__lks{ display:flex; gap:24px; flex:1; margin-left:8px; }
.ab-nav__lk{ color:rgba(244,241,232,.74); font-size:14px; font-weight:500; }
.ab-nav__lk:hover,.ab-nav__lk.is-active{ color:#fff; }
.ab-nav__act{ display:flex; align-items:center; gap:10px; }
.ab-burger{ display:none; flex-direction:column; justify-content:center; gap:5px; width:44px; height:44px; margin-left:auto; background:none; border:none; cursor:pointer; padding:0; }
.ab-burger span{ display:block; width:22px; height:2px; background:#fff; border-radius:2px; transition:transform .25s ease, opacity .2s ease; }
.ab-burger.is-open span:nth-child(1){ transform:translateY(7px) rotate(45deg); }
.ab-burger.is-open span:nth-child(2){ opacity:0; }
.ab-burger.is-open span:nth-child(3){ transform:translateY(-7px) rotate(-45deg); }
.ab-mmenu{ display:flex; flex-direction:column; background:rgba(8,37,28,.99); border-bottom:1px solid rgba(255,255,255,.1); padding:8px 22px 22px; }
.ab-mmenu__lk{ color:rgba(244,241,232,.92); font-size:16px; font-weight:600; padding:15px 4px; border-bottom:1px solid rgba(255,255,255,.08); }
.ab-mmenu__cta{ margin-top:16px; justify-content:center; font-size:16px; padding:14px; text-align:center; }
.ab-btn{ font-size:13.5px; font-weight:700; padding:9px 15px; border-radius:9px; cursor:pointer; font-family:inherit; display:inline-block; }
.ab-btn--ghost{ color:rgba(244,241,232,.85); font-weight:600; border:1px solid rgba(244,241,232,.25); padding:8px 14px; }
.ab-btn--gold{ background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); }
.ab-btn--lg{ font-size:16px; padding:14px 26px; }

.ab-hero{ background:linear-gradient(150deg,#13503c,#0a2c22); color:var(--bone); }
.ab-hero__in{ max-width:820px; margin:0 auto; padding:60px 32px 54px; }
.ab-kick{ font-size:12px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); margin-bottom:14px; }
.ab-h1{ font-size:clamp(30px,4.4vw,46px); font-weight:800; letter-spacing:-.02em; line-height:1.1; margin:0 0 18px; }
.ab-lead{ font-size:17px; line-height:1.7; color:rgba(244,241,232,.9); max-width:680px; margin:0; }

.ab-h2{ font-family:'Outfit'; font-size:clamp(21px,2.6vw,27px); font-weight:700; letter-spacing:-.01em; margin:0 0 8px; }
.ab-h2--light{ color:var(--bone); }

.ab-founders{ max-width:900px; width:100%; margin:0 auto; padding:52px 32px 20px; }
.ab-fgrid{ display:grid; grid-template-columns:1fr 1fr; gap:22px; margin-top:22px; }
.ab-fcard{ background:#fff; border:1px solid var(--line); border-radius:16px; padding:26px; }
.ab-fphoto{ width:76px; height:76px; border-radius:50%; object-fit:cover; object-position:center 16%; background:#10362a; display:block; margin-bottom:14px; }
.ab-fphoto--ph{ display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); font-family:'Outfit'; font-weight:800; font-size:24px; }
.ab-fname{ font-family:'Outfit'; font-size:19px; font-weight:800; }
.ab-fcred{ color:var(--gold2); font-weight:700; }
.ab-ftitle{ font-size:12.5px; color:var(--muted); margin:2px 0 12px; }
.ab-fbio{ font-size:14.5px; line-height:1.65; color:#33312c; margin:0; }
.ab-fnote{ font-size:14px; color:var(--muted); text-align:center; margin:24px auto 0; max-width:560px; }

.ab-beliefs{ background:linear-gradient(135deg,#10362a,#0a2c22); margin-top:40px; position:relative; overflow:hidden; }
.ab-beliefs:before{ content:""; position:absolute; top:-90px; right:-60px; width:320px; height:320px; background:radial-gradient(circle,rgba(201,168,76,.14),transparent 60%); }
.ab-beliefs__in{ max-width:900px; width:100%; margin:0 auto; padding:52px 32px; position:relative; }
.ab-bgrid{ display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:24px; }
.ab-bcard{ border:1px solid rgba(244,241,232,.14); border-radius:14px; padding:22px; background:rgba(255,255,255,.03); }
.ab-bnum{ font-family:'Outfit'; font-size:15px; font-weight:800; color:var(--gold); margin-bottom:8px; }
.ab-bh{ font-family:'Outfit'; font-size:17px; font-weight:700; color:var(--bone); margin-bottom:7px; }
.ab-bp{ font-size:14.5px; line-height:1.65; color:rgba(244,241,232,.82); margin:0; }

.ab-links{ max-width:900px; width:100%; margin:0 auto; padding:52px 32px 8px; }
.ab-linksub{ font-size:15px; color:var(--muted); max-width:620px; margin:0 0 22px; }
.ab-lgrid{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.ab-lcard{ display:block; background:#fff; border:1px solid var(--line); border-radius:14px; padding:20px; transition:transform .18s ease, box-shadow .18s ease; }
.ab-lcard:hover{ transform:translateY(-3px); box-shadow:0 10px 26px rgba(14,59,46,.1); }
.ab-lcard__t{ font-family:'Outfit'; font-size:15.5px; font-weight:700; color:var(--em); margin-bottom:6px; }
.ab-lcard__d{ font-size:13px; line-height:1.55; color:var(--muted); }

.ab-cta{ max-width:900px; width:100%; margin:44px auto 56px; padding:0 32px; }
.ab-cta__in{ background:linear-gradient(150deg,#13503c,#0a2c22); border-radius:20px; padding:44px 32px; text-align:center; color:var(--bone); }
.ab-ctah{ font-family:'Outfit'; font-size:clamp(23px,3vw,30px); font-weight:800; margin:0 0 10px; }
.ab-ctap{ font-size:16px; line-height:1.6; color:rgba(244,241,232,.88); max-width:520px; margin:0 auto 22px; }

.ab-foot{ background:#0a221a; color:rgba(244,241,232,.6); text-align:center; padding:26px; font-size:13px; margin-top:auto; }
.ab-foot b{ color:var(--gold); }

@media(max-width:760px){
  .ab-fgrid,.ab-bgrid{ grid-template-columns:1fr; }
  .ab-lgrid{ grid-template-columns:1fr; }
  .ab-nav__lks,.ab-nav__act{ display:none; }
  .ab-burger{ display:flex; }
}
`;
