import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { tig } from '@/data/landingContent';

// ============================================================================
// PILLAR / HUB — "How to choose a Medicare FMO (and how to leave one)"
// Route: /choosing-a-medicare-fmo
// ----------------------------------------------------------------------------
// This is the internal-linking hub for the transparency cluster. It targets the
// high-intent "how to choose a Medicare FMO" query, gives the honest framework,
// and links out to the deep-dive articles. The FAQ section is mirrored as
// FAQPage JSON-LD at prerender time (scripts/prerender.mjs via entry-server).
// Keep the FAQ copy here in sync with the jsonld in src/prerender/entry-server.
// ============================================================================

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="cf-nav">
      <div className="cf-nav__in">
        <RouterLink to="/" className="cf-brand">
          <img className="cf-crest" src="/tyler-crest.png" alt="" aria-hidden="true" /> {tig.name}
        </RouterLink>
        <nav className="cf-nav__lks">
          <RouterLink to="/#honest" className="cf-nav__lk">Why TIG</RouterLink>
          <RouterLink to="/choosing-a-medicare-fmo" className="cf-nav__lk is-active">Choosing an FMO</RouterLink>
          <RouterLink to="/insights" className="cf-nav__lk">Insights</RouterLink>
          <RouterLink to="/about" className="cf-nav__lk">About</RouterLink>
        </nav>
        <div className="cf-nav__act">
          <RouterLink to="/auth" className="cf-btn cf-btn--ghost">Agent Login</RouterLink>
          <RouterLink to="/join" className="cf-btn cf-btn--gold">I'm Ready to Grow</RouterLink>
        </div>
        <button
          className={`cf-burger${menuOpen ? ' is-open' : ''}`}
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>
      {menuOpen && (
        <div className="cf-mmenu" onClick={() => setMenuOpen(false)}>
          <RouterLink to="/#honest" className="cf-mmenu__lk">Why TIG</RouterLink>
          <RouterLink to="/choosing-a-medicare-fmo" className="cf-mmenu__lk">Choosing an FMO</RouterLink>
          <RouterLink to="/insights" className="cf-mmenu__lk">Insights</RouterLink>
          <RouterLink to="/about" className="cf-mmenu__lk">About</RouterLink>
          <RouterLink to="/auth" className="cf-mmenu__lk">Agent Login</RouterLink>
          <RouterLink to="/join" className="cf-btn cf-btn--gold cf-mmenu__cta">I'm Ready to Grow</RouterLink>
        </div>
      )}
    </header>
  );
}

const CRITERIA: { n: string; h: string; good: string; flag: string }[] = [
  {
    n: '01',
    h: 'How you are paid',
    good: 'You are paid directly by the carrier at the full CMS street level, and they can show you the grid.',
    flag: 'Vague answers, "assigned" commissions, or a split they will not put in numbers.',
  },
  {
    n: '02',
    h: 'Who owns the book',
    good: 'Your book is yours. If you leave, your renewals follow you. It is in writing.',
    flag: 'The agency holds the contract, or nobody will say plainly what happens to your renewals if you go.',
  },
  {
    n: '03',
    h: 'Release policy',
    good: 'A written release policy, stated up front, that does not trap you for months.',
    flag: 'Release terms buried, delayed, or "we will figure it out later." That is the whole ballgame.',
  },
  {
    n: '04',
    h: 'Carrier access',
    good: 'Top contracts with the carriers you actually need for your market, and fast appointments.',
    flag: 'A thin lineup, or pressure to write only the carriers that pay them the most.',
  },
  {
    n: '05',
    h: 'Tech and tools',
    good: 'Real quoting and enrollment (SunFire, Connecture) and a CRM built for Medicare, included at no cost.',
    flag: 'A "portal" that is really just a login, or tools you have to pay for and stitch together yourself.',
  },
  {
    n: '06',
    h: 'Support and training',
    good: 'A named person who answers the phone, live coaching, and in-appointment help. Substance, not a video dump.',
    flag: 'A help desk that does not know your name, and "training" that ends at AHIP.',
  },
];

