import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Terminal, Copy, Check, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export interface DebugLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: unknown;
}

interface TestModePdfDebugPanelProps {
  logs: DebugLogEntry[];
}

export function TestModePdfDebugPanel({ logs }: TestModePdfDebugPanelProps) {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  const categories = ['all', ...new Set(logs.map(l => l.category))];

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(l => l.category === filter);

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLogs(newExpanded);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-100';
      case 'warn': return 'text-amber-600 bg-amber-100';
      case 'debug': return 'text-purple-600 bg-purple-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const generateLogsText = () => {
    const lines = [
      '=== PDF GENERATION DEBUG LOG ===',
      `Generated: ${new Date().toISOString()}`,
      `Total Entries: ${logs.length}`,
      '',
      '--- LOG ENTRIES ---',
      ...logs.map(log => {
        let line = `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}`;
        if (log.data) {
          line += `\n    Data: ${JSON.stringify(log.data, null, 2).split('\n').join('\n    ')}`;
        }
        return line;
      })
    ];
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateLogsText());
      setCopied(true);
      toast.success('Debug logs copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  if (logs.length === 0) {
    return (
      <Card className="border-slate-300 bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 bg-slate-100/50">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-slate-700" />
            <h3 className="font-semibold text-slate-900">PDF Generation Debug Log</h3>
            <Badge variant="outline" className="border-slate-400 text-slate-700 bg-slate-100">
              Test Mode
            </Badge>
          </div>
        </div>
        <div className="p-8 text-center">
          <Terminal className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 text-sm">No debug logs yet</p>
          <p className="text-slate-500 text-xs mt-1">Submit the form to generate PDF and capture debug output</p>
        </div>
      </Card>
    );
  }

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount = logs.filter(l => l.level === 'warn').length;

  return (
    <Card className="border-slate-300 bg-slate-50/50">
      <div className="p-4 border-b border-slate-200 bg-slate-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-slate-700" />
            <h3 className="font-semibold text-slate-900">PDF Generation Debug Log</h3>
            <Badge variant="outline" className="border-slate-400 text-slate-700 bg-slate-100">
              Test Mode
            </Badge>
            {errorCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {warnCount > 0 && (
              <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-100">
                {warnCount} warning{warnCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="border-slate-400 text-slate-700 hover:bg-slate-100"
          >
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? 'Copied' : 'Copy All'}
          </Button>
        </div>
        
        {/* Category filter */}
        <div className="flex items-center gap-2 mt-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-600">Filter:</span>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={filter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(cat)}
              className={`h-6 px-2 text-xs ${filter === cat ? '' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
            >
              {cat === 'all' ? 'All' : cat}
            </Button>
          ))}
        </div>
      </div>
      
      <ScrollArea className="h-[400px]">
        <div className="p-2 space-y-1 font-mono text-xs">
          {filteredLogs.map((log, index) => (
            <div 
              key={index} 
              className={`p-2 rounded border ${
                log.level === 'error' ? 'border-red-200 bg-red-50/50' :
                log.level === 'warn' ? 'border-amber-200 bg-amber-50/50' :
                'border-slate-200 bg-white'
              }`}
            >
              <div 
                className="flex items-start gap-2 cursor-pointer"
                onClick={() => log.data && toggleExpand(index)}
              >
                {log.data && (
                  <span className="text-slate-400 mt-0.5">
                    {expandedLogs.has(index) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </span>
                )}
                <span className="text-slate-400 shrink-0">{log.timestamp}</span>
                <Badge className={`${getLevelColor(log.level)} px-1.5 py-0 text-[10px] h-4 shrink-0`}>
                  {log.level.toUpperCase()}
                </Badge>
                <span className="text-slate-500 shrink-0">[{log.category}]</span>
                <span className="text-slate-800 break-all">{log.message}</span>
              </div>
              {log.data && expandedLogs.has(index) && (
                <pre className="mt-2 ml-6 p-2 bg-slate-100 rounded text-[10px] overflow-x-auto text-slate-700">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-slate-200 bg-slate-100/30 text-xs text-slate-700 text-center">
        {filteredLogs.length} log entries • Edge function debug output
      </div>
    </Card>
  );
}
