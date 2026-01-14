import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Phone, Mail } from "lucide-react";
import austinHeadshot from "@/assets/austin-headshot.jpg";
import andrewHeadshot from "@/assets/andrew-headshot.png";
import carolineHeadshot from "@/assets/caroline-headshot.jpg";

const contacts = [
  {
    name: "Austin Tyler, MBA",
    role: "Broker Development",
    phone: "(859) 619-6672",
    email: "austin@tylerinsurancegroup.com",
    focus: "Sales strategy, team leadership, production goals",
    image: austinHeadshot
  },
  {
    name: "Andrew Horn, MHA",
    role: "Broker Development",
    phone: "(210) 722-5597",
    email: "andrew@tylerinsurancegroup.com",
    focus: "Day-to-day operations, agent support, training",
    image: andrewHeadshot
  },
  {
    name: "Caroline Horn",
    role: "Director of Operations",
    phone: null,
    email: "caroline@tylerinsurancegroup.com",
    focus: "Carrier contracting, certifications, onboarding",
    image: carolineHeadshot
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Navigation />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-[#1a1a1a] mb-1">Support</h1>
            <p className="text-slate-500">
              Monday – Friday, 9am – 5pm EST • Response within 24 hours
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <div
                key={contact.name}
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-100"
              >
                {/* Photo + Name */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={contact.image}
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover object-top"
                  />
                  <div>
                    <h2 className="font-semibold text-[#1a1a1a] text-sm">{contact.name}</h2>
                    <p className="text-xs text-[#b8860b]">{contact.role}</p>
                  </div>
                </div>

                {/* Focus Area */}
                <p className="text-xs text-slate-500 mb-4">{contact.focus}</p>

                {/* Contact Methods */}
                <div className="space-y-2">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`}
                      className="flex items-center gap-2 text-sm text-slate-700 hover:text-[#b8860b] transition-colors duration-200"
                    >
                      <Phone className="w-4 h-4 text-slate-400" />
                      {contact.phone}
                    </a>
                  )}
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-sm text-slate-700 hover:text-[#b8860b] transition-colors duration-200"
                  >
                    <Mail className="w-4 h-4 text-slate-400" />
                    {contact.email}
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Help Note */}
          <p className="text-center text-sm text-slate-400 mt-8">
            Not sure who to contact? Email any of us and we'll route your question.
          </p>

        </div>
      </main>

      <Footer />
    </div>
  );
}
