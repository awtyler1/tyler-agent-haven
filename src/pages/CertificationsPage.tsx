import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import PdfPreviewModal from "@/components/PdfPreviewModal";
import aetnaLogo from "@/assets/aetna-logo.png";
import anthemLogo from "@/assets/anthem-logo.jpg";
import devotedLogo from "@/assets/devoted-logo.png";
import humanaLogo from "@/assets/humana-logo.png";
import uhcLogo from "@/assets/uhc-logo.png";
import wellcareLogo from "@/assets/wellcare-logo.jpg";
import ahipLogo from "@/assets/ahip-logo.png";

const carrierCertifications = [
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
];

const CertificationsPage = () => {
  const [pdfPreview, setPdfPreview] = useState<{ title: string; url: string } | null>(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-20 pb-3 md:pt-24 md:pb-4 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-2">Certifications</h1>
            <p className="text-base md:text-lg text-foreground font-medium max-w-3xl mx-auto">
              Complete your annual AHIP and carrier certifications to stay compliant and ready to sell.
            </p>
          </div>
        </section>

        {/* Orientation Tile */}
        <section className="pb-3 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]">
              <h2 className="text-base font-semibold mb-2">Annual Medicare Certifications</h2>
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
          </div>
        </section>

        {/* Certification Checklist Tile */}
        <section className="pb-8 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-150 max-w-xl mx-auto text-center">
              <h3 className="text-base font-semibold mb-2">Annual Certification Checklist</h3>
              <p className="text-xs text-muted-foreground mb-3">
                A simple guide to ensure you complete every required certification.
              </p>
              <Button className="bg-gold hover:bg-gold/90 text-white text-sm h-9">
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