const QUESTIONS = [
  'Am I paid directly by the carrier at the full CMS street level, or by you?',
  'If I leave, do my clients and renewals come with me? Show me where that is written.',
  'What exactly is your release policy, and how long does it take?',
  'Which carriers will I have, and how fast are appointments?',
  'What tools do I get, and what do they cost me?',
  'When I have a problem in the field, who picks up, and how fast?',
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is the most important thing to look for in a Medicare FMO?',
    a: 'Whether you own your book of business. If you are paid directly by the carrier at the full CMS commission and your renewals follow you when you leave, you own it. If your commissions are assigned to the agency, they own it. Everything else is secondary to that.',
  },
  {
    q: 'Do all FMOs pay the same commission?',
    a: 'At street level, effectively yes. CMS sets a maximum commission each year, and a good FMO pays you that full amount directly from the carrier. The FMO earns a separate override from the carrier on top of your check, and that override is roughly the same everywhere. So "we pay the most" is usually a myth. Judge FMOs on what they do with the override, not on the number itself.',
  },
  {
    q: 'How do I get released from my FMO?',
    a: 'Request the release in writing from a principal officer of the agency. Fair FMOs state their release policy up front. Note two things: many uplines pause releases during AEP (September 1 to December 31), and for most carriers you can change your hierarchy once a year around your contract anniversary without any release at all. If an upline refuses to release you, carriers generally allow a self-release after a waiting period, commonly six months.',
  },
  {
    q: 'What is the difference between direct pay and LOA?',
    a: 'Direct pay means the carrier pays you the full commission and you own the book. LOA, or licensed-only-agent, means the carrier pays the agency and the agency pays you a share, usually while keeping ownership of the book. Some agents take an LOA deal early for leads or salary. Just know the trade you are making.',
  },
];

