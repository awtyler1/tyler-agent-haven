import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, XCircle, Copy, Check } from 'lucide-react';
import { SectionValidation } from '@/hooks/useFormValidation';
import { ContractingApplication } from '@/types/contracting';
import { toast } from 'sonner';

interface ValidationReportProps {
  sectionErrors: Record<string, SectionValidation>;
  application: ContractingApplication;
  isFormValid: boolean;
}

export function TestModeValidationReport({ sectionErrors, application, isFormValid }: ValidationReportProps) {
  const [copied, setCopied] = useState(false);

  // Get field value from application
  const getFieldValue = (fieldName: string): string => {
    // Handle nested fields
    if (fieldName.includes('_ack')) {
      return '(section not acknowledged)';
    }
    
    if (fieldName.startsWith('legal_explanation_')) {
      const questionId = fieldName.replace('legal_explanation_', '');
      const legalQuestions = (application.legal_questions || {}) as Record<string, { answer: boolean; explanation?: string }>;
      return legalQuestions[questionId]?.explanation || '(empty)';
    }

    const value = (application as unknown as Record<string, unknown>)[fieldName];
    
    if (value === null || value === undefined) return '(empty)';
    if (value === '') return '(empty string)';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.length === 0 ? '(empty array)' : `[${value.length} items]`;
      }
      // Check if address-like object
      const addr = value as Record<string, unknown>;
      if ('street' in addr || 'city' in addr) {
        const parts = [addr.street, addr.city, addr.state, addr.zip].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : '(incomplete address)';
      }
      return JSON.stringify(value).substring(0, 50) + '...';
    }
    if (typeof value === 'string' && value.startsWith('data:image')) {
      return '(image data present)';
    }
    return String(value);
  };

  // Count total errors
  const totalErrors = Object.values(sectionErrors).reduce(
    (sum, section) => sum + section.errors.length, 
    0
  );

  // Get sections with errors
  const sectionsWithErrors = Object.values(sectionErrors).filter(s => !s.isValid);
  const sectionsValid = Object.values(sectionErrors).filter(s => s.isValid);

  // Generate text report for clipboard
  const generateReportText = (): string => {
    const lines: string[] = [];
    lines.push('=== VALIDATION REPORT ===');
    lines.push(`Status: ${isFormValid ? 'ALL VALID' : `${totalErrors} FAILED`}`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    
    if (sectionsWithErrors.length > 0) {
      lines.push('--- FAILED VALIDATIONS ---');
      sectionsWithErrors.forEach(section => {
        lines.push(`\n[${section.sectionName}] (${section.errors.length} issue${section.errors.length > 1 ? 's' : ''})`);
        section.errors.forEach(error => {
          lines.push(`  • Field: ${error.field}`);
          lines.push(`    Rule: ${error.message}`);
          lines.push(`    Value: ${getFieldValue(error.field)}`);
        });
      });
      lines.push('');
    }
    
    if (sectionsValid.length > 0) {
      lines.push('--- PASSED SECTIONS ---');
      lines.push(sectionsValid.map(s => s.sectionName).join(', '));
    }
    
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateReportText());
      setCopied(true);
      toast.success('Validation report copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Card className="border-orange-300 bg-orange-50/50">
      <div className="p-4 border-b border-orange-200 bg-orange-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-700" />
            <h3 className="font-semibold text-orange-900">Validation Report</h3>
            <Badge variant="outline" className="border-orange-400 text-orange-700 bg-orange-100">
              Test Mode
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
            {isFormValid ? (
              <Badge className="bg-green-100 text-green-700 border-green-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                All Valid
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700 border-red-300">
                <XCircle className="h-3 w-3 mr-1" />
                {totalErrors} Failed
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-orange-700 mt-2">
          In Test Mode, validations do not block submission. This report shows what would fail in production.
        </p>
      </div>
      
      <ScrollArea className="h-[350px]">
        <div className="p-4 space-y-4">
          {/* Failed Sections */}
          {sectionsWithErrors.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-red-800 flex items-center gap-1.5">
                <XCircle className="h-4 w-4" />
                Failed Validations ({totalErrors})
              </h4>
              {sectionsWithErrors.map((section) => (
                <div key={section.sectionId} className="border border-red-200 rounded-lg bg-red-50/50 overflow-hidden">
                  <div className="px-3 py-2 bg-red-100/50 border-b border-red-200">
                    <span className="text-sm font-medium text-red-900">{section.sectionName}</span>
                    <span className="text-xs text-red-600 ml-2">({section.errors.length} issue{section.errors.length > 1 ? 's' : ''})</span>
                  </div>
                  <div className="divide-y divide-red-100">
                    {section.errors.map((error, idx) => (
                      <div key={idx} className="px-3 py-2 grid grid-cols-[140px_1fr_1fr] gap-2 text-xs">
                        <div className="font-mono text-red-800 font-medium truncate" title={error.field}>
                          {error.field}
                        </div>
                        <div className="text-red-700">
                          {error.message}
                        </div>
                        <div className="font-mono text-foreground/70 truncate" title={getFieldValue(error.field)}>
                          {getFieldValue(error.field)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Passed Sections */}
          {sectionsValid.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-green-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Passed Sections ({sectionsValid.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {sectionsValid.map((section) => (
                  <Badge 
                    key={section.sectionId} 
                    variant="outline" 
                    className="border-green-300 text-green-700 bg-green-50"
                  >
                    {section.sectionName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-orange-200 bg-orange-100/30 text-xs text-orange-700 text-center">
        Submission proceeds despite failures in Test Mode • Production mode will block submission
      </div>
    </Card>
  );
}
