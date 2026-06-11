import { useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { tig } from '@/data/landingContent';
import { getInsight, categoryMeta } from '@/data/insights';
import { getArticle, type Block } from '@/data/articles';

function renderBlock(b: Block, i: number) {
  if (b.type === 'h') return <h2 className="iar-h2" key={i}>{b.text}</h2>;
  if (b.type === 'ul') {
    return (
      <ul className="iar-ul" key={i}>
        {b.items.map((it, j) => <li key={j}>{it}</li>)}
      </ul>
    );
  }
  return <p className="iar-p" key={i}>{b.text}</p>;
}

function PublicNav() {
  return (
    <header className="iar-nav">
      <div className="iar-nav__in">
        <RouterLink to="/" className="iar-brand">
          <span className="iar-mk">T</span> {tig.name}
        </RouterLink>
        <nav className="iar-nav__lks">
          <RouterLink to="/#honest" className="iar-nav__lk">Why TIG</RouterLink>
          <RouterLink to="/#founders" className="iar-nav__lk">Our Team</RouterLink>
          <RouterLink to="/insights" className="iar-nav__lk">Insights</RouterLink>
          <RouterLink to="/#get" className="iar-nav__lk">What you get</RouterLink>
        </nav>
        <div className="iar-nav__act">
          <RouterLink to="/auth" className="iar-btn iar-btn--ghost">Agent Login</RouterLink>
          <RouterLink to="/join" className="iar-btn iar-btn--gold">I'm Ready to Grow</RouterLink>
        </div>
      </div>
    </header>
  );
}

function Foot() {
  return (
    <div className="iar-foot">
      Powered by <b>Tyler Insurance Group</b> · {tig.tagline}
    </div>
  );
}

export default function InsightsArticlePage() {
  const { slug } = useParams();
  const post = slug ? getInsight(slug) : undefined;
  const article = post?.articleSlug ? getArticle(post.articleSlug) : undefined;

  useEffect(() => {
    document.title = post ? `${post.title} | Tyler Insurance Group` : 'Insights | Tyler Insurance Group';
  }, [post]);

  // Unknown slug
  if (!post) {
    return (
      <div className="iar">
        <style>{CSS}</style>
        <PublicNav />
        <div className="iar-wrap" style={{ textAlign: 'center', paddingTop: 60 }}>
          <h1 className="iar-title">Article not found</h1>
          <p className="iar-p" style={{ marginTop: 8 }}>It may have moved.</p>
          <RouterLink className="iar-back" to="/insights">← Back to Insights</RouterLink>
        </div>
        <Foot />
      </div>
    );
  }

  // Members-only post reached directly → gate it.
  if (post.members) {
    return (
      <div className="iar">
        <style>{CSS}</style>
        <PublicNav />
        <div className="iar-wrap iar-gate">
          <div className="iar-gate__lock">🔒</div>
          <div className="iar-kick">{categoryMeta(post.category).label} · Members only</div>
          <h1 className="iar-title">{post.title}</h1>
          <p className="iar-p">{post.excerpt}</p>
          <p className="iar-p iar-gate__note">
            This one's in the agent playbook. Sign in with your TIG agent login to read it, or join
            the team to get access.
          </p>
          <div className="iar-gate__act">
            <RouterLink className="iar-btn iar-btn--gold" to="/auth">Agent Login</RouterLink>
            <RouterLink className="iar-btn iar-btn--ghostdark" to="/join">Become an Agent</RouterLink>
          </div>
          <RouterLink className="iar-back" to="/insights">← Back to Insights</RouterLink>
        </div>
        <Foot />
      </div>
    );
  }

  const meta = categoryMeta(post.category);
  const dateStr = new Date(post.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="iar">
      <style>{CSS}</style>
      <PublicNav />
      <article className="iar-wrap">
        <RouterLink className="iar-back" to="/insights">← Insights</RouterLink>

        <div className="iar-meta">
          <span className="iar-cat">{meta.label}</span>
          <span className="iar-date">{dateStr} · {post.readTime}</span>
        </div>
        <h1 className="iar-title">{post.title}</h1>

        <div className="iar-byline">
          <span className="iar-av">{post.author.initials}</span>
          <div>
            <div className="iar-byline__n">{post.author.name}</div>
            <div className="iar-byline__t">Broker Development · Tyler Insurance Group</div>
          </div>
        </div>

        {article ? (
          <>
            <div className="iar-tldr">
              {article.takeaways.map((t, i) => (
                <div className="iar-tldr__t" key={i}>
                  <div className="iar-tldr__n">{i + 1}</div>
                  <p>{t}</p>
                </div>
              ))}
            </div>

            <section className="iar-block">
              <div className="iar-block__h"><span className="iar-block__ic iar-ic-what">📋</span><span className="iar-block__t">{article.whatTitle || "What's happening"}</span></div>
              {article.what.map(renderBlock)}
            </section>

            <section className="iar-block iar-why">
              <div className="iar-block__h"><span className="iar-block__ic iar-ic-why">💡</span><span className="iar-block__t">Why it matters</span></div>
              {article.why.map((p, i) => <p className="iar-p" key={i}>{p}</p>)}
            </section>

            <section className="iar-block">
              <div className="iar-block__h"><span className="iar-block__ic iar-ic-do">✅</span><span className="iar-block__t">What to do now</span></div>
              <ol className="iar-ol">
                {article.actions.map((a, i) => <li key={i}>{a}</li>)}
              </ol>
            </section>

            {article.sources && <p className="iar-sources">{article.sources}</p>}
          </>
        ) : (
          <div className="iar-soon">
            <p className="iar-p" style={{ fontSize: '17px', color: 'var(--ink)' }}>{post.excerpt}</p>
            <div className="iar-soon__tag">✍️ Full write-up coming soon</div>
            <p className="iar-p">
              We're putting the finishing touches on this one. Want it in your inbox the moment it's
              live? Subscribe from the Insights page.
            </p>
            <RouterLink className="iar-btn iar-btn--gold" to="/insights">← Back to Insights</RouterLink>
          </div>
        )}
      </article>
      <Foot />
    </div>
  );
}

const CSS = `
.iar{
  --em:#0E3B2E; --em2:#0a2c22; --bone:#F4F1E8; --line:#e1d9c8; --muted:#5f6b62; --ink:#16201b; --gold:#C9A84C; --gold2:#A8801F;
  font-family:'Inter',system-ui,sans-serif; background:var(--bone); color:var(--ink); -webkit-font-smoothing:antialiased; min-height:100vh; display:flex; flex-direction:column;
}
.iar *{ box-sizing:border-box; }
.iar a{ text-decoration:none; color:inherit; }
.iar h1,.iar h2,.iar h3{ font-family:'Outfit','Inter',sans-serif; }

.iar-nav{ background:rgba(14,59,46,.96); position:sticky; top:0; z-index:50; }
.iar-nav__in{ max-width:1140px; margin:0 auto; padding:0 32px; height:66px; display:flex; align-items:center; gap:26px; }
.iar-brand{ display:flex; align-items:center; gap:10px; color:#fff; font-weight:700; font-size:15px; }
.iar-mk{ width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); font-weight:800; display:flex; align-items:center; justify-content:center; font-family:'Outfit'; }
.iar-nav__lks{ display:flex; gap:24px; flex:1; margin-left:8px; }
.iar-nav__lk{ color:rgba(244,241,232,.74); font-size:14px; font-weight:500; }
.iar-nav__lk:hover{ color:#fff; }
.iar-nav__act{ display:flex; align-items:center; gap:10px; }
.iar-btn{ font-size:13.5px; font-weight:700; padding:9px 15px; border-radius:9px; cursor:pointer; font-family:inherit; display:inline-block; }
.iar-btn--ghost{ color:rgba(244,241,232,.85); font-weight:600; border:1px solid rgba(244,241,232,.25); padding:8px 14px; }
.iar-btn--ghostdark{ color:var(--em); font-weight:600; border:1px solid var(--line); background:#fff; padding:8px 14px; }
.iar-btn--gold{ background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); }

.iar-wrap{ max-width:680px; width:100%; margin:0 auto; padding:36px 32px 56px; flex:1; }
.iar-back{ font-size:12.5px; font-weight:600; color:var(--gold2); margin-bottom:18px; display:inline-block; }
.iar-back:hover{ text-decoration:underline; }
.iar-meta{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.iar-cat{ font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#fff; background:var(--em); padding:4px 10px; border-radius:20px; }
.iar-date{ font-size:12px; color:var(--muted); }
.iar-title{ font-size:clamp(26px,3.6vw,36px); font-weight:700; letter-spacing:-.02em; line-height:1.15; margin:0 0 16px; }

.iar-byline{ display:flex; align-items:center; gap:11px; padding-bottom:22px; margin-bottom:24px; border-bottom:1px solid var(--line); }
.iar-av{ width:42px; height:42px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); font-family:'Outfit'; font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center; }
.iar-byline__n{ font-size:13.5px; font-weight:700; }
.iar-byline__t{ font-size:11.5px; color:var(--muted); margin-top:1px; }

.iar-tldr{ display:flex; background:#fff; border:1px solid var(--line); border-radius:14px; overflow:hidden; margin-bottom:28px; }
.iar-tldr__t{ flex:1; padding:15px 16px; border-right:1px solid var(--line); }
.iar-tldr__t:last-child{ border-right:none; }
.iar-tldr__n{ font-family:'Outfit'; font-size:20px; font-weight:800; color:var(--gold2); line-height:1; }
.iar-tldr__t p{ font-size:12px; line-height:1.45; color:var(--muted); margin-top:7px; }

.iar-block{ margin-bottom:22px; }
.iar-block__h{ display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.iar-block__ic{ width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
.iar-ic-what{ background:rgba(94,125,158,.14); }
.iar-ic-why{ background:rgba(201,168,76,.2); }
.iar-ic-do{ background:rgba(91,125,68,.16); }
.iar-block__t{ font-family:'Outfit'; font-size:17px; font-weight:700; }
.iar-p{ font-size:15.5px; line-height:1.7; color:#33312c; margin-bottom:14px; }
.iar-h2{ font-family:'Outfit'; font-size:16px; font-weight:700; margin:18px 0 9px; }
.iar-ul{ margin:0 0 14px 2px; padding:0; }
.iar-ul li{ list-style:none; display:flex; gap:10px; font-size:15px; line-height:1.6; margin-bottom:8px; color:#33312c; }
.iar-ul li:before{ content:"–"; color:var(--gold2); font-weight:700; flex-shrink:0; }

.iar-why{ background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone); border-radius:16px; padding:20px 22px; position:relative; overflow:hidden; }
.iar-why:before{ content:""; position:absolute; top:-70px; right:-50px; width:240px; height:240px; background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); }
.iar-why .iar-block__t{ position:relative; }
.iar-why .iar-block__ic{ color:var(--gold); position:relative; }
.iar-why .iar-p{ color:rgba(244,241,232,.92); position:relative; }
.iar-why .iar-p:last-child{ margin-bottom:0; }

.iar-ol{ margin:0; padding:0; counter-reset:step; }
.iar-ol li{ list-style:none; display:flex; gap:12px; font-size:15px; line-height:1.55; margin-bottom:11px; align-items:flex-start; color:#33312c; }
.iar-ol li:last-child{ margin-bottom:0; }
.iar-ol li:before{ counter-increment:step; content:counter(step); width:22px; height:22px; border-radius:50%; background:var(--em); color:var(--bone); font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }

.iar-sources{ font-size:11.5px; color:var(--muted); margin-top:26px; padding-top:16px; border-top:1px solid var(--line); font-style:italic; }

.iar-soon{ background:#fff; border:1px solid var(--line); border-radius:16px; padding:28px; }
.iar-soon__tag{ display:inline-block; background:rgba(201,168,76,.14); color:var(--gold2); font-size:12.5px; font-weight:700; padding:7px 13px; border-radius:30px; margin:6px 0 14px; }

.iar-gate{ text-align:center; max-width:560px; }
.iar-gate__lock{ font-size:40px; margin-bottom:8px; }
.iar-gate .iar-title{ margin-top:6px; }
.iar-gate__note{ color:var(--muted); }
.iar-gate__act{ display:flex; gap:10px; justify-content:center; margin:22px 0 26px; }

.iar-foot{ background:#0a221a; color:rgba(244,241,232,.6); text-align:center; padding:26px; font-size:13px; }
.iar-foot b{ color:var(--gold); }

@media(max-width:760px){
  .iar-wrap{ padding:24px 22px 40px; }
  .iar-tldr{ flex-direction:column; }
  .iar-tldr__t{ border-right:none; border-bottom:1px solid var(--line); }
  .iar-tldr__t:last-child{ border-bottom:none; }
  .iar-nav__lks{ display:none; }
}
`;
