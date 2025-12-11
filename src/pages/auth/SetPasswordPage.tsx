import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, CheckCircle, KeyRound } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';

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
      console.log('Auth event:', event, 'Session:', !!session);
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
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
          .update({ password_created_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }

      setIsSuccess(true);
      toast.success('Password set successfully!');

      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      console.error('Error setting password:', err);
      setError(err.message || 'Failed to set password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
        <Card 
          className="w-full max-w-[495px] rounded-[28px] border-0 relative" 
          style={{ 
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
            boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
          }}
        >
          <CardContent className="pt-16 pb-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-6 text-primary" />
            <p className="text-muted-foreground/70 text-[15px]">Verifying your link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
        <Card 
          className="w-full max-w-[495px] rounded-[28px] border-0 relative" 
          style={{ 
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
            boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
          }}
        >
          <CardHeader className="text-center space-y-8 pt-14 pb-2">
            <div className="relative pb-6">
              <img src={tylerLogo} alt="Tyler Insurance Group" className="h-[60px] mx-auto" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
            </div>
            <div className="flex justify-center">
              <div className="rounded-full bg-green-50 p-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <div className="space-y-3">
              <CardTitle className="text-[2.125rem] font-serif" style={{ letterSpacing: '0.025em' }}>Password Set!</CardTitle>
              <CardDescription className="text-muted-foreground/60 font-light text-[13px] leading-[1.7]">
                Redirecting you to the dashboard...
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-16" />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
      <Card 
        className="w-full max-w-[495px] rounded-[28px] border-0 relative" 
        style={{ 
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
          boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
        }}
      >
        <CardHeader className="text-center space-y-8 pt-14 pb-2">
          <div className="relative pb-6">
            <img src={tylerLogo} alt="Tyler Insurance Group" className="h-[60px] mx-auto" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
          </div>
          <div className="flex justify-center">
            <div className="rounded-full bg-secondary/60 p-4">
              <KeyRound className="h-10 w-10 text-muted-foreground/70" />
            </div>
          </div>
          <div className="space-y-3">
            <CardTitle className="text-[2.125rem] font-serif" style={{ letterSpacing: '0.025em' }}>Set Your Password</CardTitle>
            <CardDescription className="text-muted-foreground/60 font-light text-[13px] leading-[1.7]">
              Create a secure password to access your account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-11 pb-16">
          {!hasValidSession && error ? (
            <div className="text-center space-y-6">
              <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
              <Link to="/auth">
                <Button 
                  variant="outline" 
                  className="h-[50px] px-8 border-foreground/12 hover:bg-secondary/30 hover:border-primary/25 font-medium text-foreground/80 rounded-2xl transition-all duration-200"
                >
                  Go to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="password" className="text-[11px] font-medium uppercase tracking-widest text-foreground/55">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={8}
                    className="h-[56px] px-5 pr-12 text-[15px] bg-white border-border/30 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 focus:border-primary/50 focus:ring-0 focus:shadow-[0_0_0_4px_rgba(163,133,41,0.1),0_1px_3px_rgba(0,0,0,0.04)] placeholder:text-muted-foreground/35"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/70 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground/50 pl-1">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-[11px] font-medium uppercase tracking-widest text-foreground/55">Confirm Password</Label>
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
        </CardContent>
      </Card>
    </div>
  );
}