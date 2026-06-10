import { Outlet, useLocation, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logActivity, ActivityAction } from '@/utils/activityLogger';
import { toast } from 'sonner';

// ============================================================
// TIG Hub shell — emerald sidebar (shared-login MVP)
// ============================================================

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/hub', icon: '⌂' },
  { label: 'Carriers', path: '/carrier-resources', icon: '⛨' },
  { label: '2027 Certifications', path: '/certifications', icon: '🎓' },
  { label: 'Quote & Enroll', path: '/agent-tools', icon: '⚡' },
  { label: 'Training & Playbooks', path: '/training', icon: '📚' },
  { label: 'Knowledge & Updates', path: '/industry-updates', icon: '📈' },
  { label: 'Forms & Compliance', path: '/forms-library', icon: '📋' },
  { label: 'Calendar', path: '/calendar', icon: '🗓' },
  { label: 'Contacts', path: '/contacts', icon: '☎' },
];

export function AgentShell() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/hub') return location.pathname === '/hub';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleSignOut = async () => {
    await logActivity(ActivityAction.LOGOUT);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // non-critical
    }
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
    toast.success('Logged out');
    window.location.href = '/auth';
  };

  return (
    <div className="shell">
      <style>{CSS}</style>

      <aside className="shell-sb">
        <Link to="/hub" className="shell-brand">
          <svg className="shell-crest" viewBox="0 0 60 66" fill="none" aria-hidden="true">
            <path d="M9 7h42v33c0 13-21 20-21 20S9 53 9 40z" stroke="#C9A84C" strokeWidth="3" />
            <rect x="19" y="19" width="22" height="5" fill="#C9A84C" />
            <rect x="27.5" y="19" width="5" height="25" fill="#C9A84C" />
          </svg>
          <span className="shell-brand__nm">Tyler<br />Insurance Group</span>
        </Link>

        <nav className="shell-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <Link key={item.path} to={item.path} className={isActive(item.path) ? 'on' : ''}>
              <span className="shell-nav__ic" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="shell-foot">
          <div className="shell-foot__note">
            Questions? Text Austin or Andrew. <Link to="/contacts">Contacts →</Link>
          </div>
          <button className="shell-foot__out" onClick={handleSignOut}>Sign out</button>
        </div>
      </aside>

      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}

const CSS = `
.shell{ display:flex; min-height:100vh; background:#F4F1E8; }
.shell *{ box-sizing:border-box; }

.shell-sb{ width:230px; flex-shrink:0; background:linear-gradient(180deg,#0b2c21,#082018); color:#F4F1E8;
  display:flex; flex-direction:column; padding:18px 14px; position:sticky; top:0; height:100vh;
  font-family:'Outfit','Inter',system-ui,sans-serif; }
.shell-brand{ display:flex; align-items:center; gap:10px; padding:6px 8px 18px; border-bottom:1px solid rgba(255,255,255,.08); text-decoration:none; color:inherit; }
.shell-crest{ height:30px; width:auto; flex-shrink:0; }
.shell-brand__nm{ font-weight:700; font-size:13.5px; line-height:1.2; }

.shell-nav{ margin-top:14px; display:flex; flex-direction:column; }
.shell-nav a{ display:flex; align-items:center; gap:11px; padding:9px 11px; border-radius:9px; font-size:13.5px; font-weight:500;
  color:rgba(244,241,232,.74); text-decoration:none; position:relative; margin-bottom:2px; transition:background .15s,color .15s; }
.shell-nav a:hover{ background:rgba(255,255,255,.05); color:#fff; }
.shell-nav a.on{ background:rgba(201,168,76,.14); color:#fff; font-weight:600; }
.shell-nav a.on:before{ content:""; position:absolute; left:0; top:50%; transform:translateY(-50%); width:3px; height:18px; border-radius:2px; background:#C9A84C; }
.shell-nav__ic{ width:16px; flex-shrink:0; opacity:.9; }

.shell-foot{ margin-top:auto; padding:12px 10px 4px; border-top:1px solid rgba(255,255,255,.08); }
.shell-foot__note{ font-size:11.5px; color:rgba(244,241,232,.5); line-height:1.5; }
.shell-foot__note a{ color:#C9A84C; font-weight:600; text-decoration:none; }
.shell-foot__out{ margin-top:10px; width:100%; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);
  color:rgba(244,241,232,.8); font-family:inherit; font-size:12px; font-weight:600; padding:8px 10px; border-radius:8px; cursor:pointer; transition:.15s; }
.shell-foot__out:hover{ border-color:rgba(255,255,255,.3); color:#fff; }

.shell-main{ flex:1; min-width:0; display:flex; flex-direction:column; min-height:100vh; overflow-y:auto; }

@media(max-width:760px){
  .shell{ flex-direction:column; }
  .shell-sb{ width:100%; height:auto; position:static; flex-direction:row; align-items:center; gap:10px; padding:10px 14px; overflow-x:auto; }
  .shell-brand{ border-bottom:none; padding:0 8px 0 0; }
  .shell-brand__nm{ display:none; }
  .shell-nav{ margin-top:0; flex-direction:row; gap:2px; }
  .shell-nav a{ white-space:nowrap; padding:8px 10px; }
  .shell-foot{ display:none; }
}
`;
