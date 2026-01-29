import { useState, useEffect, ReactNode } from 'react';

interface AgentDashboardProps {
  children: ReactNode;
}

/**
 * AgentDashboard - Main container for the agent dashboard
 *
 * Features:
 * - Full-height viewport with cream gradient background
 * - Decorative background orbs for depth
 * - Viewport-aware compact mode detection
 * - Centered content container (max-w-xl)
 */
export function AgentDashboard({ children }: AgentDashboardProps) {
  const [isCompact, setIsCompact] = useState(false);

  // Detect viewport height for compact mode
  useEffect(() => {
    const checkHeight = () => {
      setIsCompact(window.innerHeight < 800);
    };
    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => window.removeEventListener('resize', checkHeight);
  }, []);

  return (
    <div className="min-h-screen h-screen overflow-auto bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 flex flex-col">
      {/* Decorative background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {children}
      </div>
    </div>
  );
}

// Export compact mode hook for child components
export function useCompactMode() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const checkHeight = () => {
      setIsCompact(window.innerHeight < 800);
    };
    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => window.removeEventListener('resize', checkHeight);
  }, []);

  return isCompact;
}
