import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Rocket, FileText, Award, Wrench, GraduationCap, Building2, ExternalLink, Check, X, FolderOpen, Building } from "lucide-react";

import tylerLogo from "@/assets/tyler-logo.png";
import austinHeadshot from "@/assets/austin-headshot.jpg";
import andrewHeadshot from "@/assets/andrew-headshot.png";
import carolineHeadshot from "@/assets/caroline-headshot.jpg";

const controlCenterTiles = [
  {
    title: "Onboarding",
    description: "Orientation, expectations, and your first steps.",
    icon: Rocket,
    link: "/start-here"
  },
  {
    title: "Contracting Hub",
    description: "Carrier contracting, documents, and onboarding guidance.",
    icon: FileText,
    link: "/contracting-hub"
  },
  {
    title: "Certifications",
    description: "AHIP and annual carrier recertification links.",
    icon: Award,
    link: "/certifications"
  },
  {
    title: "Agent Tools",
    description: "Quoting tools, CRM access, and carrier portals.",
    icon: Wrench,
    link: "/agent-tools"
  },
  {
    title: "Carrier Resources",
    description: "Plan documents, contacts, and carrier-specific resources.",
    icon: Building2,
    link: "/carrier-resources"
  },
  {
    title: "Training",
    description: "Medicare Fundamentals, Sales Training, and Leads & Marketing.",
    icon: GraduationCap,
    link: "/sales-training"
  },
  {
    title: "Forms Library",
    description: "SOA, HIPAA, enrollment worksheets, and essential appointment forms.",
    icon: FolderOpen,
    link: "/forms-library"
  },
  {
    title: "Carrier Portals",
    description: "Fast access to Humana, Aetna, UHC, Wellcare, Anthem, and more.",
    icon: Building,
    link: "/carrier-portals"
  }
];

const fmoIs = [
  "The strategic engine behind your Medicare business",
  "The bridge between you and the carriers",
  "A support system for contracting, training, tools, and growth",
  "A source of clarity and structure",
  "A partner in your long-term development"
];

const fmoIsNot = [
  "Not a call center",
  "Not a lead vendor",
  "Not a babysitter",
  "Not a shortcut",
  "Not a replacement for discipline"
];

const expectations = [
  "Clear direction",
  "Strong contracting support",
  "Real training",
  "Practical tools",
  "Honest feedback",
  "High responsiveness",
  "A system that elevates you"
];

const agentExpectations = [
  "Professionalism",
  "Integrity",
  "Discipline",
  "Communication",
  "System usage",
  "Respect for clients",
  "Commitment to growth"
];

const leadership = [
  {
    name: "Austin Tyler, MBA",
    role: "Broker Development",
    description: "Sets the vision, standards, and strategic direction for Tyler Insurance Group.",
    image: austinHeadshot
  },
  {
    name: "Andrew Horn, MHA",
    role: "Broker Development",
    description: "Manages day-to-day operations, agent support, and platform functionality.",
    image: andrewHeadshot
  },
  {
    name: "Caroline Horn",
    role: "Contracting Support",
    description: "Handles contracting processes, carrier communications, and onboarding.",
    image: carolineHeadshot
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
        {/* Header / Identity Section */}
        <section className="pt-20 pb-8 md:pt-24 md:pb-10 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <img 
              src={tylerLogo} 
              alt="Tyler Insurance Group" 
              className="h-28 md:h-32 mx-auto mb-5"
              style={{ 
                filter: 'contrast(1.1) saturate(1.1)',
                mixBlendMode: 'multiply'
              }}
            />
            <h1 className="heading-display mb-2">Tyler Insurance Group Agent Platform</h1>
            <p className="text-body max-w-2xl mx-auto mb-4" style={{ color: 'hsl(30 10% 20%)' }}>
              Your control center for contracting, certifications, tools, training, and support.
            </p>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mx-auto"></div>
          </div>
        </section>

        {/* Control Center Grid */}
        <section className="pb-20 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
              {controlCenterTiles.map((tile, index) => (
                <Link
                  key={index}
                  to={tile.link}
                  onClick={() => window.scrollTo(0, 0)}
                  className="group bg-gradient-to-b from-white to-[#FEFDFB] border border-[#E5E2DB] rounded-xl p-6 flex flex-col items-center text-center shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.15)] hover:border-[#D4CFC4] hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-full bg-gold/8 flex items-center justify-center mb-4">
                    <tile.icon className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="text-base font-semibold mb-1.5">{tile.title}</h3>
                  <p className="text-sm text-muted-foreground">{tile.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* What an FMO Is / Is Not */}
        <section className="py-10 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card-premium">
                <h3 className="heading-subsection mb-6 text-gold">What an FMO Is</h3>
                <ul className="space-y-4">
                  {fmoIs.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-body-small">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card-premium bg-muted/30">
                <h3 className="heading-subsection mb-6 text-muted-foreground">What an FMO Is Not</h3>
                <ul className="space-y-4">
                  {fmoIsNot.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <X className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-body-small text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-10 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <div className="grid md:grid-cols-2 gap-10">
              <div>
                <div className="border-l-4 border-gold pl-6 mb-6">
                  <h2 className="heading-section">Our Mission</h2>
                </div>
                <p className="text-body">
                  To build elite, independent agents who serve clients with integrity, discipline, and clarity — and to create a system where ambition is matched with support, structure, and operational excellence.
                </p>
              </div>
              <div>
                <div className="border-l-4 border-gold pl-6 mb-6">
                  <h2 className="heading-section">Our Vision</h2>
                </div>
                <p className="text-body">
                  To become the most trusted Medicare-focused FMO in Kentucky and beyond, known for high standards, elite training, and a culture of disciplined execution.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Expectations */}
        <section className="py-10 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="grid md:grid-cols-2 gap-10">
              <div>
                <div className="border-l-4 border-gold pl-6 mb-6">
                  <h2 className="heading-section">What You Can Expect From Us</h2>
                </div>
                <ul className="space-y-3">
                  {expectations.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="text-gold font-bold">◆</span>
                      <span className="text-body">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="border-l-4 border-gold pl-6 mb-6">
                  <h2 className="heading-section">What We Expect From You</h2>
                </div>
                <ul className="space-y-3">
                  {agentExpectations.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="text-gold font-bold">◆</span>
                      <span className="text-body">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section className="py-10 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-8">
              <h2 className="heading-section">Leadership</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {leadership.map((person) => (
                <div key={person.name} className="card-premium text-center">
                  {person.image ? (
                    <img 
                      src={person.image} 
                      alt={person.name}
                      className="w-28 h-28 rounded-full object-cover object-top mx-auto mb-4 border-2 border-gold/20"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl font-bold text-gold">{person.name[0]}</span>
                    </div>
                  )}
                  <h3 className="heading-subsection mb-1">{person.name}</h3>
                  <p className="text-sm text-gold font-medium mb-3">{person.role}</p>
                  <p className="text-body-small">{person.description}</p>
                </div>
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
