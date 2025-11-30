import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import tylerLogo from "@/assets/tyler-logo.png";

// Simple password - change this to your desired password
const SITE_PASSWORD = "Tyler2026";

interface PasswordGateProps {
  children: React.ReactNode;
}

const PasswordGate = ({ children }: PasswordGateProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated in this session
    const authenticated = sessionStorage.getItem("site_authenticated");
    if (authenticated === "true") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password === SITE_PASSWORD) {
      sessionStorage.setItem("site_authenticated", "true");
      setIsAuthenticated(true);
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
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
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="card-premium text-center">
          {/* Logo */}
          <div className="mb-8">
            <img
              src={tylerLogo}
              alt="Tyler Insurance Group"
              className="h-16 mx-auto"
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
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="btn-primary-gold w-full">
              Access Portal
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
