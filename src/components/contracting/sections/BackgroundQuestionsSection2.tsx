import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ContractingApplication, LEGAL_QUESTIONS, LegalQuestion } from '@/types/contracting';
import { FileDropZone } from '../FileDropZone';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface BackgroundQuestionsSection2Props {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, documentType: string) => Promise<string | null>;
  onRemove: (documentType: string) => void;
  disabled?: boolean;
}

export function BackgroundQuestionsSection2({ 
  application, 
  onUpdate, 
  onUpload,
  onRemove,
  disabled 
}: BackgroundQuestionsSection2Props) {
  const legalQuestions = application.legal_questions || {};
  const disciplinaryEntries = application.disciplinary_entries || {};
  const uploadedDocs = application.uploaded_documents || {};

  const getQuestion = (id: string): LegalQuestion => {
    return legalQuestions[id] || { answer: null, explanation: '' };
  };

  const updateQuestion = (id: string, answer: boolean) => {
    const current = getQuestion(id);
    onUpdate('legal_questions', { 
      ...legalQuestions, 
      [id]: { ...current, answer } 
    });
  };

  // Get questions 11-19 (main questions only)
  const questions = LEGAL_QUESTIONS
    .filter(q => !('isSubQuestion' in q && q.isSubQuestion))
    .slice(10);

  // Check if any question in the entire form has "Yes"
  const hasAnyYes = Object.values(legalQuestions).some(q => q.answer === true);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
      <div className="space-y-4" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
        
        {questions.map((question) => {
          const q = getQuestion(question.id);
          return (
            <div 
              key={question.id}
              className={cn(
                "flex items-start gap-4 p-4 rounded-xl transition-colors",
                q.answer === true && "bg-amber-50",
                q.answer === false && "bg-emerald-50/50",
                q.answer === null && "bg-slate-50"
              )}
            >
              <span className="text-sm font-medium text-slate-400 shrink-0 w-6">
                {question.id}.
              </span>
              <p className="text-sm text-slate-700 flex-1 leading-relaxed">
                {question.text}
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => updateQuestion(question.id, true)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    q.answer === true
                      ? "bg-amber-500 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => updateQuestion(question.id, false)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    q.answer === false
                      ? "bg-emerald-500 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  No
                </button>
              </div>
            </div>
          );
        })}

        {/* Disciplinary Explanation Section - Shows if ANY question is Yes */}
        {hasAnyYes && (
          <div className="mt-6 p-6 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                Please provide details for any "Yes" answers above.
              </p>
            </div>

            {/* Entry 1 */}
            <div className="space-y-3 p-4 bg-white rounded-lg mb-4">
              <p className="text-xs font-semibold text-slate-600">Entry 1</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Date of Action</Label>
                  <Input
                    type="date"
                    value={disciplinaryEntries.entry1?.date_of_action || ''}
                    onChange={(e) => onUpdate('disciplinary_entries', { 
                      ...disciplinaryEntries, 
                      entry1: { ...disciplinaryEntries.entry1, date_of_action: e.target.value } 
                    })}
                    className="h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Action Taken</Label>
                  <Input
                    value={disciplinaryEntries.entry1?.action || ''}
                    onChange={(e) => onUpdate('disciplinary_entries', { 
                      ...disciplinaryEntries, 
                      entry1: { ...disciplinaryEntries.entry1, action: e.target.value } 
                    })}
                    className="h-10 rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">Reason</Label>
                <Input
                  value={disciplinaryEntries.entry1?.reason || ''}
                  onChange={(e) => onUpdate('disciplinary_entries', { 
                    ...disciplinaryEntries, 
                    entry1: { ...disciplinaryEntries.entry1, reason: e.target.value } 
                  })}
                  className="h-10 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">Explanation</Label>
                <Textarea
                  value={disciplinaryEntries.entry1?.explanation || ''}
                  onChange={(e) => onUpdate('disciplinary_entries', { 
                    ...disciplinaryEntries, 
                    entry1: { ...disciplinaryEntries.entry1, explanation: e.target.value } 
                  })}
                  className="min-h-[60px] rounded-lg"
                />
              </div>
            </div>

            {/* Supporting Documents */}
            <FileDropZone
              label="Supporting Documents (Optional)"
              documentType="background_explanation"
              existingFile={uploadedDocs.background_explanation}
              onUpload={onUpload}
              onRemove={() => onRemove('background_explanation')}
            />
          </div>
        )}

      </div>
    </div>
  );
}

