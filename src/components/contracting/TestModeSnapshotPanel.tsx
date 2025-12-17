import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, Hash, FileText } from 'lucide-react';
import { ContractingApplication } from '@/types/contracting';

interface SubmissionSnapshot {
  timestamp: string;
  submissionId: string;
  data: Partial<ContractingApplication>;
}

interface TestModeSnapshotPanelProps {
  snapshot: SubmissionSnapshot;
}

export function TestModeSnapshotPanel({ snapshot }: TestModeSnapshotPanelProps) {
  // Format value for display
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        if (value.length === 0) return '(empty array)';
        return JSON.stringify(value, null, 2);
      }
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'string' && value.startsWith('data:image')) {
      return '(base64 image data)';
    }
    return String(value);
  };

  // Get all field entries sorted alphabetically
  const fieldEntries = Object.entries(snapshot.data)
    .filter(([key]) => !['id', 'user_id', 'created_at', 'updated_at'].includes(key))
    .sort(([a], [b]) => a.localeCompare(b));

  const formattedTimestamp = new Date(snapshot.timestamp).toLocaleString();

  return (
    <Card className="border-amber-300 bg-amber-50/50">
      <div className="p-4 border-b border-amber-200 bg-amber-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-700" />
            <h3 className="font-semibold text-amber-900">Last Submission Snapshot</h3>
            <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-100">
              Test Mode
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-amber-700">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{formattedTimestamp}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5" />
            <span className="font-mono text-xs">{snapshot.submissionId}</span>
          </div>
        </div>
      </div>
      
      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-1">
          {fieldEntries.map(([fieldName, value]) => (
            <div 
              key={fieldName} 
              className="grid grid-cols-[200px_1fr] gap-2 py-1.5 border-b border-amber-100 last:border-0"
            >
              <div className="font-mono text-xs text-amber-800 font-medium break-all">
                {fieldName}
              </div>
              <div className="font-mono text-xs text-foreground/80 whitespace-pre-wrap break-all">
                {formatValue(value)}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-amber-200 bg-amber-100/30 text-xs text-amber-700 text-center">
        {fieldEntries.length} fields captured • Production behavior unchanged when Test Mode is off
      </div>
    </Card>
  );
}
