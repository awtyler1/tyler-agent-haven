import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ExternalLink } from "lucide-react";
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
import tylerLogo from "@/assets/tyler-logo.png";
import aetnaLogo from "@/assets/aetna-logo.png";
import anthemLogo from "@/assets/anthem-logo.jpg";
import devotedLogo from "@/assets/devoted-logo.png";
import humanaLogo from "@/assets/humana-logo.png";
import uhcLogo from "@/assets/uhc-logo.png";
import wellcareLogo from "@/assets/wellcare-logo.jpg";
import ahipLogo from "@/assets/ahip-logo.png";

type State = "Kentucky" | "Ohio" | "Tennessee" | "Indiana" | "West Virginia" | "Georgia" | "Virginia";
type Year = "2026" | "2027";

const states: State[] = ["Kentucky", "Ohio", "Tennessee", "Indiana", "West Virginia", "Georgia", "Virginia"];
const years: Year[] = ["2026", "2027"];

const carrierCertificationsByStateAndYear: Record<Year, Record<State, Array<{
  name: string;
  url: string;
  howToCertifyUrl: string;
  howToCertifyTitle: string;
  logo: string;
  available?: boolean;
}>>> = {
  "2026": {
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
    Tennessee: [],
    Ohio: [],
    Indiana: [],
    "West Virginia": [],
    Georgia: [],
    Virginia: [],
  },
  "2027": {
    Kentucky: [
      {
        name: "Aetna",
        url: "",
        howToCertifyUrl: "",
        howToCertifyTitle: "Aetna 2027 Certification Instructions",
        logo: aetnaLogo,
        available: false,
      },
      {
        name: "Anthem",
        url: "",
        howToCertifyUrl: "",
        howToCertifyTitle: "Anthem 2027 Certification Instructions",
        logo: anthemLogo,
        available: false,
      },
      {
        name: "Devoted",
        url: "",
        howToCertifyUrl: "",
        howToCertifyTitle: "Devoted 2027 Certification Instructions",
        logo: devotedLogo,
        available: false,
      },
      {
        name: "Humana",
        url: "",
        howToCertifyUrl: "",
        howToCertifyTitle: "Humana 2027 Certification Instructions",
        logo: humanaLogo,
        available: false,
      },
      {
        name: "UnitedHealthcare",
        url: "",
        howToCertifyUrl: "",
        howToCertifyTitle: "UnitedHealthcare 2027 Certification Instructions",
        logo: uhcLogo,
        available: false,
      },
      {
        name: "Wellcare",
        url: "",
        howToCertifyUrl: "",
        howToCertifyTitle: "Wellcare 2027 Certification Instructions",
        logo: wellcareLogo,
        available: false,
      },
    ],
    Ohio: [],
    Tennessee: [],
    Indiana: [],
    "West Virginia": [],
    Georgia: [],
    Virginia: [],
  },
};

