import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jsPDF } from "jspdf";
import PdfPreviewModal from "@/components/PdfPreviewModal";
import aetnaLogo from "@/assets/aetna-logo.png";
import anthemLogo from "@/assets/anthem-logo.jpg";
import devotedLogo from "@/assets/devoted-logo.png";
import humanaLogo from "@/assets/humana-logo.png";
import uhcLogo from "@/assets/uhc-logo.png";
import wellcareLogo from "@/assets/wellcare-logo.jpg";
import ahipLogo from "@/assets/ahip-logo.png";

type State = "Kentucky" | "Ohio" | "Tennessee" | "Indiana" | "West Virginia" | "Georgia" | "Virginia";

const states: State[] = ["Kentucky", "Ohio", "Tennessee", "Indiana", "West Virginia", "Georgia", "Virginia"];

const carrierCertificationsByState: Record<State, Array<{
  name: string;
  url: string;
  howToCertifyUrl: string;
  howToCertifyTitle: string;
  logo: string;
}>> = {
  Kentucky: [
    {
      name: "Aetna",
      url: "https://www.aetna.com/producer_public/login.fcc",
      howToCertifyUrl: "/downloads/TIG_2026_Aetna_Certification_Instructions.pdf",
      howToCertifyTitle: "Aetna 2026 Certification Instructions",
      logo: aetnaLogo,
    },
    {
      name: "Anthem",
      url: "https://getcertified.elevancehealth.com/medicare/certify?brand=ELV",
      howToCertifyUrl: "/downloads/TIG_2026_Anthem_Certification_Instructions.pdf",
      howToCertifyTitle: "Anthem 2026 Certification Instructions",
      logo: anthemLogo,
    },
    {
      name: "Devoted",
      url: "https://agent.devoted.com/",
      howToCertifyUrl: "/downloads/TIG_2026_Devoted_Certification_Instructions.pdf",
      howToCertifyTitle: "Devoted 2026 Certification Instructions",
      logo: devotedLogo,
    },
    {
      name: "Humana",
      url: "https://account.humana.com/",
      howToCertifyUrl: "/downloads/TIG_2026_Humana_Certification_Instructions.pdf",
      howToCertifyTitle: "Humana 2026 Certification Instructions",
      logo: humanaLogo,
    },
    {
      name: "UnitedHealthcare",
      url: "https://www.uhcjarvis.com/content/jarvis/en/sign_in.html#/sign_in",
      howToCertifyUrl: "/downloads/TIG_2026_UHC_Certification_Instructions.pdf",
      howToCertifyTitle: "UnitedHealthcare 2026 Certification Instructions",
      logo: uhcLogo,
    },
    {
      name: "Wellcare",
      url: "https://www.wellcare.com/Broker-Resources/Broker-Resources",
      howToCertifyUrl: "",
      howToCertifyTitle: "Wellcare 2026 Certification Instructions",
      logo: wellcareLogo,
    },
  ],
  Ohio: [],
  Tennessee: [],
  Indiana: [],
  "West Virginia": [],
  Georgia: [],
  Virginia: [],
};

