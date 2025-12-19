import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ImpersonatedAgent {
  userId: string;
  fullName: string;
  email: string;
}

interface ViewModeContextType {
  // Agent View Mode (simple toggle - your data, agent UI)
  isAgentViewMode: boolean;
  toggleAgentViewMode: () => void;
  
  // Impersonation (specific agent's data)
  impersonatedAgent: ImpersonatedAgent | null;
  startImpersonating: (agent: ImpersonatedAgent) => void;
  stopImpersonating: () => void;
  
  // Combined check - are we in any kind of agent view?
  isViewingAsAgent: boolean;
  
  // Get the effective user ID for queries (impersonated or real)
  getEffectiveUserId: (realUserId: string) => string;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [isAgentViewMode, setIsAgentViewMode] = useState(false);
  const [impersonatedAgent, setImpersonatedAgent] = useState<ImpersonatedAgent | null>(null);

  // Persist to localStorage so it survives page refreshes
  useEffect(() => {
    const stored = localStorage.getItem('viewMode');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setIsAgentViewMode(parsed.isAgentViewMode || false);
        setImpersonatedAgent(parsed.impersonatedAgent || null);
      } catch (e) {
        console.error('Error parsing viewMode from localStorage:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('viewMode', JSON.stringify({
      isAgentViewMode,
      impersonatedAgent,
    }));
  }, [isAgentViewMode, impersonatedAgent]);

  const toggleAgentViewMode = () => {
    setIsAgentViewMode(prev => !prev);
    // Clear impersonation when toggling simple mode
    if (!isAgentViewMode) {
      setImpersonatedAgent(null);
    }
  };

  const startImpersonating = (agent: ImpersonatedAgent) => {
    setImpersonatedAgent(agent);
    setIsAgentViewMode(false); // Impersonation takes precedence
  };

  const stopImpersonating = () => {
    setImpersonatedAgent(null);
  };

  const isViewingAsAgent = isAgentViewMode || impersonatedAgent !== null;

  const getEffectiveUserId = (realUserId: string): string => {
    if (impersonatedAgent) {
      return impersonatedAgent.userId;
    }
    return realUserId;
  };

  return (
    <ViewModeContext.Provider value={{
      isAgentViewMode,
      toggleAgentViewMode,
      impersonatedAgent,
      startImpersonating,
      stopImpersonating,
      isViewingAsAgent,
      getEffectiveUserId,
    }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
