import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";
import tylerLogo from "@/assets/tyler-logo.png";
import { supabase } from "@/integrations/supabase/client";

interface PasswordGateProps {
  children: React.ReactNode;
}

const PasswordGate = ({ children }: PasswordGateProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Check if already authenticated in this session
    const authenticated = sessionStorage.getItem("site_authenticated");
    if (authenticated === "true") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsValidating(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("validate-password", {
        body: { password },
      });

      if (fnError) {
        console.error("Validation error:", fnError);
        setError("Unable to validate password. Please try again.");
        setPassword("");
        return;
      }

      if (data?.valid) {
        sessionStorage.setItem("site_authenticated", "true");
        setIsAuthenticated(true);
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
    } catch (err) {
      console.error("Password validation failed:", err);
      setError("Unable to validate password. Please try again.");
      setPassword("");
    } finally {
      setIsValidating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <Lock className="w-8 h-8 text-primary" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(40,30%,99%)] to-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-xl p-8 text-center shadow-[0_4px_24px_-4px_hsl(43,30%,20%,0.08)] hover:shadow-[0_12px_40px_-8px_hsl(43,30%,20%,0.14)] transition-shadow">
          {/* Logo */}
          <div className="mb-8">
            <img
              src={tylerLogo}
              alt="Tyler Insurance Group"
              className="h-20 mx-auto"
            />
          </div>

          {/* Title */}
          <h1 className="heading-subsection mb-2">Agent Portal Access</h1>
          <p className="text-body-small mb-8">
            Enter the password to access the platform.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                autoFocus
                disabled={isValidating}
              />
            </div>

            {/* Security note */}
            <p className="text-xs text-muted-foreground -mt-2">
              Secure access for licensed Tyler Insurance Group agents.
            </p>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-b from-gold to-[hsl(43,56%,38%)] text-primary-foreground rounded-lg font-medium transition-all hover:shadow-[0_4px_16px_-2px_hsl(43,56%,41%,0.4)] hover:from-[hsl(43,56%,38%)] hover:to-[hsl(43,56%,35%)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" 
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                "Access Portal"
              )}
            </Button>
          </form>

          {/* Footer note */}
          <p className="text-xs text-muted-foreground mt-6">
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordGate;
