import { ContractingApplication } from '@/types/contracting';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface AgreementsSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
}

const AGREEMENTS = [
  { id: 'info_accurate', text: 'I confirm that all information provided is true and correct.' },
  { id: 'receive_emails', text: 'I agree to receive carrier and compliance communications.' },
  { id: 'enter_info', text: 'I authorize Tyler Insurance Group to enter this information on my behalf.' },
  { id: 'facsimile_signature', text: 'I authorize Tyler Insurance Group to affix my signature to carrier documents.' },
];

export function AgreementsSection({ application, onUpdate, disabled }: AgreementsSectionProps) {
  const agreements = (application.agreements as Record<string, boolean>) || {};

  const toggleAgreement = (id: string) => {
    onUpdate('agreements', { ...agreements, [id]: !agreements[id] });
  };

  const allChecked = AGREEMENTS.every(a => agreements[a.id]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
      <div className="space-y-4" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
        
        {AGREEMENTS.map((agreement) => (
          <label 
            key={agreement.id}
            className={cn(
              "flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors",
              agreements[agreement.id] ? "bg-emerald-50" : "bg-slate-50 hover:bg-slate-100"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0 mt-0.5",
              agreements[agreement.id] 
                ? "bg-emerald-500 border-emerald-500" 
                : "border-slate-300"
            )}>
              {agreements[agreement.id] && <Check className="h-4 w-4 text-white" />}
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={agreements[agreement.id] || false}
              onChange={() => toggleAgreement(agreement.id)}
            />
            <span className="text-sm text-slate-700 leading-relaxed">{agreement.text}</span>
          </label>
        ))}

        {/* Progress indicator */}
        <div className="pt-4 text-center">
          <p className={cn(
            "text-sm",
            allChecked ? "text-emerald-600" : "text-slate-400"
          )}>
            {allChecked ? "All agreements accepted ✓" : `${Object.values(agreements).filter(Boolean).length} of ${AGREEMENTS.length} accepted`}
          </p>
        </div>

      </div>
    </div>
  );
}

