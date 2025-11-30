import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ExternalLink, Phone, Award } from "lucide-react";
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
    buttonText: "Start Aetna Certification",
    subtext: "Annual certification for MAPD and PDP plans.",
    support: "Aetna Broker Support: 866-714-9301",
    url: "#",
    howToCertifyUrl: "/downloads/TIG_2026_Aetna_Certification_Instructions.pdf",
    howToCertifyTitle: "Aetna 2026 Certification Instructions",
    logo: aetnaLogo,
  },
  {
    name: "Anthem",
    buttonText: "Start Anthem Certification",
    subtext: "Annual certification for MAPD and PDP plans.",
    support: "Anthem Broker Support: (833) 864-0133",
    url: "#",
    howToCertifyUrl: "/downloads/TIG_2026_Anthem_Certification_Instructions.pdf",
    howToCertifyTitle: "Anthem 2026 Certification Instructions",
    logo: anthemLogo,
  },
  {
    name: "Devoted",
    buttonText: "Start Devoted Certification",
    subtext: "Annual certification for MAPD and PDP plans.",
    support: "Devoted Broker Support: 800-485-4164",
    url: "#",
    howToCertifyUrl: "/downloads/TIG_2026_Devoted_Certification_Instructions.pdf",
    howToCertifyTitle: "Devoted 2026 Certification Instructions",
    logo: devotedLogo,
  },
  {
    name: "Humana",
    buttonText: "Start Humana Certification",
    subtext: "Annual certification for MAPD and PDP plans.",
    support: "Humana Broker Support: 800-309-3163",
    url: "#",
    howToCertifyUrl: "/downloads/TIG_2026_Humana_Certification_Instructions.pdf",
    howToCertifyTitle: "Humana 2026 Certification Instructions",
    logo: humanaLogo,
  },
  {
    name: "UnitedHealthcare",
    buttonText: "Start UHC Certification",
    subtext: "Annual certification for MAPD and PDP plans.",
    support: "UHC Broker Support: 888-381-8581",
    url: "#",
    howToCertifyUrl: "/downloads/TIG_2026_UHC_Certification_Instructions.pdf",
    howToCertifyTitle: "UnitedHealthcare 2026 Certification Instructions",
    logo: uhcLogo,
  },
  {
    name: "Wellcare",
    buttonText: "Start Wellcare Certification",
    subtext: "Annual certification for MAPD and PDP plans.",
    support: "Wellcare Broker Support: 866-822-1339",
    url: "#",
    howToCertifyUrl: "",
    howToCertifyTitle: "Wellcare 2026 Certification Instructions",
    logo: wellcareLogo,
  },
];

const CertificationsPage = () => {
  const [pdfPreview, setPdfPreview] = useState<{ title: string; url: string } | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">Certifications</h1>
            <p className="text-body max-w-2xl">
              Complete your annual AHIP and carrier certifications to stay compliant and ready to sell.
            </p>
          </div>
        </section>

        {/* Required Certifications - AHIP */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-10">
              <h2 className="heading-section mb-2">Required Certifications</h2>
              <p className="text-body">
                AHIP certification is required annually before you can complete carrier certifications.
              </p>
            </div>

            <a
              href="https://www.ahipmedicaretraining.com/page/login"
              target="_blank"
              rel="noopener noreferrer"
              className="group card-premium hover:border-gold transition-smooth block max-w-xl"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-14 rounded-lg bg-white flex items-center justify-center flex-shrink-0 p-2">
                  <img src={ahipLogo} alt="AHIP" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <h3 className="heading-subsection mb-1">AHIP Certification</h3>
                  <p className="text-body-small">Annual Medicare training requirement.</p>
                  <p className="text-body-small text-gold mt-1">First year agents, Tyler Insurance Group covers the full cost of their AHIP.</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <span className="btn-primary-gold inline-flex items-center gap-2 group-hover:bg-gold/90">
                  Start AHIP
                  <ExternalLink size={14} />
                </span>
              </div>
            </a>
          </div>
        </section>

        {/* Carrier Certifications */}
        <section className="section-padding bg-cream">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-10">
              <h2 className="heading-section mb-2">Carrier Certifications 2026</h2>
              <p className="text-body">
                Complete your carrier-specific certifications after AHIP is finished.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {carrierCertifications.map((cert) => (
                <a
                  key={cert.name}
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group card-premium hover:border-gold transition-smooth block"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img src={cert.logo} alt={cert.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">{cert.name}</h4>
                      <p className="text-body-small text-sm">{cert.subtext}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Phone size={12} className="text-gold" />
                    <span>{cert.support}</span>
                  </div>

                  {cert.howToCertifyUrl ? (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPdfPreview({ title: cert.howToCertifyTitle, url: cert.howToCertifyUrl });
                      }}
                      className="text-xs text-gold hover:underline mb-4 inline-block"
                    >
                      How to Certify
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground mb-4 inline-block opacity-50">
                      How to Certify (Coming Soon)
                    </span>
                  )}
                  
                  <div className="pt-4 border-t border-border">
                    <span className="btn-primary-gold w-full text-center inline-flex items-center justify-center gap-2 group-hover:bg-gold/90 whitespace-nowrap text-sm">
                      {cert.buttonText}
                      <ExternalLink size={14} />
                    </span>
                  </div>
                </a>
              ))}

              {/* Coming Soon Placeholder */}
              <div className="card-premium opacity-60 cursor-default">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">Additional Carriers</h4>
                    <p className="text-body-small text-sm">More certifications coming soon.</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <span className="btn-outline-gold w-full text-center inline-block opacity-50 cursor-not-allowed">
                    Coming Soon
                  </span>
                </div>
              </div>
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
