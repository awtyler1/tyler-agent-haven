import { useState, useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { tig } from '@/data/landingContent';
import {
  insights,
  INSIGHT_CATEGORIES,
  categoryMeta,
  type InsightPost,
  type InsightCategory,
  type InsightAuthor,
  type CoverMotif,
} from '@/data/insights';

// Where a card points: members → login, everything else → the reader.
function postHref(p: InsightPost): string {
  return p.members ? '/auth' : `/insights/${p.slug}`;
}

function fmtDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

// On-brand animated SVG cover, one unique motif per article (no stock imagery).
function InsightCover({ cover, variant = 'card' }: { cover: CoverMotif; variant?: 'card' | 'feat' }) {
  return (
    <div className={`ins-cover ins-cover--${variant}`} data-cover={cover} aria-hidden="true">
      <span className="ins-cover__glow" />
      <svg className="ins-cover__svg" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
        {cover === 'rings' && (
          <g className="ins-art">
            <circle className="r r1" cx="200" cy="110" r="42" />
            <circle className="r r2" cx="200" cy="110" r="64" />
            <circle className="r r3" cx="200" cy="110" r="86" />
            <path className="plus" d="M200 84 v52 M174 110 h52" />
          </g>
        )}
        {cover === 'chart' && (
          <g className="ins-art">
            <path className="axis" d="M40 156 H360" />
            <polyline className="line" points="40,150 110,122 180,132 250,90 330,56" />
            <circle className="enddot" cx="330" cy="56" r="6" />
          </g>
        )}
        {cover === 'bars' && (
          <g className="ins-art ins-art--bars">
            <rect className="bar b1" x="118" y="70" width="34" height="92" rx="4" />
            <rect className="bar b2" x="183" y="70" width="34" height="92" rx="4" />
            <rect className="bar b3" x="248" y="70" width="34" height="92" rx="4" />
            <path className="trend" d="M135 96 L200 50 L300 64" />
          </g>
        )}
        {cover === 'lock' && (
          <g className="ins-art ins-art--lock">
            <rect className="lockbody" x="158" y="104" width="84" height="62" rx="11" />
            <path className="shackle" d="M174 104 v-12 a26 26 0 0 1 52 0 v12" />
            <circle className="keyhole" cx="200" cy="130" r="7" />
            <rect className="keyhole" x="197" y="130" width="6" height="18" rx="3" />
          </g>
        )}
        {cover === 'coins' && (
          <g className="ins-art ins-art--coins">
            <ellipse className="coin c1" cx="200" cy="152" rx="48" ry="15" />
            <ellipse className="coin c2" cx="200" cy="128" rx="48" ry="15" />
            <ellipse className="coin c3" cx="200" cy="104" rx="48" ry="15" />
            <path className="coinup" d="M200 92 v-26 M188 78 l12 -12 l12 12" />
          </g>
        )}
        {cover === 'shield' && (
          <g className="ins-art ins-art--shield">
            <path className="shieldbody" d="M200 50 L252 72 V118 C252 160 200 182 200 182 C200 182 148 160 148 118 V72 Z" />
            <path className="shieldcheck" d="M178 114 l16 16 l30 -34" />
          </g>
        )}
        {cover === 'steps' && (
          <g className="ins-art ins-art--steps">
            <rect className="step st1" x="60" y="150" width="58" height="22" rx="3" />
            <rect className="step st2" x="118" y="124" width="58" height="48" rx="3" />
            <rect className="step st3" x="176" y="98" width="58" height="74" rx="3" />
            <rect className="step st4" x="234" y="72" width="58" height="100" rx="3" />
            <path className="climb" d="M76 150 L146 124 L210 98 L276 72" />
            <circle className="climber" cx="276" cy="72" r="7" />
          </g>
        )}
        {cover === 'deal' && (
          <g className="ins-art ins-art--deal">
            <line className="spoke s1" x1="200" y1="110" x2="110" y2="58" />
            <line className="spoke s2" x1="200" y1="110" x2="300" y2="58" />
            <line className="spoke s3" x1="200" y1="110" x2="110" y2="162" />
            <line className="spoke s4" x1="200" y1="110" x2="300" y2="162" />
            <circle className="node n1" cx="110" cy="58" r="10" />
            <circle className="node n2" cx="300" cy="58" r="10" />
            <circle className="node n3" cx="110" cy="162" r="10" />
            <circle className="node n4" cx="300" cy="162" r="10" />
            <circle className="hub" cx="200" cy="110" r="22" />
          </g>
        )}
        {cover === 'deed' && (
          <g className="ins-art ins-art--deed">
            <rect className="deedpage" x="150" y="52" width="100" height="120" rx="7" />
            <path className="deedline" d="M168 82 h64 M168 102 h64 M168 122 h40" />
            <circle className="deedseal" cx="216" cy="150" r="15" />
            <path className="deedribbon" d="M210 163 l-6 20 l12 -8 l12 8 l-6 -20" />
          </g>
        )}
        {cover === 'flow' && (
          <g className="ins-art ins-art--flow">
            <rect className="flownode fn1" x="54" y="92" width="52" height="40" rx="6" />
            <circle className="flownode fn2" cx="330" cy="112" r="24" />
            <circle className="flownode fn3" cx="200" cy="54" r="17" />
            <path className="flowline fl1" d="M106 112 H302" />
            <path className="flowline fl2" d="M200 92 V71" />
            <path className="flowarrow" d="M292 103 l13 9 l-13 9" />
          </g>
        )}
        {cover === 'map' && (
          <g className="ins-art ins-art--map">
            <path className="mapland" d="M92 82 H286 a12 12 0 0 1 12 12 v34 a12 12 0 0 1 -12 12 H156 l-20 18 v-18 H92 a12 12 0 0 1 -12 -12 V94 a12 12 0 0 1 12 -12 Z" />
            <path className="mappin" d="M200 92 a20 20 0 0 1 20 20 c0 15 -20 32 -20 32 c0 0 -20 -17 -20 -32 a20 20 0 0 1 20 -20 Z" />
            <circle className="mappindot" cx="200" cy="112" r="7" />
          </g>
        )}
      </svg>
    </div>
  );
}

function Avatar({ author }: { author: InsightAuthor }) {
  const [err, setErr] = useState(false);
  if (err || !author.photo) return <span className="ins-av">{author.initials}</span>;
  return (
    <img
      className="ins-av ins-av--img"
      src={author.photo}
      alt={author.name}
      loading="lazy"
      onError={() => setErr(true)}
    />
  );
}

export default function InsightsPage() {
  const [active, setActive] = useState<InsightCategory | 'all'>('all');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = 'Insights | Tyler Insurance Group';
  }, []);

  const featured = useMemo(() => insights.find((p) => p.featured), []);
  const rest = useMemo(() => insights.filter((p) => p !== featured), [featured]);
  const visible = useMemo(
    () => (active === 'all' ? rest : rest.filter((p) => p.category === active)),
    [active, rest],
  );

  return (
    <div className="ins">
      <style>{CSS}</style>

      {/* ── Nav ── */}
      <header className="ins-nav">
        <div className="ins-nav__in">
          <RouterLink to="/" className="ins-brand">
            <img className="ins-crest" src="/tyler-crest.png" alt="" aria-hidden="true" /> {tig.name}
          </RouterLink>
          <nav className="ins-nav__lks">
            <RouterLink to="/#honest" className="ins-nav__lk">Why TIG</RouterLink>
            <RouterLink to="/book-value" className="ins-nav__lk">Book Value</RouterLink>
            <RouterLink to="/insights" className="ins-nav__lk">Insights</RouterLink>
            <RouterLink to="/#get" className="ins-nav__lk">What you get</RouterLink>
          </nav>
          <div className="ins-nav__act">
            <RouterLink to="/auth" className="ins-btn ins-btn--ghost">Agent Login</RouterLink>
            <RouterLink to="/join" className="ins-btn ins-btn--gold">I'm Ready to Grow</RouterLink>
          </div>
          <button
            className={`ins-burger${menuOpen ? ' is-open' : ''}`}
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
        {menuOpen && (
          <div className="ins-mmenu" onClick={() => setMenuOpen(false)}>
            <RouterLink to="/#honest" className="ins-mmenu__lk">Why TIG</RouterLink>
            <RouterLink to="/book-value" className="ins-mmenu__lk">Book Value</RouterLink>
            <RouterLink to="/insights" className="ins-mmenu__lk">Insights</RouterLink>
            <RouterLink to="/#get" className="ins-mmenu__lk">What you get</RouterLink>
            <RouterLink to="/auth" className="ins-mmenu__lk">Agent Login</RouterLink>
            <RouterLink to="/join" className="ins-btn ins-btn--gold ins-mmenu__cta">I'm Ready to Grow</RouterLink>
          </div>
        )}
      </header>

      {/* ── Header band ── */}
      <div className="ins-head">
        <div className="ins-head__in">
          <div className="ins-eyebrow">TIG Insights</div>
          <h1>Straight talk on Medicare, the business, and where it's headed.</h1>
          <p>
            Field notes from agents who still sell. What's changing in the market, what we're
            building at TIG, and the plays that actually grow a book.
          </p>
        </div>
      </div>

      <div className="ins-wrap">
        {/* ── Featured ── */}
        {featured && (
          <RouterLink className="ins-feat" to={postHref(featured)}>
            <div className="ins-feat__img">
              <InsightCover cover={featured.cover} variant="feat" />
              <span className="ins-pill">★ Featured</span>
            </div>
            <div className="ins-feat__body">
              <div className="ins-kick">{categoryMeta(featured.category).label}</div>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <div className="ins-meta">
                <Avatar author={featured.author} /> {featured.author.name}
                <span className="ins-dot" /> {featured.readTime}
                <span className="ins-dot" /> {fmtDate(featured.date)}
              </div>
            </div>
          </RouterLink>
        )}

        {/* ── Filters ── */}
        <div className="ins-filters">
          <button
            className={`ins-chip${active === 'all' ? ' is-on' : ''}`}
            onClick={() => setActive('all')}
          >
            All
          </button>
          {INSIGHT_CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={`ins-chip${active === c.key ? ' is-on' : ''}`}
              onClick={() => setActive(c.key)}
            >
              {c.filter}
              {c.key === 'playbook' ? ' 🔒' : ''}
            </button>
          ))}
        </div>

        {/* ── Grid ── */}
        {visible.length > 0 ? (
          <div className="ins-grid">
            {visible.map((p) => (
              <RouterLink className="ins-card" to={postHref(p)} key={p.slug}>
                <div className={`ins-card__img${p.members ? ' is-locked' : ''}`}>
                  <InsightCover cover={p.cover} />
                  <span className="ins-pill">{categoryMeta(p.category).label}</span>
                  {p.members && <span className="ins-lock">Members</span>}
                </div>
                <div className="ins-card__b">
                  <div className="ins-kick">{categoryMeta(p.category).label}</div>
                  <h3>{p.title}</h3>
                  <p>{p.excerpt}</p>
                  <div className="ins-card__meta">
                    {p.members ? (
                      <span className="ins-card__lockmeta">🔒 Unlock with your agent login</span>
                    ) : (
                      <>
                        <Avatar author={p.author} /> {p.author.name}
                        <span className="ins-dot" /> {p.readTime}
                      </>
                    )}
                  </div>
                </div>
              </RouterLink>
            ))}
          </div>
        ) : (
          <div className="ins-empty">More in this category soon. Check back shortly.</div>
        )}

        {/* ── Newsletter ── */}
        <Newsletter />
      </div>

      <div className="ins-foot">
        Powered by <b>Tyler Insurance Group</b> · {tig.tagline}
      </div>
    </div>
  );
}

