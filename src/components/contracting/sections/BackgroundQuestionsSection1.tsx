import { ContractingApplication, LEGAL_QUESTIONS, LegalQuestion } from '@/types/contracting';
import { cn } from '@/lib/utils';

interface BackgroundQuestionsSection1Props {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
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

export function BackgroundQuestionsSection1({ application, onUpdate, disabled }: BackgroundQuestionsSection1Props) {
  const legalQuestions = application.legal_questions || {};

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

    // If parent is answered "Yes", reset sub-questions to null so user must explicitly select
    if (answer === true && QUESTION_HIERARCHY[id]) {
      QUESTION_HIERARCHY[id].forEach(subId => {
        updated[subId] = { answer: null, explanation: '' };
      });
    }

    onUpdate('legal_questions', updated);
  };

  // Get all questions (parents AND sub-questions) for questions 1-10
  // We'll filter to show only questions that belong to the first 10 main questions
  const mainQuestionIds = LEGAL_QUESTIONS
    .filter(q => !('isSubQuestion' in q && q.isSubQuestion))
    .slice(0, 10)
    .map(q => q.id);
  
  const questions = LEGAL_QUESTIONS.filter(q => {
    // Include main questions 1-10
    if (mainQuestionIds.includes(q.id)) {
      return true;
    }
    // Include sub-questions that belong to main questions 1-10
    if ('isSubQuestion' in q && q.isSubQuestion) {
      return mainQuestionIds.some(parentId => 
        QUESTION_HIERARCHY[parentId]?.includes(q.id)
      );
    }
    return false;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
      <div className="space-y-3" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
        
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

      </div>
    </div>
  );
}

