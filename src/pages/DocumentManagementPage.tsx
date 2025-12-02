import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, Upload } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
    // Aetna (46 files)
    "2026_Aetna_Medicare_EBC_Broker_Playbook.pdf",
    "Aetna_KY_Medicare_Broker_Managers.pdf",
    "Aetna_Medicare_2026_KY_Market_Specific_Training.pdf",
    "Aetna_Medicare_Eagle_Giveback_PPO_H5521-488_ANOC_2026.pdf",
    "Aetna_Medicare_Eagle_Giveback_PPO_H5521-488_EOC_2026.pdf",
    "Aetna_Medicare_Eagle_Giveback_PPO_H5521-488_Formulary_2026.pdf",
    "Aetna_Medicare_Eagle_Giveback_PPO_H5521-488_SOB_2026.pdf",
    "Aetna_Medicare_Formulary_2026.pdf",
    "Aetna_Medicare_HIDE_HMO_DSNP_H0628-012_ANOC_2026.pdf",
    "Aetna_Medicare_HIDE_HMO_DSNP_H0628-012_EOC_2026.pdf",
    "Aetna_Medicare_HIDE_HMO_DSNP_H0628-012_Formulary_2026.pdf",
    "Aetna_Medicare_HIDE_HMO_DSNP_H0628-012_SOB_2026.pdf",
    "Aetna_Medicare_Partial_Dual_HMO_DSNP_H0628-040_EOC_2026.pdf",
    "Aetna_Medicare_Partial_Dual_HMO_DSNP_H0628-040_Formulary_2026.pdf",
    "Aetna_Medicare_Partial_Dual_HMO_DSNP_H0628-040_SOB_2026.pdf",
    "Aetna_Medicare_Signature_Extra_HMO-POS_H0628-007.pdf",
    "Aetna_Medicare_Signature_Extra_HMO-POS_H0628-007_ANOC_2026.pdf",
    "Aetna_Medicare_Signature_Extra_HMO-POS_H0628-007_EOC_2026.pdf",
    "Aetna_Medicare_Signature_HMO-POS_H0628-008_2026_SOB.pdf",
    "Aetna_Medicare_Signature_HMO-POS_H0628-008_ANOC_2026.pdf",
    "Aetna_Medicare_Signature_HMO-POS_H0628-008_EOC_2026.pdf",
    "Aetna_Medicare_Signature_HMO-POS_H0628-008_Formulary_2026.pdf",
    "Aetna_Medicare_Signature_HMO-POS_H0628-010_ANOC_2026.pdf",
    "Aetna_Medicare_Signature_HMO-POS_H0628-010_EOC_2026.pdf",
    "Aetna_Medicare_Signature_HMO-POS_H0628-010_Formulary_2026.pdf",
    "Aetna_Medicare_Signature_HMO-POS_H0628-010_SOB_2026.pdf",
    "Aetna_Medicare_Signature_HMO-POS_H0628-024_ANOC_2026.pdf",
    "Aetna_Medicare_Signature_HMO-POS_H0628-024_EOC_2026.pdf",
    "Aetna_Medicare_Signature_HMO-POS_H0628-024_Formulary_2026.pdf",
    "Aetna_Medicare_Signature_HMO-POS_H0628-024_SOB_2026.pdf",
    "Aetna_Medicare_Signature_PPO_H5521-085_ANOC_2026.pdf",
    "Aetna_Medicare_Signature_PPO_H5521-085_EOC_2026.pdf",
    "Aetna_Medicare_Signature_PPO_H5521-085_Formulary_2026.pdf",
    "Aetna_Medicare_Signature_PPO_H5521-085_SOB_2026.pdf",
    "Aetna_Medicare_Signature_PPO_H5521-156_ANOC_2026.pdf",
    "Aetna_Medicare_Signature_PPO_H5521-156_EOC_2026.pdf",
    "Aetna_Medicare_Signature_PPO_H5521-156_Formulary_2026.pdf",
    "Aetna_Medicare_Signature_PPO_H5521-156_SOB_2026.pdf",
    "Aetna_Medicare_Signature_PPO_H5521-260_ANOC_2026.pdf",
    "Aetna_Medicare_Signature_PPO_H5521-260_EOC_2026.pdf",
    "Aetna_Medicare_Signature_PPO_H5521-260_Formulary_2026.pdf",
    "Aetna_Medicare_Signature_PPO_H5521-260_SOB_2026.pdf",
    "Aetna_Medicare_Value_Plus_PPO_H5521-490_ANOC_2026.pdf",
    "Aetna_Medicare_Value_Plus_PPO_H5521-490_EOC_2026.pdf",
    "Aetna_Medicare_Value_Plus_PPO_H5521-490_Formulary_2026.pdf",
    "Aetna_Medicare_Value_Plus_PPO_H5521-490_SOB_2026.pdf",
    // Anthem (16 files)
    "Anthem_Kidney_Care_HMO-POS_C-SNP_H9525-011-000_Application_2026.pdf",
    "Anthem_Kidney_Care_HMO-POS_C-SNP_H9525-011-000_EOC_2026.pdf",
    "Anthem_Kidney_Care_HMO-POS_C-SNP_H9525-011-000_SOB_2026.pdf",
    "Anthem_Medicare_Advantage_HMO-POS_H9525-013-001_Application_2026.pdf",
    "Anthem_Medicare_Advantage_HMO-POS_H9525-013-001_EOC_2026.pdf",
    "Anthem_Medicare_Advantage_HMO-POS_H9525-013-001_SOB_2026.pdf",
    "Anthem_Medicare_Advantage_HMO-POS_H9525-013-002_Application_2026.pdf",
    "Anthem_Medicare_Advantage_HMO-POS_H9525-013-002_EOC_2026.pdf",
    "Anthem_Medicare_Advantage_HMO-POS_H9525-013-002_SOB_2026.pdf",
    "Anthem_Medicare_Advantage_HMO-POS_H9525-013-003_Application_2026.pdf",
    "Anthem_Medicare_Advantage_HMO-POS_H9525-013-003_EOC_2026.pdf",
    "Anthem_Medicare_Advantage_HMO-POS_H9525-013-003_SOB_2026.pdf",
    "Anthem_Medicare_Advantage_HMO-POS_H9525-013-005_Application_2026.pdf",
    "Anthem_Medicare_Advantage_HMO-POS_H9525-013-005_EOC_2026.pdf",
    "Anthem_Medicare_Advantage_HMO-POS_H9525-013-005_SOB_2026.pdf",
    "Anthem_Non-Commissionable-MA-Plans_ABCBS.pdf",
    // Devoted (12 files)
    "Devoted_C-SNP_Choice_Plus_004_KY_EOC_2026.pdf",
    "Devoted_C-SNP_Choice_Plus_004_KY_SOB_2026.pdf",
    "Devoted_C-SNP_Choice_Premium_006_KY_EOC_2026.pdf",
    "Devoted_C-SNP_Choice_Premium_006_KY_SOB_2026.pdf",
    "Devoted_Choice_001_KY_ANOC_2026.pdf",
    "Devoted_Choice_001_KY_EOC_2026.pdf",
    "Devoted_Choice_001_KY_SOB_2026.pdf",
    "Devoted_Choice_Giveback_002_KY_ANOC_2026.pdf",
    "Devoted_Choice_Giveback_002_KY_EOC_2026.pdf",
    "Devoted_Choice_Giveback_002_KY_SOB_2026.pdf",
    "Devoted_Drug_List_2026.pdf",
    "Devoted_Health_Broker_Manual.pdf",
    // Humana (33 files)
    "HumanaChoice_Giveback_H7617-049_PPO_EOC_2026.pdf",
    "HumanaChoice_Giveback_H7617-049_PPO_SOB_2026.pdf",
    "HumanaChoice_H7617-050_PPO_H7617-050-000_EOC_2026.pdf",
    "HumanaChoice_H7617-050_PPO_H7617-050-000_SOB_2026.pdf",
    "HumanaChoice_SNP-DE_H5525-045_PPO_DSNP_HIDE_ANOC_2026.pdf",
    "HumanaChoice_SNP-DE_H5525-045_PPO_DSNP_HIDE_EOC_2026.pdf",
    "HumanaChoice_SNP-DE_H5525-045_PPO_DSNP_HIDE_SOB_2026.pdf",
    "Humana_2026_OTC_Catalog_Order_Form.pdf",
    "Humana_Community_HMO_H1036-236-000_ANOC_2026.pdf",
    "Humana_Community_HMO_H1036-236-000_EOC_2026.pdf",
    "Humana_Community_HMO_H1036-236-000_SOB_2026.pdf",
    "Humana_Community_HMO_H5178-002-000_ANOC_2026.pdf",
    "Humana_Community_HMO_H5178-002-000_EOC_2026.pdf",
    "Humana_Community_HMO_H5178-002-000_SOB_2026.pdf",
    "Humana_Dual_Select_H5619-075_HMO_DSNP_HIDE_ANOC_2026.pdf",
    "Humana_Dual_Select_H5619-075_HMO_DSNP_HIDE_EOC_2026.pdf",
    "Humana_Dual_Select_H5619-075_HMO_DSNP_HIDE_SOB_2026.pdf",
    "Humana_Gold_Plus_CKD_HMO_CSNP_H5619-170_ANOC_2026.pdf",
    "Humana_Gold_Plus_CKD_HMO_CSNP_H5619-170_EOC_2026.pdf",
    "Humana_Gold_Plus_CKD_HMO_CSNP_H5619-170_SOB_2026.pdf",
    "Humana_Gold_Plus_H5619-071_HMO_ANOC_2026.pdf",
    "Humana_Gold_Plus_H5619-071_HMO_EOC_2026.pdf",
    "Humana_Gold_Plus_HMO_H0292-003-000_EOC_2026.pdf",
    "Humana_Gold_Plus_HMO_H0292-003-000_SOB_2026.pdf",
    "Humana_Gold_Plus_SNP-DE_H1036-320_HMO_DSNP_HIDE_EOC_2026.pdf",
    "Humana_Gold_Plus_SNP-DE_H1036-320_HMO_DSNP_HIDE_SOB_2026.pdf",
    "Humana_Gold_Plus_SNP-DE_H5619-163_HMO_DSNP_HIDE_ANOC_2026.pdf",
    "Humana_Gold_Plus_SNP-DE_H5619-163_HMO_DSNP_HIDE_EOC_2026.pdf",
    "Humana_Gold_Plus_SNP-DE_H5619-163_HMO_DSNP_HIDE_SOB_2026.pdf",
    "Humana_USAA_Honor_Giveback_PPO_H5216-105-000_ANOC_2026.pdf",
    "Humana_USAA_Honor_Giveback_PPO_H5216-105-000_EOC_2026.pdf",
    "Humana_USAA_Honor_Giveback_PPO_H5216-105-000_SOB_2026.pdf",
    "Humana_USAA_Honor_Giveback_PPO_H5216-225-000_ANOC_2026.pdf",
    "Humana_USAA_Honor_Giveback_PPO_H5216-225-000_EOC_2026.pdf",
    "Humana_USAA_Honor_Giveback_PPO_H5216-225-000_SOB_2026.pdf",
    "Humana_USAA_Honor_Giveback_PPO_H7617-005-000_EOC_2026.pdf",
    "Humana_USAA_Honor_Giveback_PPO_H7617-005-000_SOB_2026.pdf",
    "KY_Humana_Market_Product_Guide_2026.pdf",
    // UnitedHealthcare (27 files)
    "UHC_2026_Dental_Quick_Reference_Guide.pdf",
    "UHC_2026_Fitness_Quick_Reference_Guide.pdf",
    "UHC_2026_OTC_Healthy_Food_Utilities_Quick_Reference_Guide.pdf",
    "UHC_2026_Part_D_Formulary_Changes.pdf",
    "UHC_2026_SSBCI_Quick_Reference_Guide.pdf",
    "UHC_2026_UCard_Quick_Reference_Guide.pdf",
    "UHC_AARP_Essentials_KY1_HMO_H5253-099_EOC_2026.pdf",
    "UHC_AARP_Essentials_KY1_HMO_H5253-099_Highlights_2026.pdf",
    "UHC_AARP_Essentials_KY1_HMO_H5253-099_SOB_2026.pdf",
    "UHC_AARP_Patriot_NoRx_KYMA01_PPO_H8768-020_EOC_2026.pdf",
    "UHC_AARP_Patriot_NoRx_KYMA01_PPO_H8768-020_Highlights_2026.pdf",
    "UHC_AARP_Patriot_NoRx_KYMA01_PPO_H8768-020_SOB_2026.pdf",
    "UHC_Complete_Care_KY6_CSNP_H5253-182_EOC_2026.pdf",
    "UHC_Complete_Care_KY6_CSNP_H5253-182_Highlights_2026.pdf",
    "UHC_Complete_Care_KY6_CSNP_H5253-182_SOB_2026.pdf",
    "UHC_Dual_Complete_KYS001_PPO_DSNP_H1889-008_EOC_2026.pdf",
    "UHC_Dual_Complete_KYS001_PPO_DSNP_H1889-008_Highlights_2026.pdf",
    "UHC_Dual_Complete_KYS001_PPO_DSNP_H1889-008_SOB_2026.pdf",
    "UHC_Dual_Complete_KYS002_DSNP_H6595-004_EOC_2026.pdf",
    "UHC_Dual_Complete_KYS002_DSNP_H6595-004_Highlights_2026.pdf",
    "UHC_Dual_Complete_KYS002_DSNP_H6595-004_SOB_2026.pdf",
    "UHC_Dual_Complete_KYS3_PPO_DSNP_H1889-030_EOC_2026.pdf",
    "UHC_Dual_Complete_KYS3_PPO_DSNP_H1889-030_Highlights_2026.pdf",
    "UHC_Dual_Complete_KYS3_PPO_DSNP_H1889-030_SOB_2026.pdf",
    "UHC_Dual_Complete_KYS4_DSNP_H6595-005_EOC_2026.pdf",
    "UHC_Dual_Complete_KYS4_DSNP_H6595-005_Highlights_2026.pdf",
    "UHC_Dual_Complete_KYS4_DSNP_H6595-005_SOB_2026.pdf",
    "UHC_Dual_Complete_KYV001_DSNP_H6595-003_EOC_2026.pdf",
    "UHC_Dual_Complete_KYV001_DSNP_H6595-003_Highlights_2026.pdf",
    "UHC_Dual_Complete_KYV001_DSNP_H6595-003_SOB_2026.pdf",
    // Wellcare (18 files)
    "Wellcare_2026_KY_Market_Highlights.pdf",
    "Wellcare_Assist_HMO-POS_H9730-010_EOC_2026.pdf",
    "Wellcare_Assist_HMO-POS_H9730-010_SOB_2026.pdf",
    "Wellcare_Commitment_to_Broker_Service_Excellence_2026.pdf",
    "Wellcare_Dual_Access_Sync_DSNP_H9730-003_EOC_2026.pdf",
    "Wellcare_Dual_Access_Sync_DSNP_H9730-003_SOB_2026.pdf",
    "Wellcare_Dual_Access_Sync_Open_DSNP_H3975-004_EOC_2026.pdf",
    "Wellcare_Dual_Access_Sync_Open_DSNP_H3975-004_SOB_2026.pdf",
    "Wellcare_Dual_Liberty_Sync_DSNP_H9730-004_EOC_2026.pdf",
    "Wellcare_Dual_Liberty_Sync_DSNP_H9730-004_SOB_2026.pdf",
    "Wellcare_Dual_Reserve_DSNP_H9730-011_EOC_2026.pdf",
    "Wellcare_Dual_Reserve_DSNP_H9730-011_SOB_2026.pdf",
    "Wellcare_Formulary_2026.pdf",
    "Wellcare_Giveback_HMO-POS_H9730-007_EOC_2026.pdf",
    "Wellcare_Giveback_HMO-POS_H9730-007_SOB_2026.pdf",
    "Wellcare_Medicare_Advantage_Sales_Presentation_2026.pdf",
    "Wellcare_Simple_HMO-POS_H9730-009_EOC_2026.pdf",
    "Wellcare_Simple_HMO-POS_H9730-009_SOB_2026.pdf",
    // General Forms and Resources (10 files)
    "Blank_Verification_of_Chronic_Condition_VCC.pdf",
    "CMS-40B.pdf",
    "Fillable_TIG_Medicare_Intake_Form.pdf",
    "Scope-of-Appointment_2026.pdf",
    "TIG_2026_Aetna_Certification_Instructions.pdf",
    "TIG_2026_Anthem_Certification_Instructions.pdf",
    "TIG_2026_Devoted_Certification_Instructions.pdf",
    "TIG_2026_Humana_Certification_Instructions.pdf",
    "TIG_2026_UHC_Certification_Instructions.pdf",
    "Tyler_Insurance_Group_Contracting_Packet.pdf",
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

  // Chunk text on client side before sending to edge function
  const chunkTextClient = (text: string, chunkSize: number = 800): string[] => {
    const chunks: string[] = [];
    const words = text.split(/\s+/);
    let currentChunk = "";

    for (const word of words) {
      if ((currentChunk + word).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = word + " ";
      } else {
        currentChunk += word + " ";
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  };

  const processDocument = async (filename: string): Promise<{ chunksProcessed: number }> => {
    try {
      // Fetch PDF from public folder
      const response = await fetch(`/downloads/${filename}`);
      if (!response.ok) throw new Error("Failed to fetch PDF");

      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = "";
      // Reduce to 20 pages to avoid memory issues
      const maxPages = Math.min(pdf.numPages, 20);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + " ";
        
        // Clear page from memory
        page.cleanup();
      }

      if (!fullText.trim()) {
        throw new Error("No text could be extracted");
      }

      const { carrier, documentType } = extractMetadata(filename);

      // Chunk the text on client side
      const textChunks = chunkTextClient(fullText);
      
      // Process chunks in parallel batches for speed
      let successfulChunks = 0;
      const BATCH_SIZE = 10; // Process 10 chunks at a time
      
      for (let i = 0; i < textChunks.length; i += BATCH_SIZE) {
        const batch = textChunks.slice(i, Math.min(i + BATCH_SIZE, textChunks.length));
        const batchPromises = batch.map((chunk, batchIndex) => {
          const chunkIndex = i + batchIndex;
          return fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                documentText: chunk,
                documentName: filename,
                documentType,
                carrier,
                chunkIndex,
                isChunked: true,
              }),
            }
          )
            .then(async (response) => {
              if (!response.ok) {
                const errorData = await response.json();
                console.error(`Failed to process chunk ${chunkIndex}:`, errorData);
                return null;
              }
              return chunkIndex;
            })
            .catch((error) => {
              console.error(`Error processing chunk ${chunkIndex}:`, error);
              return null;
            });
        });

        const results = await Promise.all(batchPromises);
        successfulChunks += results.filter(r => r !== null).length;
        
        // Minimal delay between batches
        if (i + BATCH_SIZE < textChunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return { chunksProcessed: successfulChunks };
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

      // Short delay between documents
      await new Promise((resolve) => setTimeout(resolve, 500));
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
                Process {pdfFiles.length} PDF files (20 pages each, chunked on client, 3 sec intervals)
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
