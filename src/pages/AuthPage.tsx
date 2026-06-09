import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { logActivity, ActivityAction } from '@/utils/activityLogger';
import AuthLayout from '@/components/auth/AuthLayout';
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

  if (loading) {
    return (
      <AuthLayout>
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <Loader2
            className="animate-spin"
            style={{ color: 'var(--gold)', width: 32, height: 32, margin: '0 auto' }}
          />
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>Loading...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Title block */}
      <div style={{ textAlign: 'center', padding: '28px 0 32px' }}>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 600, color: 'var(--text-primary)' }}>
          Welcome
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
          Enter your access password to continue
        </p>
      </div>

      {/* Form area */}
      <div style={{ padding: '0 36px 36px' }}>
        <form onSubmit={handleLogin}>
          {/* Password field */}
          <div style={{ marginBottom: 24 }}>
            <label htmlFor="access-password" className="auth-label">Access password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="access-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                autoComplete="current-password"
                className="auth-input"
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-faint)',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={1.7} /> : <Eye size={18} strokeWidth={1.7} />}
              </button>
            </div>
          </div>

          {/* Enter button */}
          <button type="submit" className="auth-btn-primary" disabled={isSubmitting || password.length === 0}>
            {isSubmitting ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Loader2 className="animate-spin" size={16} />
                Entering...
              </span>
            ) : (
              'Enter'
            )}
          </button>
        </form>

        {/* Help text */}
        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)', marginTop: 24, lineHeight: 1.6 }}>
          Need the password? Contact your manager at Tyler Insurance Group.
        </p>
      </div>
    </AuthLayout>
  );
}
