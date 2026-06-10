import { useEffect } from 'react';
import { trainingItems, trainingCategories, type TrainingItem, type TrainingType } from '@/data/trainingContent';

const TYPE_LABEL: Record<TrainingType, string> = {
  video: 'Video',
  article: 'Article',
  playbook: 'Playbook',
  'case-study': 'Case study',
};

function glyph(type: TrainingType) {
  return type === 'video' ? '▶' : type === 'playbook' ? '📘' : '📄';
}

function ItemCard({ item }: { item: TrainingItem }) {
  return (
    <a className={`tr-vc tr-vc--${item.type}`} href={item.href} target="_blank" rel="noopener noreferrer">
      <div className="tr-vc__thumb">
        <span className="tr-vc__badge">{TYPE_LABEL[item.type]}</span>
        <span className="tr-vc__play">{glyph(item.type)}</span>
        {item.duration && item.type === 'video' && <span className="tr-vc__dur">{item.duration}</span>}
      </div>
      <div className="tr-vc__t">{item.title}</div>
      <div className="tr-vc__m">
        {TYPE_LABEL[item.type]}
        {item.duration ? ` · ${item.duration}` : ''}
      </div>
    </a>
  );
}

export default function TrainingLibrary() {
  useEffect(() => {
    document.title = 'Training & Playbooks | Tyler Insurance Group';
  }, []);

  const hasContent = trainingItems.length > 0;
  const featured = trainingItems.find((i) => i.featured) || trainingItems[0];
  const rows = trainingCategories
    .map((cat) => ({ cat, items: trainingItems.filter((i) => i.category === cat) }))
    .filter((r) => r.items.length > 0);

  return (
    <div className="tr">
      <style>{CSS}</style>
      <div className="tr-max">
        <div className="tr-head">
          <h1 className="tr-h1">Training &amp; Playbooks</h1>
          <div className="tr-sub">CRM walkthroughs, product training, growth playbooks, and case studies.</div>
        </div>

        {!hasContent ? (
          /* ── Elegant coming-soon ── */
          <div className="tr-soon">
            <div className="tr-soon__glow" aria-hidden="true" />
            <div className="tr-soon__ic" aria-hidden="true">🎓</div>
            <div className="tr-soon__lbl">Coming soon</div>
            <h2 className="tr-soon__t">We're building the library.</h2>
            <p className="tr-soon__p">
              Training videos, playbooks, and case studies — on Forge CRM, product knowledge, and
              growing your book — are on the way. Check back soon.
            </p>
            <div className="tr-soon__chips">
              {trainingCategories.map((c) => (
                <span className="tr-soon__chip" key={c}>{c}</span>
              ))}
            </div>
          </div>
        ) : (
          <>
            {featured && (
              <a className="tr-feat" href={featured.href} target="_blank" rel="noopener noreferrer">
                <div className="tr-feat__thumb"><span className="tr-feat__play">{glyph(featured.type)}</span></div>
                <div className="tr-feat__body">
                  <div className="tr-feat__lbl">⭐ Start here</div>
                  <div className="tr-feat__t">{featured.title}</div>
                  {featured.blurb && <div className="tr-feat__s">{featured.blurb}</div>}
                  <div className="tr-feat__meta">
                    {TYPE_LABEL[featured.type]}
                    {featured.duration ? ` · ${featured.duration}` : ''} · {featured.category}
                  </div>
                </div>
              </a>
            )}

            {rows.map((row) => (
              <section className="tr-row" key={row.cat}>
                <div className="tr-row__h">
                  <span className="tr-row__t">{row.cat}</span>
                </div>
                <div className="tr-scroller">
                  {row.items.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

const CSS = `
.tr{
  --em:#0E3B2E; --bone:#F4F1E8; --card:#fff; --line:#e7e0cf; --muted:#6b6457; --ink:#1b2620; --gold:#C9A84C; --gold2:#A8801F;
  flex:1 1 auto; min-height:0; overflow-y:auto; background:var(--bone);
  font-family:'Outfit','Inter',system-ui,sans-serif; color:var(--ink);
  -webkit-font-smoothing:antialiased; padding:30px 36px 44px;
}
.tr *{ box-sizing:border-box; }
.tr-max{ max-width:1040px; margin:0 auto; }
.tr-head{ margin-bottom:20px; }
.tr-h1{ font-size:25px; font-weight:700; letter-spacing:-.02em; margin:0; }
.tr-sub{ font-size:12.5px; color:var(--muted); margin-top:2px; }

/* coming soon */
.tr-soon{ position:relative; overflow:hidden; background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone);
  border-radius:20px; padding:54px 40px; text-align:center; }
.tr-soon__glow{ position:absolute; top:-100px; left:50%; transform:translateX(-50%); width:560px; height:380px;
  background:radial-gradient(circle,rgba(201,168,76,.18),transparent 60%); pointer-events:none; }
.tr-soon__ic{ position:relative; font-size:40px; margin-bottom:14px; }
.tr-soon__lbl{ position:relative; font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--gold); margin-bottom:10px; }
.tr-soon__t{ position:relative; font-size:26px; font-weight:700; letter-spacing:-.02em; margin:0 0 12px; }
.tr-soon__p{ position:relative; font-size:14.5px; color:rgba(244,241,232,.78); line-height:1.65; max-width:52ch; margin:0 auto 24px; }
.tr-soon__chips{ position:relative; display:flex; gap:9px; justify-content:center; flex-wrap:wrap; }
.tr-soon__chip{ font-size:12px; font-weight:600; color:rgba(244,241,232,.85); background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.14); padding:7px 14px; border-radius:30px; }

/* featured */
.tr-feat{ display:flex; gap:20px; background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone);
  border-radius:18px; padding:22px; margin-bottom:24px; position:relative; overflow:hidden; text-decoration:none; }
.tr-feat:before{ content:""; position:absolute; top:-80px; right:-50px; width:300px; height:300px; background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); }
.tr-feat__thumb{ width:230px; flex-shrink:0; aspect-ratio:16/9; border-radius:12px; background:linear-gradient(135deg,#1d5d49,#0a2c22);
  display:flex; align-items:center; justify-content:center; position:relative; }
.tr-feat__play{ width:46px; height:46px; border-radius:50%; background:rgba(255,255,255,.92); color:var(--em); display:flex; align-items:center; justify-content:center; font-size:16px; }
.tr-feat__body{ position:relative; display:flex; flex-direction:column; justify-content:center; min-width:0; }
.tr-feat__lbl{ font-size:10.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--gold); margin-bottom:8px; }
.tr-feat__t{ font-size:22px; font-weight:700; letter-spacing:-.01em; line-height:1.15; }
.tr-feat__s{ font-size:13px; color:rgba(244,241,232,.72); margin-top:8px; max-width:46ch; line-height:1.55; }
.tr-feat__meta{ font-size:11.5px; color:rgba(244,241,232,.6); margin-top:12px; }

/* rows */
.tr-row{ margin-bottom:24px; }
.tr-row__h{ display:flex; align-items:center; justify-content:space-between; margin-bottom:11px; }
.tr-row__t{ font-size:15px; font-weight:700; }
.tr-scroller{ display:flex; gap:13px; overflow-x:auto; padding-bottom:6px; scrollbar-width:thin; }
.tr-vc{ width:210px; flex-shrink:0; text-decoration:none; color:var(--ink); }
.tr-vc__thumb{ aspect-ratio:16/9; border-radius:11px; background:linear-gradient(135deg,#cdbf9c,#9e8a5e); position:relative; display:flex; align-items:center; justify-content:center; overflow:hidden; }
.tr-vc--video .tr-vc__thumb{ background:linear-gradient(135deg,#1d5d49,#0a2c22); }
.tr-vc--article .tr-vc__thumb,.tr-vc--case-study .tr-vc__thumb{ background:linear-gradient(135deg,#b9cbbf,#5e7d6e); }
.tr-vc--playbook .tr-vc__thumb{ background:linear-gradient(135deg,#d6c08a,#a8801f); }
.tr-vc__play{ width:38px; height:38px; border-radius:50%; background:rgba(255,255,255,.92); color:var(--em); display:flex; align-items:center; justify-content:center; font-size:14px; }
.tr-vc--article .tr-vc__play,.tr-vc--playbook .tr-vc__play,.tr-vc--case-study .tr-vc__play{ border-radius:9px; }
.tr-vc__badge{ position:absolute; top:8px; left:8px; font-size:9.5px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; background:rgba(14,59,46,.85); color:#fff; padding:3px 8px; border-radius:20px; }
.tr-vc__dur{ position:absolute; bottom:8px; right:8px; font-size:10px; font-weight:600; background:rgba(0,0,0,.6); color:#fff; padding:2px 7px; border-radius:5px; }
.tr-vc__t{ font-size:13px; font-weight:600; margin-top:9px; line-height:1.3; }
.tr-vc__m{ font-size:11px; color:var(--muted); margin-top:3px; }

@media(max-width:760px){
  .tr{ padding:20px; }
  .tr-feat{ flex-direction:column; }
  .tr-feat__thumb{ width:100%; }
  .tr-soon{ padding:40px 22px; }
}
`;
