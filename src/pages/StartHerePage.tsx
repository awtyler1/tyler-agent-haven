import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { BookOpen, TrendingUp, CheckCircle2, FileText, Users, Download, Calendar, Phone } from "lucide-react";

const newAgentChecklist = [
  { text: "Complete Medicare Fundamentals training", link: "/medicare-fundamentals" },
  { text: "Review compliance requirements", link: "/compliance" },
  { text: "Submit carrier contracting", link: "/carrier-resources" },
  { text: "Download core scripts and resources", link: "/leads-marketing" },
  { text: "Schedule orientation call", link: "/contact" },
];

const expAgentChecklist = [
  { text: "Review current market updates", link: "/industry-updates" },
  { text: "Check carrier news and changes", link: "/industry-updates" },
  { text: "Access lead programs", link: "/leads-marketing" },
  { text: "Update contracting if needed", link: "/carrier-resources" },
  { text: "Download updated resources", link: "/leads-marketing" },
];

const StartHerePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-20 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-6">Start Here</h1>
            <p className="text-body max-w-2xl mx-auto">
              Your path forward depends on where you're starting. 
              Find your track below and follow the steps.
            </p>
          </div>
        </section>

        {/* Two Tracks */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* New Agents */}
              <div className="card-premium">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="heading-subsection">For New Agents</h2>
                </div>
                
                <p className="text-body-small mb-6">
                  Start with the fundamentals. Build your foundation. Follow the path.
                </p>

                <div className="space-y-4 mb-8">
                  {newAgentChecklist.map((item, index) => (
                    <Link 
                      key={index} 
                      to={item.link}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-smooth group"
                    >
                      <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-body-small group-hover:text-gold transition-smooth">{item.text}</span>
                    </Link>
                  ))}
                </div>

                <h3 className="font-medium text-foreground mb-4">Quick Links</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/medicare-fundamentals" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-smooth p-2 rounded hover:bg-muted">
                    <FileText size={16} /> Medicare Basics
                  </Link>
                  <Link to="/sales-training" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-smooth p-2 rounded hover:bg-muted">
                    <Users size={16} /> Sales Training
                  </Link>
                  <Link to="/compliance" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-smooth p-2 rounded hover:bg-muted">
                    <Download size={16} /> Compliance
                  </Link>
                  <Link to="/contact" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-smooth p-2 rounded hover:bg-muted">
                    <Calendar size={16} /> Schedule Call
                  </Link>
                </div>
              </div>

              {/* Experienced Agents */}
              <div className="card-premium">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="heading-subsection">For Experienced Agents</h2>
                </div>
                
                <p className="text-body-small mb-6">
                  Get up to speed quickly. Access what you need. Integrate into our systems.
                </p>

                <div className="space-y-4 mb-8">
                  {expAgentChecklist.map((item, index) => (
                    <Link 
                      key={index} 
                      to={item.link}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-smooth group"
                    >
                      <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-body-small group-hover:text-gold transition-smooth">{item.text}</span>
                    </Link>
                  ))}
                </div>

                <h3 className="font-medium text-foreground mb-4">Quick Links</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/industry-updates" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-smooth p-2 rounded hover:bg-muted">
                    <TrendingUp size={16} /> Market Updates
                  </Link>
                  <Link to="/leads-marketing" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-smooth p-2 rounded hover:bg-muted">
                    <Users size={16} /> Lead Programs
                  </Link>
                  <Link to="/carrier-resources" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-smooth p-2 rounded hover:bg-muted">
                    <FileText size={16} /> Carrier Info
                  </Link>
                  <Link to="/contact" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-smooth p-2 rounded hover:bg-muted">
                    <Phone size={16} /> Support
                  </Link>
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
