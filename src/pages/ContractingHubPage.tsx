import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import PdfPreviewModal from "@/components/PdfPreviewModal";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Download, FileText, Image as ImageIcon, X, Check, Upload } from "lucide-react";

const ContractingHubPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    npn: "",
    state: "",
    files: ""
  });
  
  const [formData, setFormData] = useState({
    name: "",
    npn: "",
    email: "",
    residentState: "",
    files: [] as File[]
  });

  // Validation logic
  const validateEmail = (email: string) => {
    return email.includes("@") && email.length > 3;
  };

  const validateNPN = (npn: string) => {
    return /^\d{1,10}$/.test(npn);
  };

  const isFormComplete = 
    formData.name.trim() !== "" &&
    validateEmail(formData.email) &&
    validateNPN(formData.npn) &&
    formData.residentState !== "" &&
    formData.files.length > 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation errors on input
    if (name === "email" && validateEmail(value)) {
      setValidationErrors(prev => ({ ...prev, email: "" }));
    }
    if (name === "npn" && validateNPN(value)) {
      setValidationErrors(prev => ({ ...prev, npn: "" }));
    }
    if (name === "residentState" && value !== "") {
      setValidationErrors(prev => ({ ...prev, state: "" }));
    }
  };

  const handleFileChange = (newFiles: File[]) => {
    setFormData(prev => ({ 
      ...prev, 
      files: [...prev.files, ...newFiles]
    }));
    if (newFiles.length > 0) {
      setValidationErrors(prev => ({ ...prev, files: "" }));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      return validTypes.includes(file.type);
    });
    
    if (droppedFiles.length > 0) {
      handleFileChange(droppedFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    let hasErrors = false;
    const errors = { email: "", npn: "", state: "", files: "" };
    
    if (!formData.name.trim()) {
      hasErrors = true;
    }
    
    if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
      hasErrors = true;
    }
    
    if (!validateNPN(formData.npn)) {
      errors.npn = "NPN must be numeric (up to 10 digits)";
      hasErrors = true;
    }
    
    if (!formData.residentState) {
      errors.state = "Please select your resident state";
      hasErrors = true;
    }
    
    if (formData.files.length === 0) {
      errors.files = "Please upload at least one document";
      hasErrors = true;
    }
    
    if (hasErrors) {
      setValidationErrors(errors);
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

      setIsSubmitted(true);

      // Reset form after short delay
      setTimeout(() => {
        setFormData({ name: "", npn: "", email: "", residentState: "", files: [] });
        setIsSubmitted(false);
        
        // Reset file input
        const fileInput = document.getElementById("documents") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }, 5000);
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
        {/* Header - Title, Subtitle, Step Indicator */}
        <section className="pt-16 pb-6 md:pt-20 md:pb-7 px-6 md:px-12 lg:px-20 bg-background">
          <div className="max-w-4xl mx-auto">
            {/* Title and Subtitle */}
            <div className="text-center mb-4">
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2">
                Contracting Hub
              </h1>
              <p className="text-[15px] md:text-[17px] text-muted-foreground">
                Your direct path to completing contracting with Tyler Insurance Group.
              </p>
            </div>

            {/* Slim Step Indicator Bar */}
            <div className="flex items-center justify-center gap-2.5 text-[11px] md:text-[12px] text-muted-foreground">
              <span>Step 1: Gather Documents</span>
              <span className="text-gold">•</span>
              <span>Step 2: Download Packet</span>
              <span className="text-gold">•</span>
              <span>Step 3: Upload & Submit</span>
            </div>
          </div>
        </section>

        {/* Two-Column Layout */}
        <section className="pb-12 px-6 md:px-12 lg:px-20 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              
              {/* LEFT COLUMN - Steps 1 & 2 */}
              <div className="space-y-10">
                
                {/* Step 1 - Gather Required Documents */}
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-3.5">
                    Step 1: Gather Required Documents
                  </h2>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">State insurance license</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">E&O certificate with your correct name</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">Voided check (personal or corporate)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">AML certificate (and CE if required by your state)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">Explanation documents for any "Yes" answers in the legal section</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">Corporate license + corporate bank info (if contracting as an agency)</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 - Download Contracting Packet */}
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-3.5">
                    Step 2: Download Contracting Packet
                  </h2>
                  <Button 
                    onClick={() => setIsPdfModalOpen(true)}
                    className="w-full bg-gold hover:bg-gold/90 text-charcoal font-semibold px-6 py-5 text-sm shadow-sm hover:shadow-md transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Contracting Packet (PDF)
                  </Button>
                  <div className="mt-2.5 text-[12px] text-muted-foreground space-y-1">
                    <p>Complete all pages and sign where indicated.</p>
                    <p>Replace the sample E&O page with your own certificate.</p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Step 3 */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-3.5">
                  Step 3: Upload Your Completed Packet
                </h2>
                
                <Card className="border-gold/30 bg-card shadow-md">
                  <CardContent className="pt-5 pb-5 px-5">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      
                      {/* Multi-File Upload with Drag & Drop */}
                      <div className="space-y-2">
                        <Label htmlFor="documents" className="text-sm font-bold">
                          Upload Documents <span className="text-destructive">*</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground/90 mb-2">
                          Attach your completed contracting packet and all required documents. Accepted formats: PDF, JPG, PNG.
                        </p>
                        
                        {/* Drag & Drop Upload Area */}
                        <div 
                          className={`relative border-2 border-dashed rounded-lg transition-all ${
                            isDragging 
                              ? 'border-gold bg-gold/10 shadow-sm' 
                              : 'border-gold/40 hover:border-gold/60 bg-cream/30'
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <Input 
                            id="documents" 
                            type="file" 
                            accept=".pdf,.jpg,.jpeg,.png" 
                            multiple
                            onChange={(e) => {
                              const newFiles = Array.from(e.target.files || []);
                              handleFileChange(newFiles);
                              e.target.value = '';
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            required={formData.files.length === 0}
                          />
                          <div className="h-20 px-3 py-3 flex flex-col items-center justify-center text-center cursor-pointer">
                            <Upload className="w-4 h-4 text-gold mb-1.5" />
                            <p className="text-[12px] text-foreground font-semibold mb-0.5">
                              Drag and drop files here or click to browse
                            </p>
                            <p className="text-[10px] text-muted-foreground/80">
                              PDF, JPG, PNG accepted
                            </p>
                          </div>
                        </div>
                        
                        {/* File Preview Chips */}
                        {formData.files.length > 0 && (
                          <div className="space-y-2.5 mt-2.5">
                            <div className="flex flex-wrap gap-2">
                              {formData.files.map((file, index) => {
                                const isPDF = file.type === 'application/pdf';
                                const isImage = file.type.startsWith('image/');
                                
                                return (
                                  <div
                                    key={`${file.name}-${index}`}
                                    className="flex items-center gap-2 bg-cream/70 border border-gold/40 rounded-lg px-2.5 py-1.5 text-[11px] group hover:border-gold/60 hover:shadow-sm transition-all"
                                  >
                                    {isPDF ? (
                                      <FileText className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                    ) : isImage ? (
                                      <ImageIcon className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                    ) : (
                                      <FileText className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                    )}
                                    <span className="text-foreground font-semibold truncate max-w-[140px]">
                                      {file.name}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center">
                                        <Check className="w-2 h-2 text-white flex-shrink-0" />
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({
                                          ...prev,
                                          files: prev.files.filter((_, i) => i !== index)
                                        }));
                                      }}
                                      className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                                      aria-label={`Remove ${file.name}`}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <p className="text-[10px] text-muted-foreground">
                              Documents attached: {formData.files.length} {formData.files.length === 1 ? 'file' : 'files'}
                            </p>
                          </div>
                        )}
                        {validationErrors.files && (
                          <p className="text-[10px] text-destructive mt-1">{validationErrors.files}</p>
                        )}
                      </div>

                      {/* Personal Info Fields */}
                      <div className="grid grid-cols-1 gap-3.5 pt-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-sm font-semibold">Full Name <span className="text-destructive">*</span></Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter your full legal name"
                            className="h-9 rounded-lg border-input hover:border-gold/40 focus:border-gold transition-colors placeholder:text-muted-foreground/70"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-sm font-semibold">Email <span className="text-destructive">*</span></Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="your@email.com"
                            className="h-9 rounded-lg border-input hover:border-gold/40 focus:border-gold transition-colors placeholder:text-muted-foreground/70"
                            required
                          />
                          {validationErrors.email && (
                            <p className="text-[10px] text-destructive">{validationErrors.email}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="npn" className="text-sm font-semibold">NPN <span className="text-destructive">*</span></Label>
                          <Input
                            id="npn"
                            name="npn"
                            value={formData.npn}
                            onChange={handleInputChange}
                            placeholder="Enter your NPN"
                            className="h-9 rounded-lg border-input hover:border-gold/40 focus:border-gold transition-colors placeholder:text-muted-foreground/70"
                            required
                          />
                          {validationErrors.npn && (
                            <p className="text-[10px] text-destructive">{validationErrors.npn}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="residentState" className="text-sm font-semibold">Resident State <span className="text-destructive">*</span></Label>
                          <select
                            id="residentState"
                            name="residentState"
                            value={formData.residentState}
                            onChange={handleInputChange}
                            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors hover:border-gold/40 focus:border-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground/70"
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
                          {validationErrors.state && (
                            <p className="text-[10px] text-destructive">{validationErrors.state}</p>
                          )}
                        </div>
                      </div>

                      {/* Post-Submission Success Message */}
                      {isSubmitted && (
                        <div className="pt-4 mt-4 border-t border-gold/30 bg-gold/5 -mx-5 px-5 py-4 rounded-lg animate-fade-in">
                          <div className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 animate-scale-in">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground mb-1">
                                Contracting packet submitted successfully
                              </p>
                              <p className="text-[11px] text-muted-foreground/90">
                                We will review your documents within 2–3 business days and email you if anything is missing.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Submit Button */}
                      {!isSubmitted && (
                        <div className="pt-3 flex flex-col items-center gap-2.5">
                          <Button 
                            type="submit" 
                            className={`w-full font-bold py-4 text-sm rounded-lg transition-all ${
                              isFormComplete
                                ? 'bg-gold hover:bg-gold/90 text-charcoal shadow-md hover:shadow-lg'
                                : 'bg-muted hover:bg-muted text-muted-foreground'
                            }`}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Submitting..." : "Submit Contracting Packet →"}
                          </Button>
                          
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground/80">
                              We review submissions within 2–3 business days.
                            </p>
                            <p className="text-[10px] text-muted-foreground/80">
                              We'll email you if anything is missing.
                            </p>
                          </div>
                        </div>
                      )}

                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

          {/* Caroline Contact Line - Bottom */}
          <section className="pb-10 px-6 md:px-12 lg:px-20 bg-background">
            <div className="max-w-4xl mx-auto text-center">
            <p className="text-[12px] text-muted-foreground">
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
