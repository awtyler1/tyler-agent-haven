import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, CheckCircle2, XCircle, MinusCircle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { MappingEntry } from '@/hooks/useContractingPdf';

export type { MappingEntry };

interface TestModeMappingReportProps {
  mappingReport: MappingEntry[];
}

export function TestModeMappingReport({ mappingReport }: TestModeMappingReportProps) {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'skipped' | 'blank'>('all');

  const successCount = mappingReport.filter(m => m.status === 'success').length;
  const failedCount = mappingReport.filter(m => m.status === 'failed').length;
  const skippedCount = mappingReport.filter(m => m.status === 'skipped').length;
  const blankCount = mappingReport.filter(m => m.isBlank).length;

  const filteredReport = mappingReport.filter(entry => {
    if (filter === 'all') return true;
    if (filter === 'blank') return entry.isBlank;
    return entry.status === filter;
  });

  const generateReportText = (): string => {
    const lines: string[] = [];
    lines.push('=== PDF MAPPING REPORT ===');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Total Fields: ${mappingReport.length}`);
    lines.push(`Success: ${successCount} | Failed: ${failedCount} | Skipped: ${skippedCount} | Blank: ${blankCount}`);
    lines.push('');
    lines.push('PDF Field Key\tValue Applied\tSource Form Field\tBlank\tStatus');
    lines.push('-'.repeat(80));
    mappingReport.forEach(entry => {
      const value = entry.valueApplied.length > 30 
        ? entry.valueApplied.substring(0, 30) + '...' 
        : entry.valueApplied || '(empty)';
      lines.push(`${entry.pdfFieldKey}\t${value}\t${entry.sourceFormField}\t${entry.isBlank ? 'Yes' : 'No'}\t${entry.status}`);
    });
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateReportText());
      setCopied(true);
      toast.success('Mapping report copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
      case 'failed': return <XCircle className="h-3.5 w-3.5 text-red-600" />;
      case 'skipped': return <MinusCircle className="h-3.5 w-3.5 text-gray-400" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5">success</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5">failed</Badge>;
      case 'skipped': return <Badge className="bg-gray-100 text-gray-600 text-[10px] px-1.5">skipped</Badge>;
      default: return null;
    }
  };

  return (
    <Card className="border-indigo-300 bg-indigo-50/50">
      <div className="p-4 border-b border-indigo-200 bg-indigo-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-700" />
            <h3 className="font-semibold text-indigo-900">PDF Mapping Report</h3>
            <Badge variant="outline" className="border-indigo-400 text-indigo-700 bg-indigo-100">
              Test Mode
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-100"
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
        
        {/* Stats */}
        <div className="flex items-center gap-3 mt-3 text-xs">
          <Badge 
            className={`cursor-pointer ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}
            onClick={() => setFilter('all')}
          >
            All ({mappingReport.length})
          </Badge>
          <Badge 
            className={`cursor-pointer ${filter === 'success' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}
            onClick={() => setFilter('success')}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Success ({successCount})
          </Badge>
          <Badge 
            className={`cursor-pointer ${filter === 'failed' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}
            onClick={() => setFilter('failed')}
          >
            <XCircle className="h-3 w-3 mr-1" />
            Failed ({failedCount})
          </Badge>
          <Badge 
            className={`cursor-pointer ${filter === 'skipped' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setFilter('skipped')}
          >
            Skipped ({skippedCount})
          </Badge>
          <Badge 
            className={`cursor-pointer ${filter === 'blank' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'}`}
            onClick={() => setFilter('blank')}
          >
            Blank ({blankCount})
          </Badge>
        </div>
      </div>
      
      <ScrollArea className="h-[350px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-indigo-50/50">
              <TableHead className="text-xs font-medium text-indigo-800 w-[200px]">PDF Field Key</TableHead>
              <TableHead className="text-xs font-medium text-indigo-800">Value Applied</TableHead>
              <TableHead className="text-xs font-medium text-indigo-800 w-[150px]">Source Field</TableHead>
              <TableHead className="text-xs font-medium text-indigo-800 w-[60px] text-center">Blank</TableHead>
              <TableHead className="text-xs font-medium text-indigo-800 w-[80px] text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReport.map((entry, idx) => (
              <TableRow key={idx} className={entry.status === 'failed' ? 'bg-red-50/50' : entry.isBlank ? 'bg-amber-50/30' : ''}>
                <TableCell className="font-mono text-xs text-foreground/80 truncate" title={entry.pdfFieldKey}>
                  {entry.pdfFieldKey}
                </TableCell>
                <TableCell className="font-mono text-xs text-foreground/70 max-w-[200px] truncate" title={entry.valueApplied}>
                  {entry.valueApplied || <span className="text-gray-400 italic">(empty)</span>}
                </TableCell>
                <TableCell className="font-mono text-xs text-foreground/60 truncate" title={entry.sourceFormField}>
                  {entry.sourceFormField}
                </TableCell>
                <TableCell className="text-center">
                  {entry.isBlank ? (
                    <span className="text-amber-600 text-xs">Yes</span>
                  ) : (
                    <span className="text-green-600 text-xs">No</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {getStatusIcon(entry.status)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredReport.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  No mappings match the selected filter
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
      
      <div className="p-3 border-t border-indigo-200 bg-indigo-100/30 text-xs text-indigo-700 text-center">
        Showing {filteredReport.length} of {mappingReport.length} field mappings • Only visible in Test Mode
      </div>
    </Card>
  );
}
