import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, CheckCircle, KeyRound, Check, X } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.webp';
import { GH } from '@/config/golden-hour';

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

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasValidSession, setHasValidSession] = useState(false);
  const navigate = useNavigate();

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 grain-overlay" style={{ background: GH.pageBg }}>
        <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(184,134,11,0.04) 0%, transparent 60%)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.025) 0%, transparent 60%)', filter: 'blur(60px)' }} />
        </div>

        <div
          className="w-full max-w-[495px] relative"
          style={{
            background: GH.glass,
            backdropFilter: `blur(${GH.glassBlur})`,
            WebkitBackdropFilter: `blur(${GH.glassBlur})`,
            border: `1px solid ${GH.glassBorder}`,
            borderRadius: 22,
            boxShadow: GH.glassShadow,
            opacity: 0,
            animation: 'fadeInUp 0.5s ease-out forwards',
          }}
        >
          <div className="pt-16 pb-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-6" style={{ color: GH.gold }} />
            <p style={{ fontSize: 15, color: GH.textSecondary }}>Verifying your link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 grain-overlay" style={{ background: GH.pageBg }}>
        <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(184,134,11,0.04) 0%, transparent 60%)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.025) 0%, transparent 60%)', filter: 'blur(60px)' }} />
        </div>

        <div
          className="w-full max-w-[495px] relative"
          style={{
            background: GH.glass,
            backdropFilter: `blur(${GH.glassBlur})`,
            WebkitBackdropFilter: `blur(${GH.glassBlur})`,
            border: `1px solid ${GH.glassBorder}`,
            borderRadius: 22,
            boxShadow: GH.glassShadow,
            opacity: 0,
            animation: 'fadeInUp 0.5s ease-out forwards',
          }}
        >
          <div className="text-center space-y-8 pt-14 pb-2">
            <div className="relative pb-6">
              <img src={tylerLogo} alt="Logo" className="h-[60px] mx-auto" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px" style={{ background: `linear-gradient(to right, transparent, ${GH.border}, transparent)` }} />
            </div>
            <div className="flex justify-center">
              <div className="rounded-full bg-green-50 p-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-serif" style={{ color: GH.textPrimary, letterSpacing: '-0.01em' }}>Password Set!</h1>
              <p style={{ fontSize: 13, color: GH.textSecondary, lineHeight: 1.7 }}>
                Redirecting you to get started...
              </p>
            </div>
          </div>
          <div className="pb-16 px-11">
            <Button
              onClick={handleRedirect}
              className="w-full h-[54px] text-white font-semibold text-[15px] rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)',
                boxShadow: '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)'
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 grain-overlay" style={{ background: GH.pageBg }}>
      {/* Atmospheric blurs */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(184,134,11,0.04) 0%, transparent 60%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.025) 0%, transparent 60%)', filter: 'blur(60px)' }} />
      </div>

      <div
        className="w-full max-w-[495px] relative"
        style={{
          background: GH.glass,
          backdropFilter: `blur(${GH.glassBlur})`,
          WebkitBackdropFilter: `blur(${GH.glassBlur})`,
          border: `1px solid ${GH.glassBorder}`,
          borderRadius: 22,
          boxShadow: GH.glassShadow,
          opacity: 0,
          animation: 'fadeInUp 0.5s ease-out forwards',
        }}
      >
        <div className="text-center space-y-8 pt-14 pb-2">
          <div className="relative pb-6">
            <img src={tylerLogo} alt="Logo" className="h-[60px] mx-auto" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px" style={{ background: `linear-gradient(to right, transparent, ${GH.border}, transparent)` }} />
          </div>
          <div className="flex justify-center">
            <div className="rounded-full p-4" style={{ background: 'rgba(60,48,28,0.04)' }}>
              <KeyRound className="h-10 w-10" style={{ color: GH.textMuted }} />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-serif" style={{ color: GH.textPrimary, letterSpacing: '-0.01em' }}>Set Your Password</h1>
            <p style={{ fontSize: 13, color: GH.textSecondary, lineHeight: 1.7 }}>
              Create a secure password to access your account
            </p>
          </div>
        </div>
        <div className="px-11 pb-16">
          {!hasValidSession && error ? (
            <div className="text-center space-y-6">
              <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
              <Link to="/auth">
                <Button
                  variant="outline"
                  className="h-[50px] px-8 font-medium rounded-2xl transition-all duration-200"
                  style={{ borderColor: GH.border, color: GH.textPrimary }}
                >
                  Go to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="password" className="text-[10px] font-semibold uppercase" style={{ letterSpacing: '0.07em', color: GH.textMuted }}>New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={12}
                    className="h-[56px] px-5 pr-12 text-[15px] bg-white border-border/30 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 focus:border-primary/50 focus:ring-0 focus:shadow-[0_0_0_4px_rgba(163,133,41,0.1),0_1px_3px_rgba(0,0,0,0.04)] placeholder:text-muted-foreground/35"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: GH.textMuted }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-3 pt-1">
                    {/* Strength bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(60,48,28,0.04)' }}>
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordValidation.strength === 'strong'
                              ? 'w-full bg-green-500'
                              : passwordValidation.strength === 'medium'
                              ? 'w-2/3 bg-amber-500'
                              : 'w-1/3 bg-red-500'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          passwordValidation.strength === 'strong'
                            ? 'text-green-600'
                            : passwordValidation.strength === 'medium'
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {passwordValidation.strength === 'strong'
                          ? 'Strong'
                          : passwordValidation.strength === 'medium'
                          ? 'Medium'
                          : 'Weak'}
                      </span>
                    </div>

                    {/* Requirements checklist */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.length ? 'text-green-600' : ''}`} style={passwordValidation.checks.length ? {} : { color: GH.textMuted }}>
                        {passwordValidation.checks.length ? <Check size={14} /> : <X size={14} />}
                        <span>12+ characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.uppercase ? 'text-green-600' : ''}`} style={passwordValidation.checks.uppercase ? {} : { color: GH.textMuted }}>
                        {passwordValidation.checks.uppercase ? <Check size={14} /> : <X size={14} />}
                        <span>Uppercase letter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.lowercase ? 'text-green-600' : ''}`} style={passwordValidation.checks.lowercase ? {} : { color: GH.textMuted }}>
                        {passwordValidation.checks.lowercase ? <Check size={14} /> : <X size={14} />}
                        <span>Lowercase letter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.number ? 'text-green-600' : ''}`} style={passwordValidation.checks.number ? {} : { color: GH.textMuted }}>
                        {passwordValidation.checks.number ? <Check size={14} /> : <X size={14} />}
                        <span>Number</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.special ? 'text-green-600' : ''}`} style={passwordValidation.checks.special ? {} : { color: GH.textMuted }}>
                        {passwordValidation.checks.special ? <Check size={14} /> : <X size={14} />}
                        <span>Special character</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-[10px] font-semibold uppercase" style={{ letterSpacing: '0.07em', color: GH.textMuted }}>Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="h-[56px] px-5 text-[15px] bg-white border-border/30 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 focus:border-primary/50 focus:ring-0 focus:shadow-[0_0_0_4px_rgba(163,133,41,0.1),0_1px_3px_rgba(0,0,0,0.04)] placeholder:text-muted-foreground/35"
                />
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-[54px] text-white font-semibold text-[15px] rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)',
                  boxShadow: '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(180deg, hsl(43, 58%, 38%) 0%, hsl(43, 62%, 30%) 100%)';
                  e.currentTarget.style.boxShadow = '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 8px 20px rgba(163, 133, 41, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)';
                  e.currentTarget.style.boxShadow = '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)';
                }}
                disabled={isSubmitting || !hasValidSession}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Set Password & Continue
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
