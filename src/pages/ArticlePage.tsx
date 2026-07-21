import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticle, type Block } from '@/data/articles';
import { KNOWLEDGE_META } from '@/data/knowledgeContent';

function AuthorAvatar({ photo, initials, name }: { photo: string; initials: string; name: string }) {
  const [err, setErr] = useState(false);
  if (err || !photo) {
    return <div className="ap-av ap-av--ph" aria-hidden="true"><span>{initials}</span></div>;
  }
  return <img className="ap-av" src={photo} alt={name} onError={() => setErr(true)} />;
}

function renderBlock(b: Block, i: number) {
  // In-body subheads are H3 — they sit under the section H2 ("What's happening").
  if (b.type === 'h') return <h3 className="ap-h3" key={i}>{b.text}</h3>;
  if (b.type === 'ul') {
    return (
      <ul className="ap-ul" key={i}>
        {b.items.map((it, j) => <li key={j}>{it}</li>)}
      </ul>
    );
  }
  return <p className="ap-p" key={i}>{b.text}</p>;
}

export default function ArticlePage() {
  const { slug } = useParams();
  const article = slug ? getArticle(slug) : undefined;

  useEffect(() => {
    document.title = article
      ? `${article.title} | Tyler Insurance Group`
      : 'Article | Tyler Insurance Group';
  }, [article]);

  if (!article) {
    return (
      <div className="ap">
        <style>{CSS}</style>
        <div className="ap-wrap" style={{ textAlign: 'center', paddingTop: 70 }}>
          <h1 className="ap-title">Article not found</h1>
          <p className="ap-p" style={{ marginTop: 8 }}>It may have moved.</p>
          <Link className="ap-back" to="/industry-updates">← Back to Knowledge &amp; Updates</Link>
        </div>
      </div>
    );
  }

  const meta = KNOWLEDGE_META[article.category];
  const dateStr = new Date(article.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="ap">
      <style>{CSS}</style>
      <article className="ap-wrap">
        <Link className="ap-back" to="/industry-updates">← Knowledge &amp; Updates</Link>

        <div className="ap-meta">
          <span className="ap-cat" style={{ background: meta.color }}>{meta.label}</span>
          <span className="ap-date">{dateStr} · {article.readTime}</span>
        </div>
        <h1 className="ap-title">{article.title}</h1>

        {/* byline — Austin + headshot, on every article */}
        <div className="ap-byline">
          <AuthorAvatar photo={article.author.photo} initials={article.author.initials} name={article.author.name} />
          <div>
            <div className="ap-byline__n">{article.author.name}</div>
            <div className="ap-byline__t">{article.author.title}</div>
          </div>
        </div>

        {/* numbered takeaways strip */}
        <div className="ap-tldr">
          {article.takeaways.map((t, i) => (
            <div className="ap-tldr__t" key={i}>
              <div className="ap-tldr__n">{i + 1}</div>
              <p>{t}</p>
            </div>
          ))}
        </div>

        {/* What's happening */}
        <section className="ap-block ap-what">
          <div className="ap-block__h"><span className="ap-block__ic">📋</span><h2 className="ap-block__t">{article.whatTitle || "What's happening"}</h2></div>
          {article.what.map(renderBlock)}
        </section>

        {/* Why it matters to you */}
        <section className="ap-block ap-why">
          <div className="ap-block__h"><span className="ap-block__ic">💡</span><h2 className="ap-block__t">Why it matters to you</h2></div>
          {article.why.map((p, i) => <p className="ap-p" key={i}>{p}</p>)}
        </section>

        {/* What to do now */}
        <section className="ap-block ap-do">
          <div className="ap-block__h"><span className="ap-block__ic">✅</span><h2 className="ap-block__t">What to do now</h2></div>
          <ol className="ap-ol">
            {article.actions.map((a, i) => <li key={i}>{a}</li>)}
          </ol>
        </section>

        {article.sources && <p className="ap-sources">{article.sources}</p>}
      </article>
    </div>
  );
}

