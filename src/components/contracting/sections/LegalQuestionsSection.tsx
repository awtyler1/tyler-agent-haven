import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ContractingApplication, LEGAL_QUESTIONS, LegalQuestion } from '@/types/contracting';
import { FileDropZone } from '../FileDropZone';
import { Shield, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LegalQuestionsSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, documentType: string) => Promise<string | null>;
  onRemove: (documentType: string) => Promise<void>;
  disabled?: boolean;
}

export function LegalQuestionsSection({ application, onUpdate, onUpload, onRemove, disabled }: LegalQuestionsSectionProps) {
  const legalQuestions = application.legal_questions || {};
  const uploadedDocs = application.uploaded_documents || {};

  const getQuestion = (id: string): LegalQuestion => {
    return legalQuestions[id] || { answer: null, explanation: '' };
  };

  const updateQuestion = (id: string, updates: Partial<LegalQuestion>) => {
    const current = getQuestion(id);
    const updated = { ...current, ...updates };
    onUpdate('legal_questions', { ...legalQuestions, [id]: updated });
  };

  const hasAnyYesAnswers = Object.values(legalQuestions).some(q => q.answer === true);

  // Get only parent questions and standalone questions (not sub-questions)
  const mainQuestions = LEGAL_QUESTIONS.filter(q => !('isSubQuestion' in q && q.isSubQuestion));

  return (
    <Card 
      className="rounded-[28px] border-0 overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
        boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.06)'
      }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-medium">Background Questions</CardTitle>
            <p className="text-xs text-muted-foreground/60">Please answer all questions truthfully. Most agents answer "No" to all.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        {disabled && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-muted-foreground/60">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Enter your initials above to unlock this section</span>
          </div>
        )}

        <div style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }} className="space-y-3">
          {mainQuestions.map((question) => {
            const q = getQuestion(question.id);
            const hasSubQuestions = LEGAL_QUESTIONS.some(sq => 'isSubQuestion' in sq && sq.isSubQuestion && sq.id.startsWith(question.id) && sq.id !== question.id);
            const subQuestions = hasSubQuestions ? LEGAL_QUESTIONS.filter(sq => 'isSubQuestion' in sq && sq.isSubQuestion && sq.id.startsWith(question.id) && sq.id !== question.id) : [];

            return (
              <div 
                key={question.id} 
                className={cn(
                  "p-4 rounded-xl border transition-colors",
                  q.answer === true 
                    ? "bg-amber-50/50 border-amber-200/30" 
                    : q.answer === false 
                      ? "bg-emerald-50/30 border-emerald-200/20"
                      : "bg-muted/10 border-border/10"
                )}
              >
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">
                      <span className="font-medium text-muted-foreground/70 mr-2">{question.id}.</span>
                      {question.text}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuestion(question.id, { answer: true })}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        q.answer === true
                          ? "bg-amber-500 text-white"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateQuestion(question.id, { answer: false })}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        q.answer === false
                          ? "bg-emerald-500 text-white"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Sub-questions when Yes is selected */}
                {q.answer === true && subQuestions.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-amber-200/50 space-y-3">
                    {subQuestions.map((sq) => {
                      const subQ = getQuestion(sq.id);
                      return (
                        <div key={sq.id} className="flex gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground/80 leading-relaxed">
                              <span className="font-medium mr-1">{sq.id.toUpperCase()}.</span>
                              {sq.text}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateQuestion(sq.id, { answer: true })}
                              className={cn(
                                "px-3 py-1 rounded text-[10px] font-medium transition-colors",
                                subQ.answer === true
                                  ? "bg-amber-500 text-white"
                                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                              )}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => updateQuestion(sq.id, { answer: false })}
                              className={cn(
                                "px-3 py-1 rounded text-[10px] font-medium transition-colors",
                                subQ.answer === false
                                  ? "bg-emerald-500 text-white"
                                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                              )}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })}

          {/* Attestation */}
          <div className="mt-6 p-4 rounded-xl bg-muted/20 border border-border/10">
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              By signing this form, I attest that the information I have provided is true to the best of my knowledge. 
              I acknowledge that if any of the information changes, I will notify Tyler Insurance Group within five (5) days of such a change.
            </p>
          </div>

          {/* Upload for explanations */}
          {hasAnyYesAnswers && (
            <div className="mt-4">
              <FileDropZone
                label="Supporting Documentation"
                documentType="background_explanation"
                existingFile={uploadedDocs['background_explanation']}
                onUpload={onUpload}
                onRemove={() => onRemove('background_explanation')}
                description="Upload any supporting documents for your explanations"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
