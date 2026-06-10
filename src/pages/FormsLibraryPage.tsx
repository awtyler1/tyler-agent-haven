import { useState, useMemo, useEffect } from 'react';
import { useForms } from '@/hooks/useForms';
import { PageLoader } from '@/components/ui/PageLoader';
import type { Form } from '@/types/forms';

// Friendly labels + display order. Includes future categories (cms,
// checklist) so they show automatically once forms use them.
const CATEGORY_LABELS: Record<string, string> = {
  cms: 'CMS Forms',
  client_intake: 'Client Intake',
  checklist: 'Checklists',
  enrollment: 'Enrollment',
  compliance: 'Compliance Forms',
  other: 'Other Forms',
};
const CATEGORY_ORDER = ['cms', 'client_intake', 'checklist', 'enrollment', 'compliance', 'other'];

function labelFor(cat: string) {
  return CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function fileExt(path: string) {
  const m = path.split('?')[0].match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : 'FILE';
}

export default function FormsLibraryPage() {
  const { forms, loading, error } = useForms();
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');

  useEffect(() => {
    document.title = 'Forms | Tyler Insurance Group';
  }, []);

  // categories present in the data, in preferred order
  const presentCats = useMemo(() => {
    const set = new Set(forms.map((f) => f.category as string));
    const ordered = CATEGORY_ORDER.filter((c) => set.has(c));
    const extras = [...set].filter((c) => !CATEGORY_ORDER.includes(c));
    return [...ordered, ...extras];
  }, [forms]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return forms.filter((f) => {
      if (activeCat !== 'All' && f.category !== activeCat) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q)
      );
    });
  }, [forms, query, activeCat]);

  const groups = useMemo(() => {
    const cats = activeCat === 'All' ? presentCats : [activeCat];
    return cats
      .map((cat) => ({
        cat,
        items: filtered
          .filter((f) => f.category === cat)
          .sort((a, b) => a.display_order - b.display_order),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered, presentCats, activeCat]);

  if (loading) {
    return (
      <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F1E8' }}>
        <PageLoader message="Loading forms..." />
      </div>
    );
  }

  return (
    <div className="fm">
      <style>{CSS}</style>
      <div className="fm-max">
        <div className="fm-head">
          <h1 className="fm-h1">Forms</h1>
          <div className="fm-sub">Grab what you need — CMS forms, intake sheets, checklists, and enrollment kits.</div>
        </div>

        {error || forms.length === 0 ? (
          <div className="fm-soon">
            <div className="fm-soon__glow" aria-hidden="true" />
            <div className="fm-soon__ic" aria-hidden="true">📋</div>
            <div className="fm-soon__lbl">{error ? 'Unavailable' : 'Coming soon'}</div>
            <h2 className="fm-soon__t">{error ? "Couldn't load forms." : 'Forms are on the way.'}</h2>
            <p className="fm-soon__p">
              {error
                ? 'Please refresh and try again.'
                : 'CMS forms, client intake sheets, checklists, and enrollment kits will live here. Check back soon.'}
            </p>
            {error && <button className="fm-retry" onClick={() => window.location.reload()}>Refresh</button>}
          </div>
        ) : (
          <>
            <div className="fm-toolbar">
              <div className="fm-search">
                🔍
                <input
                  className="fm-input"
                  placeholder="Search forms…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="fm-pills">
                <button className={`fm-p${activeCat === 'All' ? ' on' : ''}`} onClick={() => setActiveCat('All')}>All</button>
                {presentCats.map((c) => (
                  <button key={c} className={`fm-p${activeCat === c ? ' on' : ''}`} onClick={() => setActiveCat(c)}>
                    {labelFor(c)}
                  </button>
                ))}
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="fm-empty">No forms match “{query}”.</div>
            ) : (
              groups.map((g) => (
                <div key={g.cat}>
                  <div className="fm-group">
                    {labelFor(g.cat)} <span className="fm-group__c">{g.items.length}</span>
                  </div>
                  {g.items.map((f: Form) => (
                    <a
                      className="fm-row"
                      key={f.id}
                      href={f.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="fm-row__fi">{fileExt(f.file_path)}</span>
                      <div className="fm-row__body">
                        <div className="fm-row__n">{f.name}</div>
                        <div className="fm-row__m">
                          {fileExt(f.file_path)}
                          {f.year ? ` · ${f.year}` : ''}
                          {f.description ? ` · ${f.description}` : ''}
                        </div>
                      </div>
                      <span className="fm-row__dl">↓ Download</span>
                    </a>
                  ))}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

const CSS = `
.fm{
  --em:#0E3B2E; --bone:#F4F1E8; --card:#fff; --line:#e7e0cf; --muted:#6b6457; --ink:#1b2620; --gold:#C9A84C; --gold2:#A8801F;
  flex:1 1 auto; min-height:0; overflow-y:auto; background:var(--bone);
  font-family:'Outfit','Inter',system-ui,sans-serif; color:var(--ink);
  -webkit-font-smoothing:antialiased; padding:30px 36px 44px;
}
.fm *{ box-sizing:border-box; }
.fm-max{ max-width:820px; margin:0 auto; }
.fm-head{ margin-bottom:14px; }
.fm-h1{ font-size:25px; font-weight:700; letter-spacing:-.02em; margin:0; }
.fm-sub{ font-size:12.5px; color:var(--muted); margin-top:2px; }

.fm-toolbar{ display:flex; gap:12px; align-items:center; margin-bottom:18px; flex-wrap:wrap; }
.fm-search{ flex:1; min-width:200px; display:flex; align-items:center; gap:10px; background:var(--card); border:1px solid var(--line); border-radius:11px; padding:0 16px; font-size:13.5px; color:var(--muted); }
.fm-input{ flex:1; border:none; background:none; outline:none; font-family:inherit; font-size:13.5px; color:var(--ink); padding:11px 0; }
.fm-input::placeholder{ color:#b9b2a4; }
.fm-pills{ display:flex; gap:6px; flex-wrap:wrap; }
.fm-p{ font-family:inherit; font-size:11.5px; font-weight:600; padding:6px 13px; border-radius:20px; background:var(--card); border:1px solid var(--line); color:var(--muted); cursor:pointer; transition:.15s; }
.fm-p:hover{ border-color:var(--gold); }
.fm-p.on{ background:var(--em); border-color:var(--em); color:var(--bone); }

.fm-group{ font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin:22px 0 10px; display:flex; gap:8px; align-items:center; }
.fm-group__c{ font-weight:600; color:var(--gold2); background:rgba(168,128,31,.1); padding:1px 7px; border-radius:10px; font-size:10px; }
.fm-row{ display:flex; align-items:center; gap:13px; background:var(--card); border:1px solid var(--line); border-radius:12px; padding:13px 16px; margin-bottom:8px; transition:.15s; text-decoration:none; color:var(--ink); }
.fm-row:hover{ border-color:var(--gold); transform:translateY(-1px); box-shadow:0 8px 18px rgba(20,30,24,.06); }
.fm-row__fi{ width:34px; height:34px; border-radius:9px; background:rgba(184,80,63,.08); color:#b8503f; font-size:9.5px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.fm-row__body{ flex:1; min-width:0; }
.fm-row__n{ font-size:13.5px; font-weight:600; }
.fm-row__m{ font-size:11px; color:var(--muted); margin-top:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.fm-row__dl{ margin-left:auto; display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:var(--gold2); border:1px solid var(--line); border-radius:8px; padding:7px 13px; flex-shrink:0; }
.fm-row:hover .fm-row__dl{ border-color:var(--gold); }
.fm-empty{ font-size:13px; color:var(--muted); font-style:italic; padding:20px 0; }

/* coming soon / error */
.fm-soon{ position:relative; overflow:hidden; background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone); border-radius:20px; padding:54px 40px; text-align:center; margin-top:6px; }
.fm-soon__glow{ position:absolute; top:-100px; left:50%; transform:translateX(-50%); width:560px; height:380px; background:radial-gradient(circle,rgba(201,168,76,.18),transparent 60%); pointer-events:none; }
.fm-soon__ic{ position:relative; font-size:40px; margin-bottom:14px; }
.fm-soon__lbl{ position:relative; font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--gold); margin-bottom:10px; }
.fm-soon__t{ position:relative; font-size:26px; font-weight:700; letter-spacing:-.02em; margin:0 0 12px; }
.fm-soon__p{ position:relative; font-size:14.5px; color:rgba(244,241,232,.78); line-height:1.65; max-width:52ch; margin:0 auto; }
.fm-retry{ position:relative; margin-top:18px; font-family:inherit; font-size:13px; font-weight:600; color:var(--em); background:linear-gradient(135deg,#e7cf86,var(--gold2)); border:none; padding:10px 20px; border-radius:9px; cursor:pointer; }

@media(max-width:760px){ .fm{ padding:20px; } .fm-soon{ padding:40px 22px; } }
`;
