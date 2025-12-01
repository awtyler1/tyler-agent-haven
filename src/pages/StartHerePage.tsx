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
  ClipboardList,
  User
} from "lucide-react";


const expectations = [
  "Professionalism in every client interaction",
  "Strict compliance discipline",
  "Consistent use of our systems and CRM",
  "Clear, timely communication",
  "Commitment to learning and improvement",
];

const ourSupport = [
  "Straightforward support",
  "Clear direction",
  "Practical training",
  "Tools that keep you focused",
  "Fast, reliable communication",
];

const essentialTools = [
  { 
    title: "BOSS CRM", 
    link: "/agent-tools",
    icon: Wrench
  },
  { 
    title: "Connecture", 
    link: "/agent-tools",
    icon: Wrench
  },
  { 
    title: "Sunfire", 
    link: "/agent-tools",
    icon: Wrench
  },
  { 
    title: "Carrier Portal Links", 
    link: "/carrier-portals",
    icon: FolderOpen
  },
];


const StartHerePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main style={{ backgroundColor: '#FDFBF7' }}>
        {/* Hero Section */}
        <section className="pt-20 pb-6 md:pt-24 md:pb-8 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-3">Your Onboarding Roadmap</h1>
          </div>
        </section>

        {/* Onboarding Roadmap */}
        <section className="pb-8 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Tile 1 - Contracting */}
              <div className="bg-white border border-[#EAE7E1] rounded-lg p-6 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] hover:border-gold/40 hover:shadow-[0_10px_32px_-2px_rgba(0,0,0,0.08)] transition-all duration-300">
                <FileText className="w-6 h-6 text-gold mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Contracting</h3>
                <p className="text-body-small text-muted-foreground mb-6">
                  Start here. Complete your contracting packet.
                </p>
                <Link
                  to="/contracting-hub"
                  onClick={() => window.scrollTo(0, 0)}
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gold rounded-lg text-sm font-medium text-white hover:bg-gold/90 transition-all duration-200"
                >
                  Go to Contracting Hub
                </Link>
              </div>

              {/* Tile 2 - Certifications */}
              <div className="bg-white border border-[#EAE7E1] rounded-lg p-6 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] hover:border-gold/40 hover:shadow-[0_10px_32px_-2px_rgba(0,0,0,0.08)] transition-all duration-300">
                <Award className="w-6 h-6 text-gold mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Certifications</h3>
                <p className="text-body-small text-muted-foreground mb-6">
                  AHIP + Carrier certifications if new to Medicare.
                </p>
                <Link
                  to="/certifications"
                  onClick={() => window.scrollTo(0, 0)}
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gold rounded-lg text-sm font-medium text-white hover:bg-gold/90 transition-all duration-200"
                >
                  Go to Certifications
                </Link>
              </div>

              {/* Tile 3 - Orientation */}
              <div className="bg-white border border-[#EAE7E1] rounded-lg p-6 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] hover:border-gold/40 hover:shadow-[0_10px_32px_-2px_rgba(0,0,0,0.08)] transition-all duration-300">
                <GraduationCap className="w-6 h-6 text-gold mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Orientation</h3>
                <p className="text-body-small text-muted-foreground mb-6">
                  Learn the tools and systems you'll use daily.
                </p>
                <a
                  href="#essential-tools"
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gold rounded-lg text-sm font-medium text-white hover:bg-gold/90 transition-all duration-200"
                >
                  Orientation Overview
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Expectations Section */}
        <section className="py-8 px-6 md:px-12 lg:px-20" style={{ backgroundColor: '#FDFBF7' }}>
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

        {/* Essential Tools */}
        <section id="essential-tools" className="py-12 px-6 md:px-12 lg:px-20" style={{ backgroundColor: '#FDFBF7' }}>
          <div className="container-narrow">
            <h2 className="heading-section text-center mb-10">Essential Tools</h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {essentialTools.map((tool, index) => (
                <Link
                  key={index}
                  to={tool.link}
                  onClick={() => window.scrollTo(0, 0)}
                  className="bg-white border border-[#EAE7E1] rounded-lg p-5 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] hover:border-gold/40 hover:shadow-[0_10px_32px_-2px_rgba(0,0,0,0.08)] transition-all duration-300 text-center"
                >
                  <tool.icon className="w-5 h-5 text-gold mb-3 mx-auto" />
                  <h3 className="text-base font-semibold text-foreground">{tool.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="py-12 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="heading-section mb-8">Support</h2>
              
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <User className="w-5 h-5 text-gold mb-2 mx-auto" />
                  <p className="text-sm font-semibold text-foreground mb-1">Contracting Support</p>
                  <p className="text-sm text-muted-foreground">Caroline</p>
                </div>
                <div className="text-center">
                  <User className="w-5 h-5 text-gold mb-2 mx-auto" />
                  <p className="text-sm font-semibold text-foreground mb-1">General Support</p>
                  <p className="text-sm text-muted-foreground">Austin</p>
                </div>
                <div className="text-center">
                  <User className="w-5 h-5 text-gold mb-2 mx-auto" />
                  <p className="text-sm font-semibold text-foreground mb-1">Technical Support</p>
                  <p className="text-sm text-muted-foreground">Andrew</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default StartHerePage;
