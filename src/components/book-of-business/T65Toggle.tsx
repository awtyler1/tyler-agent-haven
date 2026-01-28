import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface T65ToggleProps {
  policyId: string;
  initialValue: boolean;
  onUpdate?: (newValue: boolean) => void;
}

export function T65Toggle({ policyId, initialValue, onUpdate }: T65ToggleProps) {
  const [isT65, setIsT65] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (newValue: boolean) => {
    if (newValue === isT65) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('policies')
        .update({ is_t65: newValue })
        .eq('id', policyId);

      if (error) throw error;

      setIsT65(newValue);
      onUpdate?.(newValue);
    } catch (err) {
      console.error('Error updating T65 status:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`space-y-3 ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
      {isSaving && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
        </div>
      )}

      <label
        className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-colors ${
          !isT65
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
            : 'border-stone-200 dark:border-border hover:bg-stone-50 dark:hover:bg-muted/30'
        }`}
        onClick={() => handleToggle(false)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            !isT65 ? 'border-blue-600 dark:border-blue-500' : 'border-stone-300 dark:border-muted-foreground'
          }`}>
            {!isT65 && <div className="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-500 rounded-full"></div>}
          </div>
          <div>
            <p className="font-medium text-stone-900 dark:text-foreground">Plan Change</p>
            <p className="text-sm text-stone-500 dark:text-muted-foreground">Client switched from another Medicare plan</p>
          </div>
        </div>
        <p className="text-lg font-semibold text-stone-900 dark:text-foreground">$347</p>
      </label>

      <label
        className={`flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-colors ${
          isT65
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-600'
            : 'border-stone-200 dark:border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
        }`}
        onClick={() => handleToggle(true)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            isT65 ? 'border-emerald-600 dark:border-emerald-500' : 'border-stone-300 dark:border-muted-foreground'
          }`}>
            {isT65 && <div className="w-2.5 h-2.5 bg-emerald-600 dark:bg-emerald-500 rounded-full"></div>}
          </div>
          <div>
            <p className="font-medium text-stone-900 dark:text-foreground">New to Medicare (T65)</p>
            <p className="text-sm text-stone-500 dark:text-muted-foreground">Client just turned 65 or newly eligible</p>
          </div>
        </div>
        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">$694</p>
      </label>

      <p className="text-xs text-stone-500 dark:text-muted-foreground flex items-start gap-1.5 mt-2">
        <span className="text-stone-400">i</span>
        Select "New to Medicare" if this client just became eligible for Medicare and wasn't enrolled in any MA or PDP plan before.
      </p>
    </div>
  );
}