const CSS = `
.ap{
  --em:#0E3B2E; --bone:#F4F1E8; --card:#fff; --line:#e7e0cf; --muted:#6b6457; --ink:#1b2620; --gold:#C9A84C; --gold2:#A8801F;
  flex:1 1 auto; min-height:0; overflow-y:auto; background:var(--bone);
  font-family:'Outfit','Inter',system-ui,sans-serif; color:var(--ink);
  -webkit-font-smoothing:antialiased; padding:30px 36px 56px; display:flex; justify-content:center;
}
.ap *{ box-sizing:border-box; }
.ap-wrap{ max-width:680px; width:100%; }
.ap-back{ font-size:12.5px; font-weight:600; color:var(--gold2); margin-bottom:18px; display:inline-block; text-decoration:none; }
.ap-back:hover{ text-decoration:underline; }
.ap-meta{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.ap-cat{ font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#fff; padding:4px 10px; border-radius:20px; }
.ap-date{ font-size:12px; color:var(--muted); }
.ap-title{ font-family:'Outfit',sans-serif; font-size:clamp(26px,3.6vw,36px); font-weight:700; letter-spacing:-.02em; line-height:1.15; margin:0 0 16px; }

/* byline */
.ap-byline{ display:flex; align-items:center; gap:11px; padding-bottom:22px; margin-bottom:24px; border-bottom:1px solid var(--line); }
.ap-av{ width:42px; height:42px; border-radius:50%; object-fit:cover; object-position:center 18%; flex-shrink:0; background:#eae4d6; }
.ap-av--ph{ display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#10362a,#0a2c22); }
.ap-av--ph span{ color:var(--gold); font-weight:700; font-size:14px; }
.ap-byline__n{ font-size:13.5px; font-weight:700; }
.ap-byline__t{ font-size:11.5px; color:var(--muted); margin-top:1px; }

/* takeaways */
.ap-tldr{ display:flex; gap:0; background:var(--card); border:1px solid var(--line); border-radius:14px; overflow:hidden; margin-bottom:28px; }
.ap-tldr__t{ flex:1; padding:15px 16px; border-right:1px solid var(--line); }
.ap-tldr__t:last-child{ border-right:none; }
.ap-tldr__n{ font-family:'Outfit'; font-size:20px; font-weight:800; color:var(--gold2); line-height:1; }
.ap-tldr__t p{ font-size:12px; line-height:1.45; color:var(--muted); margin-top:7px; }

/* blocks */
.ap-block{ margin-bottom:22px; }
.ap-block__h{ display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.ap-block__ic{ width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
.ap-block__t{ font-family:'Outfit'; font-size:17px; font-weight:700; margin:0; }
.ap-p{ font-size:15.5px; line-height:1.7; color:#33312c; margin-bottom:14px; }
.ap-h3{ font-family:'Outfit'; font-size:16px; font-weight:700; margin:18px 0 9px; }
.ap-ul{ margin:0 0 14px 2px; }
.ap-ul li{ list-style:none; display:flex; gap:10px; font-size:15px; line-height:1.6; margin-bottom:8px; color:#33312c; }
.ap-ul li:before{ content:"–"; color:var(--gold2); font-weight:700; flex-shrink:0; }

.ap-what .ap-block__ic{ background:rgba(94,125,158,.14); color:#5e7d9e; }

.ap-why{ background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone); border-radius:16px; padding:20px 22px; position:relative; overflow:hidden; }
.ap-why:before{ content:""; position:absolute; top:-70px; right:-50px; width:240px; height:240px; background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); }
.ap-why .ap-block__ic{ background:rgba(201,168,76,.2); color:var(--gold); position:relative; }
.ap-why .ap-block__t{ position:relative; }
.ap-why .ap-p{ color:rgba(244,241,232,.92); position:relative; }
.ap-why .ap-p:last-child{ margin-bottom:0; }

.ap-do .ap-block__ic{ background:rgba(91,125,68,.16); color:#5b7d44; }
.ap-ol{ margin:0; counter-reset:step; }
.ap-ol li{ list-style:none; display:flex; gap:12px; font-size:15px; line-height:1.55; margin-bottom:11px; align-items:flex-start; color:#33312c; }
.ap-ol li:last-child{ margin-bottom:0; }
.ap-ol li:before{ counter-increment:step; content:counter(step); width:22px; height:22px; border-radius:50%; background:var(--em); color:var(--bone); font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }

.ap-sources{ font-size:11.5px; color:var(--muted); margin-top:26px; padding-top:16px; border-top:1px solid var(--line); font-style:italic; }

@media(max-width:760px){
  .ap{ padding:22px; }
  .ap-tldr{ flex-direction:column; }
  .ap-tldr__t{ border-right:none; border-bottom:1px solid var(--line); }
  .ap-tldr__t:last-child{ border-bottom:none; }
}
`;
