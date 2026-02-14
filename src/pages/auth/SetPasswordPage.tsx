import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, CheckCircle, KeyRound, Check, X } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';

// Password validation helper
const validatePassword = (password: string): {
  isValid: boolean;
  message: string;
  strength: 'weak' | 'medium' | 'strong';
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
} => {
  const minLength = 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const checks = {
    length: password.length >= minLength,
    uppercase: hasUppercase,
    lowercase: hasLowercase,
    number: hasNumber,
    special: hasSpecial,
  };

  const meetsRequirements =
    checks.length &&
    checks.uppercase &&
    checks.lowercase &&
    checks.number &&
    checks.special;

  if (!meetsRequirements) {
    return {
      isValid: false,
      message: 'Password must be at least 12 characters with uppercase, lowercase, number, and special character.',
      strength: 'weak',
      checks,
    };
  }

  const strength = password.length >= 16 ? 'strong' : 'medium';

  return { isValid: true, message: '', strength, checks };
};

const strengthColors = {
  weak: { bar: 'var(--red)', label: 'var(--red)' },
  medium: { bar: 'var(--gold)', label: 'var(--gold-dark)' },
  strong: { bar: 'var(--green)', label: 'var(--green)' },
};

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    // Listen for auth state changes - this will fire when Supabase processes the recovery token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (session) {
          setHasValidSession(true);
          setIsLoading(false);
          setError(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setHasValidSession(false);
      }
    });

    // Also check for existing session (in case the auth event already fired)
    const checkExistingSession = async () => {
      // Give Supabase a moment to process the hash params
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasValidSession(true);
      } else {
        // Check if there are recovery params in the URL hash
        const hash = window.location.hash;
        if (!hash.includes('access_token')) {
          setError('Invalid or expired link. Please contact your administrator for a new setup link.');
        }
      }
      setIsLoading(false);
    };

    checkExistingSession();

    return () => subscription.unsubscribe();
  }, []);

  // Memoized password validation
  const passwordValidation = useMemo(() => validatePassword(password), [password]);

  // Role-based redirect logic - used by both auto-redirect and Continue button
  const handleRedirect = async () => {
    try {
      // Re-fetch user to ensure we have fresh data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth';
        return;
      }

      // Check if user has admin role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin');

      if (isAdmin) {
        // Admins go to admin dashboard
        window.location.href = '/admin';
        return;
      }

      // For non-admins, check onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_status')
        .eq('user_id', user.id)
        .single();

      if (profile?.onboarding_status === 'CONTRACTING_REQUIRED') {
        window.location.href = '/contracting';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Error during redirect:', err);
      window.location.href = '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Update profile to track password creation
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ password_created_at: new Date().toISOString(), first_login_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }

      setIsSuccess(true);
      toast.success('Password set successfully!');

      // Auto-redirect after delay
      setTimeout(() => {
        handleRedirect();
      }, 1500);
    } catch (err: any) {
      console.error('Error setting password:', err);
      setError(err.message || 'Failed to set password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AuthLayout>
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <Loader2
            className="animate-spin"
            style={{ color: 'var(--gold)', width: 32, height: 32, margin: '0 auto' }}
          />
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>Verifying your link...</p>
        </div>
      </AuthLayout>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <AuthLayout>
        <div style={{ textAlign: 'center', padding: '28px 0 8px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(107,138,66,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            <CheckCircle size={26} style={{ color: 'var(--green)' }} />
          </div>
          <h1
            style={{
              fontFamily: "'Lora', serif",
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: 20,
            }}
          >
            Password Set!
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            Redirecting you to get started...
          </p>
        </div>
        <div style={{ padding: '24px 36px 36px' }}>
          <button type="button" className="auth-btn-primary" onClick={handleRedirect}>
            Continue
          </button>
        </div>
      </AuthLayout>
    );
  }

  // Main form / error state
  return (
    <AuthLayout>
      <div style={{ textAlign: 'center', padding: '28px 0 8px' }}>
        {/* Icon circle */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(201,168,76,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          <KeyRound size={26} style={{ color: 'var(--gold-dark)' }} />
        </div>
        <h1
          style={{
            fontFamily: "'Lora', serif",
            fontSize: 28,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginTop: 20,
          }}
        >
          Set Your Password
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
          Create a secure password to access your account
        </p>
      </div>

      <div style={{ padding: '24px 36px 36px' }}>
        {!hasValidSession && error ? (
          /* Error state — invalid/expired link */
          <div>
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: 'rgba(196,74,63,0.08)',
                color: 'var(--red)',
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              {error}
            </div>
            <Link to="/auth" style={{ textDecoration: 'none' }}>
              <button type="button" className="auth-btn-outline">
                Go to Login
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* New Password */}
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="password" className="auth-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={12}
                  className="auth-input"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {/* Strength bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: 'rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: passwordValidation.strength === 'strong' ? '100%' : passwordValidation.strength === 'medium' ? '66%' : '33%',
                          background: strengthColors[passwordValidation.strength].bar,
                          transition: 'width 0.3s, background 0.3s',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: strengthColors[passwordValidation.strength].label,
                      }}
                    >
                      {passwordValidation.strength === 'strong' ? 'Strong' : passwordValidation.strength === 'medium' ? 'Medium' : 'Weak'}
                    </span>
                  </div>

                  {/* Requirements checklist */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '4px 16px',
                      marginTop: 8,
                      fontSize: 11,
                    }}
                  >
                    {[
                      { key: 'length' as const, label: '12+ characters' },
                      { key: 'uppercase' as const, label: 'Uppercase letter' },
                      { key: 'lowercase' as const, label: 'Lowercase letter' },
                      { key: 'number' as const, label: 'Number' },
                      { key: 'special' as const, label: 'Special character' },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          color: passwordValidation.checks[key] ? 'var(--green)' : 'var(--text-faint)',
                        }}
                      >
                        {passwordValidation.checks[key] ? <Check size={14} /> : <X size={14} />}
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="confirmPassword" className="auth-label">Confirm Password</label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="auth-input"
              />
            </div>

            {/* Error display */}
            {error && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 8,
                  background: 'rgba(196,74,63,0.08)',
                  color: 'var(--red)',
                  fontSize: 13,
                  marginBottom: 20,
                }}
              >
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="auth-btn-primary"
              disabled={isSubmitting || !hasValidSession}
            >
              {isSubmitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Loader2 className="animate-spin" size={16} />
                  Setting password...
                </span>
              ) : (
                'Set Password & Continue'
              )}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
