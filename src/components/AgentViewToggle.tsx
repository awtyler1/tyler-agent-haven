import { useViewMode } from '@/contexts/ViewModeContext';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function AgentViewToggle() {
  const { isAgentViewMode, toggleAgentViewMode, impersonatedAgent } = useViewMode();
  const { canAccessAdmin } = useAuth();

  // Only show for admins, and not when impersonating (that has its own UI)
  if (!canAccessAdmin() || impersonatedAgent) return null;

  return (
    <button
      onClick={toggleAgentViewMode}
      className={`text-[13px] font-medium transition-smooth tracking-wide flex items-center gap-1.5 whitespace-nowrap ${
        isAgentViewMode 
          ? 'text-amber-600 hover:text-amber-700' 
          : 'text-muted-foreground hover:text-gold'
      }`}
      title={isAgentViewMode ? 'Exit Agent View' : 'Enter Agent View'}
    >
      {isAgentViewMode ? (
        <>
          <EyeOff size={14} />
          Exit Agent View
        </>
      ) : (
        <>
          <Eye size={14} />
          Agent View
        </>
      )}
    </button>
  );
}
