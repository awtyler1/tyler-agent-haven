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
    residentState: "",
    files: [] as File[]
  });

  const requiredDocuments = [
    { text: "State insurance license" },
    { text: "E&O certificate with your correct name" },
    { text: "AML certificate (and CE if your state requires it)" },
    { text: "Voided check (personal or corporate)" },
    { text: "Any corporate documents if contracting as an agency (corporate license + corporate bank info)" },
    { text: "Written explanations for any \"Yes\" answers in the legal questionnaire" }
  ];


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim() || !formData.npn.trim() || !formData.email.trim() || !formData.residentState.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields marked with *",
        variant: "destructive"
      });
      return;
    }

    // Validate required files
    if (!formData.files || formData.files.length === 0) {
      toast({
        title: "Missing Required Files",
        description: "Please upload all required documents.",
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

      const fileData = await Promise.all(
        formData.files.map(async (file, index) => ({
          name: `document-${index + 1}`,
          fileName: file.name,
          content: await convertToBase64(file),
          type: file.type
        }))
      );

      const { error } = await supabase.functions.invoke('send-contracting-packet', {
        body: {
          name: formData.name.trim(),
          npn: formData.npn.trim(),
          email: formData.email.trim() || undefined,
          residentState: formData.residentState.trim(),
          files: fileData
        },
      });

      if (error) throw error;

      toast({
        title: "Submission Received",
        description: "Thank you. Your contracting packet has been sent to our team. We'll contact you within 2-3 business days."
      });

      // Reset form
      setFormData({ name: "", npn: "", email: "", residentState: "", files: [] });
      
      // Reset file input
      const fileInput = document.getElementById("documents") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
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

        {/* Upload Form - Compact Card */}
        <section id="upload-form" className="py-6 md:py-8 px-6 md:px-12 lg:px-20 bg-cream/20">
          <div className="container-narrow max-w-2xl">
            <div className="text-center mb-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-1.5">
                Step 3: Upload Your Completed Packet
              </h2>
              <p className="text-[13px] text-muted-foreground">
                Fill out the form below and upload all required documents.
              </p>
            </div>

            <Card className="border-gold/20 bg-card shadow-sm">
              <CardContent className="pt-5 pb-5 px-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Required Document Checklist */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Required Documents:</Label>
                    <div className="space-y-1 text-[12px] text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <span>□</span>
                        <span>State insurance license</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span>□</span>
                        <span>E&O certificate with your correct name</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span>□</span>
                        <span>Voided check (personal or corporate)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span>□</span>
                        <span>AML certificate (and CE if required by your state)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span>□</span>
                        <span>Explanation documents for any "Yes" answers in the legal section</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span>□</span>
                        <span>Corporate license + corporate bank info (if contracting as an agency)</span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-File Upload */}
                  <div className="space-y-1.5 pt-2">
                    <Label htmlFor="documents" className="text-sm font-semibold">
                      Upload Documents <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-[12px] text-muted-foreground mb-1.5">
                      Attach your completed contracting packet and all required documents.
                    </p>
                    <Input 
                      id="documents" 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setFormData(prev => ({ ...prev, files }));
                      }}
                      className="h-10 text-sm" 
                      required 
                    />
                  </div>

                  {/* Personal Info Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                    <div className="space-y-1.5">
                      <Label htmlFor="residentState" className="text-sm">Resident State <span className="text-destructive">*</span></Label>
                      <select
                        id="residentState"
                        name="residentState"
                        value={formData.residentState}
                        onChange={handleInputChange}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="">Select state</option>
                        <option value="AL">Alabama</option>
                        <option value="AK">Alaska</option>
                        <option value="AZ">Arizona</option>
                        <option value="AR">Arkansas</option>
                        <option value="CA">California</option>
                        <option value="CO">Colorado</option>
                        <option value="CT">Connecticut</option>
                        <option value="DE">Delaware</option>
                        <option value="DC">District of Columbia</option>
                        <option value="FL">Florida</option>
                        <option value="GA">Georgia</option>
                        <option value="HI">Hawaii</option>
                        <option value="ID">Idaho</option>
                        <option value="IL">Illinois</option>
                        <option value="IN">Indiana</option>
                        <option value="IA">Iowa</option>
                        <option value="KS">Kansas</option>
                        <option value="KY">Kentucky</option>
                        <option value="LA">Louisiana</option>
                        <option value="ME">Maine</option>
                        <option value="MD">Maryland</option>
                        <option value="MA">Massachusetts</option>
                        <option value="MI">Michigan</option>
                        <option value="MN">Minnesota</option>
                        <option value="MS">Mississippi</option>
                        <option value="MO">Missouri</option>
                        <option value="MT">Montana</option>
                        <option value="NE">Nebraska</option>
                        <option value="NV">Nevada</option>
                        <option value="NH">New Hampshire</option>
                        <option value="NJ">New Jersey</option>
                        <option value="NM">New Mexico</option>
                        <option value="NY">New York</option>
                        <option value="NC">North Carolina</option>
                        <option value="ND">North Dakota</option>
                        <option value="OH">Ohio</option>
                        <option value="OK">Oklahoma</option>
                        <option value="OR">Oregon</option>
                        <option value="PA">Pennsylvania</option>
                        <option value="RI">Rhode Island</option>
                        <option value="SC">South Carolina</option>
                        <option value="SD">South Dakota</option>
                        <option value="TN">Tennessee</option>
                        <option value="TX">Texas</option>
                        <option value="UT">Utah</option>
                        <option value="VT">Vermont</option>
                        <option value="VA">Virginia</option>
                        <option value="WA">Washington</option>
                        <option value="WV">West Virginia</option>
                        <option value="WI">Wisconsin</option>
                        <option value="WY">Wyoming</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 flex flex-col items-center gap-2.5">
                    <Button 
                      type="submit" 
                      className="w-full max-w-md bg-gold hover:bg-gold/90 text-charcoal font-semibold py-4 text-sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Contracting Packet →"}
                    </Button>
                    
                    <p className="text-[11px] text-muted-foreground text-center max-w-md">
                      We review submissions within 2–3 business days.<br />
                      We'll email you if anything is missing.
                    </p>
                  </div>

                </form>
              </CardContent>
            </Card>
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
