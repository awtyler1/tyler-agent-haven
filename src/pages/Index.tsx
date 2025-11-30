import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Rocket, FileText, Award, Wrench, GraduationCap, HeadphonesIcon, ExternalLink } from "lucide-react";
import tylerLogo from "@/assets/tyler-logo.png";

const controlCenterTiles = [
  {
    title: "Start Here",
    description: "Orientation, expectations, and your first steps.",
    icon: Rocket,
    link: "/start-here"
  },
  {
    title: "Contracting Hub",
    description: "Carrier contracting, documents, and onboarding guidance.",
    icon: FileText,
    link: "/carrier-resources"
  },
  {
    title: "Certifications",
    description: "AHIP and annual carrier recertification links.",
    icon: Award,
    link: "/agent-tools#certifications"
  },
  {
    title: "Agent Tools",
    description: "Quoting tools, CRM access, and carrier portals.",
    icon: Wrench,
    link: "/agent-tools"
  },
  {
    title: "Training",
    description: "Medicare Fundamentals, Sales Training, and Leads & Marketing.",
    icon: GraduationCap,
    link: "/sales-training"
  },
  {
    title: "Support",
    description: "How to contact our support team and carrier support.",
    icon: HeadphonesIcon,
    link: "/contact"
  }
];

const standards = [
  "Professionalism",
  "Accuracy",
  "Consistency",
  "Discipline",
  "Respect for clients",
  "Use of provided systems"
];

const support = [
  "Clear direction",
  "Fast response times",
  "Carrier support",
  "Practical training",
  "Tools that work",
  "Partnership in growth"
];

const quickLinks = [
  { name: "AHIP", url: "https://www.ahip.org/", external: true },
  { name: "Sunfire", url: "https://www.sunfirematrix.com/app/agent/pfs", external: true },
  { name: "BOSS CRM", url: "https://fmo.kizen.com/login", external: true },
  { name: "Carrier Support", link: "/contact" },
  { name: "Contracting Hub", link: "/carrier-resources" },
  { name: "Compliance Center", link: "/compliance" }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Header / Identity Section */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-20 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <img 
              src={tylerLogo} 
              alt="Tyler Insurance Group" 
              className="h-20 md:h-24 mx-auto mb-8"
            />
            <h1 className="heading-display mb-4">Tyler Insurance Group Agent Platform</h1>
            <p className="text-body text-muted-foreground max-w-2xl mx-auto">
              Your control center for contracting, certifications, tools, training, and support.
            </p>
          </div>
        </section>

        {/* Control Center Grid */}
        <section className="pb-20 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {controlCenterTiles.map((tile, index) => (
                <Link
                  key={index}
                  to={tile.link}
                  className="group card-premium p-8 flex flex-col items-center text-center hover:border-gold/40 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-5 group-hover:bg-gold/20 transition-colors">
                    <tile.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="heading-subsection mb-2">{tile.title}</h3>
                  <p className="text-body-small text-muted-foreground">{tile.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Standards Section */}
        <section className="py-20 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            {/* Mission */}
            <div className="text-center mb-16">
              <h2 className="text-sm font-medium tracking-widest text-gold uppercase mb-4">Our Mission</h2>
              <p className="text-xl md:text-2xl font-serif text-foreground max-w-3xl mx-auto leading-relaxed">
                "To build disciplined, independent Medicare agents who serve clients with clarity, integrity, and professionalism."
              </p>
            </div>

            {/* Standards & Support */}
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
              <div>
                <h3 className="text-sm font-medium tracking-widest text-gold uppercase mb-6">Our Standards</h3>
                <ul className="space-y-3">
                  {standards.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                      <span className="text-body">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium tracking-widest text-gold uppercase mb-6">Our Support</h3>
                <ul className="space-y-3">
                  {support.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                      <span className="text-body">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="py-16 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <h2 className="text-sm font-medium tracking-widest text-gold uppercase text-center mb-8">Quick Links</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {quickLinks.map((item, index) => (
                item.external ? (
                  <a
                    key={index}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-md text-sm font-medium text-foreground hover:border-gold/40 hover:bg-gold/5 transition-all duration-200"
                  >
                    {item.name}
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </a>
                ) : (
                  <Link
                    key={index}
                    to={item.link!}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-md text-sm font-medium text-foreground hover:border-gold/40 hover:bg-gold/5 transition-all duration-200"
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
