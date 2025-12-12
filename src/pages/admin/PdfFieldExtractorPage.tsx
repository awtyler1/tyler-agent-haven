import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface FieldInfo {
  name: string;
  type: string;
  value: string | boolean | null;
  options: string[] | null;
}

interface ExtractResult {
  success: boolean;
  totalFields: number;
  pageCount: number;
  fields: FieldInfo[];
  grouped: {
    textFields: FieldInfo[];
    checkboxes: FieldInfo[];
    dropdowns: FieldInfo[];
    radioGroups: FieldInfo[];
    other: FieldInfo[];
  };
}

export default function PdfFieldExtractorPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        // Call the edge function
        const { data, error: fnError } = await supabase.functions.invoke('extract-pdf-fields', {
          body: { pdfBase64: base64 },
        });

        if (fnError) {
          throw fnError;
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setResult(data);
        toast.success(`Found ${data.totalFields} form fields`);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Failed to extract fields: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const copyFieldNames = () => {
    if (!result) return;
    const names = result.fields.map(f => f.name).join('\n');
    navigator.clipboard.writeText(names);
    toast.success('Field names copied to clipboard');
  };

  const copyAsJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast.success('Full result copied as JSON');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">PDF Field Extractor</h1>
        <p className="text-muted-foreground mb-6">
          Upload a fillable PDF to extract all form field names for mapping.
        </p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={loading}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                disabled:opacity-50"
            />
            {loading && <p className="mt-2 text-muted-foreground">Extracting fields...</p>}
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <>
            <div className="flex gap-2 mb-4">
              <Button onClick={copyFieldNames} variant="outline">
                Copy Field Names
              </Button>
              <Button onClick={copyAsJson} variant="outline">
                Copy as JSON
              </Button>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  Summary: {result.totalFields} fields across {result.pageCount} pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  <li>{result.grouped.textFields.length} text fields</li>
                  <li>{result.grouped.checkboxes.length} checkboxes</li>
                  <li>{result.grouped.dropdowns.length} dropdowns</li>
                  <li>{result.grouped.radioGroups.length} radio groups</li>
                  {result.grouped.other.length > 0 && (
                    <li>{result.grouped.other.length} other</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">#</th>
                        <th className="text-left py-2 px-2">Field Name</th>
                        <th className="text-left py-2 px-2">Type</th>
                        <th className="text-left py-2 px-2">Current Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.fields.map((field, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2 text-muted-foreground">{idx + 1}</td>
                          <td className="py-2 px-2 font-mono text-xs">{field.name}</td>
                          <td className="py-2 px-2 text-muted-foreground">
                            {field.type.replace('PDF', '')}
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">
                            {field.value !== null ? String(field.value) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