const CertificationsPage = () => {
  const [selectedState, setSelectedState] = useState<State>("Kentucky");
  const [pdfPreview, setPdfPreview] = useState<{ title: string; url: string } | null>(null);

  const carrierCertifications = carrierCertificationsByState[selectedState];

  const handleDownloadChecklist = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Annual Medicare Certification Checklist", margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`State: ${selectedState}`, margin, yPos);
    yPos += 6;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 15;

    // Section 1: AHIP
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("STEP 1: AHIP CERTIFICATION (Required First)", margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.rect(margin, yPos - 3, 3, 3); // Checkbox
    doc.text("Complete AHIP annual Medicare training", margin + 6, yPos);
    yPos += 7;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("URL: https://www.ahipmedicaretraining.com/page/login", margin + 6, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Completion Date: _______________", margin + 6, yPos);
    yPos += 15;

    // Section 2: Carrier Certifications
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`STEP 2: CARRIER CERTIFICATIONS FOR ${selectedState.toUpperCase()}`, margin, yPos);
    yPos += 10;

    if (carrierCertifications.length === 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("No carrier certifications available yet for this state.", margin, yPos);
      yPos += 6;
      doc.text("Check back soon for updates.", margin, yPos);
      yPos += 10;
    } else {
      carrierCertifications.forEach((cert, index) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${cert.name.toUpperCase()} CERTIFICATION`, margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.rect(margin, yPos - 3, 3, 3); // Checkbox
        doc.text(`Complete ${cert.name} annual certification`, margin + 6, yPos);
        yPos += 7;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const urlText = `URL: ${cert.url}`;
        const splitUrl = doc.splitTextToSize(urlText, pageWidth - margin * 2 - 6);
        doc.text(splitUrl, margin + 6, yPos);
        yPos += splitUrl.length * 5;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("Completion Date: _______________", margin + 6, yPos);
        yPos += 12;
      });
    }

    // Important Reminders
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("IMPORTANT REMINDERS", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const reminders = [
      "• AHIP must be completed BEFORE carrier certifications",
      "• All certifications expire annually and must be renewed",
      "• Keep certificates saved for compliance records",
      "• Contact your upline with certification issues"
    ];

    reminders.forEach(reminder => {
      doc.text(reminder, margin, yPos);
      yPos += 7;
    });

    // Footer
    yPos += 10;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Tyler Insurance Group", margin, yPos);
    yPos += 5;
    doc.text("Agent Certification Tracking System", margin, yPos);

    // Save the PDF
    doc.save(`Certification_Checklist_${selectedState.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-20 pb-3 md:pt-24 md:pb-4 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display">Certifications</h1>
          </div>
        </section>

        {/* Orientation Tile + State Filter */}
        <section className="pb-3 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h2 className="text-base font-semibold">Annual Medicare Certifications</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Select State:</span>
                  <Select value={selectedState} onValueChange={(value) => setSelectedState(value as State)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state} value={state} className="text-xs">
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-snug">
                To write Medicare Advantage and Part D plans, you must complete AHIP and each carrier's annual certification. Start with AHIP, then complete the certifications for the carriers available in your state.
              </p>
            </div>
          </div>
        </section>

        {/* AHIP Hero Tile */}
        <section className="pb-3 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="bg-white border border-[#E5E2DB] rounded-lg p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-150 max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <img src={ahipLogo} alt="AHIP" className="max-w-full max-h-full object-contain" />
              </div>
              <h3 className="text-lg font-semibold mb-1">AHIP Certification</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Required before all carrier certifications
              </p>
              <a
                href="https://www.ahipmedicaretraining.com/page/login"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-gold hover:bg-gold/90 text-white text-sm h-9">
                  Take AHIP Certification
                  <ExternalLink className="w-3.5 h-3.5 ml-2" />
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Carrier Certification Grid */}
        <section className="pb-3 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            {carrierCertifications.length === 0 ? (
              <div className="bg-white border border-[#E5E2DB] rounded-lg p-8 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No carrier certifications available for {selectedState} yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Carrier certifications for this state are coming soon.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {carrierCertifications.map((cert) => (
                <div
                  key={cert.name}
                  className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-150 flex flex-col"
                >
                  <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <img 
                      src={cert.logo} 
                      alt={cert.name} 
                      className="max-w-full max-h-full object-contain"
                      style={{ filter: 'brightness(0.98) contrast(1.02)' }}
                    />
                  </div>
                  <h4 className="text-center font-semibold text-sm mb-3">{cert.name}</h4>
                  <div className="space-y-1.5 mt-auto">
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button className="w-full bg-gold hover:bg-gold/90 text-white text-xs h-8">
                        Certification Portal
                        <ExternalLink className="w-3 h-3 ml-1.5" />
                      </Button>
                    </a>
                    {cert.howToCertifyUrl ? (
                      <Button
                        variant="outline"
                        className="w-full text-xs h-8"
                        onClick={() => setPdfPreview({ title: cert.howToCertifyTitle, url: cert.howToCertifyUrl })}
                      >
                        How to Certify
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full text-xs h-8 opacity-50 cursor-not-allowed"
                        disabled
                      >
                        How to Certify
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </section>

        {/* Certification Checklist Tile */}
        <section className="pb-8 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-150 max-w-xl mx-auto text-center">
              <h3 className="text-base font-semibold mb-2">Annual Certification Checklist</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Download a checklist for AHIP + {carrierCertifications.length > 0 ? `${carrierCertifications.length} ${selectedState} carriers` : selectedState}
              </p>
              <Button 
                className="bg-gold hover:bg-gold/90 text-white text-sm h-9"
                onClick={handleDownloadChecklist}
              >
                Download Checklist
                <Download className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <PdfPreviewModal
        isOpen={!!pdfPreview}
        onClose={() => setPdfPreview(null)}
        pdfUrl={pdfPreview?.url || ""}
        title={pdfPreview?.title || ""}
      />
    </div>
  );
};

export default CertificationsPage;
