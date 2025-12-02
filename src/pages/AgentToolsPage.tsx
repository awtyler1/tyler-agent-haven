import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ExternalLink, Monitor } from "lucide-react";
import connect4Logo from "@/assets/connect4insurance-logo.png";
import sunfireLogo from "@/assets/sunfire-logo.png";
import bossCrmLogo from "@/assets/boss-crm-logo.png";

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
      </main>
      <Footer />
    </div>
  );
};

export default AgentToolsPage;
