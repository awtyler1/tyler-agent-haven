import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ContractingApplication, LEGAL_QUESTIONS, LegalQuestion } from '@/types/contracting';
import { AlertTriangle, Upload } from 'lucide-react';
import { useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WizardProgress } from '../WizardProgress';

interface ProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

interface LegalQuestionsStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, type: string) => Promise<string | null>;
  onBack: () => void;
  onContinue: () => void;
  progressProps: ProgressProps;
}

export function LegalQuestionsStep({ application, onUpdate, onUpload, onBack, onContinue, progressProps }: LegalQuestionsStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legalQuestions = (application.legal_questions as Record<string, LegalQuestion>) || {};

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

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="border-0 shadow-lg">
        {/* Progress + Header */}
        <div className="pt-3 pb-2 text-center border-b border-border/30">
          <WizardProgress {...progressProps} compact />
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <AlertTriangle className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-base font-semibold">Background Questions</h2>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Answer each question. If Yes, provide details below.
          </p>
        </div>
        <CardContent className="space-y-3 py-3">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {LEGAL_QUESTIONS.map((question) => {
                const answer = legalQuestions[question.id];
                const showExplanation = answer?.answer === true;
                const isSubQuestion = 'isSubQuestion' in question && question.isSubQuestion;
                const isParent = 'isParent' in question && question.isParent;

                return (
                  <div 
                    key={question.id} 
                    className={`space-y-1.5 pb-2 ${isSubQuestion ? 'ml-6 border-l-2 border-muted pl-3' : 'border-b last:border-0'} ${isParent ? 'bg-muted/30 p-2 rounded' : ''}`}
                  >
                    <div className="flex gap-2 items-start">
                      <span className={`font-medium text-xs text-muted-foreground shrink-0 ${isSubQuestion ? 'w-6' : 'w-5'}`}>
                        {question.id.toUpperCase()}.
                      </span>
                      <p className={`text-xs flex-1 ${isParent ? 'font-medium' : ''}`}>{question.text}</p>
                      <RadioGroup
                        value={answer?.answer === true ? 'yes' : answer?.answer === false ? 'no' : ''}
                        onValueChange={value => handleAnswerChange(question.id, value === 'yes')}
                        className="flex gap-3 shrink-0"
                      >
                        <div className="flex items-center gap-1">
                          <RadioGroupItem value="yes" id={`${question.id}_yes`} className="h-3 w-3" />
                          <Label htmlFor={`${question.id}_yes`} className="text-xs font-normal cursor-pointer">
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center gap-1">
                          <RadioGroupItem value="no" id={`${question.id}_no`} className="h-3 w-3" />
                          <Label htmlFor={`${question.id}_no`} className="text-xs font-normal cursor-pointer">
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {showExplanation && (
                      <div className={`p-2 bg-muted/50 rounded ${isSubQuestion ? '' : 'ml-5'}`}>
                        <Textarea
                          value={answer?.explanation || ''}
                          onChange={e => handleExplanationChange(question.id, e.target.value)}
                          placeholder="Explain with dates and details..."
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {hasYesAnswers && (
            <div className="flex items-center gap-3 pt-2 border-t">
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
                className="h-7 text-xs"
              >
                <Upload className="h-3 w-3 mr-1" />
                {application.uploaded_documents?.background_explanation_docs
                  ? '✓ Docs uploaded'
                  : 'Upload supporting docs'}
              </Button>
              <span className="text-xs text-muted-foreground">Optional: court docs, letters, etc.</span>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onBack} size="sm">
              Back
            </Button>
            <Button onClick={onContinue} size="sm">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
