import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ExternalLink, Monitor, Users, Building2, Phone, Mail, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const toolCards = [
  {
    name: "Connecture",
    description: "Quoting + E-apps. Carrier-agnostic. Fast comparisons.",
    note: "Use your assigned credentials.",
    url: "https://connecture.com",
    icon: Monitor,
  },
  {
    name: "Sunfire",
    description: "Quoting, enrollment, SOA capture, and plan comparison. Includes MA, PDP, and Med Supp.",
    note: "Use your assigned login.",
    url: "https://sunfire.com",
    icon: Monitor,
  },
];

const carrierPortals = [
  { name: "Humana", url: "#" },
  { name: "Wellcare", url: "#" },
  { name: "Aetna", url: "#" },
  { name: "UnitedHealthcare", url: "#" },
  { name: "Anthem", url: "#" },
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
            <p className="text-body max-w-2xl mb-6">
              Your command center for quoting, applications, CRM, and essential platforms.
            </p>
            
            {/* Quick Selection Dropdown */}
            <div className="max-w-xs">
              <label className="text-sm font-medium text-foreground mb-2 block">Quick Access</label>
              <Select
                onValueChange={(value) => {
                  if (value) window.open(value, '_blank');
                }}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select a tool..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="https://connecture.com">Connecture</SelectItem>
                  <SelectItem value="https://sunfire.com">Sunfire</SelectItem>
                  <SelectItem value="https://bosscrm.com">BOSS CRM</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                    <div className="w-12 h-12 rounded-lg bg-cream flex items-center justify-center flex-shrink-0">
                      <tool.icon className="w-6 h-6 text-gold" />
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
              href="https://bosscrm.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group card-premium hover:border-gold transition-smooth block max-w-xl"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-gold" />
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {carrierPortals.map((carrier) => (
                <div
                  key={carrier.name}
                  className="card-premium opacity-60 cursor-not-allowed text-center py-8"
                >
                  <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground">{carrier.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Coming Soon</p>
                </div>
              ))}
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
