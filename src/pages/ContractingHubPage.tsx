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
import { CheckCircle, Download, Mail, FileText, Image as ImageIcon, X, Check, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  const requiredDocuments = [
    { text: "State insurance license", tag: "Required" },
    { text: "E&O certificate with your correct name", tag: "Required" },
    { text: "Voided check (personal or corporate)", tag: "Required" },
    { text: "AML certificate (and CE if your state requires it)", tag: "If state requires" },
    { text: "Explanation documents for any \"Yes\" answers in the legal section", tag: "If answering Yes" },
    { text: "Corporate license + corporate bank info (if contracting as an agency)", tag: "Agency only" }
  ];

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
                      {requiredDocuments.map((doc, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span>□</span>
                          <span className="flex-1">{doc.text}</span>
                          <span className="text-[10px] text-gold font-medium">({doc.tag})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Multi-File Upload with Drag & Drop */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="documents" className="text-sm font-semibold">
                        Upload Documents <span className="text-destructive">*</span>
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-[11px]">
                            <p>If you're unsure which documents to include, refer to the checklist above or email Caroline at caroline@tylerinsurancegroup.com</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-[12px] text-muted-foreground mb-1.5">
                      Attach your completed contracting packet and all required documents.<br />
                      Accepted formats: PDF, JPG, PNG. Multiple files allowed.
                    </p>
                    
                    {/* Drag & Drop Upload Area */}
                    <div 
                      className={`relative border-2 border-dashed rounded-md transition-colors ${
                        isDragging 
                          ? 'border-gold bg-gold/5' 
                          : 'border-input hover:border-gold/40'
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
                      <div className="h-20 px-4 py-3 flex flex-col items-center justify-center text-center cursor-pointer">
                        <p className="text-sm text-foreground font-medium mb-1">
                          Drag and drop files here or click to browse
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          PDF, JPG, PNG accepted
                        </p>
                      </div>
                    </div>
                    
                    {/* File Preview Chips */}
                    {formData.files.length > 0 && (
                      <div className="space-y-2.5 mt-3">
                        <div className="flex flex-wrap gap-2">
                          {formData.files.map((file, index) => {
                            const isPDF = file.type === 'application/pdf';
                            const isImage = file.type.startsWith('image/');
                            
                            return (
                              <div
                                key={`${file.name}-${index}`}
                                className="flex items-center gap-2 bg-cream/60 border border-gold/30 rounded-md px-3 py-2 text-[12px] group hover:border-gold/50 transition-colors shadow-sm"
                              >
                                {isPDF ? (
                                  <FileText className="w-4 h-4 text-gold flex-shrink-0" />
                                ) : isImage ? (
                                  <ImageIcon className="w-4 h-4 text-gold flex-shrink-0" />
                                ) : (
                                  <FileText className="w-4 h-4 text-gold flex-shrink-0" />
                                )}
                                <span className="text-foreground/90 font-semibold truncate max-w-[180px]">
                                  {file.name}
                                </span>
                                <div className="flex items-center gap-1 ml-1">
                                  <Check className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                  <span className="text-[10px] text-gold font-medium">Uploaded</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      files: prev.files.filter((_, i) => i !== index)
                                    }));
                                  }}
                                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                                  aria-label={`Remove ${file.name}`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* File Count Indicator with Progress Bar */}
                        <div className="space-y-1.5">
                          <p className="text-[11px] text-muted-foreground">
                            We typically expect at least 4–5 files (packet, license, E&O, voided check, AML, etc.).
                          </p>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[11px] text-foreground font-medium">
                              Documents attached: {formData.files.length} {formData.files.length === 1 ? 'file' : 'files'}
                            </span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((segment) => (
                                <div
                                  key={segment}
                                  className={`w-6 h-1.5 rounded-full transition-colors ${
                                    formData.files.length >= segment
                                      ? 'bg-gold'
                                      : 'bg-border'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {validationErrors.files && (
                      <p className="text-[11px] text-destructive mt-1">{validationErrors.files}</p>
                    )}
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
                      {validationErrors.email && (
                        <p className="text-[11px] text-destructive">{validationErrors.email}</p>
                      )}
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
                      {validationErrors.npn && (
                        <p className="text-[11px] text-destructive">{validationErrors.npn}</p>
                      )}
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
                      {validationErrors.state && (
                        <p className="text-[11px] text-destructive">{validationErrors.state}</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Review Summary */}
                  {(formData.name || formData.email || formData.npn || formData.residentState || formData.files.length > 0) && (
                    <div className="pt-4 mt-4 border-t border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-2.5">Quick Review</h3>
                      <div className="space-y-1.5 text-[12px]">
                        {formData.name && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[110px]">Full Name:</span>
                            <span className="text-foreground">{formData.name}</span>
                          </div>
                        )}
                        {formData.email && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[110px]">Email:</span>
                            <span className="text-foreground">{formData.email}</span>
                          </div>
                        )}
                        {formData.npn && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[110px]">NPN:</span>
                            <span className="text-foreground">{formData.npn}</span>
                          </div>
                        )}
                        {formData.residentState && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[110px]">Resident State:</span>
                            <span className="text-foreground">{formData.residentState}</span>
                          </div>
                        )}
                        {formData.files.length > 0 && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[110px]">Documents:</span>
                            <span className="text-foreground">{formData.files.length} {formData.files.length === 1 ? 'file' : 'files'} attached</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Post-Submission Success Message */}
                  {isSubmitted && (
                    <div className="pt-4 mt-4 border-t border-gold/20 bg-gold/5 -mx-5 px-5 py-4 rounded-md animate-fade-in">
                      <div className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5 animate-scale-in" />
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-1">
                            Contracting packet submitted successfully
                          </p>
                          <p className="text-[12px] text-muted-foreground">
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
                        className={`w-full max-w-md font-semibold py-4 text-sm transition-colors ${
                          isFormComplete
                            ? 'bg-gold hover:bg-gold/90 text-charcoal'
                            : 'bg-muted hover:bg-muted text-muted-foreground'
                        }`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "Submit Contracting Packet →"}
                      </Button>
                      
                      <p className="text-[11px] text-muted-foreground text-center max-w-md">
                        We review submissions within 2–3 business days.<br />
                        We'll email you if anything is missing.
                      </p>
                    </div>
                  )}

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
