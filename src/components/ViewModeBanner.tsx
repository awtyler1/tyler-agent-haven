import { useViewMode } from '@/contexts/ViewModeContext';
import { Eye, X } from 'lucide-react';

export function ViewModeBanner() {
  const { 
    isAgentViewMode, 
    impersonatedAgent, 
    toggleAgentViewMode, 
    stopImpersonating,
    isViewingAsAgent 
  } = useViewMode();

  if (!isViewingAsAgent) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[100] bg-amber-500 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium shadow-lg">
      <Eye className="h-3.5 w-3.5" />
      {impersonatedAgent ? (
        <>
          {impersonatedAgent.fullName}
          <button
            onClick={stopImpersonating}
            className="ml-1 hover:bg-amber-600 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <>
          Agent View
          <button
            onClick={toggleAgentViewMode}
            className="ml-1 hover:bg-amber-600 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
}