function Newsletter() {
  const [done, setDone] = useState(false);
  return (
    <div className="ins-news">
      <div>
        <h3>Get the next one in your inbox.</h3>
        <p>
          One useful email when we publish. Medicare shifts, market reads, and what we're learning.
          No spam, no overrides pitch.
        </p>
      </div>
      {done ? (
        <div className="ins-news__done">✓ You're on the list. Talk soon.</div>
      ) : (
        <form
          className="ins-news__form"
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
        >
          <input type="email" required placeholder="you@email.com" aria-label="Email address" />
          <button className="ins-btn ins-btn--gold" type="submit">
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}

const CSS = `
.ins{
  --em:#0E3B2E; --em2:#0a2c22; --bone:#F4F1E8; --line:#e1d9c8; --muted:#5f6b62; --ink:#16201b; --gold:#C9A84C; --gold2:#A8801F;
  font-family:'Inter',system-ui,sans-serif; background:var(--bone); color:var(--ink); -webkit-font-smoothing:antialiased; min-height:100vh;
}
.ins *{ box-sizing:border-box; }
.ins a{ text-decoration:none; }
.ins-feat, .ins-card{ color:var(--ink); }
.ins h1,.ins h2,.ins h3{ font-family:'Outfit','Inter',sans-serif; }

.ins-nav{ background:rgba(14,59,46,.96); position:sticky; top:0; z-index:50; }
.ins-nav__in{ max-width:1140px; margin:0 auto; padding:0 32px; height:66px; display:flex; align-items:center; gap:26px; }
.ins-brand{ display:flex; align-items:center; gap:10px; color:#fff; font-weight:700; font-size:15px; }
.ins-crest{ height:30px; width:auto; display:block; }
.ins-nav__lks{ display:flex; gap:24px; flex:1; margin-left:8px; }
.ins-nav__lk{ color:rgba(244,241,232,.74); font-size:14px; font-weight:500; transition:color .18s; }
.ins-nav__lk:hover{ color:#fff; }
.ins-nav__act{ display:flex; align-items:center; gap:10px; }
.ins-burger{ display:none; flex-direction:column; justify-content:center; gap:5px; width:44px; height:44px; margin-left:auto; background:none; border:none; cursor:pointer; padding:0; }
.ins-burger span{ display:block; width:22px; height:2px; background:#fff; border-radius:2px; transition:transform .25s ease, opacity .2s ease; }
.ins-burger.is-open span:nth-child(1){ transform:translateY(7px) rotate(45deg); }
.ins-burger.is-open span:nth-child(2){ opacity:0; }
.ins-burger.is-open span:nth-child(3){ transform:translateY(-7px) rotate(-45deg); }
.ins-mmenu{ display:flex; flex-direction:column; background:rgba(8,37,28,.99); border-bottom:1px solid rgba(255,255,255,.1); padding:8px 22px 22px; }
.ins-mmenu__lk{ color:rgba(244,241,232,.92); font-size:16px; font-weight:600; padding:15px 4px; border-bottom:1px solid rgba(255,255,255,.08); }
.ins-mmenu__cta{ margin-top:16px; justify-content:center; font-size:16px; padding:14px; }
.ins-btn{ font-size:13.5px; font-weight:700; padding:9px 15px; border-radius:9px; border:none; cursor:pointer; font-family:inherit; }
.ins-btn--ghost{ color:rgba(244,241,232,.85); font-weight:600; border:1px solid rgba(244,241,232,.25); background:transparent; padding:8px 14px; }
.ins-btn--gold{ background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); }

.ins-head{ background:linear-gradient(168deg,var(--em),var(--em2)); color:var(--bone); position:relative; overflow:hidden; padding:64px 0 90px; }
.ins-head:before{ content:""; position:absolute; top:-160px; left:62%; width:760px; height:520px; background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); }
.ins-head__in{ max-width:1140px; margin:0 auto; padding:0 32px; position:relative; }
.ins-eyebrow{ font-size:12px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:var(--gold); }
.ins-head h1{ font-size:clamp(34px,5vw,52px); font-weight:800; letter-spacing:-.03em; line-height:1.04; margin:14px 0 0; max-width:16ch; }
.ins-head p{ font-size:16.5px; color:rgba(244,241,232,.8); line-height:1.6; margin-top:14px; max-width:54ch; }

.ins-wrap{ max-width:1140px; margin:-58px auto 0; padding:0 32px 80px; position:relative; z-index:2; }

.ins-pill{ display:inline-flex; align-items:center; gap:6px; background:rgba(10,44,34,.55); color:var(--gold); border:1px solid rgba(201,168,76,.55); font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:5px 11px; border-radius:30px; position:relative; z-index:2; backdrop-filter:blur(3px); }
.ins-kick{ font-size:11.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--gold2); }
.ins-av{ width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); font-family:'Outfit'; font-weight:800; font-size:12px; display:inline-flex; align-items:center; justify-content:center; }
.ins-av--img{ display:inline-block; object-fit:cover; object-position:center 16%; background:#10362a; vertical-align:middle; }
.ins-dot{ width:3px; height:3px; border-radius:50%; background:var(--line); display:inline-block; }

.ins-feat{ display:grid; grid-template-columns:1.25fr 1fr; background:#fff; border:1px solid var(--line); border-radius:20px; overflow:hidden; box-shadow:0 24px 60px rgba(20,30,24,.1); transition:box-shadow .2s; }
.ins-feat:hover{ box-shadow:0 30px 70px rgba(20,30,24,.16); }
.ins-feat__img{ position:relative; min-height:340px; display:flex; align-items:flex-end; padding:26px; background:#0a2c22; overflow:hidden; }
.ins-feat__body{ padding:34px; }
.ins-feat__body h2{ font-size:27px; font-weight:700; letter-spacing:-.02em; line-height:1.14; margin:10px 0 12px; }
.ins-feat__body p{ font-size:14.5px; color:var(--muted); line-height:1.65; }
.ins-meta{ display:flex; align-items:center; gap:10px; margin-top:18px; font-size:12.5px; color:var(--muted); }

.ins-filters{ display:flex; gap:9px; flex-wrap:wrap; margin:46px 0 22px; }
.ins-chip{ font-size:13px; font-weight:600; padding:8px 15px; border-radius:30px; border:1px solid var(--line); background:#fff; color:var(--muted); cursor:pointer; font-family:inherit; transition:.15s; }
.ins-chip:hover{ border-color:var(--gold2); color:var(--ink); }
.ins-chip.is-on{ background:var(--em); color:var(--bone); border-color:var(--em); }

.ins-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
.ins-card{ background:#fff; border:1px solid var(--line); border-radius:16px; overflow:hidden; display:flex; flex-direction:column; transition:transform .18s,box-shadow .18s; }
.ins-card:hover{ transform:translateY(-4px); box-shadow:0 18px 40px rgba(20,30,24,.1); }
.ins-card__img{ height:158px; position:relative; background:#0a2c22; overflow:hidden; }
.ins-card__img .ins-pill{ position:absolute; left:14px; top:14px; }
.ins-card__img.is-locked .ins-cover{ filter:saturate(.7) brightness(.88); }

/* Animated topic covers */
.ins-cover{ position:absolute; inset:0; overflow:hidden; background:linear-gradient(150deg,#13503c,#0a2c22); }
.ins-cover[data-cover="lock"]{ background:linear-gradient(150deg,#0f4234,#081f18); }
.ins-cover__glow{ position:absolute; top:-45%; right:-25%; width:85%; height:150%; background:radial-gradient(circle,rgba(201,168,76,.22),transparent 60%); animation:insDrift 7s ease-in-out infinite; }
@keyframes insDrift{ 0%,100%{ transform:translate(0,0); } 50%{ transform:translate(-8%,7%); } }
.ins-cover__svg{ position:absolute; inset:0; width:100%; height:100%; transition:transform .35s ease; }
.ins-card:hover .ins-cover__svg{ transform:scale(1.04); }

/* medicare-101: pulsing care rings + cross */
.ins-art .r{ fill:none; stroke:#C9A84C; stroke-width:2; opacity:.35; transform-box:fill-box; transform-origin:center; }
.ins-art .r1{ animation:insPulse 3.2s ease-in-out infinite; }
.ins-art .r2{ opacity:.26; animation:insPulse 3.2s ease-in-out .5s infinite; }
.ins-art .r3{ opacity:.16; animation:insPulse 3.2s ease-in-out 1s infinite; }
@keyframes insPulse{ 0%,100%{ transform:scale(1); opacity:.35; } 50%{ transform:scale(1.07); opacity:.12; } }
.ins-art .plus{ stroke:#e7cf86; stroke-width:11; stroke-linecap:round; }

/* industry: drawing trend line */
.ins-art .axis{ stroke:rgba(244,241,232,.16); stroke-width:2; }
.ins-art .line{ fill:none; stroke:#C9A84C; stroke-width:4; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:520; stroke-dashoffset:520; animation:insDraw 2.4s ease-out forwards; }
@keyframes insDraw{ to{ stroke-dashoffset:0; } }
.ins-art .enddot{ fill:#e7cf86; animation:insBlink 2.4s ease-in-out 2s infinite; }
@keyframes insBlink{ 0%,100%{ opacity:1; } 50%{ opacity:.4; } }

/* agency: growth bars + trend */
.ins-art--bars .bar{ fill:#C9A84C; transform-box:fill-box; transform-origin:center bottom; transform:scaleY(0); animation:insGrow .8s cubic-bezier(.4,0,.2,1) forwards; }
.ins-art--bars .b1{ opacity:.5; animation-delay:.1s; }
.ins-art--bars .b2{ opacity:.72; animation-delay:.25s; }
.ins-art--bars .b3{ opacity:.95; animation-delay:.4s; }
@keyframes insGrow{ to{ transform:scaleY(1); } }
.ins-art--bars .trend{ fill:none; stroke:#e7cf86; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:300; stroke-dashoffset:300; animation:insDraw 1.5s ease-out .55s forwards; }

/* playbook: floating padlock */
.ins-art--lock{ transform-box:fill-box; transform-origin:center; animation:insFloat 4.5s ease-in-out infinite; }
.ins-art--lock .lockbody,.ins-art--lock .shackle{ fill:none; stroke:#C9A84C; stroke-width:5; }
.ins-art--lock .keyhole{ fill:#e7cf86; }
@keyframes insFloat{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-5px); } }

/* commissions: stacked coins + up arrow */
.ins-art--coins .coin{ fill:none; stroke:#C9A84C; stroke-width:3; opacity:0; transform-box:fill-box; transform-origin:center; animation:insCoin .55s ease forwards; }
.ins-art--coins .c1{ animation-delay:.1s; }
.ins-art--coins .c2{ animation-delay:.3s; }
.ins-art--coins .c3{ animation-delay:.5s; }
@keyframes insCoin{ from{ opacity:0; transform:translateY(12px); } to{ opacity:.9; transform:none; } }
.ins-art--coins .coinup{ fill:none; stroke:#e7cf86; stroke-width:4; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:80; stroke-dashoffset:80; animation:insDraw 1s ease .75s forwards; }

/* FMO: drawing shield + check, gently floating */
.ins-art--shield{ transform-box:fill-box; transform-origin:center; animation:insFloat 5s ease-in-out infinite; }
.ins-art--shield .shieldbody{ fill:rgba(201,168,76,.06); stroke:#C9A84C; stroke-width:4; stroke-linejoin:round; stroke-dasharray:440; stroke-dashoffset:440; animation:insDraw 1.7s ease forwards; }
.ins-art--shield .shieldcheck{ fill:none; stroke:#e7cf86; stroke-width:6; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:80; stroke-dashoffset:80; animation:insDraw .7s ease 1.2s forwards; }

/* acquisition: consolidation network (nodes feeding a hub) */
.ins-art--deal .spoke{ stroke:rgba(201,168,76,.5); stroke-width:2; stroke-dasharray:130; stroke-dashoffset:130; animation:insDraw 1s ease forwards; }
.ins-art--deal .s2{ animation-delay:.15s; }
.ins-art--deal .s3{ animation-delay:.3s; }
.ins-art--deal .s4{ animation-delay:.45s; }
.ins-art--deal .node{ fill:#C9A84C; transform-box:fill-box; transform-origin:center; animation:insNode 2.6s ease-in-out infinite; }
.ins-art--deal .n2{ animation-delay:.4s; }
.ins-art--deal .n3{ animation-delay:.8s; }
.ins-art--deal .n4{ animation-delay:1.2s; }
.ins-art--deal .hub{ fill:rgba(231,207,134,.14); stroke:#e7cf86; stroke-width:4; }
@keyframes insNode{ 0%,100%{ opacity:.55; transform:scale(1); } 50%{ opacity:1; transform:scale(1.18); } }

/* starting from zero: ascending steps + climbing marker */
.ins-art--steps .step{ fill:#C9A84C; transform-box:fill-box; transform-origin:center bottom; transform:scaleY(0); animation:insGrow .7s cubic-bezier(.4,0,.2,1) forwards; }
.ins-art--steps .st1{ opacity:.45; animation-delay:.1s; }
.ins-art--steps .st2{ opacity:.62; animation-delay:.25s; }
.ins-art--steps .st3{ opacity:.8; animation-delay:.4s; }
.ins-art--steps .st4{ opacity:.95; animation-delay:.55s; }
.ins-art--steps .climb{ fill:none; stroke:#e7cf86; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:300; stroke-dashoffset:300; animation:insDraw 1.4s ease-out .7s forwards; }
.ins-art--steps .climber{ fill:#e7cf86; animation:insBlink 2.4s ease-in-out 2s infinite; }

/* who owns your book: ownership document + wax seal */
.ins-art--deed{ transform-box:fill-box; transform-origin:center; animation:insFloat 5s ease-in-out infinite; }
.ins-art--deed .deedpage{ fill:rgba(201,168,76,.06); stroke:#C9A84C; stroke-width:4; stroke-linejoin:round; stroke-dasharray:440; stroke-dashoffset:440; animation:insDraw 1.7s ease forwards; }
.ins-art--deed .deedline{ stroke:rgba(244,241,232,.5); stroke-width:3; stroke-linecap:round; }
.ins-art--deed .deedseal{ fill:rgba(231,207,134,.14); stroke:#e7cf86; stroke-width:3; }
.ins-art--deed .deedribbon{ fill:#e7cf86; opacity:.9; }

/* how commissions work: carrier-to-agent money flow, with override branch */
.ins-art--flow .flownode{ fill:rgba(201,168,76,.1); stroke:#C9A84C; stroke-width:3; }
.ins-art--flow .fn2{ fill:rgba(231,207,134,.16); stroke:#e7cf86; }
.ins-art--flow .flowline{ fill:none; stroke:#C9A84C; stroke-width:3; stroke-linecap:round; stroke-dasharray:260; stroke-dashoffset:260; animation:insDraw 1.6s ease forwards; }
.ins-art--flow .fl2{ stroke:rgba(201,168,76,.55); animation-delay:.6s; }
.ins-art--flow .flowarrow{ fill:none; stroke:#e7cf86; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; }

/* kentucky commissions: state land mass + location pin */
.ins-art--map .mapland{ fill:rgba(244,241,232,.05); stroke:rgba(244,241,232,.18); stroke-width:2; stroke-linejoin:round; }
.ins-art--map .mappin{ fill:rgba(201,168,76,.16); stroke:#C9A84C; stroke-width:4; stroke-linejoin:round; transform-box:fill-box; transform-origin:center bottom; animation:insFloat 4.5s ease-in-out infinite; }
.ins-art--map .mappindot{ fill:#e7cf86; }

@media (prefers-reduced-motion: reduce){
  .ins-cover__glow,.ins-art .r,.ins-art .enddot,.ins-art--bars .bar,.ins-art--lock,
  .ins-art--shield,.ins-art--deal .node,.ins-art--coins .coin,.ins-art--steps .step,.ins-art--steps .climber,
  .ins-art--deed,.ins-art--map .mappin{ animation:none; }
  .ins-art .line,.ins-art--bars .trend,.ins-art--shield .shieldbody,.ins-art--shield .shieldcheck,
  .ins-art--coins .coinup,.ins-art--deal .spoke,.ins-art--steps .climb,
  .ins-art--deed .deedpage,.ins-art--flow .flowline{ animation:none; stroke-dashoffset:0; }
  .ins-art--bars .bar,.ins-art--steps .step{ transform:scaleY(1); }
  .ins-art--coins .coin{ opacity:.9; transform:none; }
}
.ins-lock{ position:absolute; right:12px; top:12px; z-index:2; background:rgba(10,44,34,.82); color:var(--gold); font-size:11px; font-weight:700; padding:5px 10px; border-radius:30px; display:flex; align-items:center; gap:5px; backdrop-filter:blur(2px); }
.ins-card__b{ padding:18px 18px 20px; display:flex; flex-direction:column; flex:1; }
.ins-card__b .ins-kick{ font-size:11px; }
.ins-card__b h3{ font-size:17px; font-weight:700; letter-spacing:-.01em; line-height:1.25; margin:8px 0 8px; }
.ins-card__b p{ font-size:13.5px; color:var(--muted); line-height:1.6; flex:1; }
.ins-card__meta{ display:flex; align-items:center; gap:8px; margin-top:14px; font-size:12px; color:var(--muted); }
.ins-card__lockmeta{ font-weight:600; color:var(--em); }

.ins-empty{ text-align:center; padding:48px 20px; color:var(--muted); font-size:14.5px; border:1px dashed var(--line); border-radius:16px; background:#fff; }

.ins-news{ margin-top:60px; background:linear-gradient(150deg,var(--em),var(--em2)); border-radius:22px; padding:44px; color:var(--bone); display:grid; grid-template-columns:1.3fr 1fr; gap:30px; align-items:center; position:relative; overflow:hidden; }
.ins-news:before{ content:""; position:absolute; right:-80px; top:-80px; width:380px; height:380px; background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); }
.ins-news h3{ font-size:25px; font-weight:700; letter-spacing:-.02em; }
.ins-news p{ font-size:14px; color:rgba(244,241,232,.78); line-height:1.6; margin-top:8px; }
.ins-news__form{ display:flex; gap:9px; position:relative; z-index:2; }
.ins-news__form input{ flex:1; font-family:inherit; font-size:14px; padding:13px 14px; border-radius:10px; border:1px solid rgba(244,241,232,.25); background:rgba(244,241,232,.08); color:#fff; }
.ins-news__form input::placeholder{ color:rgba(244,241,232,.55); }
.ins-news__form .ins-btn--gold{ padding:13px 18px; white-space:nowrap; }
.ins-news__done{ position:relative; z-index:2; font-size:15px; font-weight:600; color:var(--gold); }

.ins-foot{ background:#0a221a; color:rgba(244,241,232,.6); text-align:center; padding:26px; font-size:13px; }
.ins-foot b{ color:var(--gold); }

@media(max-width:900px){
  .ins-feat{ grid-template-columns:1fr; }
  .ins-grid{ grid-template-columns:1fr 1fr; }
  .ins-news{ grid-template-columns:1fr; }
  .ins-nav__lks{ display:none; }
  .ins-nav__act{ display:none; }
  .ins-burger{ display:flex; }
}
@media(max-width:600px){ .ins-grid{ grid-template-columns:1fr; } }
`;