const CertificationsPage = () => {
  const [selectedState, setSelectedState] = useState<State>("Kentucky");
  const [selectedYear, setSelectedYear] = useState<Year>("2026");
  const [pdfPreview, setPdfPreview] = useState<{ title: string; url: string } | null>(null);

  const carrierCertifications = carrierCertificationsByStateAndYear[selectedYear]?.[selectedState] || [];

  const handleDownloadChecklist = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25;
    const contentWidth = pageWidth - (margin * 2);
    
    // Background color (soft beige matching dashboard)
    doc.setFillColor(253, 251, 247); // #FDFBF7
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    let yPos = 0;

    // Premium gold accent bar at top
    doc.setFillColor(188, 143, 79); // Gold accent
    doc.rect(0, 0, pageWidth, 3, 'F');
    yPos = 18;

    // Add Tyler Insurance Group Logo (centered)
    const logoWidth = 70;
    const logoHeight = 35;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(tylerLogo, 'PNG', logoX, yPos, logoWidth, logoHeight);
    yPos += logoHeight + 14;

    // Title Block
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text("Annual Medicare Certification Checklist", pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`State: ${selectedState}  •  Year: ${selectedYear}  •  Updated ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;
    
    // Title block divider line
    doc.setDrawColor(212, 207, 196); // #D4CFC4
    doc.setLineWidth(0.5);
    doc.line(margin + 15, yPos, pageWidth - margin - 15, yPos);
    yPos += 18;

    // STEP 1 Header with hierarchy
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text("STEP 1 — AHIP Certification", margin, yPos);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("(Required First)", margin + 65, yPos);
    yPos += 5;
    
    // Step divider
    doc.setDrawColor(212, 207, 196);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 12;

    // AHIP Section box
    const ahipBoxY = yPos;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(229, 226, 219); // #E5E2DB
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, ahipBoxY, contentWidth, 30, 3, 3, 'FD');
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("Complete AHIP annual Medicare training", margin + 10, yPos);
    yPos += 10;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("Completion Date:", margin + 10, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(" ____________________________", margin + 40, yPos);
    yPos += 20;

    // STEP 2 Header with hierarchy
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(`STEP 2 — Carrier Certifications for ${selectedState}`, margin, yPos);
    yPos += 5;
    
    // Step divider
    doc.setDrawColor(212, 207, 196);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 14;

    if (carrierCertifications.length === 0) {
      const noCarriersBoxY = yPos;
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(229, 226, 219);
      doc.roundedRect(margin, noCarriersBoxY, contentWidth, 26, 3, 3, 'FD');
      
      yPos += 9;
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(120, 120, 120);
      doc.text("No carrier certifications available yet for this state.", margin + 10, yPos);
      yPos += 6;
      doc.text("Check back soon for updates.", margin + 10, yPos);
      yPos += 18;
    } else {
      carrierCertifications.forEach((cert, index) => {
        // Check if we need a new page
        if (yPos > 240) {
          doc.addPage();
          doc.setFillColor(253, 251, 247);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          doc.setFillColor(188, 143, 79);
          doc.rect(0, 0, pageWidth, 3, 'F');
          yPos = 25;
        }

        // Carrier box
        const carrierBoxY = yPos;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(229, 226, 219);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, carrierBoxY, contentWidth, 28, 3, 3, 'FD');
        
        yPos += 10;
        
        // Add carrier logo
        const logoSize = 10;
        try {
          doc.addImage(cert.logo, 'PNG', margin + 10, yPos - 4.5, logoSize, logoSize);
        } catch (e) {
          // Skip if logo fails to load
        }
        
        // Carrier name
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(cert.name, margin + 10 + logoSize + 5, yPos);
        yPos += 10;

        // Completion date
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("Completion Date:", margin + 14, yPos);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 180, 180);
        doc.text(" _________________________", margin + 44, yPos);
        yPos += 14;
      });
    }

    // Important Reminders Section (premium shaded box)
    if (yPos > 205) {
      doc.addPage();
      doc.setFillColor(253, 251, 247);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setFillColor(188, 143, 79);
      doc.rect(0, 0, pageWidth, 3, 'F');
      yPos = 25;
    }

    yPos += 8;
    const remindersBoxY = yPos;
    doc.setFillColor(248, 246, 240); // Soft beige shade
    doc.setDrawColor(229, 226, 219);
    doc.setLineWidth(1);
    doc.roundedRect(margin, remindersBoxY, contentWidth, 46, 3, 3, 'FD');
    
    yPos += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text("Important Reminders", margin + 10, yPos);
    yPos += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const reminders = [
      "• AHIP must be completed BEFORE carrier certifications",
      "• All certifications expire annually and must be renewed",
      "• Keep certificates saved for compliance records",
      "• Contact your upline with certification issues"
    ];

    reminders.forEach(reminder => {
      doc.text(reminder, margin + 14, yPos);
      yPos += 6;
    });
    
    yPos += 6;

    // Footer separator
    const footerY = pageHeight - 18;
    doc.setDrawColor(212, 207, 196);
    doc.setLineWidth(0.3);
    doc.line(margin + 20, footerY, pageWidth - margin - 20, footerY);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Tyler Insurance Group • Licensed Agent Platform", pageWidth / 2, footerY + 6, { align: 'center' });

    // Save the PDF
    doc.save(`Certification_Checklist_${selectedYear}_${selectedState.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-3 md:pt-36 md:pb-3 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-1.5">Certifications</h1>
            <p className="text-base md:text-lg text-foreground font-medium max-w-3xl mx-auto">
              Complete AHIP once, then certify with each carrier listed below. Your available carriers update automatically based on the selected state.
            </p>
          </div>
        </section>

        {/* Filters Bar - Unified Tile */}
        <section className="pb-2.5 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="bg-white border border-[#D4CFC4] rounded-lg shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08)] p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Year:</span>
                  <Select value={selectedYear} onValueChange={(value) => setSelectedYear(value as Year)}>
                    <SelectTrigger className="w-[90px] h-8 text-xs border-[#D4CFC4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year} className="text-xs">
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">State:</span>
                  <Select value={selectedState} onValueChange={(value) => setSelectedState(value as State)}>
                    <SelectTrigger className="w-[130px] h-8 text-xs border-[#D4CFC4]">
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
              <button
                onClick={handleDownloadChecklist}
                className="text-xs text-gold hover:text-gold/80 transition-colors underline decoration-gold/30 hover:decoration-gold/60 underline-offset-2"
              >
                Download Checklist (PDF)
              </button>
            </div>
          </div>
        </section>

        {/* AHIP Hero Tile - Full Width with Gold Accent */}
        <section className="pb-2 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="bg-white border-l-[3px] border-l-gold border-y border-r border-[#D4CFC4] rounded-lg shadow-[0_3px_14px_-2px_rgba(0,0,0,0.10)] hover:bg-white/[1.02] hover:border-[#BAB5A6] hover:shadow-[0_8px_26px_-4px_rgba(0,0,0,0.16)] hover:-translate-y-[2px] transition-all duration-140 ease-in-out animate-fade-in">
              <div className="flex items-center gap-5 p-5">
                <div className="w-[64px] h-[64px] flex-shrink-0 flex items-center justify-center">
                  <img 
                    src={ahipLogo} 
                    alt="AHIP" 
                    className="max-w-[64px] max-h-[64px] object-contain"
                    style={{ filter: 'brightness(0.98) contrast(1.02)' }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold mb-1">AHIP Certification</h3>
                  <p className="text-xs text-muted-foreground">
                    Required before all carrier certifications
                  </p>
                </div>
                <a
                  href="https://www.ahipmedicaretraining.com/page/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <Button className="bg-gold hover:bg-gold/90 text-white text-sm h-9 px-6">
                    Take AHIP Certification →
                  </Button>
                </a>
              </div>
            </div>
            {/* Dotted Divider */}
            <div className="border-b border-dashed border-[#D4CFC4] my-4"></div>
          </div>
        </section>

        {/* Carrier Certification Grid */}
        <section className="pb-8 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            {carrierCertifications.length === 0 ? (
              <div className="bg-white border border-[#D4CFC4] rounded-lg p-6 shadow-[0_3px_14px_-2px_rgba(0,0,0,0.10)] text-center animate-fade-in">
                <p className="text-sm text-muted-foreground mb-1">
                  No carrier certifications available for {selectedState} in {selectedYear} yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Carrier certifications for this state and year are coming soon.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-2.5">
                {carrierCertifications.map((cert, index) => {
                  const isAvailable = cert.available !== false;
                  
                  if (!isAvailable) {
                    // Non-clickable tile for unavailable certifications
                    return (
                      <div
                        key={cert.name}
                        className="bg-white border border-[#D4CFC4] rounded-lg p-3 shadow-[0_3px_14px_-2px_rgba(0,0,0,0.10)] opacity-60 cursor-not-allowed flex flex-col items-center text-center animate-fade-in"
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <div className="w-[56px] h-[56px] mb-2 flex items-center justify-center">
                          <img 
                            src={cert.logo} 
                            alt={cert.name} 
                            className="max-w-[56px] max-h-[56px] object-contain grayscale"
                            style={{ filter: 'brightness(0.98) contrast(1.02) grayscale(100%)' }}
                          />
                        </div>
                      <h4 className="font-semibold text-xs mb-1">{cert.name}</h4>
                        <p className="text-[10px] text-red-600 italic mb-2.5">
                          {selectedYear} Certifications Not Available
                        </p>
                        <div className="space-y-2 mt-auto w-full">
                          <Button 
                            className="w-full bg-gold/50 text-white text-[11px] h-7 cursor-not-allowed" 
                            disabled
                          >
                            Certification Portal →
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full text-[11px] h-7 cursor-not-allowed"
                            disabled
                          >
                            How to Certify
                          </Button>
                        </div>
                      </div>
                    );
                  }
                  
                  // Clickable tile for available certifications
                  return (
                    <div
                      key={cert.name}
                      className="bg-white border border-[#D4CFC4] rounded-lg p-3 shadow-[0_3px_14px_-2px_rgba(0,0,0,0.10)] hover:bg-white/[1.02] hover:border-[#BAB5A6] hover:shadow-[0_8px_26px_-4px_rgba(0,0,0,0.16)] hover:-translate-y-[2px] transition-all duration-140 ease-in-out flex flex-col items-center text-center animate-fade-in"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <div className="w-[56px] h-[56px] mb-2 flex items-center justify-center">
                        <img 
                          src={cert.logo} 
                          alt={cert.name} 
                          className="max-w-[56px] max-h-[56px] object-contain"
                          style={{ filter: 'brightness(0.98) contrast(1.02)' }}
                        />
                      </div>
                      <h4 className="font-semibold text-xs mb-2.5">{cert.name}</h4>
                      <div className="space-y-2 mt-auto w-full">
                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button className="w-full bg-gold hover:bg-gold/90 text-white text-[11px] h-7">
                            Certification Portal →
                          </Button>
                        </a>
                        {cert.howToCertifyUrl ? (
                          <Button
                            variant="outline"
                            className="w-full text-[11px] h-7 hover:bg-accent"
                            onClick={() => setPdfPreview({ title: cert.howToCertifyTitle, url: cert.howToCertifyUrl })}
                          >
                            How to Certify
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full text-[11px] h-7 opacity-50 cursor-not-allowed"
                            disabled
                          >
                            How to Certify
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
