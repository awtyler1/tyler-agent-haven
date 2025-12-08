import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ContractingApplication, LEGAL_QUESTIONS, LegalQuestion } from '@/types/contracting';
import { AlertTriangle, Upload } from 'lucide-react';
import { useRef } from 'react';

interface LegalQuestionsStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, type: string) => Promise<string | null>;
  onBack: () => void;
  onContinue: () => void;
}

export function LegalQuestionsStep({ application, onUpdate, onUpload, onBack, onContinue }: LegalQuestionsStepProps) {
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
  const allAnswered = LEGAL_QUESTIONS.every(q => legalQuestions[q.id]?.answer !== null && legalQuestions[q.id]?.answer !== undefined);

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Legal & Background Questions
          </CardTitle>
          <CardDescription>
            Answer each question carefully. If you answer Yes, you will be asked to provide more detail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {LEGAL_QUESTIONS.map((question, index) => {
            const answer = legalQuestions[question.id];
            const showExplanation = answer?.answer === true;

            return (
              <div key={question.id} className="space-y-3 pb-4 border-b last:border-0">
                <div className="flex gap-4">
                  <span className="font-medium text-muted-foreground shrink-0">
                    {index + 1}.
                  </span>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm">{question.text}</p>
                    
                    <RadioGroup
                      value={answer?.answer === true ? 'yes' : answer?.answer === false ? 'no' : ''}
                      onValueChange={value => handleAnswerChange(question.id, value === 'yes')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="yes" id={`${question.id}_yes`} />
                        <Label htmlFor={`${question.id}_yes`} className="font-normal cursor-pointer">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="no" id={`${question.id}_no`} />
                        <Label htmlFor={`${question.id}_no`} className="font-normal cursor-pointer">
                          No
                        </Label>
                      </div>
                    </RadioGroup>

                    {showExplanation && (
                      <div className="space-y-2 ml-4 p-3 bg-muted/50 rounded-lg">
                        <Label htmlFor={`${question.id}_explanation`}>
                          Please explain (include dates, actions, and descriptions)
                        </Label>
                        <Textarea
                          id={`${question.id}_explanation`}
                          value={answer?.explanation || ''}
                          onChange={e => handleExplanationChange(question.id, e.target.value)}
                          placeholder="Provide details..."
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {hasYesAnswers && (
            <div className="space-y-3 pt-4 border-t">
              <Label>Supporting Documents (optional)</Label>
              <p className="text-sm text-muted-foreground">
                Upload any court documents, letters, or other supporting documentation.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {application.uploaded_documents?.background_explanation_docs
                  ? '✓ Documents uploaded'
                  : 'Upload supporting documents'}
              </Button>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={onContinue}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}