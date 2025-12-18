import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, ExternalLink, Copy, Check, Server, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  timestamp: string;
  level: string;
  event_message: string;
  function_id?: string;
}

export function TestModeEdgeLogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('fetch-edge-logs', {
        body: { 
          functionName: 'generate-contracting-pdf',
          limit: 100 
        }
      });

      if (fetchError) throw fetchError;
      
      setLogs(data?.logs || []);
      setLastFetched(new Date().toLocaleTimeString());
      
      if (data?.message) {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const copyLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] [${log.level}] ${log.event_message}`
    ).join('\n');
    
    navigator.clipboard.writeText(logText || 'No logs available');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openBackend = () => {
    // This will trigger the backend panel in Lovable
    window.open('https://supabase.com/dashboard', '_blank');
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="border-purple-500/30 bg-purple-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-lg text-purple-300">Edge Function Logs</CardTitle>
            <Badge variant="outline" className="text-purple-400 border-purple-400/50">
              generate-contracting-pdf
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {lastFetched && (
              <span className="text-xs text-muted-foreground">
                Last fetched: {lastFetched}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={loading}
              className="border-purple-500/50 hover:bg-purple-500/20"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Fetching...' : 'Fetch Logs'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyLogs}
              className="border-purple-500/50 hover:bg-purple-500/20"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-md bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-amber-300 font-medium">Note</p>
                <p className="text-amber-200/80 mt-1">{error}</p>
                <p className="text-amber-200/60 mt-2 text-xs">
                  To view live logs: Open the Lovable Cloud panel → Edge Functions → generate-contracting-pdf → Logs
                </p>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="h-[300px] rounded-md border border-purple-500/20 bg-black/40 p-3">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Server className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No logs fetched yet</p>
              <p className="text-xs mt-1">Click "Fetch Logs" to retrieve recent logs</p>
              <p className="text-xs mt-3 text-center max-w-xs">
                Or use the Lovable Cloud panel to view logs in real-time after generating a PDF
              </p>
            </div>
          ) : (
            <div className="space-y-1 font-mono text-xs">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-2 py-1 border-b border-purple-500/10 last:border-0">
                  <span className="text-muted-foreground shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`shrink-0 uppercase ${getLevelColor(log.level)}`}>
                    [{log.level}]
                  </span>
                  <span className="text-foreground break-all">
                    {log.event_message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {logs.length} log entries
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-purple-400 hover:text-purple-300"
            onClick={() => {
              // Instruction for user
              alert('To view real-time logs:\n\n1. Click the "Cloud" button in the left sidebar\n2. Go to "Edge Functions"\n3. Select "generate-contracting-pdf"\n4. View the "Logs" tab');
            }}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            How to view live logs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
