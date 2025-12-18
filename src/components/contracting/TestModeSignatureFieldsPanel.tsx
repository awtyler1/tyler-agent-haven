import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSignature, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { SignatureFieldInfo } from '@/hooks/useContractingPdf';

interface TestModeSignatureFieldsPanelProps {
  fields: SignatureFieldInfo[];
}

export function TestModeSignatureFieldsPanel({ fields }: TestModeSignatureFieldsPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!fields || fields.length === 0) {
    return null;
  }

  const generateReportText = (): string => {
    const lines: string[] = [];
    lines.push('=== PDF SIGNATURE FIELDS FOUND ===');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Total Fields: ${fields.length}`);
    lines.push('');
    lines.push('Field Name\tType');
    lines.push('-'.repeat(60));
    fields.forEach(field => {
      lines.push(`${field.name}\t${field.type}`);
    });
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateReportText());
      setCopied(true);
      toast.success('Signature fields copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Card className="border-purple-300 bg-purple-50/50">
      <div className="p-4 border-b border-purple-200 bg-purple-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-purple-700" />
            <h3 className="font-semibold text-purple-900">PDF Signature Fields Found</h3>
            <Badge variant="outline" className="border-purple-400 text-purple-700 bg-purple-100">
              {fields.length} fields
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs border-purple-300 text-purple-700 hover:bg-purple-100"
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
        </div>
      </div>
      
      <div className="max-h-[250px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-purple-50/50">
              <TableHead className="text-xs font-medium text-purple-800">Field Name</TableHead>
              <TableHead className="text-xs font-medium text-purple-800 w-[120px]">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-mono text-xs text-foreground/80">
                  {field.name}
                </TableCell>
                <TableCell className="font-mono text-xs text-foreground/60">
                  {field.type}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="p-3 border-t border-purple-200 bg-purple-100/30 text-xs text-purple-700 text-center">
        Shows all signature-related fields in PDF template • Test Mode only
      </div>
    </Card>
  );
}
