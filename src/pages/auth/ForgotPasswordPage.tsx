import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.webp';
import { GH } from '@/config/golden-hour';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/set-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
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
              <div className="rounded-full bg-green-50 p-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-serif" style={{ color: GH.textPrimary, letterSpacing: '-0.01em' }}>Check Your Email</h1>
              <p style={{ fontSize: 13, color: GH.textSecondary, lineHeight: 1.7 }}>
                We sent a password reset link to <strong style={{ color: GH.textPrimary }}>{email}</strong>
              </p>
            </div>
          </div>
          <div className="space-y-8 px-11 pb-16">
            <p className="text-center leading-relaxed" style={{ fontSize: 13, color: GH.textSecondary }}>
              Click the link in the email to reset your password. The link will expire in 24 hours.
            </p>
            <div className="text-center">
              <Link to="/auth">
                <Button
                  variant="outline"
                  className="h-[50px] px-8 font-medium rounded-2xl transition-all duration-200"
                  style={{ borderColor: GH.border, color: GH.textPrimary }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
            <p className="text-xs text-center" style={{ color: GH.textMuted }}>
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setIsSuccess(false)}
                className="hover:underline font-medium"
                style={{ color: GH.gold }}
              >
                try again
              </button>
            </p>
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
              <Mail className="h-10 w-10" style={{ color: GH.textMuted }} />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-serif" style={{ color: GH.textPrimary, letterSpacing: '-0.01em' }}>Forgot Password?</h1>
            <p style={{ fontSize: 13, color: GH.textSecondary, lineHeight: 1.7 }}>
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>
        </div>
        <div className="px-11 pb-16">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-[10px] font-semibold uppercase" style={{ letterSpacing: '0.07em', color: GH.textMuted }}>Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-[56px] px-5 text-[15px] bg-white border-border/30 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 focus:border-primary/50 focus:ring-0 focus:shadow-[0_0_0_4px_rgba(163,133,41,0.1),0_1px_3px_rgba(0,0,0,0.04)] placeholder:text-muted-foreground/35"
              />
            </div>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
            <div className="text-center pt-2">
              <Link
                to="/auth"
                className="text-[13px] hover:underline transition-colors inline-flex items-center"
                style={{ color: GH.textSecondary }}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
