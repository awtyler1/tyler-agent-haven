import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  tig,
  navLinks,
  announcement,
  hero,
  trustItems,
  truths,
  valueItems,
  founderNote,
  founders,
  closingCta,
  type Founder,
} from '@/data/landingContent';

// ── Smart link: # smooth-scrolls, http/mailto open out, "/" uses router ──
function SmartLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (href.startsWith('#')) {
    return (
      <a
        href={href}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        {children}
      </a>
    );
  }
  if (href.startsWith('http') || href.startsWith('mailto:')) {
    const ext = href.startsWith('http');
    return (
      <a href={href} className={className} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    );
  }
  return (
    <RouterLink to={href} className={className}>
      {children}
    </RouterLink>
  );
}

// ── Hero founder photo with graceful initials fallback ──
function HeroPhoto({ founder }: { founder: Founder }) {
  const [errored, setErrored] = useState(false);
  if (errored || !founder.photo) {
    return (
      <div className="lp-hero__photo lp-hero__photo--ph" aria-hidden="true">
        <span>{founder.initials}</span>
      </div>
    );
  }
  return (
    <img
      className="lp-hero__photo"
      src={founder.photo}
      alt={founder.name}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
}

// Render text with |emphasis| spans in gold
function withEmphasis(text: string) {
  return text.split('|').map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="lp-gold">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll('.lp-reveal');
    let io: IntersectionObserver | undefined;
    if (reduce) {
      targets.forEach((el) => el.classList.add('is-in'));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('is-in');
              io?.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
      );
      targets.forEach((el) => io!.observe(el));
    }
    return () => {
      window.removeEventListener('scroll', onScroll);
      io?.disconnect();
    };
  }, []);

  return (
    <div className="lp">
      <style>{CSS}</style>

      {/* ── Sticky top: announcement bar + nav ── */}
      <div className="lp-stickytop">
        <SmartLink href={announcement.href} className="lp-ann">
          <span className="lp-ann__badge">{announcement.badge}</span>
          {announcement.text} <span className="lp-ann__g">{announcement.linkText}</span>
        </SmartLink>

        <header className={`lp-nav${scrolled ? ' lp-nav--scrolled' : ''}`}>
          <div className="lp-container lp-nav__inner">
            <a
              href="#top"
              className="lp-brand"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <img className="lp-brand__crest" src="/tyler-crest.png" alt="" aria-hidden="true" />
              <span className="lp-brand__name">{tig.name}</span>
            </a>
            <nav className="lp-nav__links">
              {navLinks.map((l) => (
                <SmartLink key={l.href} href={l.href} className="lp-nav__link">
                  {l.label}
                </SmartLink>
              ))}
            </nav>
            <div className="lp-nav__actions">
              <SmartLink href={hero.secondaryCta.href} className="lp-btn lp-btn--ghost">
                {hero.secondaryCta.label}
              </SmartLink>
              <SmartLink href={hero.primaryCta.href} className="lp-btn lp-btn--gold">
                Become an Agent
              </SmartLink>
            </div>
          </div>
        </header>
      </div>

      {/* ── Hero ── */}
      <section className="lp-hero" id="top">
        <div className="lp-hero__glow" aria-hidden="true" />

        {/* Founders flanking the headline (hidden on narrow screens) */}
        <div className="lp-hero__who lp-hero__who--l" aria-hidden="true">
          <HeroPhoto founder={founders[0]} />
          <div className="lp-hero__nm">{founders[0].name}</div>
          <div className="lp-hero__rl">{founders[0].title}</div>
        </div>
        <div className="lp-hero__who lp-hero__who--r" aria-hidden="true">
          <HeroPhoto founder={founders[1]} />
          <div className="lp-hero__nm">{founders[1].name}</div>
          <div className="lp-hero__rl">{founders[1].title}</div>
        </div>

        <div className="lp-container lp-hero__inner">
          <h1 className="lp-h1">
            {hero.titlePre}
            <span className="lp-h1__hi">{hero.titleHi}</span>
            {hero.titlePost}
          </h1>
          <p className="lp-hero__sub">{hero.sub}</p>
          <div className="lp-hero__ctas">
            <SmartLink href={hero.primaryCta.href} className="lp-btn lp-btn--gold lp-btn--lg">
              {hero.primaryCta.label} →
            </SmartLink>
          </div>
          <div className="lp-hero__micro">{hero.microcopy}</div>
          <div className="lp-hero__trust">
            {trustItems.map((t) => (
              <div className="lp-hero__trustit" key={t.strong}>
                <span aria-hidden="true">{t.icon}</span> <b>{t.strong}</b>, {t.rest}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The honest version ── */}
      <section className="lp-section lp-section--em lp-reveal" id="honest">
        <div className="lp-container">
          <div className="lp-kick lp-kick--gold">The honest version</div>
          <h2 className="lp-h2">No pitch. Here's the truth.</h2>
          <div className="lp-truths">
            {truths.map((t) => (
              <div className="lp-truth" key={t.claim}>
                <div className="lp-truth__claim">{t.claim}</div>
                <div className="lp-truth__clar">{t.clarifier}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── A word from the team (founders) ── */}
      <section className="lp-section lp-section--em lp-reveal" id="founders">
        <div className="lp-container">
          <div className="lp-kick lp-kick--gold">A word from the team</div>
          <div className="lp-note">
            {founderNote.lines.map((line, i) => (
              <p className="lp-note__line" key={i}>
                {withEmphasis(line)}
              </p>
            ))}
            <div className="lp-note__sign">{founderNote.sign}</div>
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section className="lp-section lp-reveal" id="get">
        <div className="lp-container">
          <div className="lp-kick">What you actually get</div>
          <h2 className="lp-h2">Everything we use. Handed to you.</h2>
          <div className="lp-get">
            {valueItems.map((v) => (
              <div className="lp-get__item" key={v.title}>
                <span className="lp-get__ck">✓</span>
                <div>
                  <b>{v.title}</b>
                  <span>{v.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="lp-cta lp-reveal">
        <div className="lp-cta__glow" aria-hidden="true" />
        <div className="lp-container lp-cta__inner">
          <h2 className="lp-cta__title">{closingCta.heading}</h2>
          <p className="lp-cta__sub">{closingCta.sub}</p>
          <SmartLink href={closingCta.primaryCta.href} className="lp-btn lp-btn--gold lp-btn--lg">
            {closingCta.primaryCta.label}
          </SmartLink>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <div className="lp-footer__brand">
            <img className="lp-footer__logo" src="/tyler-logo-light.png" alt="Tyler Insurance Group" />
            <div className="lp-footer__tag">{tig.tagline}</div>
          </div>
          <div className="lp-footer__links">
            {navLinks.map((l) => (
              <SmartLink key={l.href} href={l.href} className="lp-footer__link">
                {l.label}
              </SmartLink>
            ))}
            <SmartLink href="/auth" className="lp-footer__link">
              Agent Login
            </SmartLink>
          </div>
        </div>
        <div className="lp-footer__base">
          <span>© {new Date().getFullYear()} {tig.name}</span>
          <span>Powered by Tyler Insurance Group</span>
        </div>
      </footer>
    </div>
  );
}

// ── Scoped styles (emerald + gold) ──
const CSS = `
.lp{
  --em:#0E3B2E; --em2:#0a2c22; --bone:#F4F1E8; --soft:#EAE4D6; --line:#dfd8c8;
  --muted:#5f6b62; --ink:#16201b; --gold:#C9A84C; --gold2:#A8801F;
  font-family:'Outfit','Inter',system-ui,-apple-system,sans-serif;
  color:var(--ink); background:var(--bone); -webkit-font-smoothing:antialiased;
}
.lp *{ box-sizing:border-box; }
.lp section[id]{ scroll-margin-top:116px; }
.lp-container{ max-width:1120px; margin:0 auto; padding:0 32px; }
.lp-gold{ color:var(--gold2); }

/* Buttons */
.lp-btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px;
  font-weight:600; font-size:14px; padding:11px 20px; border-radius:9px;
  border:1px solid transparent; cursor:pointer; text-decoration:none; transition:all .18s cubic-bezier(.4,0,.2,1); white-space:nowrap; }
.lp-btn--lg{ padding:15px 26px; font-size:15.5px; border-radius:11px; }
.lp-btn--gold{ background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); }
.lp-btn--gold:hover{ transform:translateY(-2px); box-shadow:0 10px 26px rgba(168,128,31,.32); }
.lp-btn--ghost{ background:transparent; color:#fff; border-color:rgba(255,255,255,.28); }
.lp-btn--ghost:hover{ border-color:#fff; }

/* Sticky top (announcement + nav stay pinned on scroll) */
.lp-stickytop{ position:sticky; top:0; z-index:60; }

/* Announcement bar */
.lp-ann{ display:block; text-align:center; text-decoration:none; background:var(--em2);
  color:#fff; font-size:14px; font-weight:600; padding:11px 16px; border-bottom:1px solid rgba(255,255,255,.08); }
.lp-ann__badge{ background:var(--gold); color:var(--em); font-size:11px; font-weight:800; letter-spacing:.04em;
  padding:3px 9px; border-radius:20px; margin-right:10px; vertical-align:middle; }
.lp-ann__g{ color:var(--gold); }
.lp-ann:hover .lp-ann__g{ text-decoration:underline; }

/* Nav */
.lp-nav{ background:rgba(14,59,46,.92);
  backdrop-filter:saturate(140%) blur(10px); border-bottom:1px solid rgba(255,255,255,.1);
  transition:background .25s ease, box-shadow .25s ease; }
.lp-nav--scrolled{ background:rgba(10,44,34,.97); box-shadow:0 6px 24px rgba(0,0,0,.22); }
.lp-nav__inner{ display:flex; align-items:center; gap:26px; height:66px; }
.lp-brand{ display:inline-flex; align-items:center; gap:11px; text-decoration:none; }
.lp-brand__mark{ width:30px; height:30px; border-radius:8px; background:linear-gradient(135deg,#e7cf86,var(--gold2));
  color:var(--em); font-weight:800; font-size:15px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }
.lp-brand__crest{ height:30px; width:auto; display:block; }
.lp-brand__name{ font-weight:700; font-size:15px; letter-spacing:.01em; color:#fff; white-space:nowrap; }
.lp-nav__links{ display:flex; gap:24px; margin-left:10px; flex:1; }
.lp-nav__link{ font-size:14px; font-weight:500; text-decoration:none; color:rgba(244,241,232,.74); transition:color .18s; }
.lp-nav__link:hover{ color:#fff; }
.lp-nav__actions{ display:flex; align-items:center; gap:10px; }

/* Hero (light) */
.lp-hero{ position:relative; overflow:hidden; background:linear-gradient(180deg,#f6f3ec,#eceae3); color:var(--ink);
  padding:74px 0 96px; text-align:center; min-height:560px; }
.lp-hero__glow{ position:absolute; top:-160px; left:50%; transform:translateX(-50%); width:1000px; height:560px;
  background:radial-gradient(circle,rgba(201,168,76,.10),transparent 62%); pointer-events:none;
  animation:lpDrift 9s ease-in-out infinite; }
@keyframes lpDrift{ 0%,100%{ transform:translateX(-50%) translateY(0); } 50%{ transform:translateX(-50%) translateY(22px); } }
.lp-hero__inner{ position:relative; animation:lpRise .7s cubic-bezier(.4,0,.2,1) both; }
@keyframes lpRise{ from{ opacity:0; transform:translateY(14px); } to{ opacity:1; transform:none; } }
.lp-eyebrow{ font-size:12.5px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--gold); margin-bottom:22px; }
.lp-h1{ text-transform:uppercase; font-size:clamp(38px,6.2vw,74px); font-weight:900; letter-spacing:-.04em; line-height:1.0; margin:0 auto 22px; max-width:18ch; color:var(--ink); }
.lp-h1__hi{ color:var(--em); }
.lp-hero__sub{ font-size:clamp(16px,1.7vw,20px); line-height:1.55; color:#46524b; max-width:40ch; margin:0 auto 28px; font-weight:500; }
.lp-hero__ctas{ display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
.lp-hero__micro{ font-size:13px; color:var(--muted); margin-top:14px; }
.lp-hero__trust{ display:flex; gap:28px; justify-content:center; flex-wrap:wrap; margin-top:38px; }
.lp-hero__trustit{ font-size:13.5px; color:var(--muted); }
.lp-hero__trustit b{ color:var(--ink); font-weight:700; }

/* Flanking founder photos */
.lp-hero__who{ position:absolute; bottom:52px; z-index:2; text-align:center; }
.lp-hero__who--l{ left:48px; }
.lp-hero__who--r{ right:48px; }
.lp-hero__photo{ width:186px; height:238px; object-fit:cover; object-position:center 16%; border-radius:18px;
  border:3px solid #fff; box-shadow:0 18px 44px rgba(20,30,24,.22); background:var(--em2); display:block; }
.lp-hero__photo--ph{ display:flex; align-items:center; justify-content:center; background:linear-gradient(160deg,#13503c,#0a2c22); }
.lp-hero__photo--ph span{ font-family:'Outfit',sans-serif; font-weight:800; font-size:42px; color:var(--gold); }
.lp-hero__nm{ margin-top:12px; font-size:13px; font-weight:700; color:var(--ink); }
.lp-hero__rl{ font-size:11px; color:var(--muted); }
@media(max-width:1180px){ .lp-hero__who{ display:none; } }

/* Sections */
.lp-section{ padding:88px 0; }
.lp-section--em{ background:var(--em); color:var(--bone); }

/* Scroll reveal */
.lp-reveal{ opacity:0; transform:translateY(24px); transition:opacity .7s cubic-bezier(.4,0,.2,1), transform .7s cubic-bezier(.4,0,.2,1); }
.lp-reveal.is-in{ opacity:1; transform:none; }
@media (prefers-reduced-motion: reduce){
  .lp-reveal{ opacity:1; transform:none; transition:none; }
  .lp-hero__glow{ animation:none; }
  .lp-hero__inner{ animation:none; }
}
.lp-kick{ font-size:12px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--gold2); margin-bottom:14px; }
.lp-kick--gold{ color:var(--gold); }
.lp-h2{ font-family:'Outfit',sans-serif; font-size:clamp(28px,3.8vw,46px); font-weight:700; letter-spacing:-.03em; line-height:1.04; margin:0 0 42px; }
.lp-h2--light{ color:#fff; }

/* Truths */
.lp-truths{ border-top:2px solid var(--em); }
.lp-truth{ display:grid; grid-template-columns:1fr 1.1fr; gap:30px; align-items:baseline; padding:26px 0; border-bottom:1px solid var(--line); }
.lp-truth__claim{ font-family:'Outfit',sans-serif; font-size:clamp(20px,2.2vw,27px); font-weight:700; letter-spacing:-.015em; }
.lp-truth__clar{ font-size:15.5px; color:var(--muted); line-height:1.6; }
/* Truths on the dark (emerald) section */
.lp-section--em .lp-h2{ color:#fff; }
.lp-section--em .lp-truths{ border-top-color:rgba(244,241,232,.28); }
.lp-section--em .lp-truth{ border-bottom-color:rgba(244,241,232,.14); }
.lp-section--em .lp-truth__claim{ color:#fff; }
.lp-section--em .lp-truth__clar{ color:rgba(244,241,232,.72); }

/* What you get (light) */
.lp-get{ display:grid; grid-template-columns:repeat(2,1fr); gap:0; border-top:1px solid var(--line); }
.lp-get__item{ display:flex; gap:14px; padding:20px 4px; border-bottom:1px solid var(--line); align-items:flex-start; }
.lp-get__ck{ color:var(--gold2); font-weight:700; font-size:18px; line-height:1.3; }
.lp-get__item b{ font-family:'Outfit',sans-serif; font-weight:600; font-size:16.5px; display:block; margin-bottom:3px; color:var(--ink); }
.lp-get__item span{ font-size:14px; color:var(--muted); line-height:1.55; }

/* Founder note */
.lp-note{ max-width:760px; }
.lp-note__line{ font-family:'Outfit',sans-serif; font-size:clamp(20px,2.4vw,30px); font-weight:500; line-height:1.4; letter-spacing:-.01em; margin:0 0 16px; }
.lp-note__sign{ font-size:14px; color:var(--muted); margin-top:6px; }
/* note + emphasis on the dark "word from the team" section */
.lp-section--em .lp-note__line{ color:var(--bone); }
.lp-section--em .lp-note__sign{ color:rgba(244,241,232,.6); }
.lp-section--em .lp-gold{ color:var(--gold); }

/* Founders */
.lp-founders{ display:grid; grid-template-columns:1fr 1fr; gap:22px; margin-top:48px; }
.lp-founder{ display:flex; gap:20px; align-items:center; background:#fff; border:1px solid var(--line); border-radius:18px; padding:22px; }
.lp-founder__photo{ width:120px; height:120px; border-radius:14px; object-fit:cover; object-position:center 18%; flex-shrink:0; background:var(--soft); }
.lp-founder__photo--ph{ display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,var(--em),var(--em2)); }
.lp-founder__photo--ph span{ font-family:'Outfit',sans-serif; font-weight:700; font-size:34px; color:var(--gold); }
.lp-founder__name{ font-family:'Outfit',sans-serif; font-size:21px; font-weight:600; margin:0; color:var(--ink); }
.lp-founder__cred{ font-weight:500; color:var(--muted); font-size:15px; }
.lp-founder__title{ font-size:13px; color:var(--gold2); font-weight:600; margin:3px 0 10px; }
.lp-founder__blurb{ font-size:14px; color:var(--muted); line-height:1.6; margin:0; }

/* Closing CTA */
.lp-cta{ position:relative; overflow:hidden; background:linear-gradient(180deg,var(--em),var(--em2)); color:var(--bone); padding:90px 0; text-align:center; }
.lp-cta__glow{ position:absolute; bottom:-40%; left:50%; transform:translateX(-50%); width:900px; height:560px; background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); }
.lp-cta__inner{ position:relative; }
.lp-cta__title{ font-family:'Outfit',sans-serif; font-size:clamp(28px,4vw,46px); font-weight:800; letter-spacing:-.03em; margin:0 0 16px; max-width:20ch; margin-left:auto; margin-right:auto; }
.lp-cta__sub{ font-size:17px; color:rgba(244,241,232,.78); max-width:54ch; margin:0 auto 30px; line-height:1.6; }

/* Footer */
.lp-footer{ background:#0a221a; color:var(--bone); }
.lp-footer__inner{ display:flex; align-items:center; justify-content:space-between; gap:24px; padding-top:44px; padding-bottom:30px; flex-wrap:wrap; }
.lp-footer__brand{ display:flex; flex-direction:column; align-items:flex-start; gap:10px; }
.lp-footer__logo{ height:54px; width:auto; display:block; }
.lp-footer__name{ font-weight:700; font-size:16px; }
.lp-footer__tag{ font-size:12.5px; color:rgba(244,241,232,.5); margin-top:2px; }
.lp-footer__links{ display:flex; gap:22px; flex-wrap:wrap; }
.lp-footer__link{ font-size:14px; color:rgba(244,241,232,.66); text-decoration:none; transition:color .18s; }
.lp-footer__link:hover{ color:#fff; }
.lp-footer__base{ border-top:1px solid rgba(255,255,255,.1); padding:20px 32px; max-width:1120px; margin:0 auto;
  display:flex; justify-content:space-between; gap:12px; font-size:12.5px; color:rgba(244,241,232,.42); flex-wrap:wrap; }

/* Responsive */
@media(max-width:820px){
  .lp-nav__links{ display:none; }
  .lp-container{ padding:0 20px; }
  .lp-truth{ grid-template-columns:1fr; gap:8px; }
  .lp-get{ grid-template-columns:1fr; }
  .lp-founders{ grid-template-columns:1fr; }
  .lp-section{ padding:60px 0; }
  .lp-footer__inner{ flex-direction:column; align-items:flex-start; }
}
@media(max-width:460px){
  .lp-nav__actions .lp-btn--ghost{ display:none; }
  .lp-founder{ flex-direction:column; text-align:center; }
}
`;
