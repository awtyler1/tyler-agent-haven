import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ExternalLink, Monitor, Mail, Clock } from "lucide-react";
import connect4Logo from "@/assets/connect4insurance-logo.png";
import sunfireLogo from "@/assets/sunfire-logo.png";
import bossCrmLogo from "@/assets/boss-crm-logo.png";
import carolineHeadshot from "@/assets/caroline-headshot.jpg";

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

        {/* Support Section */}
        <section className="section-padding bg-cream">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-10">
              <h2 className="heading-section mb-2">Need Help?</h2>
              <p className="text-body">
                If you cannot access a tool or need credential resets:
              </p>
            </div>

            <div className="max-w-md mb-10">
              <div className="card-premium text-center">
                <img 
                  src={carolineHeadshot} 
                  alt="Caroline Horn"
                  className="w-24 h-24 rounded-full object-cover object-top mx-auto mb-4 border-2 border-gold/20"
                />
                <h3 className="heading-subsection mb-1">Caroline Horn</h3>
                <p className="text-sm text-gold font-medium mb-4">Contracting Support</p>
                
                <a 
                  href="mailto:caroline@tylerinsurancegroup.com"
                  className="flex items-center justify-center gap-2 text-foreground hover:text-gold transition-smooth text-sm mb-6"
                >
                  <Mail size={14} className="text-gold" />
                  <span>caroline@tylerinsurancegroup.com</span>
                </a>

                <a 
                  href="mailto:caroline@tylerinsurancegroup.com"
                  className="btn-primary-gold text-center text-sm py-2 px-6 inline-block"
                >
                  Email Caroline
                </a>
              </div>
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
