import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ExternalLink, Monitor, Users, Building2, Phone, Mail, Clock, Award, GraduationCap } from "lucide-react";
import connect4Logo from "@/assets/connect4insurance-logo.png";
import sunfireLogo from "@/assets/sunfire-logo.png";
import bossCrmLogo from "@/assets/boss-crm-logo.png";
import aetnaLogo from "@/assets/aetna-logo.png";
import anthemLogo from "@/assets/anthem-logo.jpg";
import devotedLogo from "@/assets/devoted-logo.png";
import humanaLogo from "@/assets/humana-logo.png";
import uhcLogo from "@/assets/uhc-logo.png";
import wellcareLogo from "@/assets/wellcare-logo.jpg";

const toolCards = [
  {
    name: "Connect4Insurance",
    description: "Quoting + E-apps. Carrier-agnostic. Fast comparisons.",
    note: "Use your assigned credentials.",
    url: "https://pinnacle7.destinationrx.com/PC/Agent/Account/Login",
    icon: Monitor,
    logo: connect4Logo,
  },
  {
    name: "Sunfire",
    description: "Quoting, enrollment, SOA capture, and plan comparison. Includes MA, PDP, and Med Supp.",
    note: "Use your assigned login.",
    url: "https://www.sunfirematrix.com/app/agent/pfs",
    icon: Monitor,
    logo: sunfireLogo,
  },
];

const carrierPortals = [
  { name: "Aetna", url: "https://www.aetna.com/producer_public/login.fcc", logo: aetnaLogo },
  { name: "Anthem", url: "https://brokerportal.anthem.com/apps/ptb/login", logo: anthemLogo },
  { name: "Devoted", url: "https://agent.devoted.com/", logo: devotedLogo },
  { name: "Humana", url: "https://account.humana.com/", logo: humanaLogo },
  { name: "United Healthcare", url: "https://www.uhcjarvis.com/content/jarvis/en/sign_in.html#/sign_in", logo: uhcLogo },
  { name: "Wellcare", url: "https://www.wellcare.com/Broker-Resources/Broker-Resources", logo: wellcareLogo },
];

const carrierCertifications = [
  {
    name: "Humana",
    buttonText: "Start Humana Certification",
    subtext: "Annual certification for MAPD and PDP plans.",
    support: "Humana Broker Support: 800-309-3163",
    url: "#",
    logo: humanaLogo,
  },
  {
    name: "Aetna",
    buttonText: "Start Aetna Certification",
    subtext: "Annual certification for MAPD and PDP plans.",
    support: "Aetna Broker Support: 866-714-9301",
    url: "#",
    logo: aetnaLogo,
  },
  {
    name: "UnitedHealthcare",
    buttonText: "Start UHC Certification",
    subtext: "Annual certification for MAPD and PDP plans.",
    support: "UHC Broker Support: 888-381-8581",
    url: "#",
    logo: uhcLogo,
  },
  {
    name: "Wellcare",
    buttonText: "Start Wellcare Certification",
    subtext: "Annual certification for MAPD and PDP plans.",
    support: "Wellcare Broker Support: 866-822-1339",
    url: "#",
    logo: wellcareLogo,
  },
  {
    name: "Anthem",
    buttonText: "Start Anthem Certification",
    subtext: "Annual certification for MAPD and PDP plans.",
    support: "Anthem Broker Support: 855-277-6066",
    url: "#",
    logo: anthemLogo,
  },
];

const supportContacts = [
  {
    name: "Caroline",
    role: "Contracting",
    phone: "(555) 345-6789",
    email: "caroline@tylerinsurance.com",
  },
  {
    name: "Pinnacle Support",
    role: "Broker Support",
    phone: "(555) 456-7890",
    email: "support@pinnacle.com",
  },
];

const AgentToolsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">Agent Tools</h1>
            <p className="text-body max-w-2xl">
              Your command center for quoting, applications, CRM, and essential platforms.
            </p>
          </div>
        </section>

        {/* Quoting Tools */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-10">
              <h2 className="heading-section mb-2">Quoting & Enrollment Platforms</h2>
              <p className="text-body">
                Use these platforms to run quotes, compare plans, submit applications, and review member details.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {toolCards.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group card-premium hover:border-gold transition-smooth block"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-20 h-14 rounded-lg bg-cream flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {tool.logo ? (
                        <img src={tool.logo} alt={tool.name} className="w-full h-full object-contain" />
                      ) : (
                        <tool.icon className="w-6 h-6 text-gold" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="heading-subsection mb-1">{tool.name}</h3>
                      <p className="text-body-small">{tool.description}</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-6">{tool.note}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-border">
                    <span className="btn-primary-gold inline-flex items-center gap-2 group-hover:bg-gold/90">
                      Open {tool.name}
                      <ExternalLink size={14} />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CRM Section */}
        <section className="section-padding bg-cream">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-10">
              <h2 className="heading-section mb-2">CRM Access</h2>
              <p className="text-body">
                Manage your leads, track activity, log applications, and monitor your pipeline through our CRM.
              </p>
            </div>

            <a
              href="https://fmo.kizen.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="group card-premium hover:border-gold transition-smooth block max-w-xl"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-14 rounded-lg bg-background flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src={bossCrmLogo} alt="BOSS CRM" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <h3 className="heading-subsection mb-1">BOSS CRM</h3>
                  <p className="text-body-small">
                    Lead management. Pipeline tracking. Client retention tools. Activity logging.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <span className="btn-primary-gold inline-flex items-center gap-2 group-hover:bg-gold/90">
                  Open BOSS CRM
                  <ExternalLink size={14} />
                </span>
                <a 
                  href="/contact" 
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-gold hover:underline"
                >
                  Need help logging in?
                </a>
              </div>
            </a>
          </div>
        </section>

        {/* Carrier Portals */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-10">
              <h2 className="heading-section mb-2">Carrier Portals</h2>
              <p className="text-body">
                Fast access to your carrier broker portals once contracted.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {carrierPortals.map((carrier) => (
                <a
                  key={carrier.name}
                  href={carrier.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-premium hover:border-gold transition-smooth text-center py-8 group"
                >
                  {'logo' in carrier && carrier.logo ? (
                    <div className="w-16 h-12 mx-auto mb-3 rounded-lg overflow-hidden group-hover:scale-110 transition-transform flex items-center justify-center">
                      <img src={carrier.logo} alt={carrier.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <Building2 className="w-8 h-8 text-gold mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  )}
                  <p className="font-medium text-foreground">{carrier.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 group-hover:text-gold transition-smooth">Open Portal</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications Section */}
        <section className="section-padding bg-cream">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-10">
              <h2 className="heading-section mb-2">Certifications</h2>
              <p className="text-body">
                Complete your annual AHIP and carrier certifications to stay compliant and ready to sell.
              </p>
            </div>

            {/* Required Certifications - AHIP */}
            <div className="mb-12">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gold mb-6">Required Certifications</h3>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="group card-premium hover:border-gold transition-smooth block max-w-xl"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-20 h-14 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-8 h-8 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h4 className="heading-subsection mb-1">AHIP Certification</h4>
                    <p className="text-body-small">Annual Medicare training requirement.</p>
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

            {/* Carrier Recertifications */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gold mb-6">Carrier Recertifications</h3>
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
                    
                    <div className="pt-4 border-t border-border">
                      <span className="btn-primary-gold w-full text-center inline-flex items-center justify-center gap-2 group-hover:bg-gold/90">
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
          </div>
        </section>

        {/* Support Section */}
        <section className="section-padding bg-cream">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-10">
              <h2 className="heading-section mb-2">Need Help?</h2>
              <p className="text-body">
                If you cannot access a tool or need credential resets:
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {supportContacts.map((contact) => (
                <div key={contact.name} className="card-premium">
                  <div className="mb-4">
                    <h3 className="heading-subsection mb-1">{contact.name}</h3>
                    <p className="text-sm text-gold font-medium">{contact.role}</p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <a 
                      href={`tel:${contact.phone.replace(/\D/g, '')}`}
                      className="flex items-center gap-3 text-foreground hover:text-gold transition-smooth text-sm"
                    >
                      <Phone size={14} className="text-gold" />
                      <span>{contact.phone}</span>
                    </a>
                    <a 
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-3 text-foreground hover:text-gold transition-smooth text-sm"
                    >
                      <Mail size={14} className="text-gold" />
                      <span>{contact.email}</span>
                    </a>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-border">
                    <a 
                      href={`tel:${contact.phone.replace(/\D/g, '')}`}
                      className="flex-1 btn-outline-gold text-center text-sm py-2"
                    >
                      Call
                    </a>
                    <a 
                      href={`mailto:${contact.email}`}
                      className="flex-1 btn-primary-gold text-center text-sm py-2"
                    >
                      Email
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-premium">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-gold" />
                <div>
                  <p className="font-medium text-foreground">Office Hours</p>
                  <p className="text-body-small">Monday - Friday: 9:00 AM - 5:00 PM EST</p>
                </div>
              </div>
              <p className="text-body-small">
                <span className="text-gold font-medium">Response Time:</span> Within 24 hours for credential resets and tool access issues.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AgentToolsPage;
