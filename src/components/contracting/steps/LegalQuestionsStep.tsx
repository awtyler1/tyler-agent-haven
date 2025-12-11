import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ContractingApplication, LEGAL_QUESTIONS, LegalQuestion } from '@/types/contracting';
import { ClipboardCheck, Upload, CheckCircle2, ChevronRight, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';
import { useRef, useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WizardProgress } from '../WizardProgress';
import { InitialsAcknowledgmentBar } from '../InitialsAcknowledgmentBar';
import { cn } from '@/lib/utils';

interface ProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

interface LegalQuestionsStepProps {
  application: ContractingApplication;
  initials: string | null;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, type: string) => Promise<string | null>;
  onRemove: (type: string) => void;
  onBack: () => void;
  onContinue: () => void;
  progressProps: ProgressProps;
}

// Group questions: primary questions and their sub-questions
const groupedQuestions = LEGAL_QUESTIONS.reduce((acc, question) => {
  const isSubQuestion = 'isSubQuestion' in question && question.isSubQuestion;
  
  if (!isSubQuestion) {
    acc.push({
      primary: question,
      subQuestions: [] as typeof LEGAL_QUESTIONS[number][],
    });
  } else {
    // Find the parent by matching the number prefix (e.g., "1a" belongs to "1")
    const parentId = question.id.replace(/[a-z]+$/, '');
    const parentGroup = acc.find(g => g.primary.id === parentId);
    if (parentGroup) {
      parentGroup.subQuestions.push(question);
    }
  }
  return acc;
}, [] as { primary: typeof LEGAL_QUESTIONS[number]; subQuestions: typeof LEGAL_QUESTIONS[number][] }[]);

