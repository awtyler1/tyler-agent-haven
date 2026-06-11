import { useState, useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { tig } from '@/data/landingContent';
import {
  insights,
  INSIGHT_CATEGORIES,
  categoryMeta,
  type InsightPost,
  type InsightCategory,
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

// Cover image with a graceful branded fallback (never a broken image icon).
function Cover({ src, className }: { src?: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) return null;
  return <img className={className} src={src} alt="" loading="lazy" onError={() => setErr(true)} />;
}

function Avatar({ initials }: { initials: string }) {
  return <span className="ins-av">{initials}</span>;
}

export default function InsightsPage() {
  const [active, setActive] = useState<InsightCategory | 'all'>('all');

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
            <span className="ins-mk">T</span> {tig.name}
          </RouterLink>
          <nav className="ins-nav__lks">
            <RouterLink to="/#honest" className="ins-nav__lk">Why TIG</RouterLink>
            <RouterLink to="/#founders" className="ins-nav__lk">Our Team</RouterLink>
            <RouterLink to="/insights" className="ins-nav__lk">Insights</RouterLink>
            <RouterLink to="/#get" className="ins-nav__lk">What you get</RouterLink>
          </nav>
          <div className="ins-nav__act">
            <RouterLink to="/auth" className="ins-btn ins-btn--ghost">Agent Login</RouterLink>
            <RouterLink to="/join" className="ins-btn ins-btn--gold">I'm Ready to Grow</RouterLink>
          </div>
        </div>
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
              <Cover src={featured.image} />
              <span className="ins-pill">★ Featured</span>
            </div>
            <div className="ins-feat__body">
              <div className="ins-kick">{categoryMeta(featured.category).label}</div>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <div className="ins-meta">
                <Avatar initials={featured.author.initials} /> {featured.author.name}
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
                  <Cover src={p.image} />
                  <span className="ins-pill">{categoryMeta(p.category).label}</span>
                  {p.members && <span className="ins-lock">🔒 Members</span>}
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
                        <Avatar initials={p.author.initials} /> {p.author.name}
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
.ins a{ text-decoration:none; color:inherit; }
.ins h1,.ins h2,.ins h3{ font-family:'Outfit','Inter',sans-serif; }

.ins-nav{ background:rgba(14,59,46,.96); position:sticky; top:0; z-index:50; }
.ins-nav__in{ max-width:1140px; margin:0 auto; padding:0 32px; height:66px; display:flex; align-items:center; gap:26px; }
.ins-brand{ display:flex; align-items:center; gap:10px; color:#fff; font-weight:700; font-size:15px; }
.ins-mk{ width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); font-weight:800; display:flex; align-items:center; justify-content:center; font-family:'Outfit'; }
.ins-nav__lks{ display:flex; gap:24px; flex:1; margin-left:8px; }
.ins-nav__lk{ color:rgba(244,241,232,.74); font-size:14px; font-weight:500; transition:color .18s; }
.ins-nav__lk:hover{ color:#fff; }
.ins-nav__act{ display:flex; align-items:center; gap:10px; }
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
.ins-dot{ width:3px; height:3px; border-radius:50%; background:var(--line); display:inline-block; }

.ins-feat{ display:grid; grid-template-columns:1.25fr 1fr; background:#fff; border:1px solid var(--line); border-radius:20px; overflow:hidden; box-shadow:0 24px 60px rgba(20,30,24,.1); transition:box-shadow .2s; }
.ins-feat:hover{ box-shadow:0 30px 70px rgba(20,30,24,.16); }
.ins-feat__img{ position:relative; min-height:340px; display:flex; align-items:flex-end; padding:26px; background:linear-gradient(150deg,#13503c,#0a2c22); overflow:hidden; }
.ins-feat__img img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.ins-feat__img:after{ content:""; position:absolute; inset:0; background:linear-gradient(155deg,rgba(10,44,34,.25),rgba(10,44,34,.72)); }
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
.ins-card__img{ height:158px; position:relative; background:linear-gradient(135deg,#1c5b44,#0e3b2e); overflow:hidden; }
.ins-card__img img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:transform .3s; }
.ins-card:hover .ins-card__img img{ transform:scale(1.05); }
.ins-card__img:after{ content:""; position:absolute; inset:0; background:linear-gradient(180deg,rgba(10,44,34,.45),transparent 42%); }
.ins-card__img .ins-pill{ position:absolute; left:14px; top:14px; }
.ins-card__img.is-locked img{ filter:saturate(.5) brightness(.7); }
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
}
@media(max-width:600px){ .ins-grid{ grid-template-columns:1fr; } }
`;
