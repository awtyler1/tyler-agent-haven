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
    Tennessee: [
      {
        name: "Aetna",
        url: "https://www.aetna.com/producer_public/login.fcc",
        howToCertifyUrl: "/downloads/TIG_2026_Aetna_Certification_Instructions.pdf",
        howToCertifyTitle: "Aetna 2026 Certification Instructions",
        logo: aetnaLogo,
      },
      {
        name: "BlueCross BlueShield of Tennessee",
        url: "https://www.bcbst.com/providers/",
        howToCertifyUrl: "",
        howToCertifyTitle: "BlueCross BlueShield of Tennessee 2026 Certification Instructions",
        logo: ahipLogo, // PLACEHOLDER - needs actual BCBSTN logo
      },
      {
        name: "Cigna",
        url: "https://www.cignahealthcarepartners.com/",
        howToCertifyUrl: "",
        howToCertifyTitle: "Cigna 2026 Certification Instructions",
        logo: ahipLogo, // PLACEHOLDER - needs actual Cigna logo
      },
      {
        name: "Devoted Health",
        url: "https://agent.devoted.com/",
        howToCertifyUrl: "/downloads/TIG_2026_Devoted_Certification_Instructions.pdf",
        howToCertifyTitle: "Devoted Health 2026 Certification Instructions",
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
      {
        name: "Wellpoint",
        url: "https://www.elevancehealth.com/",
        howToCertifyUrl: "",
        howToCertifyTitle: "Wellpoint 2026 Certification Instructions",
        logo: ahipLogo, // PLACEHOLDER - needs actual Wellpoint logo
      },
      {
        name: "Zing Health",
        url: "https://www.zinghealth.com/",
        howToCertifyUrl: "",
        howToCertifyTitle: "Zing Health 2026 Certification Instructions",
        logo: ahipLogo, // PLACEHOLDER - needs actual Zing Health logo
      },
    ],
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
        <section className="pt-32 pb-8 md:pt-36 md:pb-10 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-3">Certifications</h1>
            <p className="text-lg md:text-xl text-foreground font-medium max-w-3xl mx-auto">
              Start with AHIP, then complete the certifications required by carriers in your selected state.
            </p>
          </div>
        </section>

        {/* Orientation Tile */}
        <section className="pb-1.5 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="bg-white border border-[#D4CFC4] rounded-lg p-4 shadow-[0_3px_14px_-2px_rgba(0,0,0,0.10)] animate-fade-in">
              <div className="flex items-start justify-between gap-6 mb-3">
                <h2 className="text-base font-semibold">Annual Medicare Certifications</h2>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Year:</span>
                    <Select value={selectedYear} onValueChange={(value) => setSelectedYear(value as Year)}>
                      <SelectTrigger className="w-[100px] h-8 text-xs">
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
                    <span className="text-xs text-muted-foreground whitespace-nowrap">State:</span>
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
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                To write Medicare Advantage and Part D plans, you must complete AHIP and each carrier's annual certification. Start with AHIP, then complete the certifications for the carriers available in your state.
              </p>
              <button
                onClick={handleDownloadChecklist}
                className="text-xs text-gold hover:text-gold/80 transition-colors underline decoration-gold/30 hover:decoration-gold/60 underline-offset-2"
              >
                Download State Certification Checklist (PDF)
              </button>
            </div>
          </div>
        </section>

        {/* AHIP Hero Card */}
        <section className="pb-1.5 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="bg-white border border-[#D4CFC4] rounded-lg p-6 shadow-[0_3px_14px_-2px_rgba(0,0,0,0.10)] hover:bg-white/[1.02] hover:border-[#BAB5A6] hover:shadow-[0_8px_26px_-4px_rgba(0,0,0,0.16)] hover:-translate-y-[3px] transition-all duration-140 ease-in-out max-w-2xl mx-auto text-center animate-fade-in">
              <div className="w-[76px] h-[76px] mx-auto mb-4 flex items-center justify-center">
                <img 
                  src={ahipLogo} 
                  alt="AHIP" 
                  className="max-w-[76px] max-h-[76px] object-contain"
                  style={{ filter: 'brightness(0.98) contrast(1.02)' }}
                />
              </div>
              <h3 className="text-base font-semibold mb-1">AHIP Certification</h3>
              <p className="text-xs text-muted-foreground mb-5">
                Required before all carrier certifications
              </p>
              <a
                href="https://www.ahipmedicaretraining.com/page/login"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-gold hover:bg-gold/90 text-white text-sm h-9 px-6">
                  Take AHIP Certification →
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Carrier Certification Grid */}
        <section className="pb-8 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            {carrierCertifications.length === 0 ? (
              <div className="bg-white border border-[#D4CFC4] rounded-lg p-8 shadow-[0_3px_14px_-2px_rgba(0,0,0,0.10)] text-center animate-fade-in">
                <p className="text-sm text-muted-foreground mb-2">
                  No carrier certifications available for {selectedState} in {selectedYear} yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Carrier certifications for this state and year are coming soon.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {carrierCertifications.map((cert, index) => {
                  const isAvailable = cert.available !== false;
                  
                  if (!isAvailable) {
                    // Non-clickable tile for unavailable certifications
                    return (
                      <div
                        key={cert.name}
                        className="bg-white border border-[#D4CFC4] rounded-lg p-4 shadow-[0_3px_14px_-2px_rgba(0,0,0,0.10)] opacity-60 cursor-not-allowed flex flex-col items-center text-center animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-[76px] h-[76px] mb-3 flex items-center justify-center">
                          <img 
                            src={cert.logo} 
                            alt={cert.name} 
                            className="max-w-[76px] max-h-[76px] object-contain grayscale"
                            style={{ filter: 'brightness(0.98) contrast(1.02) grayscale(100%)' }}
                          />
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{cert.name}</h4>
                        <p className="text-xs text-red-600 italic mb-4">
                          {selectedYear} Certifications Not Available
                        </p>
                        <div className="space-y-2 mt-auto w-full">
                          <Button 
                            className="w-full bg-gold/50 text-white text-xs h-8 cursor-not-allowed" 
                            disabled
                          >
                            Certification Portal →
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full text-xs h-8 cursor-not-allowed"
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
                      className="bg-white border border-[#D4CFC4] rounded-lg p-4 shadow-[0_3px_14px_-2px_rgba(0,0,0,0.10)] hover:bg-white/[1.02] hover:border-[#BAB5A6] hover:shadow-[0_8px_26px_-4px_rgba(0,0,0,0.16)] hover:-translate-y-[3px] transition-all duration-140 ease-in-out flex flex-col items-center text-center animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="w-[76px] h-[76px] mb-3 flex items-center justify-center">
                        <img 
                          src={cert.logo} 
                          alt={cert.name} 
                          className="max-w-[76px] max-h-[76px] object-contain"
                          style={{ filter: 'brightness(0.98) contrast(1.02)' }}
                        />
                      </div>
                      <h4 className="font-semibold text-sm mb-4">{cert.name}</h4>
                      <div className="space-y-2 mt-auto w-full">
                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button className="w-full bg-gold hover:bg-gold/90 text-white text-xs h-8">
                            Certification Portal →
                          </Button>
                        </a>
                        {cert.howToCertifyUrl ? (
                          <Button
                            variant="outline"
                            className="w-full text-xs h-8 hover:bg-accent"
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
