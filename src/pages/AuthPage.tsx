import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { logActivity, ActivityAction } from '@/utils/activityLogger';
import { SHARED_AGENT_EMAIL } from '@/config/access';

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, getDefaultRoute } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(getDefaultRoute(), { replace: true });
    }
  }, [isAuthenticated, loading, navigate, getDefaultRoute]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Agents only type a password. We sign into the single shared account
      // whose email is fixed in config (never shown to the agent).
      const { error } = await supabase.auth.signInWithPassword({
        email: SHARED_AGENT_EMAIL,
        password,
      });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Incorrect password. Please try again.');
        } else {
          toast.error(error.message);
        }
        setPassword('');
        return;
      }
      await logActivity(ActivityAction.LOGIN);
      toast.success('Welcome!');
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tigauth">
      <style>{CSS}</style>
      <div className="tigauth__glow" aria-hidden="true" />
      <div className="tigauth__card">
        <a className="tigauth__brand" href="/">
          <img src="/tyler-crest.png" alt="Tyler Insurance Group" className="tigauth__crest" />
          <span className="tigauth__name">Tyler Insurance Group</span>
        </a>

        {loading ? (
          <div className="tigauth__loading">
            <Loader2 className="animate-spin" size={30} />
            <p>Loading…</p>
          </div>
        ) : (
          <>
            <h1 className="tigauth__title">Welcome back</h1>
            <p className="tigauth__sub">Enter your access password to continue.</p>

            <form onSubmit={handleLogin} className="tigauth__form">
              <label htmlFor="access-password" className="tigauth__label">Access password</label>
              <div className="tigauth__field">
                <input
                  id="access-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  autoComplete="current-password"
                  className="tigauth__input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="tigauth__toggle"
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={1.7} /> : <Eye size={18} strokeWidth={1.7} />}
                </button>
              </div>

              <button type="submit" className="tigauth__btn" disabled={isSubmitting || password.length === 0}>
                {isSubmitting ? (
                  <span className="tigauth__btnrow"><Loader2 className="animate-spin" size={16} /> Entering…</span>
                ) : (
                  'Enter'
                )}
              </button>
            </form>

            <p className="tigauth__help">Need the password? Contact your manager at Tyler Insurance Group.</p>
          </>
        )}
      </div>
    </div>
  );
}

const CSS = `
.tigauth{
  --em:#0E3B2E; --em2:#0a2c22; --bone:#F4F1E8; --line:#dfd8c8; --muted:#5f6b62; --ink:#16201b; --gold:#C9A84C; --gold2:#A8801F;
  position:relative; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; overflow:hidden;
  background:linear-gradient(165deg,var(--em),var(--em2));
  font-family:'Outfit','Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased;
}
.tigauth *{ box-sizing:border-box; }
.tigauth__glow{ position:absolute; top:-160px; left:50%; transform:translateX(-50%); width:900px; height:560px;
  background:radial-gradient(circle,rgba(201,168,76,.16),transparent 60%); pointer-events:none; }
.tigauth__card{ position:relative; width:100%; max-width:420px; background:var(--bone); border-radius:20px;
  box-shadow:0 30px 70px rgba(6,20,15,.45); padding:40px 38px 34px; text-align:center; }
.tigauth__brand{ display:inline-flex; flex-direction:column; align-items:center; gap:10px; text-decoration:none; margin-bottom:26px; }
.tigauth__crest{ height:58px; width:auto; }
.tigauth__name{ font-weight:700; font-size:14px; letter-spacing:.04em; text-transform:uppercase; color:var(--gold2); }
.tigauth__title{ font-family:'Lora',Georgia,serif; font-size:28px; font-weight:600; color:var(--ink); margin:0 0 6px; }
.tigauth__sub{ font-size:13.5px; color:var(--muted); margin:0 0 28px; }
.tigauth__form{ text-align:left; }
.tigauth__label{ display:block; font-size:12.5px; font-weight:600; color:var(--ink); margin-bottom:7px; }
.tigauth__field{ position:relative; }
.tigauth__input{ width:100%; font-family:inherit; font-size:14px; padding:12px 44px 12px 14px; border:1px solid var(--line);
  border-radius:10px; background:#fff; color:var(--ink); outline:none; transition:border-color .15s, box-shadow .15s; }
.tigauth__input::placeholder{ color:#b9b2a4; }
.tigauth__input:focus{ border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,.15); }
.tigauth__toggle{ position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none;
  cursor:pointer; color:#9b9484; padding:0; display:flex; }
.tigauth__toggle:hover{ color:var(--gold2); }
.tigauth__btn{ width:100%; margin-top:20px; font-family:inherit; font-size:15px; font-weight:600; padding:13px 20px;
  border:none; border-radius:10px; cursor:pointer; color:var(--em);
  background:linear-gradient(135deg,#e7cf86,var(--gold2)); transition:transform .15s, box-shadow .15s, opacity .15s; }
.tigauth__btn:hover:not(:disabled){ transform:translateY(-1px); box-shadow:0 10px 24px rgba(168,128,31,.32); }
.tigauth__btn:disabled{ opacity:.55; cursor:not-allowed; }
.tigauth__btnrow{ display:inline-flex; align-items:center; gap:8px; }
.tigauth__help{ font-size:12.5px; color:var(--muted); margin:24px 0 0; line-height:1.6; }
.tigauth__loading{ padding:40px 0; color:var(--gold2); display:flex; flex-direction:column; align-items:center; gap:12px; }
.tigauth__loading p{ font-size:13px; color:var(--muted); }
`;
