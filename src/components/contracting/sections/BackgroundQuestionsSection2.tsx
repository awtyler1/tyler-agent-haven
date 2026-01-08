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

const QUESTION_HIERARCHY: Record<string, string[]> = {
  '1': ['1a', '1b', '1c', '1d', '1e', '1f', '1g', '1h'],
  '2': ['2a', '2b', '2c', '2d'],
  '5': ['5a', '5b', '5c'],
  '8': ['8a', '8b'],
  '14': ['14a', '14c'],
  '15': ['15a', '15b', '15c'],
};

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

  const shouldShowSubQuestion = (subQuestionId: string): boolean => {
    // Find the parent question ID
    for (const [parentId, subIds] of Object.entries(QUESTION_HIERARCHY)) {
      if (subIds.includes(subQuestionId)) {
        const parentQuestion = getQuestion(parentId);
        return parentQuestion.answer === true;
      }
    }
    return false;
  };

  const updateQuestion = (id: string, answer: boolean) => {
    const current = getQuestion(id);
    const updated = { ...legalQuestions, [id]: { ...current, answer } };
    
    // If parent is answered "No", automatically set all child sub-questions to "No"
    if (answer === false && QUESTION_HIERARCHY[id]) {
      QUESTION_HIERARCHY[id].forEach(subId => {
        const subCurrent = getQuestion(subId);
        updated[subId] = { ...subCurrent, answer: false };
      });
    }
    
    onUpdate('legal_questions', updated);
  };

  // Get all questions (parents AND sub-questions) for questions 11-19
  // We'll filter to show only questions that belong to main questions 11-19
  const mainQuestionIds = LEGAL_QUESTIONS
    .filter(q => !('isSubQuestion' in q && q.isSubQuestion))
    .slice(10)
    .map(q => q.id);
  
  const questions = LEGAL_QUESTIONS.filter(q => {
    // Include main questions 11-19
    if (mainQuestionIds.includes(q.id)) {
      return true;
    }
    // Include sub-questions that belong to main questions 11-19
    if ('isSubQuestion' in q && q.isSubQuestion) {
      return mainQuestionIds.some(parentId => 
        QUESTION_HIERARCHY[parentId]?.includes(q.id)
      );
    }
    return false;
  });

  // Check if any question in the entire form has "Yes"
  const hasAnyYes = Object.values(legalQuestions).some(q => q.answer === true);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
      <div className="space-y-4" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
        
        {questions.map((question) => {
          const isSubQuestion = 'isSubQuestion' in question && question.isSubQuestion;
          const shouldShow = !isSubQuestion || shouldShowSubQuestion(question.id);

          const q = getQuestion(question.id);
          return (
            <div
              key={question.id}
              className={cn(
                "transition-all duration-300 ease-out overflow-hidden",
                shouldShow ? "opacity-100 max-h-40" : "opacity-0 max-h-0"
              )}
            >
              <div
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl",
                  isSubQuestion && "ml-8 border-l-2 border-slate-300 pl-6",
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