export default function ChoosingFmoPage() {
  useEffect(() => {
    document.title = 'How to Choose a Medicare FMO (and How to Leave One) | Tyler Insurance Group';
  }, []);

  return (
    <div className="cf">
      <style>{CSS}</style>
      <Nav />

      <section className="cf-hero">
        <div className="cf-hero__in">
          <div className="cf-kick">The honest guide</div>
          <h1 className="cf-h1">How to choose a Medicare FMO, and how to leave one</h1>
          <p className="cf-lead">
            Your FMO is one of the biggest decisions your business will make, and most agents pick
            the one whose recruiter called first. It deserves more than that. Here is the framework
            we would use, the questions to ask before you sign, and how to make sure you are never
            trapped. We would tell you this even if you were looking at someone else.
          </p>
        </div>
      </section>

      <article className="cf-wrap">
        <section className="cf-sec">
          <h2 className="cf-h2">Start with the only question that really matters</h2>
          <p className="cf-p">
            Before comp, before tools, before the pitch, answer one thing: if you leave, do your
            clients and renewals come with you? That single answer separates building a business
            from renting one. It comes down to how your contract is written, not how friendly the
            recruiter was. We break it down in{' '}
            <RouterLink className="cf-ilink" to="/insights/who-owns-your-book">who owns your book of business</RouterLink>.
          </p>
        </section>

        <section className="cf-sec">
          <h2 className="cf-h2">The six things to actually evaluate</h2>
          <p className="cf-p">
            Every FMO will tell you they have great support and top contracts. Ignore the adjectives
            and check these six, and ask for each in writing.
          </p>
          <div className="cf-crit">
            {CRITERIA.map((c) => (
              <div className="cf-critcard" key={c.n}>
                <div className="cf-critnum">{c.n}</div>
                <div className="cf-critbody">
                  <div className="cf-crith">{c.h}</div>
                  <p className="cf-critline"><span className="cf-good">Good looks like</span> {c.good}</p>
                  <p className="cf-critline"><span className="cf-flag">Red flag</span> {c.flag}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="cf-sec">
          <h2 className="cf-h2">The money, in plain terms</h2>
          <p className="cf-p">
            Do not get sold on "highest commissions." At street level, the commission is a CMS
            maximum that a good FMO pays you in full, directly from the carrier. The FMO earns a
            separate override that is roughly the same everywhere, paid by the carrier on top of
            your check. The real question is what they do with that override. See{' '}
            <RouterLink className="cf-ilink" to="/insights/how-fmo-commissions-work">how FMO commissions actually work</RouterLink>,
            and for the current numbers,{' '}
            <RouterLink className="cf-ilink" to="/insights/kentucky-medicare-commissions-2027">Medicare agent commissions in Kentucky for 2026 and 2027</RouterLink>.
          </p>
        </section>

        <section className="cf-sec cf-ask">
          <h2 className="cf-h2 cf-h2--light">Six questions to ask before you sign</h2>
          <p className="cf-p cf-p--light">
            Ask these out loud, and get the answers in writing. How they respond tells you more than
            any brochure.
          </p>
          <ol className="cf-ol">
            {QUESTIONS.map((q, i) => <li key={i}>{q}</li>)}
          </ol>
          <p className="cf-asknote">
            If a recruiter will not put the answers in writing, that is your answer.
          </p>
        </section>

        <section className="cf-sec">
          <h2 className="cf-h2">And how to leave one</h2>
          <p className="cf-p">
            Choosing well is half of it. Knowing you can leave is the other half, and it takes most
            of the fear out of the decision. Three things worth knowing:
          </p>
          <ul className="cf-ul">
            <li>Request a release in writing from a principal officer. Fair FMOs state the policy up front.</li>
            <li>Most carriers let you change your hierarchy once a year around your contract anniversary, with no release needed at all.</li>
            <li>Many uplines pause releases during AEP (September 1 to December 31). If an upline refuses outright, carriers generally allow a self-release after a waiting period, often six months.</li>
          </ul>
          <p className="cf-p">
            The trap to avoid is any FMO that will not put release terms in writing. If a company
            needs to hold you hostage to keep you, that tells you what they think their value is.
          </p>
        </section>

        <section className="cf-sec">
          <h2 className="cf-h2">Common questions</h2>
          <div className="cf-faq">
            {FAQ.map((f, i) => (
              <div className="cf-faqitem" key={i}>
                <div className="cf-faqq">{f.q}</div>
                <p className="cf-faqa">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cf-sec cf-clusters">
          <h2 className="cf-h2">Go deeper</h2>
          <div className="cf-cgrid">
            <RouterLink className="cf-ccard" to="/insights/who-owns-your-book">
              <div className="cf-ccard__t">Who owns your book of business?</div>
              <div className="cf-ccard__d">Direct pay vs. assigned commissions, and the one word to search your contract for.</div>
            </RouterLink>
            <RouterLink className="cf-ccard" to="/insights/how-fmo-commissions-work">
              <div className="cf-ccard__t">How FMO commissions actually work</div>
              <div className="cf-ccard__d">Street, override, and the LOA split, in plain terms.</div>
            </RouterLink>
            <RouterLink className="cf-ccard" to="/insights/kentucky-medicare-commissions-2027">
              <div className="cf-ccard__t">Kentucky commissions: 2026 and 2027</div>
              <div className="cf-ccard__d">The real numbers, and why renewals matter more than any of them.</div>
            </RouterLink>
            <RouterLink className="cf-ccard" to="/insights/what-a-medicare-fmo-really-does">
              <div className="cf-ccard__t">What a Medicare FMO really does</div>
              <div className="cf-ccard__d">The old model vs. the new one, and how to pick one that grows you.</div>
            </RouterLink>
          </div>
        </section>
      </article>

      <section className="cf-cta">
        <div className="cf-cta__in">
          <h2 className="cf-ctah">Run us through your own checklist</h2>
          <p className="cf-ctap">
            Ask us every question above. We will answer in writing. If we are a fit, great. If not,
            you will still leave knowing exactly what to look for.
          </p>
          <RouterLink className="cf-btn cf-btn--gold cf-btn--lg" to="/join">I'm Ready to Grow</RouterLink>
        </div>
      </section>

      <div className="cf-foot">
        Powered by <b>Tyler Insurance Group</b> · {tig.tagline}
      </div>
    </div>
  );
}

const CSS = `
.cf{
  --em:#0E3B2E; --em2:#0a2c22; --bone:#F4F1E8; --line:#e1d9c8; --muted:#5f6b62; --ink:#16201b; --gold:#C9A84C; --gold2:#A8801F;
  font-family:'Inter',system-ui,sans-serif; background:var(--bone); color:var(--ink); -webkit-font-smoothing:antialiased; min-height:100vh; display:flex; flex-direction:column;
}
.cf *{ box-sizing:border-box; }
.cf a{ text-decoration:none; }
.cf h1,.cf h2,.cf h3{ font-family:'Outfit','Inter',sans-serif; }

.cf-nav{ background:rgba(14,59,46,.96); position:sticky; top:0; z-index:50; }
.cf-nav__in{ max-width:1140px; margin:0 auto; padding:0 32px; height:66px; display:flex; align-items:center; gap:26px; }
.cf-brand{ display:flex; align-items:center; gap:10px; color:#fff; font-weight:700; font-size:15px; }
.cf-crest{ height:30px; width:auto; display:block; }
.cf-nav__lks{ display:flex; gap:24px; flex:1; margin-left:8px; }
.cf-nav__lk{ color:rgba(244,241,232,.74); font-size:14px; font-weight:500; }
.cf-nav__lk:hover,.cf-nav__lk.is-active{ color:#fff; }
.cf-nav__act{ display:flex; align-items:center; gap:10px; }
.cf-burger{ display:none; flex-direction:column; justify-content:center; gap:5px; width:44px; height:44px; margin-left:auto; background:none; border:none; cursor:pointer; padding:0; }
.cf-burger span{ display:block; width:22px; height:2px; background:#fff; border-radius:2px; transition:transform .25s ease, opacity .2s ease; }
.cf-burger.is-open span:nth-child(1){ transform:translateY(7px) rotate(45deg); }
.cf-burger.is-open span:nth-child(2){ opacity:0; }
.cf-burger.is-open span:nth-child(3){ transform:translateY(-7px) rotate(-45deg); }
.cf-mmenu{ display:flex; flex-direction:column; background:rgba(8,37,28,.99); border-bottom:1px solid rgba(255,255,255,.1); padding:8px 22px 22px; }
.cf-mmenu__lk{ color:rgba(244,241,232,.92); font-size:16px; font-weight:600; padding:15px 4px; border-bottom:1px solid rgba(255,255,255,.08); }
.cf-mmenu__cta{ margin-top:16px; justify-content:center; font-size:16px; padding:14px; text-align:center; }
.cf-btn{ font-size:13.5px; font-weight:700; padding:9px 15px; border-radius:9px; cursor:pointer; font-family:inherit; display:inline-block; }
.cf-btn--ghost{ color:rgba(244,241,232,.85); font-weight:600; border:1px solid rgba(244,241,232,.25); padding:8px 14px; }
.cf-btn--gold{ background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); }
.cf-btn--lg{ font-size:16px; padding:14px 26px; }

.cf-hero{ background:linear-gradient(150deg,#13503c,#0a2c22); color:var(--bone); }
.cf-hero__in{ max-width:820px; margin:0 auto; padding:60px 32px 54px; }
.cf-kick{ font-size:12px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); margin-bottom:14px; }
.cf-h1{ font-size:clamp(28px,4.2vw,44px); font-weight:800; letter-spacing:-.02em; line-height:1.12; margin:0 0 18px; }
.cf-lead{ font-size:17px; line-height:1.7; color:rgba(244,241,232,.9); max-width:700px; margin:0; }

.cf-wrap{ max-width:760px; width:100%; margin:0 auto; padding:44px 32px 20px; flex:1; }
.cf-sec{ margin-bottom:40px; }
.cf-h2{ font-family:'Outfit'; font-size:clamp(20px,2.6vw,26px); font-weight:700; letter-spacing:-.01em; margin:0 0 12px; }
.cf-h2--light{ color:var(--bone); }
.cf-p{ font-size:16px; line-height:1.72; color:#33312c; margin:0 0 14px; }
.cf-p--light{ color:rgba(244,241,232,.9); }
.cf-ilink{ color:var(--gold2); font-weight:600; border-bottom:1px solid rgba(168,128,31,.35); }
.cf-ilink:hover{ border-bottom-color:var(--gold2); }

.cf-crit{ display:flex; flex-direction:column; gap:14px; margin-top:18px; }
.cf-critcard{ display:flex; gap:16px; background:#fff; border:1px solid var(--line); border-radius:14px; padding:20px; }
.cf-critnum{ font-family:'Outfit'; font-size:18px; font-weight:800; color:var(--gold2); flex-shrink:0; }
.cf-crith{ font-family:'Outfit'; font-size:17px; font-weight:700; margin-bottom:8px; }
.cf-critline{ font-size:14.5px; line-height:1.6; color:#33312c; margin:0 0 6px; }
.cf-critline:last-child{ margin-bottom:0; }
.cf-good{ display:inline-block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#3d6b3d; margin-right:6px; }
.cf-flag{ display:inline-block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#a5502f; margin-right:6px; }

.cf-ask{ background:linear-gradient(135deg,#10362a,#0a2c22); border-radius:18px; padding:30px 28px; position:relative; overflow:hidden; }
.cf-ask:before{ content:""; position:absolute; top:-70px; right:-50px; width:240px; height:240px; background:radial-gradient(circle,rgba(201,168,76,.15),transparent 60%); }
.cf-ask > *{ position:relative; }
.cf-ol{ margin:16px 0 0; padding:0; counter-reset:step; }
.cf-ol li{ list-style:none; display:flex; gap:12px; font-size:15.5px; line-height:1.55; margin-bottom:12px; align-items:flex-start; color:rgba(244,241,232,.94); }
.cf-ol li:before{ counter-increment:step; content:counter(step); width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cf-asknote{ font-size:14px; color:var(--gold); font-weight:600; margin:14px 0 0; position:relative; }

.cf-ul{ margin:6px 0 14px; padding:0; }
.cf-ul li{ list-style:none; display:flex; gap:10px; font-size:15.5px; line-height:1.65; margin-bottom:10px; color:#33312c; }
.cf-ul li:before{ content:"–"; color:var(--gold2); font-weight:700; flex-shrink:0; }

.cf-faq{ display:flex; flex-direction:column; gap:14px; margin-top:16px; }
.cf-faqitem{ background:#fff; border:1px solid var(--line); border-radius:12px; padding:18px 20px; }
.cf-faqq{ font-family:'Outfit'; font-size:15.5px; font-weight:700; color:var(--em); margin-bottom:7px; }
.cf-faqa{ font-size:14.5px; line-height:1.65; color:#33312c; margin:0; }

.cf-clusters{ margin-top:8px; }
.cf-cgrid{ display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:16px; }
.cf-ccard{ display:block; background:#fff; border:1px solid var(--line); border-radius:14px; padding:20px; transition:transform .18s ease, box-shadow .18s ease; }
.cf-ccard:hover{ transform:translateY(-3px); box-shadow:0 10px 26px rgba(14,59,46,.1); }
.cf-ccard__t{ font-family:'Outfit'; font-size:15.5px; font-weight:700; color:var(--em); margin-bottom:6px; }
.cf-ccard__d{ font-size:13px; line-height:1.55; color:var(--muted); }

.cf-cta{ max-width:760px; width:100%; margin:24px auto 56px; padding:0 32px; }
.cf-cta__in{ background:linear-gradient(150deg,#13503c,#0a2c22); border-radius:20px; padding:44px 32px; text-align:center; color:var(--bone); }
.cf-ctah{ font-family:'Outfit'; font-size:clamp(22px,3vw,29px); font-weight:800; margin:0 0 10px; }
.cf-ctap{ font-size:16px; line-height:1.6; color:rgba(244,241,232,.88); max-width:520px; margin:0 auto 22px; }

.cf-foot{ background:#0a221a; color:rgba(244,241,232,.6); text-align:center; padding:26px; font-size:13px; margin-top:auto; }
.cf-foot b{ color:var(--gold); }

@media(max-width:760px){
  .cf-wrap{ padding:30px 22px 16px; }
  .cf-cgrid{ grid-template-columns:1fr; }
  .cf-critcard{ flex-direction:column; gap:8px; }
  .cf-nav__lks,.cf-nav__act{ display:none; }
  .cf-burger{ display:flex; }
}
`;