export function LegalQuestionsStep({ application, initials: pageInitials, onUpdate, onUpload, onRemove, onBack, onContinue, progressProps }: LegalQuestionsStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const legalQuestions = (application.legal_questions as Record<string, LegalQuestion>) || {};
  const [signature, setSignature] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const handleAnswerChange = (questionId: string, answer: boolean) => {
    const current = legalQuestions[questionId] || { answer: null };
    onUpdate('legal_questions', {
      ...legalQuestions,
      [questionId]: { ...current, answer },
    });
  };

  const handleExplanationChange = (questionId: string, explanation: string) => {
    const current = legalQuestions[questionId] || { answer: null };
    onUpdate('legal_questions', {
      ...legalQuestions,
      [questionId]: { ...current, explanation },
    });
  };

  const handleFileUpload = async (file: File) => {
    await onUpload(file, 'background_explanation_docs');
  };

  const hasYesAnswers = Object.values(legalQuestions).some(q => q.answer === true);
  
  // Count answered questions for progress
  const answeredCount = useMemo(() => {
    return groupedQuestions.filter(g => legalQuestions[g.primary.id]?.answer !== undefined && legalQuestions[g.primary.id]?.answer !== null).length;
  }, [legalQuestions]);

  // Find unanswered questions
  const unansweredQuestions = useMemo(() => {
    return groupedQuestions
      .map((g, index) => ({ index: index + 1, id: g.primary.id, answered: legalQuestions[g.primary.id]?.answer !== undefined && legalQuestions[g.primary.id]?.answer !== null }))
      .filter(q => !q.answered);
  }, [legalQuestions]);

  // Find questions with Yes but no explanation
  const missingExplanations = useMemo(() => {
    const missing: { index: number; id: string }[] = [];
    groupedQuestions.forEach((g, index) => {
      const answer = legalQuestions[g.primary.id];
      // If primary answered Yes and has no sub-questions, needs explanation
      if (answer?.answer === true && g.subQuestions.length === 0 && !answer.explanation?.trim()) {
        missing.push({ index: index + 1, id: g.primary.id });
      }
      // Check sub-questions if primary is Yes
      if (answer?.answer === true && g.subQuestions.length > 0) {
        g.subQuestions.forEach(subQ => {
          const subAnswer = legalQuestions[subQ.id];
          if (subAnswer?.answer === true && !subAnswer.explanation?.trim()) {
            missing.push({ index: index + 1, id: subQ.id });
          }
        });
      }
    });
    return missing;
  }, [legalQuestions]);

  const allQuestionsAnswered = unansweredQuestions.length === 0;
  const allExplanationsProvided = missingExplanations.length === 0;
  const hasSigned = signature.trim().length >= 2;

  const handleClearAll = () => {
    onUpdate('legal_questions', {});
    setSignature('');
    setShowErrors(false);
  };

  const canContinue = hasSigned && allQuestionsAnswered && allExplanationsProvided;

  const handleContinue = () => {
    if (!canContinue) {
      setShowErrors(true);
      // Scroll to first error
      if (!allQuestionsAnswered && formRef.current) {
        const firstUnanswered = unansweredQuestions[0];
        const el = formRef.current.querySelector(`[data-question="${firstUnanswered.id}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (!allExplanationsProvided && formRef.current) {
        const firstMissing = missingExplanations[0];
        const el = formRef.current.querySelector(`[data-question="${firstMissing.id}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (!hasSigned && formRef.current) {
        const el = formRef.current.querySelector('[data-field="signature"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    onContinue();
  };

  return (
    <div className="max-w-3xl mx-auto" ref={formRef}>
      <Card 
        className="border-0 rounded-[24px]"
        style={{ 
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
          boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
        }}
      >
        {/* Progress + Header */}
        <div className="pt-5 pb-4 text-center border-b border-border/20">
          <WizardProgress {...progressProps} compact />
          <div className="flex items-center justify-center gap-2.5 mt-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold font-serif" style={{ letterSpacing: '0.015em' }}>Background Questions</h2>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-md mx-auto">
            Standard compliance questions required by our carrier partners.
            <br />
            <span className="text-muted-foreground/50">Most agents answer "No" to all and continue in under a minute.</span>
          </p>
        </div>

        <CardContent className="py-5 px-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
            <span className="text-xs text-muted-foreground">
              {answeredCount} of {groupedQuestions.length} answered
            </span>
            <div className="flex items-center gap-3">
              {answeredCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear all
                </button>
              )}
              <span className="text-xs text-muted-foreground/70">
                Select Yes or No for each
              </span>
            </div>
          </div>

          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-3">
              {groupedQuestions.map((group, index) => {
                const primaryAnswer = legalQuestions[group.primary.id];
                const showSubQuestions = primaryAnswer?.answer === true && group.subQuestions.length > 0;
                const isNo = primaryAnswer?.answer === false;
                const hasSubQuestions = group.subQuestions.length > 0;

                const isUnanswered = showErrors && !primaryAnswer?.answer && primaryAnswer?.answer !== false;
                
                return (
                  <div 
                    key={group.primary.id}
                    data-question={group.primary.id}
                    className={cn(
                      "rounded-lg border transition-all",
                      isNo && "border-border/30 bg-muted/10",
                      primaryAnswer?.answer === true && "border-amber-200/50 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/10",
                      !isNo && primaryAnswer?.answer !== true && "border-border/50 bg-background",
                      isUnanswered && "border-destructive ring-1 ring-destructive/20"
                    )}
                  >
                    {/* Primary Question */}
                    <div className="p-3">
                      <div className="flex gap-3 items-start">
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-[1.6] pr-2 text-foreground/90">{group.primary.text}</p>
                          {hasSubQuestions && !showSubQuestions && (
                            <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                              <ChevronRight className="h-2.5 w-2.5" />
                              {isNo ? 'No follow-up needed' : 'Answering "Yes" will show follow-up questions'}
                            </p>
                          )}
                        </div>
                        <RadioGroup
                          value={primaryAnswer?.answer === true ? 'yes' : primaryAnswer?.answer === false ? 'no' : ''}
                          onValueChange={value => handleAnswerChange(group.primary.id, value === 'yes')}
                          className="flex gap-2 shrink-0"
                        >
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                            primaryAnswer?.answer === false 
                              ? 'border-primary/50 bg-primary/5 text-primary' 
                              : 'border-border/50 hover:border-border'
                          }`}>
                            <RadioGroupItem value="no" id={`${group.primary.id}_no`} className="h-3.5 w-3.5" />
                            <Label htmlFor={`${group.primary.id}_no`} className="text-xs font-medium cursor-pointer">
                              No
                            </Label>
                          </div>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                            primaryAnswer?.answer === true 
                              ? 'border-amber-400/50 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' 
                              : 'border-border/50 hover:border-border'
                          }`}>
                            <RadioGroupItem value="yes" id={`${group.primary.id}_yes`} className="h-3.5 w-3.5" />
                            <Label htmlFor={`${group.primary.id}_yes`} className="text-xs font-medium cursor-pointer">
                              Yes
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Explanation for primary question if Yes and no sub-questions */}
                      {primaryAnswer?.answer === true && group.subQuestions.length === 0 && (
                        <div className="mt-3 ml-7">
                          <Textarea
                            value={primaryAnswer?.explanation || ''}
                            onChange={e => handleExplanationChange(group.primary.id, e.target.value)}
                            placeholder="Please provide details including dates and circumstances..."
                            rows={2}
                            className="text-sm bg-background"
                          />
                        </div>
                      )}
                    </div>

                    {/* Sub-questions (progressive disclosure) */}
                    {showSubQuestions && (
                      <div className="border-t border-amber-200/30 dark:border-amber-900/20 bg-amber-50/20 dark:bg-amber-950/5 px-3 py-2 space-y-2">
                        <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 font-medium ml-7">
                          Please answer the following related questions:
                        </p>
                        {group.subQuestions.map(subQ => {
                          const subAnswer = legalQuestions[subQ.id];
                          return (
                            <div key={subQ.id} className="ml-7 pl-3 border-l-2 border-amber-300/40 dark:border-amber-700/30">
                              <div className="flex gap-2 items-start">
                                <span className="text-[10px] font-medium text-amber-600/70 dark:text-amber-500/70 shrink-0 uppercase">
                                  {subQ.id}.
                                </span>
                                <p className="text-xs flex-1 text-muted-foreground leading-relaxed">{subQ.text}</p>
                                <RadioGroup
                                  value={subAnswer?.answer === true ? 'yes' : subAnswer?.answer === false ? 'no' : ''}
                                  onValueChange={value => handleAnswerChange(subQ.id, value === 'yes')}
                                  className="flex gap-2 shrink-0"
                                >
                                  <div className="flex items-center gap-1">
                                    <RadioGroupItem value="no" id={`${subQ.id}_no`} className="h-3 w-3" />
                                    <Label htmlFor={`${subQ.id}_no`} className="text-[10px] cursor-pointer">No</Label>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <RadioGroupItem value="yes" id={`${subQ.id}_yes`} className="h-3 w-3" />
                                    <Label htmlFor={`${subQ.id}_yes`} className="text-[10px] cursor-pointer">Yes</Label>
                                  </div>
                                </RadioGroup>
                              </div>
                              {subAnswer?.answer === true && (
                                <div className="mt-2">
                                  <Textarea
                                    value={subAnswer?.explanation || ''}
                                    onChange={e => handleExplanationChange(subQ.id, e.target.value)}
                                    placeholder="Please explain..."
                                    rows={2}
                                    className="text-xs bg-background"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Supporting documents upload (only if Yes answers) */}
          {hasYesAnswers && (
            <div className="flex items-center gap-3 pt-4 mt-4 border-t border-border/50">
              <input
                type="file"
                ref={fileInputRef}
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className={application.uploaded_documents?.background_explanation_docs ? 'text-primary border-primary/30' : ''}
              >
                {application.uploaded_documents?.background_explanation_docs ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-primary" />Documents uploaded</>
                ) : (
                  <><Upload className="h-3.5 w-3.5 mr-1.5" />Upload supporting documents</>
                )}
              </Button>
              <span className="text-xs text-muted-foreground">Optional: court documents, letters, etc.</span>
            </div>
          )}

          {/* Signature section */}
          <div className="mt-4 p-4 rounded-lg bg-muted/20 border border-border/40">
            <p className="text-xs font-medium text-foreground/80 mb-2">Electronic Signature</p>
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed mb-3">
              <p>By signing below, I confirm that:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>My answers above are true and complete to the best of my knowledge.</li>
                <li>I will notify Tyler Insurance Group within five days if any information changes.</li>
                <li>I understand carriers may contact me with additional questions during contracting.</li>
              </ul>
            </div>
            <div className="space-y-1.5" data-field="signature">
              <Label htmlFor="background_signature" className="text-xs">
                Type your full legal name as signature *
              </Label>
              <Input
                id="background_signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder={application.full_legal_name || "Full Legal Name"}
                className={cn(
                  "h-10 text-base font-serif italic max-w-sm",
                  showErrors && !hasSigned && "border-destructive focus:border-destructive focus:ring-destructive/20"
                )}
              />
              {showErrors && !hasSigned && (
                <p className="text-[10px] text-destructive animate-fade-in">
                  Signature required
                </p>
              )}
            </div>
          </div>

          {/* Validation warnings */}
          {showErrors && !canContinue && (
            <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg mt-4 animate-fade-in">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                {!allQuestionsAnswered && (
                  <p>
                    <span className="font-medium">Please answer all questions. </span>
                    <span className="text-destructive/80">
                      Unanswered: Question{unansweredQuestions.length > 1 ? 's' : ''} {unansweredQuestions.map(q => q.index).join(', ')}
                    </span>
                  </p>
                )}
                {!allExplanationsProvided && (
                  <p>
                    <span className="font-medium">Please provide details for "Yes" answers. </span>
                    <span className="text-destructive/80">
                      Missing explanation: Question{missingExplanations.length > 1 ? 's' : ''} {[...new Set(missingExplanations.map(q => q.index))].join(', ')}
                    </span>
                  </p>
                )}
                {!hasSigned && (
                  <p><span className="font-medium">Please sign above to continue.</span></p>
                )}
              </div>
            </div>
          )}

          {/* Initials Acknowledgment */}
          <InitialsAcknowledgmentBar initials={pageInitials} />

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t">
            <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
              Back
            </Button>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ArrowRight className="h-3 w-3" />
              <span className="text-foreground/70">Next: Banking</span>
            </p>
            <Button onClick={handleContinue}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
