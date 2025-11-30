import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Download, 
  FileText, 
  Send, 
  Phone, 
  Mail, 
  Building2,
  Award,
  Wrench,
  HelpCircle,
  ClipboardList,
  Users
} from "lucide-react";

const ContractingHubPage = () => {
  const requiredDocuments = [
    "Copy of your insurance license",
    "Copy of your E&O coverage (if applicable)",
    "Copy of a voided check for direct deposit",
    "Copy of Anti-Money Laundering (AML) certificate",
    "Copy of CE training certificate (if required by your state)",
    "Written explanation for any background issues",
    "Corporate license and corporate voided check (if contracting as a corporation)",
    "Corporate resolution or signer list (if applying to Athene as a corporation)"
  ];

  const carriers = [
    "Aetna",
    "Aflac",
    "Alignment",
    "Allstate",
    "Americo",
    "Anthem",
    "Assurity",
    "Athene",
    "Centene",
    "Cigna",
    "CVS/Aetna",
    "Devoted",
    "Elevance",
    "Foresters",
    "Gerber",
    "Global Atlantic",
    "Guarantee Trust Life",
    "Humana",
    "Mutual of Omaha",
    "National General",
    "Oxford Life",
    "Prosperity",
    "Sentinel",
    "Transamerica",
    "UnitedHealthcare",
    "Wellcare"
  ];

  const importantNotes = [
    "Some carriers may charge resident or non-resident appointment fees.",
    "Ensure all legal questions are answered truthfully (pages 2–4).",
    "Include explanations for any 'Yes' answers.",
    "All pages must be signed where indicated.",
    "By submitting contracting, you authorize TIG to submit your forms to carriers."
  ];

  const quickLinks = [
    { title: "Download Packet", href: "/downloads/Tyler_Insurance_Group_Contracting_Packet.pdf", icon: Download, external: true },
    { title: "Required Documents", href: "#required-documents", icon: ClipboardList, external: false },
    { title: "Carrier List", href: "#carriers", icon: Building2, external: false },
    { title: "Certifications", href: "/agent-tools", icon: Award, external: false },
    { title: "Agent Tools", href: "/agent-tools", icon: Wrench, external: false },
    { title: "Support", href: "/contact", icon: HelpCircle, external: false }
  ];

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
              This page guides you through the contracting process and ensures your appointments are completed quickly and correctly.
            </p>
          </div>
        </section>

        {/* Required Documents Section */}
        <section id="required-documents" className="section-padding bg-cream/30">
          <div className="container-narrow">
            <div className="text-center mb-12">
              <h2 className="heading-section text-foreground mb-4">
                What You Need Before You Begin
              </h2>
              <p className="text-body text-muted-foreground">
                Have these items ready before submitting contracting.
              </p>
            </div>

            <Card className="border-gold/20 shadow-elegant">
              <CardContent className="p-8">
                <div className="grid gap-4">
                  {requiredDocuments.map((doc, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{doc}</span>
                    </div>
                  ))}
                </div>
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

            <div className="space-y-8">
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
                      <p className="text-muted-foreground mb-6">
                        Download the Tyler Insurance Group Contracting Packet and complete all required sections.
                      </p>
                      <Button asChild className="bg-gold hover:bg-gold/90 text-charcoal">
                        <a href="/downloads/Tyler_Insurance_Group_Contracting_Packet.pdf" download>
                          <Download className="w-4 h-4 mr-2" />
                          Download Contracting Packet
                        </a>
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
                        Complete every page of the contracting packet. All pages must be signed where indicated throughout the document.
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
                        Collect all required documents listed above: insurance license, E&O coverage, voided check, AML certificate, and any applicable corporate documents.
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
                        Select Your Carriers
                      </h3>
                      <p className="text-muted-foreground">
                        Use the Carrier Selection page in the packet (page 10) to indicate which carriers you want to be appointed with.
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
                        Submit Everything
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Submit your completed packet and all required documents via fax.
                      </p>
                      <div className="bg-cream/50 rounded-lg p-4 mb-6">
                        <p className="font-semibold text-foreground mb-1">Fax to: <span className="text-gold">702-851-5842</span></p>
                        <p className="text-sm text-muted-foreground">If you have questions, call <span className="font-medium">1 (725) 605-8995</span></p>
                      </div>
                      <Button asChild className="bg-gold hover:bg-gold/90 text-charcoal">
                        <a href="tel:17258058995">
                          <Send className="w-4 h-4 mr-2" />
                          Contact to Submit
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Carrier List */}
        <section id="carriers" className="section-padding bg-cream/30">
          <div className="container-narrow">
            <div className="text-center mb-12">
              <h2 className="heading-section text-foreground mb-4">
                Carriers Available for Contracting
              </h2>
              <p className="text-body text-muted-foreground">
                Select your preferred carriers on page 10 of the contracting packet.
              </p>
            </div>

            <Card className="border-gold/20">
              <CardContent className="p-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {carriers.map((carrier, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border/50"
                    >
                      <Building2 className="w-4 h-4 text-gold flex-shrink-0" />
                      <span className="text-sm text-foreground">{carrier}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Important Notes */}
        <section className="section-padding bg-background">
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
                    Contracting cannot be processed until all documents are completed and submitted.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Support Section */}
        <section className="section-padding bg-cream/30">
          <div className="container-narrow">
            <div className="text-center mb-12">
              <h2 className="heading-section text-foreground mb-4">
                Contracting Support
              </h2>
              <p className="text-body text-muted-foreground">
                Need help with your contracting? We're here to assist.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-gold/20">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    Caroline Horn
                  </h3>
                  <p className="text-muted-foreground mb-6">Contracting Support</p>
                  <div className="space-y-3">
                    <a 
                      href="mailto:caroline@tylerinsurancegroup.com" 
                      className="flex items-center justify-center gap-2 text-gold hover:text-gold/80 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      caroline@tylerinsurancegroup.com
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gold/20">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
                    <Phone className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    General Contracting Questions
                  </h3>
                  <p className="text-muted-foreground mb-6">For questions while completing the packet</p>
                  <a 
                    href="tel:17256058995" 
                    className="flex items-center justify-center gap-2 text-gold hover:text-gold/80 transition-colors text-lg font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    1 (725) 605-8995
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="section-padding bg-background">
          <div className="container-narrow">
            <div className="text-center mb-12">
              <h2 className="heading-section text-foreground mb-4">
                Quick Links
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                
                if (link.external) {
                  return (
                    <a
                      key={index}
                      href={link.href}
                      download={link.title === "Download Packet"}
                      className="flex flex-col items-center gap-3 p-6 rounded-xl border border-gold/20 bg-card hover:border-gold/40 hover:shadow-elegant transition-all duration-300 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                        <Icon className="w-6 h-6 text-gold" />
                      </div>
                      <span className="text-sm font-medium text-foreground text-center">{link.title}</span>
                    </a>
                  );
                }
                
                if (link.href.startsWith("#")) {
                  return (
                    <a
                      key={index}
                      href={link.href}
                      className="flex flex-col items-center gap-3 p-6 rounded-xl border border-gold/20 bg-card hover:border-gold/40 hover:shadow-elegant transition-all duration-300 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                        <Icon className="w-6 h-6 text-gold" />
                      </div>
                      <span className="text-sm font-medium text-foreground text-center">{link.title}</span>
                    </a>
                  );
                }
                
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
    </div>
  );
};

export default ContractingHubPage;
