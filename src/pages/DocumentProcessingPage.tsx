import { useState } from "react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ProcessingStatus {
  fileName: string;
  status: "pending" | "processing" | "success" | "error";
  message?: string;
}

const DocumentProcessingPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statuses, setStatuses] = useState<ProcessingStatus[]>([]);
  const { toast } = useToast();

  const processDocument = async (path: string, fileName: string) => {
    try {
      setStatuses(prev => prev.map(s => 
        s.fileName === fileName ? { ...s, status: "processing" } : s
      ));

      // Fetch the PDF
      const response = await fetch(path);
      const blob = await response.blob();
      const text = await blob.text();

      // Extract metadata from filename
      const parts = fileName.replace(".pdf", "").split("_");
      const carrier = parts[0];
      const documentType = fileName.includes("SOB") ? "sob" : 
                          fileName.includes("EOC") ? "eoc" :
                          fileName.includes("ANOC") ? "anoc" :
                          fileName.includes("Formulary") ? "formulary" : "other";

      // Process the document
      const processResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            documentText: text,
            documentName: fileName,
            documentType,
            carrier: carrier.toLowerCase(),
          }),
        }
      );

      if (!processResponse.ok) throw new Error("Processing failed");

      setStatuses(prev => prev.map(s => 
        s.fileName === fileName 
          ? { ...s, status: "success", message: "Processed successfully" } 
          : s
      ));

    } catch (error) {
      console.error(`Error processing ${fileName}:`, error);
      setStatuses(prev => prev.map(s => 
        s.fileName === fileName 
          ? { ...s, status: "error", message: error instanceof Error ? error.message : "Unknown error" } 
          : s
      ));
    }
  };

  const processAllDocuments = async () => {
    setIsProcessing(true);
    
    // List of documents to process (sample - add all your PDFs here)
    const documents = [
      "/downloads/Aetna_Medicare_Formulary_2026.pdf",
      "/downloads/Humana_Gold_Plus_H5619-071_HMO_EOC_2026.pdf",
      "/downloads/UHC_AARP_Essentials_KY1_HMO_H5253-099_SOB_2026.pdf",
      "/downloads/Wellcare_Formulary_2026.pdf",
      // Add more documents as needed
    ];

    const initialStatuses: ProcessingStatus[] = documents.map(path => ({
      fileName: path.split("/").pop() || path,
      status: "pending",
    }));
    
    setStatuses(initialStatuses);

    for (const path of documents) {
      const fileName = path.split("/").pop() || path;
      await processDocument(path, fileName);
      // Small delay between documents
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsProcessing(false);
    toast({
      title: "Processing Complete",
      description: "All documents have been processed",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1">
        <section className="pt-32 pb-8 md:pt-36 md:pb-10">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-2">Document Processing</h1>
            <p className="text-base md:text-lg text-foreground font-medium max-w-3xl mx-auto">
              Process carrier documents for AI chatbot
            </p>
          </div>
        </section>

        <section className="pb-16">
          <div className="container-narrow">
            <div className="max-w-2xl mx-auto">
              <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">Batch Process Documents</h2>
                </div>
                <p className="text-muted-foreground mb-6">
                  This will process all carrier plan documents and make them searchable by the AI chatbot.
                  Processing may take several minutes.
                </p>
                <Button 
                  onClick={processAllDocuments}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full"
                >
                  {isProcessing ? "Processing..." : "Start Processing"}
                </Button>
              </div>

              {statuses.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Processing Status</h3>
                  <div className="space-y-2">
                    {statuses.map((status, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-md"
                      >
                        {status.status === "pending" && (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                        {status.status === "processing" && (
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        )}
                        {status.status === "success" && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {status.status === "error" && (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {status.fileName}
                          </p>
                          {status.message && (
                            <p className="text-xs text-muted-foreground">
                              {status.message}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {status.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default DocumentProcessingPage;
