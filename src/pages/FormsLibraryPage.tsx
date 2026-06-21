import { useState, useMemo, useEffect } from 'react';
import {
  forms,
  FORM_CATEGORIES,
  categoryLabel,
  type FormCategory,
  type FormItem,
} from '@/data/formsContent';

function fileExt(path: string) {
  const m = path.split('?')[0].match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : 'PDF';
}

export default function FormsLibraryPage() {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<FormCategory | 'All'>('All');

  useEffect(() => {
    document.title = 'Forms | Tyler Insurance Group';
  }, []);

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
  }, [query, activeCat]);

  const groups = useMemo(() => {
    const cats = activeCat === 'All' ? FORM_CATEGORIES.map((c) => c.key) : [activeCat];
    return cats
      .map((cat) => ({ cat, items: filtered.filter((f) => f.category === cat) }))
      .filter((g) => g.items.length > 0);
  }, [filtered, activeCat]);

  return (
    <div className="fm">
      <style>{CSS}</style>
      <div className="fm-max">
        <div className="fm-head">
          <h1 className="fm-h1">Forms</h1>
          <div className="fm-sub">CMS forms, fact finders, and worksheets. Everything you need for a clean, compliant appointment.</div>
        </div>

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
            {FORM_CATEGORIES.map((c) => (
              <button key={c.key} className={`fm-p${activeCat === c.key ? ' on' : ''}`} onClick={() => setActiveCat(c.key)}>
                {c.label}
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
                {categoryLabel(g.cat)} <span className="fm-group__c">{g.items.length}</span>
              </div>
              {g.items.map((f) => <FormRow key={f.id} f={f} />)}
            </div>
          ))
        )}

        <p className="fm-note">
          More forms are added as we finalize them. CMS forms come straight from cms.gov; our fact finders are built to match how we work.
        </p>
      </div>
    </div>
  );
}

function FormRow({ f }: { f: FormItem }) {
  const src = (
    <span className={`fm-src fm-src--${f.source.toLowerCase()}`}>{f.source}</span>
  );

  if (f.file) {
    return (
      <a className="fm-row" href={f.file} target="_blank" rel="noopener noreferrer">
        <span className="fm-row__fi">{fileExt(f.file)}</span>
        <div className="fm-row__body">
          <div className="fm-row__n">{f.name} {src}</div>
          <div className="fm-row__m">
            {fileExt(f.file)}{f.year ? ` · ${f.year}` : ''}{f.description ? ` · ${f.description}` : ''}
          </div>
        </div>
        <span className="fm-row__dl">↓ Download</span>
      </a>
    );
  }

  return (
    <div className="fm-row fm-row--soon">
      <span className="fm-row__fi fm-row__fi--soon">PDF</span>
      <div className="fm-row__body">
        <div className="fm-row__n">{f.name} {src}</div>
        <div className="fm-row__m">{f.description}</div>
      </div>
      <span className="fm-row__soon">Coming soon</span>
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
.fm-input{ flex:1; border:none; background:none; outline:none; font-family:inherit; font-size:16px; color:var(--ink); padding:11px 0; }
.fm-input::placeholder{ color:#b9b2a4; }
.fm-pills{ display:flex; gap:6px; flex-wrap:wrap; }
.fm-p{ font-family:inherit; font-size:11.5px; font-weight:600; padding:6px 13px; border-radius:20px; background:var(--card); border:1px solid var(--line); color:var(--muted); cursor:pointer; transition:.15s; }
.fm-p:hover{ border-color:var(--gold); }
.fm-p.on{ background:var(--em); border-color:var(--em); color:var(--bone); }

.fm-group{ font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin:22px 0 10px; display:flex; gap:8px; align-items:center; }
.fm-group__c{ font-weight:600; color:var(--gold2); background:rgba(168,128,31,.1); padding:1px 7px; border-radius:10px; font-size:10px; }

.fm-row{ display:flex; align-items:center; gap:13px; background:var(--card); border:1px solid var(--line); border-radius:12px; padding:13px 16px; margin-bottom:8px; transition:.15s; text-decoration:none; color:var(--ink); }
.fm-row:not(.fm-row--soon):hover{ border-color:var(--gold); transform:translateY(-1px); box-shadow:0 8px 18px rgba(20,30,24,.06); }
.fm-row__fi{ width:34px; height:34px; border-radius:9px; background:rgba(184,80,63,.08); color:#b8503f; font-size:9.5px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.fm-row__fi--soon{ background:rgba(107,100,87,.1); color:var(--muted); }
.fm-row__body{ flex:1; min-width:0; }
.fm-row__n{ font-size:13.5px; font-weight:600; }
.fm-row__m{ font-size:11.5px; color:var(--muted); margin-top:1px; }
.fm-row__dl{ margin-left:auto; display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:var(--gold2); border:1px solid var(--line); border-radius:8px; padding:7px 13px; flex-shrink:0; }
.fm-row:hover .fm-row__dl{ border-color:var(--gold); }

.fm-row--soon{ opacity:.7; }
.fm-row__soon{ margin-left:auto; font-size:11px; font-weight:600; color:var(--muted); background:var(--bone); border:1px solid var(--line); border-radius:8px; padding:7px 12px; flex-shrink:0; white-space:nowrap; }

.fm-src{ font-size:9px; font-weight:700; letter-spacing:.04em; padding:1px 6px; border-radius:6px; margin-left:7px; vertical-align:middle; position:relative; top:-1px; }
.fm-src--cms{ background:rgba(94,125,158,.15); color:#5e7d9e; }
.fm-src--tig{ background:rgba(168,128,31,.13); color:var(--gold2); }

.fm-empty{ font-size:13px; color:var(--muted); font-style:italic; padding:20px 0; }
.fm-note{ font-size:11.5px; color:var(--muted); margin-top:22px; line-height:1.6; }

@media(max-width:760px){ .fm{ padding:20px; } }
`;
