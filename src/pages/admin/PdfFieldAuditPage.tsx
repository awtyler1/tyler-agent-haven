import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileSearch, Loader2, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FieldInfo {
  fieldName: string;
  fieldType: string;
  pageIndex: number;
  rect: { x: number; y: number; width: number; height: number } | null;
}

interface AuditResult {
  summary: {
    totalFields: number;
    totalPages: number;
    byType: Record<string, number>;
    byPage: Record<number, number>;
    signatureFields: string[];
  };
  fields: FieldInfo[];
}

export default function PdfFieldAuditPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Fetch PDF from public folder
      const response = await fetch("/templates/TIG_Contracting_Packet_Template.pdf");
      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.status}`);
      }

      // Convert to base64
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      console.log("Template loaded, size:", arrayBuffer.byteLength, "base64 length:", base64.length);

      // Call audit endpoint
      const { data, error: fnError } = await supabase.functions.invoke("pdf-field-audit", {
        body: { templateBase64: base64 },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pdf-field-audit.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const signatureFields = result?.fields.filter(f => f.fieldType === "signature") || [];
  const signaturePages = [...new Set(signatureFields.map(f => f.pageIndex))];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">PDF Field Audit</h1>
              <p className="text-muted-foreground">Analyze form fields in the contracting PDF template</p>
            </div>
          </div>
          <div className="flex gap-2">
            {result && (
              <Button variant="outline" onClick={downloadJson}>
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </Button>
            )}
            <Button onClick={runAudit} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSearch className="h-4 w-4 mr-2" />
              )}
              Run Audit
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{result.summary.totalFields}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{result.summary.totalPages}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Signature Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{signatureFields.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pages with Signatures</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{signaturePages.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Field Types */}
            <Card>
              <CardHeader>
                <CardTitle>Fields by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.summary.byType).map(([type, count]) => (
                    <Badge
                      key={type}
                      variant={type === "signature" ? "default" : "secondary"}
                      className="text-sm"
                    >
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Signature Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Signature Fields
                  <Badge>{signatureFields.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {signatureFields.length === 0 ? (
                  <p className="text-muted-foreground">No signature fields found</p>
                ) : (
                  <div className="space-y-2">
                    {signatureFields.map((field, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{field.fieldName}</p>
                          <p className="text-sm text-muted-foreground">Page {field.pageIndex + 1}</p>
                        </div>
                        {field.rect && (
                          <code className="text-xs bg-background px-2 py-1 rounded">
                            x:{field.rect.x.toFixed(0)} y:{field.rect.y.toFixed(0)} w:{field.rect.width.toFixed(0)} h:{field.rect.height.toFixed(0)}
                          </code>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Fields Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Fields (sorted by page, then name)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-[600px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Page</th>
                        <th className="text-left p-2">Rect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.fields.map((field, idx) => (
                        <tr
                          key={idx}
                          className={`border-b hover:bg-muted/50 ${
                            field.fieldType === "signature" ? "bg-primary/5" : ""
                          }`}
                        >
                          <td className="p-2 font-mono text-xs">{field.fieldName}</td>
                          <td className="p-2">
                            <Badge
                              variant={field.fieldType === "signature" ? "default" : "outline"}
                              className="text-xs"
                            >
                              {field.fieldType}
                            </Badge>
                          </td>
                          <td className="p-2">{field.pageIndex + 1}</td>
                          <td className="p-2 font-mono text-xs">
                            {field.rect
                              ? `(${field.rect.x.toFixed(0)}, ${field.rect.y.toFixed(0)}, ${field.rect.width.toFixed(0)}, ${field.rect.height.toFixed(0)})`
                              : "-"}
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
      </div>
    </div>
  );
}
