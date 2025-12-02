import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  FileText, 
  Award, 
  GraduationCap
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



const StartHerePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main style={{ backgroundColor: '#FDFBF7' }}>
        {/* Hero Section */}
        <section className="pt-32 pb-8 md:pt-36 md:pb-10 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-3">Your Onboarding Roadmap</h1>
          </div>
        </section>

        {/* Onboarding Roadmap */}
        <section className="pb-8 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Tile 1 - Contracting */}
              <div className="bg-white border border-[#E5E2DB] rounded-lg p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-150">
                <FileText className="w-6 h-6 text-gold mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Contracting</h3>
                <p className="text-body-small text-muted-foreground mb-6">
                  Start here. Complete your contracting packet.
                </p>
                <Link
                  to="/contracting-hub"
                  onClick={() => window.scrollTo(0, 0)}
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gold rounded-lg text-sm font-medium text-white hover:bg-gold/90 transition-all duration-150"
                >
                  Go to Contracting Hub
                </Link>
              </div>

              {/* Tile 2 - Certifications */}
              <div className="bg-white border border-[#E5E2DB] rounded-lg p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-150">
                <Award className="w-6 h-6 text-gold mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Certifications</h3>
                <p className="text-body-small text-muted-foreground mb-6">
                  AHIP + Carrier certifications if new to Medicare.
                </p>
                <Link
                  to="/certifications"
                  onClick={() => window.scrollTo(0, 0)}
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gold rounded-lg text-sm font-medium text-white hover:bg-gold/90 transition-all duration-150"
                >
                  Go to Certifications
                </Link>
              </div>

              {/* Tile 3 - Agent Tools */}
              <div className="bg-white border border-[#E5E2DB] rounded-lg p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-150">
                <GraduationCap className="w-6 h-6 text-gold mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Agent Tools</h3>
                <p className="text-body-small text-muted-foreground mb-6">
                  Learn the tools and systems you'll use daily.
                </p>
                <Link
                  to="/agent-tools"
                  onClick={() => window.scrollTo(0, 0)}
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gold rounded-lg text-sm font-medium text-white hover:bg-gold/90 transition-all duration-150"
                >
                  Go to Agent Tools
                </Link>
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
      </main>
      <Footer />
    </div>
  );
};

export default StartHerePage;
