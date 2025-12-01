import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Award, 
  Wrench, 
  GraduationCap, 
  Shield, 
  FolderOpen,
  HeadphonesIcon,
  ClipboardList
} from "lucide-react";

const firstSteps = [
  { text: "Complete contracting through the Contracting Hub", link: "/contracting-hub" },
  { text: "Complete AHIP and annual carrier certifications", link: "/certifications" },
  { text: "Access your tools in Agent Tools (Connecture, Sunfire, BOSS CRM, Carrier Portals)", link: "/agent-tools" },
  { text: "Begin Medicare Fundamentals", link: "/medicare-fundamentals" },
  { text: "Review Sales Training and required scripts", link: "/sales-training" },
  { text: "Bookmark the Support page for help when needed", link: "/contact" },
];

const expectations = [
  "Maintain professionalism",
  "Follow compliance rules",
  "Use our systems as designed",
  "Keep CRM activity updated",
  "Communicate clearly and respectfully",
  "Complete certifications on time",
  "Follow the appointment structure",
  "Serve clients with integrity",
  "Stay disciplined, consistent, and coachable",
];

const ourSupport = [
  "Clean contracting support",
  "Clear direction",
  "Practical training",
  "Tools that work",
  "Fast response times",
  "Carrier updates",
  "Guidance when you get stuck",
  "A system designed to help you grow",
];

const platformAreas = [
  { 
    title: "Contracting Hub", 
    description: "Carrier contracting, documents, onboarding",
    icon: FileText,
    link: "/contracting-hub"
  },
  { 
    title: "Certifications", 
    description: "AHIP + carrier recerts",
    icon: Award,
    link: "/certifications"
  },
  { 
    title: "Agent Tools", 
    description: "Connecture, Sunfire, BOSS CRM, Carrier Portals",
    icon: Wrench,
    link: "/agent-tools"
  },
  { 
    title: "Training", 
    description: "Medicare Fundamentals, Sales Training, Leads & Marketing",
    icon: GraduationCap,
    link: "/sales-training"
  },
  { 
    title: "Compliance", 
    description: "Rules, SOA, CMS guidance",
    icon: Shield,
    link: "/compliance"
  },
  { 
    title: "Resources", 
    description: "Downloads, scripts, PDFs",
    icon: FolderOpen,
    link: "/forms-library"
  },
  { 
    title: "Support", 
    description: "How to get help fast",
    icon: HeadphonesIcon,
    link: "/contact"
  },
];

const requiredDocs = [
  "NPN",
  "Driver's License",
  "E&O Certificate",
  "Voided Check",
  "AHIP Certificate (once complete)",
  "State-specific appointment forms (if needed)",
];

const quickLinks = [
  { title: "Contracting Hub", link: "/contracting-hub", icon: FileText },
  { title: "Certifications", link: "/certifications", icon: Award },
  { title: "Agent Tools", link: "/agent-tools", icon: Wrench },
  { title: "Medicare Fundamentals", link: "/medicare-fundamentals", icon: GraduationCap },
  { title: "Sales Training", link: "/sales-training", icon: GraduationCap },
  { title: "Support", link: "/contact", icon: HeadphonesIcon },
];

const StartHerePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main style={{ backgroundColor: '#FDFBF7' }}>
        {/* 1. Title Section */}
        <section className="pt-20 pb-8 md:pt-24 md:pb-10 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-2">Onboarding</h1>
            <p className="text-body max-w-2xl mx-auto mb-4" style={{ color: 'hsl(30 10% 20%)' }}>
              Your orientation, expectations, and path forward with Tyler Insurance Group.
            </p>
            <p className="text-body max-w-2xl mx-auto">
              This page gives you your first steps, your expectations, and a clear understanding of how to use this platform. Follow this structure and you will always know what to do next.
            </p>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mx-auto mt-4"></div>
          </div>
        </section>

        {/* 2. First Steps Checklist */}
        <section className="pb-10 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 md:p-10 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3 mb-2">
                <ClipboardList className="w-6 h-6 text-gold" />
                <h2 className="heading-section">First Steps</h2>
              </div>
              <p className="text-muted-foreground mb-8">Complete these steps in order.</p>
              
              <div className="space-y-4 mb-10">
                {firstSteps.map((step, index) => (
                  <Link
                    key={index}
                    to={step.link}
                    onClick={() => window.scrollTo(0, 0)}
                    className="flex items-start gap-4 p-4 rounded-lg border border-[#EAE7E1] hover:border-gold/40 hover:bg-gold/5 transition-all duration-200 group"
                  >
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-body-small group-hover:text-foreground">{step.text}</span>
                  </Link>
                ))}
              </div>

              <Link
                to="/contracting-hub"
                onClick={() => window.scrollTo(0, 0)}
                className="inline-flex items-center justify-center px-6 py-3 bg-gold rounded-lg text-sm font-medium text-white hover:bg-gold/90 transition-all duration-200 gap-2"
              >
                Start Contracting <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* 3 & 4. Expectations Section */}
        <section className="py-10 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <div className="grid md:grid-cols-2 gap-10">
              {/* What We Expect From You */}
              <div>
                <div className="border-l-4 border-gold pl-6 mb-6">
                  <h2 className="heading-section">What We Expect From You</h2>
                </div>
                <ul className="space-y-3">
                  {expectations.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="text-gold font-bold">◆</span>
                      <span className="text-body">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What You Can Expect From Us */}
              <div>
                <div className="border-l-4 border-gold pl-6 mb-6">
                  <h2 className="heading-section">What You Can Expect From Us</h2>
                </div>
                <ul className="space-y-3">
                  {ourSupport.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="text-gold font-bold">◆</span>
                      <span className="text-body">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. How to Use This Platform */}
        <section className="py-10 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <h2 className="text-sm font-medium tracking-widest text-gold uppercase text-center mb-4">
              How This Platform Works
            </h2>
            <p className="text-body-small text-center text-muted-foreground mb-10 max-w-xl mx-auto">
              Navigate the platform using these core areas.
            </p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {platformAreas.map((area, index) => (
                <Link
                  key={index}
                  to={area.link}
                  onClick={() => window.scrollTo(0, 0)}
                  className="bg-white border border-[#EAE7E1] rounded-lg p-5 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] hover:border-gold/40 hover:shadow-[0_10px_32px_-2px_rgba(0,0,0,0.08)] transition-all duration-300 group"
                >
                  <area.icon className="w-5 h-5 text-gold mb-3" />
                  <h3 className="text-base font-semibold text-foreground mb-1">{area.title}</h3>
                  <p className="text-sm text-muted-foreground">{area.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Required Documents */}
        <section className="py-10 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-sm font-medium tracking-widest text-gold uppercase mb-4">
                Required Documents
              </h2>
              <p className="text-body-small text-muted-foreground mb-8">
                Have these ready before starting your contracting.
              </p>
              
              <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] text-left">
                <ul className="space-y-3">
                  {requiredDocs.map((doc, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                      <span className="text-body">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Quick Links Grid */}
        <section className="py-10 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <h2 className="text-sm font-medium tracking-widest text-gold uppercase text-center mb-8">
              Quick Links
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {quickLinks.map((item, index) => (
                <Link
                  key={index}
                  to={item.link}
                  onClick={() => window.scrollTo(0, 0)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-md text-sm font-medium text-foreground hover:border-gold/40 hover:bg-gold/5 transition-all duration-200"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Closing Line */}
        <section className="py-12 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow text-center">
            <p className="text-xl md:text-2xl text-foreground font-medium max-w-2xl mx-auto leading-relaxed italic">
              "This is your starting point. Follow the structure. Stay disciplined. We are here to support your growth."
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default StartHerePage;
