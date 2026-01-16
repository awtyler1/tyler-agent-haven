import { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { importRTSCertifications, RTSImportResult } from '@/lib/rtsImport';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

interface LastImport {
  id: string;
  file_name: string;
  agents_matched: number;
  agents_skipped: number;
  certifications_imported: number;
  created_at: string;
  uploader_name: string | null;
}

export default function RTSImportPage() {
  const { profile } = useProfile();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<RTSImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [lastImport, setLastImport] = useState<LastImport | null>(null);
  const [loadingLastImport, setLoadingLastImport] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch last import on mount
  useEffect(() => {
    fetchLastImport();
  }, []);

  const fetchLastImport = async () => {
    setLoadingLastImport(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('rts_import_logs')
        .select(`
          id,
          file_name,
          agents_matched,
          agents_skipped,
          certifications_imported,
          created_at,
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setLastImport({
          id: data.id,
          file_name: data.file_name,
          agents_matched: data.agents_matched,
          agents_skipped: data.agents_skipped,
          certifications_imported: data.certifications_imported,
          created_at: data.created_at || '',
          uploader_name: (data.profiles as { full_name: string | null })?.full_name,
        });
      }
    } catch (err) {
      console.error('Failed to fetch last import:', err);
    } finally {
      setLoadingLastImport(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.name.endsWith('.xlsx')) {
      setSelectedFile(file);
      setResult(null);
      setError(null);
    } else {
      setError('Please select an Excel file (.xlsx)');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !profile?.id) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const importResult = await importRTSCertifications({
        file: selectedFile,
        uploadedByProfileId: profile.id,
      });
      setResult(importResult);
      // Refresh last import after successful import
      fetchLastImport();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatNumber = (n: number) => n.toLocaleString();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">RTS Certification Import</h1>
            <p className="text-sm text-slate-500">Import agent certifications from Pinnacle RTS reports</p>
          </div>
        </div>

        {/* Last Import Info */}
        {!loadingLastImport && lastImport && (
          <Card className="mb-6 bg-slate-50 border-slate-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="font-medium">Last import:</span>
                <span className="text-slate-900">{lastImport.file_name}</span>
                <span className="text-slate-400">·</span>
                <span>{format(new Date(lastImport.created_at), 'MMM d, yyyy')}</span>
                {lastImport.uploader_name && (
                  <>
                    <span className="text-slate-400">by</span>
                    <span>{lastImport.uploader_name}</span>
                  </>
                )}
              </div>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-emerald-700">
                  <span className="font-semibold">{formatNumber(lastImport.agents_matched)}</span> agents matched
                </span>
                <span className="text-slate-500">
                  <span className="font-semibold">{formatNumber(lastImport.agents_skipped)}</span> skipped
                </span>
                <span className="text-emerald-700">
                  <span className="font-semibold">{formatNumber(lastImport.certifications_imported)}</span> certifications
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Upload the Pinnacle RTS report (.xlsx) to update agent certification statuses.
              Agents are matched by NPN - only registered agents will be updated.
            </p>
            <ul className="mt-3 text-sm text-slate-600 list-disc list-inside space-y-1">
              <li>File must be an Excel file (.xlsx) with a sheet named "Certs"</li>
              <li>Column D should contain the agent NPN</li>
              <li>Certification columns should be in format "Carrier: Product" (e.g., "Aetna: MA")</li>
            </ul>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upload File</CardTitle>
            <CardDescription>Select or drag and drop your RTS report</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Dropzone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive
                  ? "border-emerald-500 bg-emerald-50"
                  : selectedFile
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-slate-300 hover:border-slate-400"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <FileSpreadsheet className="h-10 w-10 text-emerald-600 mb-3" />
                  <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-slate-500"
                    onClick={handleReset}
                  >
                    Choose different file
                  </Button>
                </div>
              ) : (
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-emerald-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Excel files only (.xlsx)</p>
                </label>
              )}
            </div>

            {/* Import Button */}
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleImport}
                disabled={!selectedFile || importing || !profile?.id}
                className="gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import Certifications
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Import Failed</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Display */}
        {result && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-base text-emerald-900">Import Complete</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <p className="text-2xl font-bold text-emerald-700">{formatNumber(result.matched)}</p>
                  <p className="text-sm text-slate-600">Agents matched</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <p className="text-2xl font-bold text-slate-500">{formatNumber(result.skipped)}</p>
                  <p className="text-sm text-slate-600">Skipped</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <p className="text-2xl font-bold text-emerald-700">{formatNumber(result.certifications_imported)}</p>
                  <p className="text-sm text-slate-600">Certifications</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <p className="text-2xl font-bold text-emerald-700">{formatNumber(result.carrier_statuses_updated)}</p>
                  <p className="text-sm text-slate-600">Contracted</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900 mb-2">
                    {result.errors.length} warning(s):
                  </p>
                  <ul className="text-xs text-amber-800 space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Import Another File
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
