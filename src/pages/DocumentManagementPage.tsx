import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, Upload, PlayCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProcessingJob {
  id: string;
  status: string;
  total_documents: number;
  processed_documents: number;
  failed_documents: number;
  current_document: string | null;
  started_at: string;
  completed_at: string | null;
}

export default function DocumentManagementPage() {
  const [processedDocs, setProcessedDocs] = useState<Set<string>>(new Set());
  const [currentJob, setCurrentJob] = useState<ProcessingJob | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // List of all PDF files
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

  // Check which documents are already processed on mount
  useEffect(() => {
    const checkProcessedDocs = async () => {
      const { data, error } = await supabase
        .from('document_chunks')
        .select('document_name');
      
      if (!error && data) {
        const processed = new Set(data.map(d => d.document_name));
        setProcessedDocs(processed);
      }
    };
    checkProcessedDocs();
  }, []);

  // Poll for job status updates
  useEffect(() => {
    if (!currentJob || currentJob.status === 'completed' || currentJob.status === 'failed') {
      return;
    }

    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('id', currentJob.id)
        .single();

      if (data) {
        setCurrentJob(data as ProcessingJob);
        
        if (data.status === 'completed') {
          toast.success(`Processing complete! ${data.processed_documents} documents processed`);
          // Refresh processed docs list
          const { data: chunks } = await supabase
            .from('document_chunks')
            .select('document_name');
          if (chunks) {
            setProcessedDocs(new Set(chunks.map(d => d.document_name)));
          }
        } else if (data.status === 'failed') {
          toast.error('Processing failed');
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [currentJob]);

  const startBackgroundProcessing = async () => {
    setIsStarting(true);

    try {
      // Filter out already-processed documents
      const unprocessedFiles = pdfFiles.filter(file => !processedDocs.has(file));
      
      if (unprocessedFiles.length === 0) {
        toast.success("All documents have already been processed!");
        setIsStarting(false);
        return;
      }

      // Start background job
      const { data, error } = await supabase.functions.invoke('process-documents-background', {
        body: { 
          documents: unprocessedFiles,
          projectOrigin: window.location.origin
        }
      });

      if (error) throw error;

      if (data?.jobId) {
        // Fetch the job details
        const { data: job } = await supabase
          .from('processing_jobs')
          .select('*')
          .eq('id', data.jobId)
          .single();

        if (job) {
          setCurrentJob(job as ProcessingJob);
          toast.success(`Started processing ${unprocessedFiles.length} documents in background. You can close this page.`);
        }
      }
    } catch (error) {
      console.error('Error starting background processing:', error);
      toast.error('Failed to start background processing');
    } finally {
      setIsStarting(false);
    }
  };

  const refreshJobStatus = async () => {
    if (!currentJob) return;

    const { data } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('id', currentJob.id)
      .single();

    if (data) {
      setCurrentJob(data as ProcessingJob);
    }
  };

  const progress = currentJob 
    ? (currentJob.processed_documents / currentJob.total_documents) * 100 
    : 0;

  const isProcessing = currentJob && currentJob.status === 'processing';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Document Management</h1>
          <p className="text-lg text-muted-foreground">
            Background processing system - close the browser anytime
          </p>
        </div>

        <Card className="p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Background Processing</h2>
              <p className="text-muted-foreground">
                {processedDocs.size} of {pdfFiles.length} documents already processed
              </p>
            </div>
            <div className="flex gap-2">
              {currentJob && (
                <Button
                  onClick={refreshJobStatus}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  Refresh
                </Button>
              )}
              <Button
                onClick={startBackgroundProcessing}
                disabled={isStarting || isProcessing}
                size="lg"
                className="gap-2"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Starting...
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-5 w-5" />
                    Start Background Processing ({pdfFiles.length - processedDocs.size})
                  </>
                )}
              </Button>
            </div>
          </div>

          {currentJob && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold mb-1">Current Job Status</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    Status: {currentJob.status}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{Math.round(progress)}%</div>
                  <div className="text-sm text-muted-foreground">
                    {currentJob.processed_documents} / {currentJob.total_documents}
                  </div>
                </div>
              </div>

              <Progress value={progress} className="h-2" />

              {currentJob.current_document && (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">Processing:</span>
                  <span className="font-medium">{currentJob.current_document}</span>
                </div>
              )}

              {currentJob.status === 'completed' && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>
                    Completed! Processed {currentJob.processed_documents} documents
                    {currentJob.failed_documents > 0 && ` (${currentJob.failed_documents} failed)`}
                  </span>
                </div>
              )}

              {currentJob.status === 'failed' && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span>Processing failed</span>
                </div>
              )}

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Background Processing Benefits:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Close this page - processing continues on server</li>
                  <li>✓ No need to keep browser open</li>
                  <li>✓ Return anytime to check progress</li>
                  <li>✓ All chunks saved to database automatically</li>
                </ul>
              </div>
            </div>
          )}
        </Card>

        {!currentJob && (
          <Card className="p-6 bg-muted/30">
            <h3 className="font-semibold mb-2">How it works</h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Click "Start Background Processing" to begin</li>
              <li>Server processes all unprocessed PDFs automatically</li>
              <li>Each PDF is extracted (20 pages), chunked (800 chars), and embedded</li>
              <li>Close the browser - processing continues in background</li>
              <li>Return anytime and click "Refresh" to see current progress</li>
            </ol>
          </Card>
        )}
      </div>
    </div>
  );
}
