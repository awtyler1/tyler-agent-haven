import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, FileText, Download, ExternalLink, ChevronRight, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserAvatarDropdown } from "@/components/UserAvatarDropdown";

const sections = [
  { id: "rules", title: "Compliance Rules", icon: Shield },
  { id: "guidelines", title: "Updated Guidelines", icon: FileText },
  { id: "soa", title: "SOA Downloads", icon: Download },
  { id: "cms", title: "CMS Resources", icon: ExternalLink },
];

const rules = [
  {
    title: "Scope of Appointment (SOA)",
    items: [
      "Must be signed before any appointment",
      "Must specify products to be discussed",
      "Cannot add products not listed without new SOA",
      "Keep on file for 10 years"
    ]
  },
  {
    title: "Marketing Requirements",
    items: [
      "All materials must be CMS/carrier approved",
      "Cannot use words like 'free' or 'no cost'",
      "Cannot target based on health status",
      "Must include required disclaimers"
    ]
  },
  {
    title: "Enrollment Guidelines",
    items: [
      "Never enroll without beneficiary present",
      "Confirm understanding of plan terms",
      "Provide Summary of Benefits",
      "Document permission and consent"
    ]
  },
  {
    title: "Prohibited Activities",
    items: [
      "No door-to-door sales",
      "No unsolicited calls",
      "No selling at healthcare facilities",
      "No cross-selling at Medicare events"
    ]
  }
];

const downloads = [
  { name: "Standard SOA Form", type: "PDF", url: "/downloads/Scope-of-Appointment_2026.pdf" },
  { name: "Telephonic SOA Script", type: "PDF", url: null },
  { name: "Pre-Enrollment Checklist", type: "PDF", url: null },
  { name: "Agent Attestation Form", type: "PDF", url: null },
  { name: "Complaint Submission Form", type: "PDF", url: null },
];

const cmsLinks = [
  { name: "Medicare Communications & Marketing Guidelines", url: "https://www.cms.gov/medicare/health-plans/managed-care-marketing" },
  { name: "Medicare Learning Network", url: "https://www.cms.gov/medicare/learning-network" },
  { name: "CMS.gov Official Site", url: "https://www.cms.gov" },
  { name: "Medicare Plan Finder", url: "https://www.medicare.gov/plan-compare" },
];

const CompliancePage = () => {
  const [activeSection, setActiveSection] = useState(sections.length > 0 ? sections[0].id : '');
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);

  const renderContent = () => {
    switch (activeSection) {
      case "rules":
        return (
          <div>
            <h2 className="heading-section mb-4">Compliance Rules</h2>
            <p className="text-body mb-8">
              Know the rules. Follow them exactly. Protect yourself and your clients.
            </p>
            <div className="space-y-6">
              {rules.map((rule, index) => (
                <div key={index} className="p-6 bg-muted rounded-lg">
                  <h3 className="font-medium text-foreground mb-4">{rule.title}</h3>
                  <ul className="space-y-2">
                    {rule.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-gold font-bold">◆</span>
                        <span className="text-body-small">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      case "guidelines":
        return (
          <div>
            <h2 className="heading-section mb-4">Updated Guidelines</h2>
            <p className="text-body mb-8">
              Stay current with the latest regulatory updates and policy changes.
            </p>
            <div className="p-6 border border-gold/30 bg-gold/5 rounded-lg mb-6">
              <p className="text-sm font-medium text-gold mb-2">Latest Update: January 2024</p>
              <p className="text-body-small">
                CMS has released updated marketing guidelines for the 2024 plan year. 
                All agents must review and acknowledge these changes.
              </p>
            </div>
            <div className="space-y-4">
              {[
                "2024 Medicare Communications and Marketing Guidelines",
                "Updated Agent Training Requirements",
                "New Telephonic Enrollment Rules",
                "Social Media Marketing Guidelines"
              ].map((item, index) => (
                <button 
                  key={index}
                  className="w-full flex items-center justify-between p-4 border border-border rounded-lg hover:border-gold hover:bg-gold/5 transition-smooth text-left"
                >
                  <span className="font-medium text-foreground">{item}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        );
      case "soa":
        return (
          <div>
            <h2 className="heading-section mb-4">SOA Downloads</h2>
            <p className="text-body mb-8">
              Download required forms and documentation.
            </p>
            <div className="space-y-3">
              {downloads.map((doc, index) => (
                doc.url ? (
                  <button 
                    key={index}
                    onClick={() => setPreviewDoc({ name: doc.name, url: doc.url })}
                    className="w-full flex items-center justify-between p-4 border border-border rounded-lg hover:border-gold hover:bg-gold/5 transition-smooth text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-gold" />
                      <div>
                        <p className="font-medium text-foreground">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.type}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                ) : (
                  <button 
                    key={index}
                    className="w-full flex items-center justify-between p-4 border border-border rounded-lg hover:border-gold hover:bg-gold/5 transition-smooth text-left opacity-60 cursor-not-allowed"
                    disabled
                  >
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-gold" />
                      <div>
                        <p className="font-medium text-foreground">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.type} - Coming Soon</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                )
              ))}
            </div>
          </div>
        );
      case "cms":
        return (
          <div>
            <h2 className="heading-section mb-4">CMS Resources</h2>
            <p className="text-body mb-8">
              Official resources from the Centers for Medicare & Medicaid Services.
            </p>
            <div className="space-y-3">
              {cmsLinks.map((link, index) => (
                <a 
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-4 border border-border rounded-lg hover:border-gold hover:bg-gold/5 transition-smooth"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-gold" />
                    <span className="font-medium text-foreground">{link.name}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-semibold text-[#292524]">TIG</span>
            </Link>
            <span className="text-[#e8e4dd]">|</span>
            <span className="text-sm text-[#5c5552]">Agent Portal</span>
          </div>
          <UserAvatarDropdown />
        </div>
      </header>

      <main className="flex-1">
        {/* Back Link + Title */}
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="font-serif text-2xl font-semibold text-[#292524]">Compliance</h1>
        </div>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-6 pb-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            {/* Sidebar */}
            <div className="lg:sticky lg:top-20 lg:self-start">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Sections</h3>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-smooth flex items-center gap-3 ${
                        activeSection === section.id 
                          ? "bg-gold/10 text-gold border-l-2 border-gold" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <section.icon size={16} />
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  ))}
                </nav>
              </div>

            {/* Main Content */}
            <div className="card-premium animate-fade-in" key={activeSection}>
              {renderContent()}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center bg-gradient-to-t from-[#FEFDFB] to-transparent">
        <p className="text-xs text-[#5c5552]/50">
          Powered by <span className="text-[#5c5552]/70">Tyler Insurance Group</span>
        </p>
      </footer>

      {/* PDF Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted">
              <h3 className="font-medium text-foreground">{previewDoc?.name}</h3>
              <div className="flex items-center gap-2">
                <Button asChild variant="default" size="sm">
                  <a href={previewDoc?.url} download>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-muted">
              {previewDoc && (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-full"
                  title={previewDoc.name}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompliancePage;
