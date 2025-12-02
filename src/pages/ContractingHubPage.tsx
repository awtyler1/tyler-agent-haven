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
        {/* Hero - Compact */}
        <section className="pt-28 pb-6 md:pt-32 md:pb-8 px-6 md:px-12 lg:px-20 bg-background">
          <div className="container-narrow text-center">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2">
              Contracting Hub
            </h1>
            <p className="text-base md:text-lg text-foreground max-w-2xl mx-auto">
              Your guided path to completing contracting with Tyler Insurance Group.
            </p>
          </div>
        </section>

        {/* Quick Orientation - Compact */}
        <section className="py-6 px-6 md:px-12 lg:px-20 bg-cream/20">
          <div className="container-narrow max-w-4xl">
            <p className="text-sm md:text-base leading-relaxed text-foreground text-center">
              Welcome aboard. Follow these three steps in order to complete your contracting smoothly. If you need help, contact Caroline at the bottom of this page.
            </p>
          </div>
        </section>

        {/* Three Steps - Side by Side Above the Fold */}
        <section className="py-8 px-6 md:px-12 lg:px-20 bg-background">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Step 1: Required Documents */}
              <Card className="border-gold/20 bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-semibold text-lg">1</span>
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Gather Documents
                    </h2>
                  </div>
                  
                  <div className="space-y-2.5">
                    {requiredDocuments.map((doc, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground leading-snug">{doc.text}</span>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                    Having these ready prevents delays.
                  </p>
                </CardContent>
              </Card>

              {/* Step 2: Download Packet */}
              <Card className="border-gold/20 bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-semibold text-lg">2</span>
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Download Packet
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setIsPdfModalOpen(true)}
                      className="w-full bg-gold hover:bg-gold/90 text-charcoal font-medium py-6"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Packet (PDF)
                    </Button>
                    
                    <div className="space-y-2 pt-2">
                      <p className="text-sm text-foreground font-medium">Instructions:</p>
                      <ul className="space-y-1.5 text-xs text-muted-foreground">
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
              <Card className="border-gold/20 bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-semibold text-lg">3</span>
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Submit Packet
                    </h2>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    Complete the form below with your info and upload all required documents.
                  </p>

                  <a 
                    href="#upload-form"
                    className="block w-full bg-gold hover:bg-gold/90 text-charcoal font-medium py-6 rounded-md text-center transition-colors"
                  >
                    Go to Upload Form →
                  </a>

                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-foreground mb-2">What Happens Next:</p>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
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

        {/* Upload Form - Full Details Below */}
        <section id="upload-form" className="py-12 md:py-16 px-6 md:px-12 lg:px-20 bg-cream/20">
          <div className="container-narrow max-w-3xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
                Step 3: Upload Your Completed Packet
              </h2>
              <p className="text-muted-foreground">
                Fill out the form below and upload all required documents.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full legal name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="npn">NPN <span className="text-destructive">*</span></Label>
                  <Input
                    id="npn"
                    name="npn"
                    value={formData.npn}
                    onChange={handleInputChange}
                    placeholder="Enter your NPN"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="residentState">Resident State <span className="text-destructive">*</span></Label>
                  <Input
                    id="residentState"
                    name="residentState"
                    value={formData.residentState}
                    onChange={handleInputChange}
                    placeholder="e.g., Kentucky"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>Contracting Type <span className="text-destructive">*</span></Label>
                  <RadioGroup
                    value={formData.contractingType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contractingType: value as "individual" | "agency" }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual" className="font-normal cursor-pointer">Individual</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="agency" id="agency" />
                      <Label htmlFor="agency" className="font-normal cursor-pointer">Agency</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* File Uploads */}
              <div className="pt-4 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">File Upload Fields</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="packet">Completed Contracting Packet (PDF) <span className="text-destructive">*</span></Label>
                  <Input id="packet" type="file" accept=".pdf" onChange={handleFileChange("contractingPacket")} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license">Insurance License <span className="text-destructive">*</span></Label>
                  <Input id="license" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange("license")} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eo">E&O Certificate <span className="text-destructive">*</span></Label>
                  <Input id="eo" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange("eo")} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="check">Voided Check <span className="text-destructive">*</span></Label>
                  <Input id="check" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange("voidedCheck")} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aml">AML / CE Certificate(s) <span className="text-destructive">*</span></Label>
                  <Input id="aml" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange("amlCe")} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional">Additional Documents <span className="text-muted-foreground text-sm">(Optional)</span></Label>
                  <Input id="additional" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange("additional")} />
                  <p className="text-xs text-muted-foreground">Background explanations, corporate resolutions, SelectHealth add-ons, etc.</p>
                </div>
              </div>

              {/* Required Checkboxes */}
              <div className="pt-4 space-y-4 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground">Required Confirmations</h3>
                
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="check1" 
                    checked={checkboxes.completedSigned}
                    onCheckedChange={handleCheckboxChange("completedSigned")}
                  />
                  <Label htmlFor="check1" className="font-normal leading-snug cursor-pointer">
                    I completed and signed all required pages of the contracting packet.
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="check2" 
                    checked={checkboxes.attachedDocs}
                    onCheckedChange={handleCheckboxChange("attachedDocs")}
                  />
                  <Label htmlFor="check2" className="font-normal leading-snug cursor-pointer">
                    I attached my license, E&O, voided check, and AML/CE certificates.
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="check3" 
                    checked={checkboxes.yesExplanations}
                    onCheckedChange={handleCheckboxChange("yesExplanations")}
                  />
                  <Label htmlFor="check3" className="font-normal leading-snug cursor-pointer">
                    If I answered "Yes" to any legal questions, I have uploaded written explanations.
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="check4" 
                    checked={checkboxes.corporateDocs}
                    onCheckedChange={handleCheckboxChange("corporateDocs")}
                  />
                  <Label htmlFor="check4" className="font-normal leading-snug cursor-pointer">
                    If contracting as a corporation, I included corporate license and bank documents.
                  </Label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gold hover:bg-gold/90 text-charcoal font-semibold py-6 mt-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Contracting Packet"}
              </Button>
            </form>
          </div>
        </section>

        {/* Support Contact */}
        <section className="py-10 px-6 md:px-12 lg:px-20 bg-background border-t border-border">
          <div className="container-narrow text-center">
            <p className="text-sm text-muted-foreground mb-3">Need help with contracting?</p>
            <p className="text-foreground font-medium mb-2">Caroline Horn</p>
            <a 
              href="mailto:caroline@tylerinsurancegroup.com"
              className="inline-flex items-center gap-2 text-gold hover:text-gold/80 transition-colors"
            >
              <Mail className="w-4 h-4" />
              caroline@tylerinsurancegroup.com
            </a>
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
