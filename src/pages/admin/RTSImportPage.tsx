import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, Check } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { importRTSCertifications } from '@/lib/rtsImport';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

interface LastImport {
  id: string;
  agents_matched: number;
  certifications_imported: number;
  created_at: string;
}

export default function RTSImportPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastImport, setLastImport] = useState<LastImport | null>(null);
  const [loadingLastImport, setLoadingLastImport] = useState(true);
  const [importResult, setImportResult] = useState<{
    agentsMatched: number;
    profilesCreated: number;
    certificationsImported: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch last import on mount
  useEffect(() => {
    fetchLastImport();
  }, []);

  // Auto-reset success state after 8 seconds
  useEffect(() => {
    if (importResult) {
      const timer = setTimeout(() => setImportResult(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [importResult]);

  const fetchLastImport = async () => {
    setLoadingLastImport(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('rts_import_logs')
        .select('id, agents_matched, certifications_imported, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setLastImport({
          id: data.id,
          agents_matched: data.agents_matched,
          certifications_imported: data.certifications_imported,
          created_at: data.created_at || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch last import:', err);
    } finally {
      setLoadingLastImport(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      setError('Please select an Excel file (.xlsx)');
      return;
    }
    setError(null);
    handleImport(file);
  };

  const handleImport = async (file: File) => {
    if (!profile?.id) return;

    setImporting(true);
    setError(null);

    try {
      const result = await importRTSCertifications({
        file,
        uploadedByProfileId: profile.id,
      });
      fetchLastImport();
      setImportResult({
        agentsMatched: result.matched,
        profilesCreated: result.profiles_created,
        certificationsImported: result.certifications_imported,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const formatNumber = (n: number) => n.toLocaleString();

  // Staleness logic
  const getDaysSinceSync = (lastSyncDate: string): number => {
    return differenceInDays(new Date(), new Date(lastSyncDate));
  };

  const isStale = (days: number): boolean => days >= 5;

  return (
    <AdminLayout maxWidth="narrow">
      <div
        className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]"
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Title */}
        <h1 className="text-2xl font-serif font-medium text-foreground mb-10">RTS Import</h1>

        {/* Calendar Widget */}
        {lastImport && !loadingLastImport && (
          <>
            <CalendarWidget lastSync={lastImport.created_at} />
            <p className="text-muted-foreground mt-6 mb-10">
              {formatNumber(lastImport.agents_matched)} agents synced
            </p>
          </>
        )}

        {/* Loading state for calendar */}
        {loadingLastImport && (
          <div className="w-36 h-44 bg-muted/50 rounded-2xl animate-pulse mb-10" />
        )}

        {/* No imports yet */}
        {!loadingLastImport && !lastImport && (
          <p className="text-muted-foreground mb-10">No imports yet</p>
        )}

        {/* Upload Button / Success State */}
        {importResult ? (
          <div className="w-full max-w-xs text-center">
            <div className="bg-green-50/50 border border-green-200/60 rounded-2xl p-6">
              <div className="w-12 h-12 bg-green-100/60 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-lg font-medium text-green-800 mb-1">Import Complete</p>
              <p className="text-sm text-green-700">
                {importResult.agentsMatched} agents synced
                {importResult.profilesCreated > 0 && ` · ${importResult.profilesCreated} new profiles created`}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setImportResult(null)}
              className="mt-4 text-muted-foreground"
            >
              Upload Another
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-xs">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="w-full py-6 bg-gold hover:bg-gold/90 text-white rounded-2xl font-medium text-base gap-2"
            >
              {importing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload New Report
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Drop .xlsx or click to browse
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50/50 border border-red-200/60 rounded-2xl text-center max-w-xs">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Calendar widget component
function CalendarWidget({ lastSync }: { lastSync: string }) {
  const syncDate = new Date(lastSync);
  const daysSince = differenceInDays(new Date(), syncDate);
  const stale = daysSince >= 5;

  return (
    <div
      className={cn(
        'bg-white border-2 rounded-2xl overflow-hidden shadow-sm w-36',
        stale ? 'border-amber-300' : 'border-stone-200'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'text-white text-center py-2',
          stale ? 'bg-amber-500' : 'bg-gold'
        )}
      >
        <p className="text-xs font-medium uppercase tracking-wide">Last Sync</p>
      </div>

      {/* Date */}
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground uppercase">
          {format(syncDate, 'MMM')}
        </p>
        <p className="text-5xl font-bold text-foreground">
          {format(syncDate, 'd')}
        </p>
        <p
          className={cn(
            'text-xs mt-1',
            stale ? 'text-amber-500' : 'text-muted-foreground'
          )}
        >
          {daysSince === 0
            ? format(syncDate, 'h:mm a')
            : `${daysSince} day${daysSince !== 1 ? 's' : ''} ago`}
        </p>
      </div>
    </div>
  );
}
