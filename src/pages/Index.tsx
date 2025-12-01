import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Rocket, FileText, Award, Wrench, GraduationCap, Building2, ExternalLink, Check, X } from "lucide-react";
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
  }
];

const quickLinks = [
  { name: "AHIP", url: "https://www.ahip.org/", external: true },
  { name: "Sunfire", url: "https://www.sunfirematrix.com/app/agent/pfs", external: true },
  { name: "BOSS CRM", url: "https://fmo.kizen.com/login", external: true },
  { name: "Carrier Support", link: "/contact" },
  { name: "Contracting Hub", link: "/contracting-hub" },
  { name: "Compliance Center", link: "/compliance" }
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
                  onClick={() => window.scrollTo(0, 0)}
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

        {/* What an FMO Is / Is Not */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-12">
              <h2 className="heading-section">What an FMO Actually Is</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
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

            <p className="text-center text-lg font-medium text-foreground italic">
              "Our role is to build durable agents, not dependent ones."
            </p>
          </div>
        </section>

        {/* Who We Are */}
        <section className="section-padding bg-cream">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-8">
              <h2 className="heading-section">Who We Are as Your FMO</h2>
            </div>
            <p className="text-body max-w-3xl">
              Tyler Insurance Group operates with discipline, structure, clean processes, and high standards. We are not interested in shortcuts or noise. We are focused on building a system that supports serious agents who want to build serious businesses. Our approach is methodical. Our expectations are clear. Our support is real.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-8">
              <h2 className="heading-section">Our Mission</h2>
            </div>
            <blockquote className="text-xl md:text-2xl text-foreground font-medium leading-relaxed max-w-4xl">
              "To build elite, independent agents who serve clients with integrity, discipline, and clarity — and to create a system where ambition is matched with support, structure, and operational excellence."
            </blockquote>
          </div>
        </section>

        {/* Vision */}
        <section className="section-padding bg-cream">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-8">
              <h2 className="heading-section">Our Vision</h2>
            </div>
            <p className="text-body max-w-3xl">
              To become the most trusted Medicare-focused FMO in Kentucky and beyond, known for high standards, elite training, and a culture of disciplined execution.
            </p>
          </div>
        </section>

        {/* Expectations */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <div className="border-l-4 border-gold pl-6 mb-8">
                  <h2 className="heading-section">What You Can Expect From Us</h2>
                </div>
                <ul className="space-y-4">
                  {expectations.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="text-gold font-bold">◆</span>
                      <span className="text-body">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="border-l-4 border-gold pl-6 mb-8">
                  <h2 className="heading-section">What We Expect From You</h2>
                </div>
                <ul className="space-y-4">
                  {agentExpectations.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="text-gold font-bold">◆</span>
                      <span className="text-body">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-center text-lg font-medium text-foreground italic mt-12">
              "When both sides uphold these standards, success becomes predictable."
            </p>
          </div>
        </section>

        {/* Leadership */}
        <section className="section-padding bg-cream">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-10">
              <h2 className="heading-section">Leadership</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {leadership.map((person) => (
                <div key={person.name} className="card-premium text-center">
                  {person.image ? (
                    <img 
                      src={person.image} 
                      alt={person.name}
                      className="w-32 h-32 rounded-full object-cover object-top mx-auto mb-4 border-2 border-gold/20"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl font-bold text-gold">{person.name[0]}</span>
                    </div>
                  )}
                  <h3 className="heading-subsection mb-1">{person.name}</h3>
                  <p className="text-sm text-gold font-medium mb-4">{person.role}</p>
                  <p className="text-body-small">{person.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why We Built This */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-8">
              <h2 className="heading-section">Why We Built This Platform</h2>
            </div>
            <p className="text-body max-w-3xl mb-6">
              This platform exists to eliminate confusion, unify training, raise standards, simplify onboarding, and create a repeatable system for long-term success.
            </p>
            <p className="text-body max-w-3xl">
              We built it because we believe agents deserve clarity. They deserve structure. They deserve a system that works with them, not against them. Every page, every resource, every tool on this platform was designed with one goal: to help you succeed on your terms, with our support.
            </p>
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="py-16 px-6 md:px-12 lg:px-20 bg-cream">
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
                    onClick={() => window.scrollTo(0, 0)}
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
