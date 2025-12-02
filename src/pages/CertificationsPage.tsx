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
    Kentucky: [],
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
        <section className="pt-20 pb-3 md:pt-24 md:pb-4 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display">Certifications</h1>
          </div>
        </section>

        {/* Orientation Tile + State & Year Filters */}
        <section className="pb-3 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h2 className="text-base font-semibold">Annual Medicare Certifications</h2>
                <div className="flex items-center gap-3">
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
                  No carrier certifications available for {selectedState} in {selectedYear} yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Carrier certifications for this state and year are coming soon.
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
                Download a checklist for AHIP + {carrierCertifications.length > 0 ? `${carrierCertifications.length} ${selectedState} carriers` : selectedState} ({selectedYear})
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
