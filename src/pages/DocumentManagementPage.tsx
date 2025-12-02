import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, Upload } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ProcessingStatus {
  filename: string;
  status: "pending" | "processing" | "success" | "error";
  message?: string;
  chunksProcessed?: number;
}

export default function DocumentManagementPage() {
  const [processingStatuses, setProcessingStatuses] = useState<ProcessingStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const pdfFiles = [
    // Aetna
    "2026_Aetna_Medicare_EBC_Broker_Playbook.pdf",
    "Aetna_KY_Medicare_Broker_Managers.pdf",
    "Aetna_Medicare_2026_KY_Market_Specific_Training.pdf",
    // Add more files as needed - showing a few examples
    "Devoted_Health_Broker_Manual.pdf",
    "Humana_2026_OTC_Catalog_Order_Form.pdf",
    "KY_Humana_Market_Product_Guide_2026.pdf",
    "Wellcare_Medicare_Advantage_Sales_Presentation_2026.pdf",
  ];

  const extractMetadata = (filename: string) => {
    const parts = filename.replace(".pdf", "").split("_");
    let carrier = "unknown";
    let documentType = "guide";

    // Extract carrier from filename
    if (filename.toLowerCase().includes("aetna")) carrier = "aetna";
    else if (filename.toLowerCase().includes("anthem")) carrier = "anthem";
    else if (filename.toLowerCase().includes("devoted")) carrier = "devoted";
    else if (filename.toLowerCase().includes("humana")) carrier = "humana";
    else if (filename.toLowerCase().includes("uhc") || filename.toLowerCase().includes("united")) carrier = "unitedhealth";
    else if (filename.toLowerCase().includes("wellcare")) carrier = "wellcare";

    // Determine document type
    if (filename.includes("SOB")) documentType = "sob";
    else if (filename.includes("EOC")) documentType = "eoc";
    else if (filename.includes("ANOC")) documentType = "anoc";
    else if (filename.includes("Formulary")) documentType = "formulary";
    else if (filename.includes("Certification")) documentType = "certification";
    else if (filename.includes("Manual") || filename.includes("Guide") || filename.includes("Playbook")) documentType = "guide";

    return { carrier, documentType };
  };

  const processDocument = async (filename: string): Promise<{ chunksProcessed: number }> => {
    try {
      // Fetch PDF from public folder
      const response = await fetch(`/downloads/${filename}`);
      if (!response.ok) throw new Error("Failed to fetch PDF");

      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = "";
      const maxPages = Math.min(pdf.numPages, 50);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }

      if (!fullText.trim()) {
        throw new Error("No text could be extracted");
      }

      const { carrier, documentType } = extractMetadata(filename);

      // Send to processing edge function
      const processResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            documentText: fullText,
            documentName: filename,
            documentType,
            carrier,
          }),
        }
      );

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || "Failed to process");
      }

      const data = await processResponse.json();
      return data;
    } catch (error) {
      throw error;
    }
  };

  const processAllDocuments = async () => {
    setIsProcessing(true);
    const statuses: ProcessingStatus[] = pdfFiles.map((filename) => ({
      filename,
      status: "pending",
    }));
    setProcessingStatuses(statuses);

    for (let i = 0; i < pdfFiles.length; i++) {
      const filename = pdfFiles[i];
      
      setProcessingStatuses((prev) =>
        prev.map((s) =>
          s.filename === filename ? { ...s, status: "processing" } : s
        )
      );

      try {
        const result = await processDocument(filename);
        setProcessingStatuses((prev) =>
          prev.map((s) =>
            s.filename === filename
              ? {
                  ...s,
                  status: "success",
                  message: `Processed ${result.chunksProcessed} chunks`,
                  chunksProcessed: result.chunksProcessed,
                }
              : s
          )
        );
      } catch (error) {
        setProcessingStatuses((prev) =>
          prev.map((s) =>
            s.filename === filename
              ? {
                  ...s,
                  status: "error",
                  message: error instanceof Error ? error.message : "Failed",
                }
              : s
          )
        );
      }

      // Small delay to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsProcessing(false);
  };

  const successCount = processingStatuses.filter((s) => s.status === "success").length;
  const errorCount = processingStatuses.filter((s) => s.status === "error").length;
  const progress = processingStatuses.length > 0 
    ? ((successCount + errorCount) / processingStatuses.length) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Document Management</h1>
          <p className="text-lg text-muted-foreground">
            Process PDFs to enable AI chatbot document search
          </p>
        </div>

        <Card className="p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Batch Process Documents</h2>
              <p className="text-muted-foreground">
                Process {pdfFiles.length} PDF files from the downloads folder
              </p>
            </div>
            <Button
              onClick={processAllDocuments}
              disabled={isProcessing}
              size="lg"
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Start Processing
                </>
              )}
            </Button>
          </div>

          {processingStatuses.length > 0 && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>
                    {successCount} success, {errorCount} errors
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                {processingStatuses.map((status) => (
                  <div
                    key={status.filename}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {status.status === "success" && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      )}
                      {status.status === "error" && (
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      )}
                      {status.status === "processing" && (
                        <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                      )}
                      {status.status === "pending" && (
                        <div className="h-5 w-5 rounded-full border-2 border-muted flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {status.filename}
                        </p>
                        {status.message && (
                          <p className="text-xs text-muted-foreground">
                            {status.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
