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
    <div className="w-full py-3">
      {/* Progress dots - Apple style */}
      <div className="flex items-center justify-center gap-2">
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
                isCurrent && "w-8 h-2 bg-primary",
                isCompleted && !isCurrent && "w-2 h-2 bg-green-500",
                !isCurrent && !isCompleted && "w-2 h-2 bg-muted-foreground/30",
                isClickable && "cursor-pointer hover:opacity-80",
                !isClickable && "cursor-not-allowed"
              )}
              aria-label={`Step ${step.id}: ${step.name}`}
            />
          );
        })}
      </div>

      {/* Step name with fade animation */}
      <div className="mt-3 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Step {currentStep} of {WIZARD_STEPS.length}
        </p>
        <h2 className="text-lg font-semibold text-foreground mt-0.5 transition-all duration-300">
          {WIZARD_STEPS.find(s => s.id === currentStep)?.name}
        </h2>
      </div>
    </div>
  );
}
