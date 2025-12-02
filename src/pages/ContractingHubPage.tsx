import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import PdfPreviewModal from "@/components/PdfPreviewModal";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Download, Mail } from "lucide-react";

const ContractingHubPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    npn: "",
    email: "",
    phone: "",
    residentState: "",
    contractingType: "individual" as "individual" | "agency"
  });

  const [files, setFiles] = useState({
    contractingPacket: null as File | null,
    license: null as File | null,
    eo: null as File | null,
    voidedCheck: null as File | null,
    amlCe: null as File | null,
    additional: null as File | null
  });

  const [checkboxes, setCheckboxes] = useState({
    completedSigned: false,
    attachedDocs: false,
    yesExplanations: false,
    corporateDocs: false
  });

  const requiredDocuments = [
    { text: "State insurance license", icon: CheckCircle },
    { text: "E&O certificate with your correct name", icon: CheckCircle },
    { text: "AML certificate (and CE if your state requires it)", icon: CheckCircle },
    { text: "Voided check (personal or corporate)", icon: CheckCircle },
    { text: "Any corporate documents if contracting as an agency (corporate license + corporate bank info)", icon: CheckCircle },
    { text: "Written explanations for any \"Yes\" answers in the legal questionnaire", icon: CheckCircle }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (field: keyof typeof files) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleCheckboxChange = (field: keyof typeof checkboxes) => (checked: boolean) => {
    setCheckboxes(prev => ({ ...prev, [field]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim() || !formData.npn.trim() || !formData.phone.trim() || !formData.residentState.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields marked with *",
        variant: "destructive"
      });
      return;
    }

    // Validate required files
    if (!files.contractingPacket || !files.license || !files.eo || !files.voidedCheck || !files.amlCe) {
      toast({
        title: "Missing Required Files",
        description: "Please upload all required documents.",
        variant: "destructive"
      });
      return;
    }

    // Validate checkboxes
    if (!checkboxes.completedSigned || !checkboxes.attachedDocs || !checkboxes.yesExplanations || !checkboxes.corporateDocs) {
      toast({
        title: "Confirmation Required",
        description: "Please check all required confirmation boxes before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert files to base64
      const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      const fileData = await Promise.all([
        convertToBase64(files.contractingPacket).then(content => ({ 
          name: "contracting-packet", 
          fileName: files.contractingPacket!.name, 
          content, 
          type: files.contractingPacket!.type 
        })),
        convertToBase64(files.license).then(content => ({ 
          name: "license", 
          fileName: files.license!.name, 
          content, 
          type: files.license!.type 
        })),
        convertToBase64(files.eo).then(content => ({ 
          name: "eo-certificate", 
          fileName: files.eo!.name, 
          content, 
          type: files.eo!.type 
        })),
        convertToBase64(files.voidedCheck).then(content => ({ 
          name: "voided-check", 
          fileName: files.voidedCheck!.name, 
          content, 
          type: files.voidedCheck!.type 
        })),
        convertToBase64(files.amlCe).then(content => ({ 
          name: "aml-ce-certificate", 
          fileName: files.amlCe!.name, 
          content, 
          type: files.amlCe!.type 
        })),
        ...(files.additional ? [convertToBase64(files.additional).then(content => ({ 
          name: "additional-documents", 
          fileName: files.additional!.name, 
          content, 
          type: files.additional!.type 
        }))] : [])
      ]);

      const { error } = await supabase.functions.invoke('send-contracting-packet', {
        body: {
          name: formData.name.trim(),
          npn: formData.npn.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim(),
          residentState: formData.residentState.trim(),
          contractingType: formData.contractingType,
          files: fileData
        },
      });

      if (error) throw error;

      toast({
        title: "Submission Received",
        description: "Thank you. Your contracting packet has been sent to our team. We'll contact you within 2-3 business days."
      });

      // Reset form
      setFormData({ name: "", npn: "", email: "", phone: "", residentState: "", contractingType: "individual" });
      setFiles({ contractingPacket: null, license: null, eo: null, voidedCheck: null, amlCe: null, additional: null });
      setCheckboxes({ completedSigned: false, attachedDocs: false, yesExplanations: false, corporateDocs: false });
      
      // Reset file inputs
      const fileInputs = ["packet", "license", "eo", "check", "aml", "additional"];
      fileInputs.forEach(id => {
        const input = document.getElementById(id) as HTMLInputElement;
        if (input) input.value = "";
      });
    } catch (error: any) {
      console.error("Error submitting contracting packet:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error sending your packet. Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero - Dashboard Style */}
        <section className="pt-20 pb-4 md:pt-24 md:pb-5 px-6 md:px-12 lg:px-20 bg-background">
          <div className="container-narrow text-center">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-1.5">
              Contracting Hub
            </h1>
            <p className="text-[15px] md:text-[17px] text-foreground max-w-2xl mx-auto">
              Your three-step path to completing contracting with Tyler Insurance Group.
            </p>
          </div>
        </section>

        {/* Three Steps - Side by Side Above the Fold */}
        <section className="py-4 px-6 md:px-12 lg:px-16 bg-background">
          <div className="max-w-[90%] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              
              {/* Step 1: Required Documents */}
              <Card className="border-gold/20 bg-card h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-semibold text-base">1</span>
                    </div>
                    <h2 className="text-[19px] font-semibold text-foreground">
                      Gather Documents
                    </h2>
                  </div>
                  
                  <div className="space-y-[0.35em]">
                    {requiredDocuments.map((doc, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span className="text-[13px] text-foreground leading-snug">{doc.text}</span>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border">
                    Having these ready prevents delays.
                  </p>
                </CardContent>
              </Card>

              {/* Step 2: Download Packet */}
              <Card className="border-gold/20 bg-card h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-semibold text-base">2</span>
                    </div>
                    <h2 className="text-[19px] font-semibold text-foreground">
                      Download Packet
                    </h2>
                  </div>
                  
                  <div className="space-y-2.5">
                    <Button 
                      onClick={() => setIsPdfModalOpen(true)}
                      className="w-full bg-gold hover:bg-gold/90 text-charcoal font-medium py-4 text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Packet (PDF)
                    </Button>
                    
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[13px] text-foreground font-medium">Instructions:</p>
                      <ul className="space-y-[0.35em] text-[11px] text-muted-foreground">
                        <li>• Complete all pages and sign</li>
                        <li>• SelectHealth section is optional</li>
                        <li>• Replace sample E&O with yours</li>
                        <li>• Answer all legal questions truthfully</li>
                        <li>• Include written explanations for any "Yes" answers</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3: Upload Form - Compact */}
              <Card className="border-gold/20 bg-card h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-semibold text-base">3</span>
                    </div>
                    <h2 className="text-[19px] font-semibold text-foreground">
                      Submit Packet
                    </h2>
                  </div>

                  <p className="text-[13px] text-muted-foreground mb-2.5">
                    Complete the form below with your info and upload all required documents.
                  </p>

                  <a 
                    href="#upload-form"
                    className="block w-full bg-gold hover:bg-gold/90 text-charcoal font-medium py-4 rounded-md text-center transition-colors text-sm"
                  >
                    Go to Upload Form →
                  </a>

                  <div className="mt-2.5 pt-2.5 border-t border-border">
                    <p className="text-[11px] font-medium text-foreground mb-1.5">What Happens Next:</p>
                    <ul className="space-y-[0.35em] text-[11px] text-muted-foreground">
                      <li>• Review within 2-3 business days</li>
                      <li>• We'll email if anything is missing</li>
                      <li>• Notification when carriers approve</li>
                      <li>• Begin writing business immediately</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>

        {/* Support Line - Below Cards */}
        <section className="py-4 px-6 md:px-12 lg:px-20 bg-background">
          <div className="text-center">
            <p className="text-[13px] text-muted-foreground">
              Need help? Contact Caroline at{" "}
              <a 
                href="mailto:caroline@tylerinsurancegroup.com"
                className="text-gold hover:text-gold/80 transition-colors"
              >
                caroline@tylerinsurancegroup.com
              </a>
            </p>
          </div>
        </section>

        {/* Upload Form - Full Details Below - Compressed */}
        <section id="upload-form" className="py-8 md:py-10 px-6 md:px-12 lg:px-20 bg-cream/20">
          <div className="container-narrow max-w-3xl">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                Step 3: Upload Your Completed Packet
              </h2>
              <p className="text-[13px] text-muted-foreground">
                Fill out the form below and upload all required documents.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm">Full Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full legal name"
                    className="h-9"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="npn" className="text-sm">NPN <span className="text-destructive">*</span></Label>
                  <Input
                    id="npn"
                    name="npn"
                    value={formData.npn}
                    onChange={handleInputChange}
                    placeholder="Enter your NPN"
                    className="h-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm">Email <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className="h-9"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm">Phone <span className="text-destructive">*</span></Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                    className="h-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="residentState" className="text-sm">Resident State <span className="text-destructive">*</span></Label>
                  <Input
                    id="residentState"
                    name="residentState"
                    value={formData.residentState}
                    onChange={handleInputChange}
                    placeholder="e.g., Kentucky"
                    className="h-9"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Contracting Type <span className="text-destructive">*</span></Label>
                  <RadioGroup
                    value={formData.contractingType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contractingType: value as "individual" | "agency" }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual" className="font-normal cursor-pointer text-sm">Individual</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="agency" id="agency" />
                      <Label htmlFor="agency" className="font-normal cursor-pointer text-sm">Agency</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* File Uploads */}
              <div className="pt-3 space-y-3">
                <h3 className="text-base font-semibold text-foreground">File Upload Fields</h3>
                
                <div className="space-y-1.5">
                  <Label htmlFor="packet" className="text-sm">Completed Contracting Packet (PDF) <span className="text-destructive">*</span></Label>
                  <Input id="packet" type="file" accept=".pdf" onChange={handleFileChange("contractingPacket")} className="h-9 text-sm" required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="license" className="text-sm">Insurance License <span className="text-destructive">*</span></Label>
                  <Input id="license" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange("license")} className="h-9 text-sm" required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eo" className="text-sm">E&O Certificate <span className="text-destructive">*</span></Label>
                  <Input id="eo" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange("eo")} className="h-9 text-sm" required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="check" className="text-sm">Voided Check <span className="text-destructive">*</span></Label>
                  <Input id="check" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange("voidedCheck")} className="h-9 text-sm" required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="aml" className="text-sm">AML / CE Certificate(s) <span className="text-destructive">*</span></Label>
                  <Input id="aml" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange("amlCe")} className="h-9 text-sm" required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="additional" className="text-sm">Additional Documents <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                  <Input id="additional" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange("additional")} className="h-9 text-sm" />
                  <p className="text-[11px] text-muted-foreground">Background explanations, corporate resolutions, SelectHealth add-ons, etc.</p>
                </div>
              </div>

              {/* Required Checkboxes */}
              <div className="pt-3 space-y-2.5 border-t border-border">
                <h3 className="text-base font-semibold text-foreground">Required Confirmations</h3>
                
                <div className="flex items-start space-x-2.5">
                  <Checkbox 
                    id="check1" 
                    checked={checkboxes.completedSigned}
                    onCheckedChange={handleCheckboxChange("completedSigned")}
                  />
                  <Label htmlFor="check1" className="font-normal leading-snug cursor-pointer text-[13px]">
                    I completed and signed all required pages of the contracting packet.
                  </Label>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Checkbox 
                    id="check2" 
                    checked={checkboxes.attachedDocs}
                    onCheckedChange={handleCheckboxChange("attachedDocs")}
                  />
                  <Label htmlFor="check2" className="font-normal leading-snug cursor-pointer text-[13px]">
                    I attached my license, E&O, voided check, and AML/CE certificates.
                  </Label>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Checkbox 
                    id="check3" 
                    checked={checkboxes.yesExplanations}
                    onCheckedChange={handleCheckboxChange("yesExplanations")}
                  />
                  <Label htmlFor="check3" className="font-normal leading-snug cursor-pointer text-[13px]">
                    If I answered "Yes" to any legal questions, I have uploaded written explanations.
                  </Label>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Checkbox 
                    id="check4" 
                    checked={checkboxes.corporateDocs}
                    onCheckedChange={handleCheckboxChange("corporateDocs")}
                  />
                  <Label htmlFor="check4" className="font-normal leading-snug cursor-pointer text-[13px]">
                    If contracting as a corporation, I included corporate license and bank documents.
                  </Label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gold hover:bg-gold/90 text-charcoal font-semibold py-5 mt-5"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Contracting Packet"}
              </Button>
            </form>
          </div>
        </section>
      </main>

      <Footer />

      <PdfPreviewModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title="Tyler Insurance Group Contracting Packet"
        pdfUrl="/downloads/Tyler_Insurance_Group_Contracting_Packet.pdf"
      />
    </div>
  );
};

export default ContractingHubPage;
