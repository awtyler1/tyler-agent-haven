import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Phone, Mail, MessageSquare, Clock } from "lucide-react";
import austinHeadshot from "@/assets/austin-headshot.jpg";
import andrewHeadshot from "@/assets/andrew-headshot.png";
import carolineHeadshot from "@/assets/caroline-headshot.jpg";

const contacts = [
  {
    name: "Austin Tyler, MBA",
    role: "Broker Development",
    phone: "(859) 619-6672",
    email: "austin@tylerinsurancegroup.com",
    specialties: ["Sales strategy", "Team leadership", "Production goals"],
    image: austinHeadshot
  },
  {
    name: "Andrew Horn, MHA",
    role: "Broker Development",
    phone: "(210) 722-5597",
    email: "andrew@tylerinsurancegroup.com",
    specialties: ["Day-to-day operations", "Agent support", "Training coordination"],
    image: andrewHeadshot
  },
  {
    name: "Caroline Horn",
    role: "Contracting Support",
    phone: null,
    email: "caroline@tylerinsurancegroup.com",
    specialties: ["Carrier contracting", "Certifications", "Onboarding"],
    image: carolineHeadshot
  },
];

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">Contact & Support</h1>
            <p className="text-body max-w-2xl">
              Clear lines of communication. Know who to contact and when.
            </p>
          </div>
        </section>

        {/* Office Hours */}
        <section className="px-6 md:px-12 lg:px-20 py-8 border-b border-border">
          <div className="container-narrow">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gold" />
                <div>
                  <p className="font-medium text-foreground">Office Hours</p>
                  <p className="text-body-small">Monday - Friday: 9:00 AM - 5:00 PM EST</p>
                </div>
              </div>
              <div className="text-body-small">
                <span className="text-gold font-medium">Response Time:</span> Within 24 hours
              </div>
            </div>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="section-padding">
          <div className="container-narrow">
            {/* Austin and Andrew - side by side */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {contacts.slice(0, 2).map((contact, index) => (
                <div key={index} className="card-premium">
                  <div className="flex items-start gap-4 mb-6">
                    {contact.image ? (
                      <img 
                        src={contact.image} 
                        alt={contact.name}
                        className="w-16 h-16 rounded-full object-cover object-top flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-gold">{contact.name[0]}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="heading-subsection mb-1">{contact.name}</h3>
                      <p className="text-sm text-gold font-medium">{contact.role}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {contact.phone && (
                      <a 
                        href={`tel:${contact.phone.replace(/\D/g, '')}`}
                        className="flex items-center gap-3 text-foreground hover:text-gold transition-smooth"
                      >
                        <Phone size={16} className="text-gold" />
                        <span>{contact.phone}</span>
                      </a>
                    )}
                    <a 
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-3 text-foreground hover:text-gold transition-smooth"
                    >
                      <Mail size={16} className="text-gold" />
                      <span>{contact.email}</span>
                    </a>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Specialties</p>
                    <ul className="space-y-1">
                      {contact.specialties.map((specialty, i) => (
                        <li key={i} className="flex items-center gap-2 text-body-small">
                          <span className="text-gold text-xs">◆</span>
                          {specialty}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border flex gap-3">
                    {contact.phone && (
                      <>
                        <a 
                          href={`tel:${contact.phone.replace(/\D/g, '')}`}
                          className="flex-1 btn-outline-gold text-center text-sm py-3"
                        >
                          Call
                        </a>
                        <a 
                          href={`sms:${contact.phone.replace(/\D/g, '')}`}
                          className="flex-1 btn-outline-gold text-center text-sm py-3"
                        >
                          Text
                        </a>
                      </>
                    )}
                    <a 
                      href={`mailto:${contact.email}`}
                      className={`${contact.phone ? 'flex-1' : 'w-full'} btn-primary-gold text-center text-sm py-3`}
                    >
                      Email
                    </a>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Caroline - centered below */}
            <div className="flex justify-center">
              <div className="w-full md:w-1/2 md:max-w-md">
                {contacts.slice(2, 3).map((contact, index) => (
                  <div key={index} className="card-premium">
                    <div className="flex items-start gap-4 mb-6">
                      {contact.image ? (
                        <img 
                          src={contact.image} 
                          alt={contact.name}
                          className="w-16 h-16 rounded-full object-cover object-top flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl font-bold text-gold">{contact.name[0]}</span>
                        </div>
                      )}
                      <div>
                        <h3 className="heading-subsection mb-1">{contact.name}</h3>
                        <p className="text-sm text-gold font-medium">{contact.role}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {contact.phone && (
                        <a 
                          href={`tel:${contact.phone.replace(/\D/g, '')}`}
                          className="flex items-center gap-3 text-foreground hover:text-gold transition-smooth"
                        >
                          <Phone size={16} className="text-gold" />
                          <span>{contact.phone}</span>
                        </a>
                      )}
                      <a 
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-3 text-foreground hover:text-gold transition-smooth"
                      >
                        <Mail size={16} className="text-gold" />
                        <span>{contact.email}</span>
                      </a>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Specialties</p>
                      <ul className="space-y-1">
                        {contact.specialties.map((specialty, i) => (
                          <li key={i} className="flex items-center gap-2 text-body-small">
                            <span className="text-gold text-xs">◆</span>
                            {specialty}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border flex gap-3">
                      {contact.phone && (
                        <>
                          <a 
                            href={`tel:${contact.phone.replace(/\D/g, '')}`}
                            className="flex-1 btn-outline-gold text-center text-sm py-3"
                          >
                            Call
                          </a>
                          <a 
                            href={`sms:${contact.phone.replace(/\D/g, '')}`}
                            className="flex-1 btn-outline-gold text-center text-sm py-3"
                          >
                            Text
                          </a>
                        </>
                      )}
                      <a 
                        href={`mailto:${contact.email}`}
                        className={`${contact.phone ? 'flex-1' : 'w-full'} btn-primary-gold text-center text-sm py-3`}
                      >
                        Email
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ or Additional Info */}
        <section className="section-padding bg-cream">
          <div className="container-narrow text-center">
            <h2 className="heading-section mb-4">Need Something Else?</h2>
            <p className="text-body max-w-xl mx-auto mb-8">
              Can't find what you're looking for? Reach out to any team member and 
              we'll point you in the right direction.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="mailto:support@tylerinsurance.com" className="btn-primary-gold">
                General Inquiry
              </a>
              <a href="tel:5551234567" className="btn-outline-gold">
                Call Main Line
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
