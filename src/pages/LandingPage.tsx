import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Reveal } from '@/components/landing/Reveal';
import {
  tig,
  navLinks,
  hero,
  heroStats,
  carriers,
  pillars,
  tools,
  resources,
  training,
  about,
  joinCta,
} from '@/data/landingContent';

// ── Smart link: anchors smooth-scroll, http/mailto open out, "/" uses router ──
function SmartLink({
  href,
  className,
  children,
  onNavigate,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  if (href.startsWith('#')) {
    return (
      <a
        href={href}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
          onNavigate?.();
        }}
      >
        {children}
      </a>
    );
  }
  if (href.startsWith('http')) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  if (href.startsWith('mailto:')) {
    return (
      <a href={href} className={className}>
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

// ── Icons ─────────────────────────────────────────────────────────────────────
function Icon({ name }: { name: string }) {
  const p = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'shield': return (<svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>);
    case 'bolt': return (<svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>);
    case 'cap': return (<svg {...p}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" /></svg>);
    case 'pen': return (<svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>);
    case 'phone': return (<svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>);
    case 'badge': return (<svg {...p}><circle cx="12" cy="8" r="6" /><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" /></svg>);
    case 'check': return (<svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>);
    case 'chat': return (<svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>);
    case 'arrow': return (<svg {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>);
    default: return null;
  }
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="lp">
      <style>{CSS}</style>

      {/* ── Nav ── */}
      <header className={`lp-nav ${scrolled ? 'lp-nav--solid' : ''}`}>
        <div className="lp-nav__inner">
          <a href="#top" className="lp-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <span className="lp-brand__mark">T</span>
            <span className="lp-brand__name">{tig.short}</span>
          </a>
          <nav className="lp-nav__links">
            {navLinks.map((l) => (
              <SmartLink key={l.href} href={l.href} className="lp-nav__link">{l.label}</SmartLink>
            ))}
          </nav>
          <div className="lp-nav__actions">
            <SmartLink href={hero.secondaryCta.href} className="lp-btn lp-btn--ghost-dark">{hero.secondaryCta.label}</SmartLink>
            <SmartLink href={hero.primaryCta.href} className="lp-btn lp-btn--gold">Join TIG</SmartLink>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="lp-hero" id="top">
        <div className="lp-hero__glow" aria-hidden="true" />
        <div className="lp-container lp-hero__inner">
          <Reveal><div className="lp-eyebrow lp-eyebrow--gold">{hero.eyebrow}</div></Reveal>
          <Reveal delay={0.05}>
            <h1 className="lp-hero__title">
              {hero.titleLines.map((line, i) => (
                <span key={i} className="lp-hero__line">{line}</span>
              ))}
            </h1>
          </Reveal>
          <Reveal delay={0.12}><p className="lp-hero__sub">{hero.subhead}</p></Reveal>
          <Reveal delay={0.18}>
            <div className="lp-hero__ctas">
              <SmartLink href={hero.primaryCta.href} className="lp-btn lp-btn--gold lp-btn--lg">{hero.primaryCta.label}</SmartLink>
              <SmartLink href={hero.secondaryCta.href} className="lp-btn lp-btn--ghost-dark lp-btn--lg">{hero.secondaryCta.label}</SmartLink>
            </div>
          </Reveal>
          <Reveal delay={0.26}>
            <div className="lp-stats">
              {heroStats.map((s) => (
                <div key={s.label} className="lp-stat">
                  <div className="lp-stat__value">{s.value}</div>
                  <div className="lp-stat__label">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Carrier strip ── */}
      <section className="lp-strip">
        <div className="lp-container">
          <div className="lp-strip__label">Direct contracts with the carriers that matter</div>
          <div className="lp-strip__row">
            {carriers.map((c) => (
              <span key={c} className="lp-carrier">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why TIG ── */}
      <section className="lp-section" id="why">
        <div className="lp-container">
          <Reveal><div className="lp-eyebrow">Why TIG</div></Reveal>
          <Reveal delay={0.05}><h2 className="lp-h2">Built to help you write more, keep more, and grow faster.</h2></Reveal>
          <div className="lp-grid lp-grid--4">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={0.05 * i}>
                <div className="lp-card">
                  <div className="lp-card__icon"><Icon name={p.icon} /></div>
                  <h3 className="lp-card__title">{p.title}</h3>
                  <p className="lp-card__body">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools ── */}
      <section className="lp-section lp-section--cream" id="tools">
        <div className="lp-container">
          <Reveal><div className="lp-eyebrow">The tech stack</div></Reveal>
          <Reveal delay={0.05}><h2 className="lp-h2">Quote, enroll, and manage your book — all in one place.</h2></Reveal>
          <div className="lp-grid lp-grid--3">
            {tools.map((t, i) => (
              <Reveal key={t.name} delay={0.05 * i}>
                <SmartLink href={t.href} className="lp-tool">
                  <div className="lp-tool__head">
                    <span className="lp-tool__name">{t.name}</span>
                    <span className="lp-tool__arrow"><Icon name="arrow" /></span>
                  </div>
                  <p className="lp-card__body">{t.desc}</p>
                  <span className="lp-tool__launch">Launch ↗</span>
                </SmartLink>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Resources ── */}
      <section className="lp-section" id="resources">
        <div className="lp-container">
          <Reveal><div className="lp-eyebrow">Agent resources</div></Reveal>
          <Reveal delay={0.05}><h2 className="lp-h2">The high-value info our agents reach for most.</h2></Reveal>
          <div className="lp-grid lp-grid--4">
            {resources.map((r, i) => (
              <Reveal key={r.title} delay={0.05 * i}>
                <SmartLink href={r.href} className="lp-res">
                  <div className="lp-res__icon"><Icon name={r.icon} /></div>
                  <h3 className="lp-card__title">{r.title}</h3>
                  <p className="lp-card__body">{r.desc}</p>
                </SmartLink>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Training & Learning Center ── */}
      <section className="lp-section lp-section--cream" id="training">
        <div className="lp-container">
          <Reveal><div className="lp-eyebrow">Training & Learning Center</div></Reveal>
          <Reveal delay={0.05}><h2 className="lp-h2">Sharpen your skills. Stay ahead of the market.</h2></Reveal>
          <div className="lp-grid lp-grid--2">
            <Reveal>
              <div className="lp-list-card">
                <h3 className="lp-list-card__title">Training</h3>
                <ul className="lp-list">
                  {training.trainingItems.map((t) => (<li key={t}><span className="lp-tick">›</span>{t}</li>))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="lp-list-card">
                <h3 className="lp-list-card__title">Learning Center</h3>
                <ul className="lp-list">
                  {training.learningItems.map((t) => (<li key={t}><span className="lp-tick">›</span>{t}</li>))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="lp-section" id="about">
        <div className="lp-container lp-about">
          <div className="lp-about__left">
            <Reveal><div className="lp-eyebrow">About us</div></Reveal>
            <Reveal delay={0.05}><h2 className="lp-h2 lp-h2--tight">{about.heading}</h2></Reveal>
          </div>
          <div className="lp-about__right">
            {about.body.map((para, i) => (
              <Reveal key={i} delay={0.05 * i}><p className="lp-about__p">{para}</p></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Join CTA ── */}
      <section className="lp-join" id="join">
        <div className="lp-join__glow" aria-hidden="true" />
        <div className="lp-container lp-join__inner">
          <Reveal><h2 className="lp-join__title">{joinCta.heading}</h2></Reveal>
          <Reveal delay={0.06}><p className="lp-join__sub">{joinCta.subhead}</p></Reveal>
          <Reveal delay={0.12}>
            <SmartLink href={joinCta.primaryCta.href} className="lp-btn lp-btn--gold lp-btn--lg">{joinCta.primaryCta.label}</SmartLink>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <div className="lp-footer__brand">
            <span className="lp-brand__mark">T</span>
            <div>
              <div className="lp-footer__name">{tig.name}</div>
              <div className="lp-footer__tag">{tig.tagline}</div>
            </div>
          </div>
          <div className="lp-footer__links">
            {navLinks.map((l) => (<SmartLink key={l.href} href={l.href} className="lp-footer__link">{l.label}</SmartLink>))}
            <SmartLink href="/auth" className="lp-footer__link">Agent Login</SmartLink>
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

// ── Scoped styles ───────────────────────────────────────────────────────────
const CSS = `
.lp {
  --ink: #1b1a1f;
  --ink-2: #211f26;
  --gold: #C9A84C;
  --gold-deep: #8A6D20;
  --cream: #FAF8F3;
  --line: #ece8e0;
  --text: #2B2B22;
  --muted: #6f6a60;
  font-family: 'Outfit', system-ui, -apple-system, sans-serif;
  color: var(--text);
  background: #fff;
  -webkit-font-smoothing: antialiased;
}
.lp * { box-sizing: border-box; }
.lp section[id] { scroll-margin-top: 84px; }
.lp-container { max-width: 1180px; margin: 0 auto; padding: 0 32px; }

/* Buttons */
.lp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font-family: inherit; font-size: 14px; font-weight: 600; line-height: 1;
  padding: 11px 20px; border-radius: 10px; cursor: pointer; text-decoration: none;
  border: 1px solid transparent; transition: all 0.18s cubic-bezier(0.4,0,0.2,1); white-space: nowrap;
}
.lp-btn--lg { padding: 15px 28px; font-size: 15.5px; border-radius: 12px; }
.lp-btn--gold { background: linear-gradient(135deg, #d8b85a, var(--gold-deep)); color: #fff; box-shadow: 0 6px 20px rgba(138,109,32,0.28); }
.lp-btn--gold:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(138,109,32,0.36); }
.lp-btn--ghost-dark { background: rgba(255,255,255,0.06); color: #fff; border-color: rgba(255,255,255,0.22); }
.lp-btn--ghost-dark:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.4); }
.lp-nav--solid .lp-btn--ghost-dark { background: transparent; color: var(--text); border-color: var(--line); }
.lp-nav--solid .lp-btn--ghost-dark:hover { border-color: var(--gold); color: var(--gold-deep); }

/* Eyebrow + headings */
.lp-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); margin-bottom: 16px; }
.lp-eyebrow--gold { color: var(--gold); }
.lp-h2 { font-size: clamp(27px, 3.6vw, 42px); font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; max-width: 720px; margin: 0 0 44px; color: var(--text); }
.lp-h2--tight { margin-bottom: 0; }

/* Nav */
.lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; transition: background 0.25s, box-shadow 0.25s, border-color 0.25s; border-bottom: 1px solid transparent; }
.lp-nav--solid { background: rgba(255,255,255,0.86); backdrop-filter: saturate(140%) blur(12px); border-bottom-color: var(--line); box-shadow: 0 1px 20px rgba(0,0,0,0.04); }
.lp-nav__inner { max-width: 1180px; margin: 0 auto; padding: 14px 32px; display: flex; align-items: center; gap: 28px; }
.lp-brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
.lp-brand__mark { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, var(--gold), var(--gold-deep)); color: #fff; font-weight: 800; font-size: 15px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.lp-brand__name { font-weight: 700; font-size: 16px; letter-spacing: 0.14em; color: #fff; transition: color 0.25s; }
.lp-nav--solid .lp-brand__name { color: var(--text); }
.lp-nav__links { display: flex; gap: 26px; margin-left: 12px; flex: 1; }
.lp-nav__link { font-size: 14px; font-weight: 500; text-decoration: none; color: rgba(255,255,255,0.78); transition: color 0.18s; }
.lp-nav__link:hover { color: #fff; }
.lp-nav--solid .lp-nav__link { color: var(--muted); }
.lp-nav--solid .lp-nav__link:hover { color: var(--text); }
.lp-nav__actions { display: flex; align-items: center; gap: 10px; }

/* Hero */
.lp-hero { position: relative; background: linear-gradient(180deg, #211f26 0%, #1a191e 100%); color: #fff; overflow: hidden; padding: 168px 0 96px; }
.lp-hero__glow { position: absolute; top: -20%; left: 50%; transform: translateX(-50%); width: 1100px; height: 720px; background: radial-gradient(circle, rgba(201,168,76,0.20) 0%, transparent 60%); pointer-events: none; filter: blur(20px); }
.lp-hero__inner { position: relative; text-align: center; }
.lp-hero__title { font-size: clamp(40px, 7vw, 78px); font-weight: 800; letter-spacing: -0.035em; line-height: 1.02; margin: 0 auto 24px; max-width: 16ch; }
.lp-hero__line { display: block; }
.lp-hero__line:last-child { background: linear-gradient(120deg, #f0dd9e, var(--gold)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.lp-hero__sub { font-size: clamp(16px, 1.6vw, 19px); line-height: 1.6; color: rgba(255,255,255,0.74); max-width: 600px; margin: 0 auto 36px; }
.lp-hero__ctas { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
.lp-stats { display: flex; justify-content: center; gap: 56px; margin-top: 64px; flex-wrap: wrap; }
.lp-stat__value { font-size: 34px; font-weight: 800; letter-spacing: -0.02em; background: linear-gradient(120deg, #f0dd9e, var(--gold)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.lp-stat__label { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-top: 6px; }

/* Carrier strip */
.lp-strip { padding: 36px 0; border-bottom: 1px solid var(--line); background: #fff; }
.lp-strip__label { text-align: center; font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 22px; }
.lp-strip__row { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px 14px; }
.lp-carrier { font-size: 14px; font-weight: 600; color: #4a4640; padding: 9px 16px; border: 1px solid var(--line); border-radius: 30px; background: #fff; transition: all 0.18s; }
.lp-carrier:hover { border-color: var(--gold); color: var(--gold-deep); transform: translateY(-1px); }

/* Sections */
.lp-section { padding: 96px 0; }
.lp-section--cream { background: var(--cream); }

/* Grids */
.lp-grid { display: grid; gap: 20px; }
.lp-grid--4 { grid-template-columns: repeat(4, 1fr); }
.lp-grid--3 { grid-template-columns: repeat(3, 1fr); }
.lp-grid--2 { grid-template-columns: repeat(2, 1fr); }

/* Cards */
.lp-card { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 28px; height: 100%; transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s; }
.lp-card:hover { transform: translateY(-4px); box-shadow: 0 14px 34px rgba(0,0,0,0.07); }
.lp-card__icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; color: var(--gold-deep); background: rgba(201,168,76,0.12); margin-bottom: 18px; }
.lp-card__title { font-size: 17px; font-weight: 700; margin: 0 0 8px; color: var(--text); letter-spacing: -0.01em; }
.lp-card__body { font-size: 14.5px; line-height: 1.6; color: var(--muted); margin: 0; }

/* Tool cards */
.lp-tool { display: block; background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 26px; text-decoration: none; height: 100%; transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s; }
.lp-tool:hover { transform: translateY(-4px); box-shadow: 0 14px 34px rgba(0,0,0,0.07); border-color: var(--gold); }
.lp-tool__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.lp-tool__name { font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
.lp-tool__arrow { color: var(--muted); display: flex; transition: transform 0.22s, color 0.22s; }
.lp-tool:hover .lp-tool__arrow { color: var(--gold-deep); transform: translate(3px,-3px); }
.lp-tool__launch { display: inline-block; margin-top: 16px; font-size: 13px; font-weight: 600; color: var(--gold-deep); }

/* Resource cards */
.lp-res { display: block; background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 24px; text-decoration: none; height: 100%; transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s; }
.lp-res:hover { transform: translateY(-4px); box-shadow: 0 14px 34px rgba(0,0,0,0.07); border-color: var(--gold); }
.lp-res__icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--gold-deep); background: rgba(201,168,76,0.12); margin-bottom: 16px; }

/* List cards */
.lp-list-card { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 32px; height: 100%; }
.lp-list-card__title { font-size: 18px; font-weight: 700; margin: 0 0 18px; color: var(--text); }
.lp-list { list-style: none; margin: 0; padding: 0; }
.lp-list li { display: flex; gap: 12px; align-items: flex-start; padding: 11px 0; border-bottom: 1px solid var(--line); font-size: 15px; color: var(--text); }
.lp-list li:last-child { border-bottom: none; }
.lp-tick { color: var(--gold); font-weight: 800; }

/* About */
.lp-about { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start; }
.lp-about__p { font-size: 16.5px; line-height: 1.7; color: var(--muted); margin: 0 0 18px; }

/* Join CTA */
.lp-join { position: relative; background: linear-gradient(180deg, #211f26 0%, #1a191e 100%); color: #fff; overflow: hidden; padding: 96px 0; text-align: center; }
.lp-join__glow { position: absolute; bottom: -40%; left: 50%; transform: translateX(-50%); width: 900px; height: 600px; background: radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 60%); pointer-events: none; }
.lp-join__inner { position: relative; }
.lp-join__title { font-size: clamp(28px, 4vw, 46px); font-weight: 800; letter-spacing: -0.025em; margin: 0 0 16px; }
.lp-join__sub { font-size: 17px; color: rgba(255,255,255,0.74); max-width: 520px; margin: 0 auto 32px; line-height: 1.6; }

/* Footer */
.lp-footer { background: #15141a; color: #fff; }
.lp-footer__inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-top: 48px; padding-bottom: 32px; flex-wrap: wrap; }
.lp-footer__brand { display: flex; align-items: center; gap: 14px; }
.lp-footer__name { font-weight: 700; font-size: 16px; }
.lp-footer__tag { font-size: 12.5px; color: rgba(255,255,255,0.5); margin-top: 2px; }
.lp-footer__links { display: flex; gap: 22px; flex-wrap: wrap; }
.lp-footer__link { font-size: 14px; color: rgba(255,255,255,0.66); text-decoration: none; transition: color 0.18s; }
.lp-footer__link:hover { color: #fff; }
.lp-footer__base { border-top: 1px solid rgba(255,255,255,0.1); padding: 20px 32px; max-width: 1180px; margin: 0 auto; display: flex; justify-content: space-between; gap: 12px; font-size: 12.5px; color: rgba(255,255,255,0.42); flex-wrap: wrap; }

/* Responsive */
@media (max-width: 980px) {
  .lp-grid--4 { grid-template-columns: repeat(2, 1fr); }
  .lp-about { grid-template-columns: 1fr; gap: 24px; }
}
@media (max-width: 760px) {
  .lp-nav__links { display: none; }
  .lp-container { padding: 0 20px; }
  .lp-nav__inner { padding: 12px 20px; }
  .lp-hero { padding: 132px 0 72px; }
  .lp-section { padding: 64px 0; }
  .lp-grid--3 { grid-template-columns: 1fr; }
  .lp-grid--2 { grid-template-columns: 1fr; }
  .lp-stats { gap: 36px; margin-top: 44px; }
  .lp-footer__inner { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 460px) {
  .lp-grid--4 { grid-template-columns: 1fr; }
  .lp-nav__actions .lp-btn--ghost-dark { display: none; }
}
`;
