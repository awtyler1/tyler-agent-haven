import { Check } from 'lucide-react';
import { WIZARD_STEPS } from '@/types/contracting';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (step: number) => void;
}

export function WizardProgress({ currentStep, completedSteps, onStepClick }: WizardProgressProps) {
  return (
    <div className="w-full py-4 px-2">
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || step.id <= currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && !isCompleted && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground",
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && "cursor-not-allowed opacity-50"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.id}
              </button>

              {/* Connector line */}
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-1",
                    isCompleted ? "bg-green-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step name */}
      <div className="mt-2 text-center">
        <span className="text-sm font-medium text-foreground">
          Step {currentStep}: {WIZARD_STEPS.find(s => s.id === currentStep)?.name}
        </span>
      </div>
    </div>
  );
}