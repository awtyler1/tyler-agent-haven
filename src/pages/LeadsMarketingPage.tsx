import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Users, FileText, Calendar, Download, ChevronRight, Mail, Phone, Presentation } from "lucide-react";

const sections = [
  { id: "lead-types", title: "Lead Types Explained", icon: Users },
  { id: "med-exp", title: "Med Exp Process", icon: FileText },
  { id: "lead-lists", title: "Lead Lists", icon: FileText },
  { id: "seminars", title: "Seminars", icon: Presentation },
  { id: "lead-request", title: "Lead Request Form", icon: Mail },
  { id: "outreach", title: "Outreach Best Practices", icon: Phone },
  { id: "marketing", title: "Marketing Resources", icon: Download },
];

const leadTypes = [
  { name: "Med Exp Leads", description: "Aged data from previous enrollment periods" },
  { name: "T65 Leads", description: "Individuals turning 65 within 3 months" },
  { name: "Seminar Leads", description: "RSVPs and attendees from educational events" },
  { name: "Referral Leads", description: "Client-referred prospects" },
  { name: "Digital Leads", description: "Online inquiry and form submissions" },
];

const LeadsMarketingPage = () => {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  const renderContent = () => {
    switch (activeSection) {
      case "lead-types":
        return (
          <div>
            <h2 className="heading-section mb-4">Lead Types Explained</h2>
            <p className="text-body mb-8">
              Understanding your lead sources helps you prioritize effectively and set proper expectations.
            </p>
            <div className="space-y-4">
              {leadTypes.map((lead, index) => (
                <div key={index} className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium text-foreground mb-1">{lead.name}</h3>
                  <p className="text-body-small">{lead.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "med-exp":
        return (
          <div>
            <h2 className="heading-section mb-4">Med Exp Process</h2>
            <p className="text-body mb-8">
              The Med Exp process is your systematic approach to working aged leads effectively.
            </p>
            <div className="bg-muted rounded-lg p-6">
              <ol className="space-y-4">
                {[
                  "Request your Med Exp list from the portal",
                  "Scrub list against DNC registry",
                  "Import into your CRM system",
                  "Begin outbound calling sequence",
                  "Track all contact attempts",
                  "Schedule appointments from interested prospects"
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gold text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-body">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        );
      case "seminars":
        return (
          <div>
            <h2 className="heading-section mb-4">Seminars</h2>
            <p className="text-body mb-8">
              Educational seminars are a powerful way to build trust and generate qualified appointments.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-medium text-foreground mb-2">Venue Selection</h3>
                <p className="text-body-small">Libraries, community centers, restaurants</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-medium text-foreground mb-2">Marketing</h3>
                <p className="text-body-small">Mailers, digital ads, community boards</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-medium text-foreground mb-2">Presentation</h3>
                <p className="text-body-small">CMS-approved slides and talking points</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-medium text-foreground mb-2">Follow-Up</h3>
                <p className="text-body-small">48-hour contact sequence</p>
              </div>
            </div>
          </div>
        );
      case "lead-request":
        return (
          <div>
            <h2 className="heading-section mb-4">Lead Request Form</h2>
            <p className="text-body mb-8">
              Submit your lead request below. Requests are processed within 24-48 hours.
            </p>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Lead Type</label>
                <select className="w-full p-3 border border-border rounded-lg bg-background text-foreground">
                  <option>Med Exp Leads</option>
                  <option>T65 Leads</option>
                  <option>Seminar Support</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Quantity Requested</label>
                <input type="number" className="w-full p-3 border border-border rounded-lg bg-background text-foreground" placeholder="Enter quantity" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Counties/Zip Codes</label>
                <textarea className="w-full p-3 border border-border rounded-lg bg-background text-foreground" rows={3} placeholder="List target areas"></textarea>
              </div>
              <button type="submit" className="btn-primary-gold">
                Submit Request
              </button>
            </form>
          </div>
        );
      case "marketing":
        return (
          <div>
            <h2 className="heading-section mb-4">Marketing Resources</h2>
            <p className="text-body mb-8">
              Download approved marketing materials and templates.
            </p>
            <div className="space-y-3">
              {[
                "Business Card Templates",
                "Seminar Flyer Templates",
                "Email Templates",
                "Social Media Guidelines",
                "Compliance-Approved Scripts"
              ].map((resource, index) => (
                <button 
                  key={index}
                  className="w-full flex items-center justify-between p-4 border border-border rounded-lg hover:border-gold hover:bg-gold/5 transition-smooth text-left"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-gold" />
                    <span className="font-medium text-foreground">{resource}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div>
            <h2 className="heading-section mb-4">{sections.find(s => s.id === activeSection)?.title}</h2>
            <p className="text-body">Content coming soon.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">Leads & Marketing</h1>
            <p className="text-body max-w-2xl">
              Your playbook for lead generation and marketing execution.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="grid lg:grid-cols-[280px_1fr] gap-8">
              {/* Sidebar */}
              <div className="lg:sticky lg:top-28 lg:self-start">
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
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LeadsMarketingPage;
