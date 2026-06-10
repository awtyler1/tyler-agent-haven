import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCarrierDirectory } from '@/hooks/useCarrierDirectory';
import { CARRIER_BRAND_COLORS } from '@/config/carriers';
import { PageLoader } from '@/components/ui/PageLoader';
import type { CarrierWithResources } from '@/types/carrierDirectory';

// ────────────────────────────────────────────────────────────────
// DATA SOURCE: carrier_contacts and carrier_links in Supabase,
// state-scoped (state_code = 'KY' or NULL/nationwide).
// carrier_documents intentionally not shown — plan docs go stale
// every year and live in the carrier portals (the source of truth).
//
// Shared-login MVP: shows ALL active carriers for the state — no
// per-agent certification filtering (everyone sees the same page).
//
// MULTI-STATE: when new states launch, render more state pills and
// pass the selected code to useCarrierDirectory(stateCode).
// ────────────────────────────────────────────────────────────────

const STATE = { code: 'KY', label: 'Kentucky' };

function isBrokerSupport(contactType: string) {
  return contactType === 'broker_support' || contactType === 'general';
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function CarrierResourcesPage() {
  const { carriers, loading, error } = useCarrierDirectory(STATE.code);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCode = searchParams.get('carrier') || '';

  useEffect(() => {
    if (carriers.length > 0 && !carriers.some((c) => c.code === selectedCode)) {
      setSearchParams({ carrier: carriers[0].code }, { replace: true });
    }
  }, [carriers, selectedCode, setSearchParams]);

  const selected: CarrierWithResources | undefined = carriers.find((c) => c.code === selectedCode);
  const brand = CARRIER_BRAND_COLORS[selectedCode] || '#A8801F';

  const portalLink = selected?.links.find((l) => l.link_type === 'portal');
  const otherLinks = selected?.links.filter((l) => l.link_type !== 'portal') || [];
  const contacts = selected?.contacts || [];
  const supportPhone = contacts.find((c) => isBrokerSupport(c.contact_type) && c.phone)?.phone;

  if (loading) {
    return (
      <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F1E8' }}>
        <PageLoader message="Loading carriers..." />
      </div>
    );
  }

  if (error || carriers.length === 0) {
    return (
      <div className="cr">
        <style>{CSS}</style>
        <div className="cr-max" style={{ textAlign: 'center', paddingTop: 80 }}>
          <h1 className="cr-h1">Carriers</h1>
          <p style={{ fontSize: 14, color: '#6b6457', marginTop: 10 }}>
            {error ? 'Unable to load carrier resources. ' : 'No carriers available yet. '}
            {error && (
              <button className="cr-retry" onClick={() => window.location.reload()}>Retry</button>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cr">
      <style>{CSS}</style>
      <div className="cr-max">
        {/* ── Header ── */}
        <div className="cr-head">
          <div>
            <h1 className="cr-h1">Carriers</h1>
            <div className="cr-sub">
              {carriers.length} carrier{carriers.length === 1 ? '' : 's'} · {STATE.label}
            </div>
          </div>
          <div className="cr-state">
            <span className="cr-state__pill cr-state__pill--on">{STATE.label}</span>
            <span className="cr-state__pill cr-state__pill--soon">More states soon</span>
          </div>
        </div>

        {/* ── Rail + Detail ── */}
        <div className="cr-split">
          {/* Rail */}
          <nav className="cr-rail" aria-label="Carriers">
            <div className="cr-rail__h">All carriers</div>
            {carriers.map((c) => {
              const on = c.code === selectedCode;
              const dot = CARRIER_BRAND_COLORS[c.code] || '#A8801F';
              return (
                <button
                  key={c.code}
                  className={`cr-ri${on ? ' on' : ''}`}
                  onClick={() => setSearchParams({ carrier: c.code })}
                >
                  <span className="cr-ri__dot" style={{ background: dot }} />
                  {c.display_name || c.name}
                </button>
              );
            })}
          </nav>

          {/* Detail */}
          {selected && (
            <div className="cr-detail">
              {/* Carrier header */}
              <div className="cr-dhead">
                <div className="cr-dhead__mark" style={{ background: brand }}>
                  {(selected.display_name || selected.name)[0]}
                </div>
                <div>
                  <div className="cr-dhead__nm">{selected.display_name || selected.name}</div>
                  <div className="cr-dhead__st">
                    {STATE.label}
                    {contacts.length > 0 && ` · ${contacts.length} contact${contacts.length === 1 ? '' : 's'}`}
                  </div>
                </div>
                <div className="cr-dhead__acts">
                  {portalLink && (
                    <a className="cr-btn cr-btn--gold" href={portalLink.url} target="_blank" rel="noopener noreferrer">
                      Open portal ↗
                    </a>
                  )}
                  {supportPhone && (
                    <a className="cr-btn cr-btn--ghost" href={`tel:${supportPhone.replace(/\D/g, '')}`}>
                      📞 {supportPhone}
                    </a>
                  )}
                </div>
              </div>

              {/* Contacts + Documents */}
              <div className="cr-grid">
                <section className="cr-card">
                  <h2 className="cr-card__h">Contacts</h2>
                  {contacts.length === 0 ? (
                    <div className="cr-empty">No contacts yet.</div>
                  ) : (
                    contacts.map((ct) => {
                      const generic = isBrokerSupport(ct.contact_type);
                      return (
                        <div className="cr-ct" key={ct.id}>
                          <span
                            className="cr-ct__av"
                            style={generic ? { background: `${brand}1a`, color: brand } : { background: brand, color: '#fff' }}
                          >
                            {getInitials(ct.name)}
                          </span>
                          <div className="cr-ct__body">
                            <div className="cr-ct__n">{ct.name}</div>
                            {(ct.title || ct.region) && (
                              <div className="cr-ct__r">
                                {[ct.title, ct.region].filter(Boolean).join(' · ')}
                              </div>
                            )}
                            {ct.email && (
                              <a className="cr-ct__em" href={`mailto:${ct.email}`}>{ct.email}</a>
                            )}
                          </div>
                          {ct.phone && (
                            <a className="cr-ct__ph" href={`tel:${ct.phone.replace(/\D/g, '')}`}>{ct.phone}</a>
                          )}
                        </div>
                      );
                    })
                  )}
                </section>
              </div>

              {/* Link pills */}
              {otherLinks.length > 0 && (
                <div className="cr-pills">
                  {otherLinks.map((l) => (
                    <a className="cr-pill" key={l.id} href={l.url} target="_blank" rel="noopener noreferrer">
                      {l.name} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Scoped styles (emerald) ───────────────────────────────────────────────────
const CSS = `
.cr{
  --em:#0E3B2E; --bone:#F4F1E8; --card:#fff; --line:#e7e0cf; --muted:#6b6457;
  --ink:#1b2620; --gold:#C9A84C; --gold2:#A8801F;
  flex:1 1 auto; min-height:0; overflow-y:auto; background:var(--bone);
  font-family:'Outfit','Inter',system-ui,sans-serif; color:var(--ink);
  -webkit-font-smoothing:antialiased; padding:30px 36px 44px;
}
.cr *{ box-sizing:border-box; }
.cr-max{ max-width:1020px; margin:0 auto; }

.cr-head{ display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:18px; }
.cr-h1{ font-size:25px; font-weight:700; letter-spacing:-.02em; margin:0; }
.cr-sub{ font-size:12.5px; color:var(--muted); margin-top:2px; }
.cr-retry{ background:none; border:none; color:var(--gold2); font-weight:600; cursor:pointer; font-size:14px; font-family:inherit; text-decoration:underline; }

.cr-state{ display:inline-flex; gap:6px; background:var(--card); border:1px solid var(--line); border-radius:30px; padding:4px; }
.cr-state__pill{ font-size:12.5px; font-weight:600; padding:6px 14px; border-radius:30px; color:var(--muted); }
.cr-state__pill--on{ background:var(--em); color:var(--bone); }
.cr-state__pill--soon{ opacity:.55; font-weight:500; }

.cr-split{ display:flex; gap:16px; align-items:flex-start; }

/* rail */
.cr-rail{ width:220px; flex-shrink:0; background:var(--card); border:1px solid var(--line); border-radius:14px; overflow:hidden; }
.cr-rail__h{ padding:12px 14px; border-bottom:1px solid var(--line); font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); }
.cr-ri{ display:flex; align-items:center; gap:9px; width:100%; padding:10px 14px; font-family:inherit; font-size:13px; font-weight:500;
  color:var(--ink); background:none; border:none; cursor:pointer; position:relative; text-align:left; transition:background .15s; }
.cr-ri:hover{ background:var(--bone); }
.cr-ri.on{ background:rgba(201,168,76,.1); font-weight:700; }
.cr-ri.on:before{ content:""; position:absolute; left:0; top:50%; transform:translateY(-50%); width:3px; height:18px; border-radius:2px; background:var(--gold); }
.cr-ri__dot{ width:7px; height:7px; border-radius:50%; flex-shrink:0; }

/* detail */
.cr-detail{ flex:1; min-width:0; }
.cr-dhead{ background:linear-gradient(135deg,#10362a,#0a2c22); color:var(--bone); border-radius:16px; padding:20px 22px;
  display:flex; align-items:center; gap:14px; flex-wrap:wrap; position:relative; overflow:hidden; margin-bottom:14px; }
.cr-dhead:before{ content:""; position:absolute; top:-80px; right:-50px; width:280px; height:280px;
  background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); pointer-events:none; }
.cr-dhead__mark{ width:42px; height:42px; border-radius:11px; color:#fff; display:flex; align-items:center; justify-content:center;
  font-weight:800; font-size:18px; position:relative; flex-shrink:0; }
.cr-dhead__nm{ font-size:20px; font-weight:700; position:relative; }
.cr-dhead__st{ font-size:11.5px; color:rgba(244,241,232,.6); position:relative; margin-top:1px; }
.cr-dhead__acts{ margin-left:auto; display:flex; gap:9px; position:relative; flex-wrap:wrap; }
.cr-btn{ display:inline-flex; align-items:center; gap:7px; font-size:12.5px; font-weight:700; padding:10px 16px; border-radius:9px;
  text-decoration:none; transition:.15s; white-space:nowrap; }
.cr-btn--gold{ background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); }
.cr-btn--gold:hover{ transform:translateY(-1px); box-shadow:0 8px 20px rgba(168,128,31,.3); }
.cr-btn--ghost{ background:rgba(255,255,255,.07); color:#fff; border:1px solid rgba(255,255,255,.16); }
.cr-btn--ghost:hover{ border-color:rgba(255,255,255,.4); }

.cr-grid{ display:grid; grid-template-columns:1fr; gap:14px; }
.cr-card{ background:var(--card); border:1px solid var(--line); border-radius:14px; padding:16px 18px; }
.cr-card__h{ font-size:13px; font-weight:700; margin:0 0 10px; }
.cr-empty{ font-size:12.5px; color:var(--muted); padding:10px 0; font-style:italic; }

.cr-ct{ display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--line); }
.cr-ct:last-child{ border-bottom:none; }
.cr-ct__av{ width:30px; height:30px; border-radius:8px; font-size:10.5px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cr-ct__body{ min-width:0; flex:1; }
.cr-ct__n{ font-size:12.5px; font-weight:600; }
.cr-ct__r{ font-size:10.5px; color:var(--muted); }
.cr-ct__em{ display:block; font-size:10.5px; color:var(--gold2); text-decoration:none; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cr-ct__em:hover{ text-decoration:underline; }
.cr-ct__ph{ font-size:12.5px; font-weight:700; color:var(--gold2); white-space:nowrap; text-decoration:none; flex-shrink:0; }
.cr-ct__ph:hover{ text-decoration:underline; }

.cr-pills{ display:flex; gap:8px; flex-wrap:wrap; margin-top:14px; }
.cr-pill{ font-size:11.5px; font-weight:600; padding:7px 13px; border-radius:20px; background:var(--card); border:1px solid var(--line);
  color:var(--muted); text-decoration:none; transition:.15s; }
.cr-pill:hover{ border-color:var(--gold); color:var(--ink); }

@media(max-width:860px){
  .cr{ padding:20px; }
  .cr-split{ flex-direction:column; }
  .cr-rail{ width:100%; display:flex; flex-wrap:wrap; gap:2px; padding:6px; }
  .cr-rail__h{ display:none; }
  .cr-ri{ width:auto; border-radius:8px; }
  .cr-ri.on:before{ display:none; }
  .cr-dhead__acts{ margin-left:0; width:100%; }
}
`;
