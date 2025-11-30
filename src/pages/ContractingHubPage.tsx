import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import PdfPreviewModal from "@/components/PdfPreviewModal";
import { 
  CheckCircle, 
  FileText, 
  Upload,
  Award,
  Wrench,
  HelpCircle,
  BookOpen,
  GraduationCap,
  Mail,
  Eye
} from "lucide-react";

const ContractingHubPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    npn: "",
    email: ""
  });
  const [file, setFile] = useState<File | null>(null);

  const requiredDocuments = [
    "Copy of your insurance license",
    "Copy of your E&O coverage (if applicable)",
    "Copy of a voided check for direct deposit",
    "Completed AML training certificate",
    "CE certificate (if required by your state)",
    "Written explanations for any \"Yes\" answers to background questions",
    "Corporate license and corporate voided check (if contracting as a corporation)",
    "Corporate signer list or corporate resolution (if contracting through a business entity)"
  ];

  const importantNotes = [
    "Some carriers charge state appointment fees",
    "All legal/background questions must be answered truthfully",
    "Include written explanations for any \"Yes\" answers",
    "Contracting cannot be processed until all required documents are submitted",
    "Expect follow-up requests if corrections or missing items are identified"
  ];

  const quickLinks = [
    { title: "Certifications", href: "/agent-tools", icon: Award },
    { title: "Agent Tools", href: "/agent-tools", icon: Wrench },
    { title: "Medicare Fundamentals", href: "/medicare-fundamentals", icon: BookOpen },
    { title: "Sales Training", href: "/sales-training", icon: GraduationCap },
    { title: "Support", href: "/contact", icon: HelpCircle }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.npn.trim() || !file) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in your name, NPN, and upload your contracting packet.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // For now, simulate submission - will need Lovable Cloud for actual email
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Submission Received",
        description: "Thank you. Your contracting packet has been sent to our contracting team. We will contact you if additional information is needed."
      });
      setFormData({ name: "", npn: "", email: "" });
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById("packet-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24">
        {/* Title Section */}
        <section className="section-padding bg-background">
          <div className="container-narrow text-center">
            <h1 className="heading-display text-foreground mb-4">
              Contracting Hub
            </h1>
            <p className="text-xl text-gold font-medium mb-6">
              Get appointed with Tyler Insurance Group and our carrier partners.
            </p>
            <p className="text-body text-muted-foreground max-w-2xl mx-auto">
              This page walks you through the contracting process from start to finish. Follow each step carefully to ensure fast and accurate appointments.
            </p>
          </div>
        </section>

        {/* Required Documents Section */}
        <section className="section-padding bg-cream/30">
          <div className="container-narrow">
            <div className="text-center mb-12">
              <h2 className="heading-section text-foreground mb-4">
                What You Need Before You Begin
              </h2>
            </div>

            <Card className="border-gold/20 shadow-elegant">
              <CardContent className="p-8">
                <div className="grid gap-4 mb-8">
                  {requiredDocuments.map((doc, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{doc}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic border-t border-border pt-6">
                  Have these items ready before starting the contracting submission process.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Step-by-Step Process */}
        <section className="section-padding bg-background">
          <div className="container-narrow">
            <div className="text-center mb-12">
              <h2 className="heading-section text-foreground mb-4">
                Step-by-Step Contracting Process
              </h2>
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <Card className="border-gold/20">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-serif text-xl font-bold">1</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        Download and Complete the Contracting Packet
                      </h3>
                      <Button 
                        onClick={() => setIsPdfModalOpen(true)}
                        className="bg-gold hover:bg-gold/90 text-charcoal"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview & Download Contracting Packet
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className="border-gold/20">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-serif text-xl font-bold">2</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        Fill Out All Required Forms
                      </h3>
                      <p className="text-muted-foreground">
                        Ensure every page is completed and signed. Missing signatures or unanswered questions will delay your appointment.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="border-gold/20">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-serif text-xl font-bold">3</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        Gather Required Documents
                      </h3>
                      <p className="text-muted-foreground">
                        Collect all documents from the checklist above: license, E&O, voided check, AML certificate, and any applicable corporate documents.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 4 */}
              <Card className="border-gold/20">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-serif text-xl font-bold">4</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        Select the Carriers You Want to Be Appointed With
                      </h3>
                      <p className="text-muted-foreground">
                        Indicate your chosen carriers inside the contracting packet. You may add or remove carriers later.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 5 */}
              <Card className="border-gold/20">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-serif text-xl font-bold">5</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        Submit Your Packet Using the Upload Form Below
                      </h3>
                      <p className="text-muted-foreground">
                        Once complete, use the submission form at the bottom of this page to upload your packet directly to our contracting team.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Upload Form Section */}
        <section className="section-padding bg-background">
          <div className="container-narrow">
            <Card className="border-gold/30 shadow-elegant max-w-2xl mx-auto">
              <CardContent className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-8 h-8 text-gold" />
                  </div>
                  <h2 className="heading-section text-foreground mb-4">
                    Submit Your Completed Contracting Packet
                  </h2>
                  <p className="text-muted-foreground">
                    Upload your completed contracting packet and required documents here. Your submission will be sent directly to our contracting team.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full legal name"
                      className="border-border focus:border-gold"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="npn" className="text-foreground">
                      NPN (National Producer Number) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="npn"
                      name="npn"
                      value={formData.npn}
                      onChange={handleInputChange}
                      placeholder="Enter your NPN"
                      className="border-border focus:border-gold"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      Email Address <span className="text-muted-foreground text-sm">(optional)</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      className="border-border focus:border-gold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="packet-upload" className="text-foreground">
                      Upload Completed Contracting Packet <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="packet-upload"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="border-border focus:border-gold cursor-pointer"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Accepted formats: PDF, DOC, DOCX, JPG, PNG
                    </p>
                  </div>

                  {file && (
                    <div className="flex items-center gap-2 p-3 bg-cream/50 rounded-lg">
                      <FileText className="w-4 h-4 text-gold" />
                      <span className="text-sm text-foreground">{file.name}</span>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gold hover:bg-gold/90 text-charcoal font-semibold py-6"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Uploading..."
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload and Send to Contracting
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Important Notes */}
        <section className="section-padding bg-cream/30">
          <div className="container-narrow">
            <div className="text-center mb-12">
              <h2 className="heading-section text-foreground mb-4">
                Important Notes & Expectations
              </h2>
            </div>

            <Card className="border-gold/20">
              <CardContent className="p-8">
                <div className="space-y-4 mb-8">
                  {importantNotes.map((note, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <FileText className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{note}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gold/10 border border-gold/30 rounded-lg p-6">
                  <p className="text-foreground font-medium text-center">
                    Accuracy and completeness prevent delays.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Support Section */}
        <section className="section-padding bg-background">
          <div className="container-narrow">
            <div className="text-center mb-12">
              <h2 className="heading-section text-foreground mb-4">
                Contracting Support
              </h2>
            </div>

            <Card className="border-gold/20 max-w-xl mx-auto">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Caroline Horn
                </h3>
                <p className="text-muted-foreground mb-6">Contracting Specialist</p>
                
                <div className="space-y-3 mb-6">
                  <a 
                    href="mailto:caroline@tylerinsurancegroup.com" 
                    className="flex items-center justify-center gap-2 text-gold hover:text-gold/80 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    caroline@tylerinsurancegroup.com
                  </a>
                </div>

                <p className="text-sm text-muted-foreground border-t border-border pt-6">
                  For general contracting questions, include your full name and NPN for faster support.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Links */}
        <section className="section-padding bg-cream/30">
          <div className="container-narrow">
            <div className="text-center mb-12">
              <h2 className="heading-section text-foreground mb-4">
                Quick Links
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={index}
                    to={link.href}
                    className="flex flex-col items-center gap-3 p-6 rounded-xl border border-gold/20 bg-card hover:border-gold/40 hover:shadow-elegant transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <Icon className="w-6 h-6 text-gold" />
                    </div>
                    <span className="text-sm font-medium text-foreground text-center">{link.title}</span>
                  </Link>
                );
              })}
            </div>
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
