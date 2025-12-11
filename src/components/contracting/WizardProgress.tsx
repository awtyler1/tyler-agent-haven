import { WIZARD_STEPS } from '@/types/contracting';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (step: number) => void;
  compact?: boolean;
}

export function WizardProgress({ currentStep, completedSteps, onStepClick, compact = false }: WizardProgressProps) {
  return (
    <div className={cn("w-full", compact ? "py-1" : "py-2")}>
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5">
        {WIZARD_STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || step.id <= currentStep;

          return (
            <button
              key={step.id}
              onClick={() => isClickable && onStepClick?.(step.id)}
              disabled={!isClickable}
              className={cn(
                "transition-all duration-300 ease-out rounded-full",
                isCurrent && "w-6 h-1.5 bg-primary",
                isCompleted && !isCurrent && "w-1.5 h-1.5 bg-green-500",
                !isCurrent && !isCompleted && "w-1.5 h-1.5 bg-muted-foreground/30",
                isClickable && "cursor-pointer hover:opacity-80",
                !isClickable && "cursor-not-allowed"
              )}
              aria-label={`Step ${step.id}: ${step.name}`}
            />
          );
        })}
      </div>

      {/* Step counter */}
      <p className={cn(
        "text-center text-muted-foreground mt-1",
        compact ? "text-[9px]" : "text-[10px]"
      )}>
        Step {currentStep} of {WIZARD_STEPS.length}
      </p>
    </div>
  );
}
