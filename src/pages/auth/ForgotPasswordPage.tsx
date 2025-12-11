import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';

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
              <CardTitle className="text-[2.125rem] font-serif" style={{ letterSpacing: '0.025em' }}>Check Your Email</CardTitle>
              <CardDescription className="text-muted-foreground/60 font-light text-[13px] leading-[1.7]">
                We sent a password reset link to <strong className="text-foreground/80">{email}</strong>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 px-11 pb-16">
            <p className="text-[13px] text-muted-foreground/70 text-center leading-relaxed">
              Click the link in the email to reset your password. The link will expire in 24 hours.
            </p>
            <div className="text-center">
              <Link to="/auth">
                <Button 
                  variant="outline" 
                  className="h-[50px] px-8 border-foreground/12 hover:bg-secondary/30 hover:border-primary/25 font-medium text-foreground/80 rounded-2xl transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground/60 text-center">
              Didn't receive the email? Check your spam folder or{' '}
              <button 
                onClick={() => setIsSuccess(false)} 
                className="text-primary hover:underline font-medium"
              >
                try again
              </button>
            </p>
          </CardContent>
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
              <Mail className="h-10 w-10 text-muted-foreground/70" />
            </div>
          </div>
          <div className="space-y-3">
            <CardTitle className="text-[2.125rem] font-serif" style={{ letterSpacing: '0.025em' }}>Forgot Password?</CardTitle>
            <CardDescription className="text-muted-foreground/60 font-light text-[13px] leading-[1.7]">
              Enter your email and we'll send you a link to reset your password
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-11 pb-16">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-[11px] font-medium uppercase tracking-widest text-foreground/55">Email Address</Label>
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
                className="text-[13px] text-muted-foreground/70 hover:text-primary transition-colors inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}