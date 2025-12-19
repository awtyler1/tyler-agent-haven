import { useViewMode } from '@/contexts/ViewModeContext';
import { Eye, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-3 text-sm font-medium shadow-lg">
      <Eye className="h-4 w-4" />
      {impersonatedAgent ? (
        <>
          <span>Viewing as: <strong>{impersonatedAgent.fullName}</strong></span>
          <span className="opacity-75">({impersonatedAgent.email})</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={stopImpersonating}
            className="h-7 px-2 text-white hover:bg-amber-600 hover:text-white ml-2"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Exit
          </Button>
        </>
      ) : (
        <>
          <span>Agent View Mode</span>
          <span className="opacity-75">(Your data, agent experience)</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAgentViewMode}
            className="h-7 px-2 text-white hover:bg-amber-600 hover:text-white ml-2"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Exit
          </Button>
        </>
      )}
    </div>
  );
}
