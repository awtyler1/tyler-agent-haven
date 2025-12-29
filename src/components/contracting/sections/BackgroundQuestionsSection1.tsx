import { ContractingApplication, LEGAL_QUESTIONS, LegalQuestion } from '@/types/contracting';
import { cn } from '@/lib/utils';

interface BackgroundQuestionsSection1Props {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
}

export function BackgroundQuestionsSection1({ application, onUpdate, disabled }: BackgroundQuestionsSection1Props) {
  const legalQuestions = application.legal_questions || {};

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

  // Get questions 1-10 (main questions only, not sub-questions)
  const questions = LEGAL_QUESTIONS
    .filter(q => !('isSubQuestion' in q && q.isSubQuestion))
    .slice(0, 10);

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

      </div>
    </div>
  );
}

