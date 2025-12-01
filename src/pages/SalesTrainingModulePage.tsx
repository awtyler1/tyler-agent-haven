import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { 
  Target, 
  Calendar, 
  Phone, 
  ClipboardList, 
  PresentationIcon, 
  MessageSquare, 
  FileCheck, 
  UserCheck, 
  Briefcase, 
  Brain, 
  FileText, 
  Users 
} from "lucide-react";

const salesTrainingTiles = [
  {
    title: "Sales Fundamentals",
    subtitle: "Core principles of effective, ethical selling.",
    icon: Target
  },
  {
    title: "Running the Appointment",
    subtitle: "Structure, flow, pacing, and leading the client.",
    icon: Calendar
  },
  {
    title: "Dialing & Lead Follow-Up",
    subtitle: "How to control conversations and create appointments.",
    icon: Phone
  },
  {
    title: "Needs Assessment",
    subtitle: "Asking the right questions to uncover the real situation.",
    icon: ClipboardList
  },
  {
    title: "Plan Presentation",
    subtitle: "Presenting options clearly and confidently.",
    icon: PresentationIcon
  },
  {
    title: "Overcoming Objections",
    subtitle: "Resolving concerns without pressure or gimmicks.",
    icon: MessageSquare
  },
  {
    title: "Enrollment Mastery",
    subtitle: "Making the enrollment process seamless and compliant.",
    icon: FileCheck
  },
  {
    title: "Post-Enrollment Follow-Up",
    subtitle: "Retention systems that build long-term loyalty.",
    icon: UserCheck
  },
  {
    title: "Business Ownership",
    subtitle: "How top-tier agents operate like business leaders.",
    icon: Briefcase
  },
  {
    title: "Mindset & Discipline",
    subtitle: "The habits and inner skills behind elite performance.",
    icon: Brain
  },
  {
    title: "Sales Scripts Library",
    subtitle: "Structured talk tracks for real conversations.",
    icon: FileText
  },
  {
    title: "Sales Scenarios Recap",
    subtitle: "How to handle the most common real-world situations.",
    icon: Users
  }
];

const SalesTrainingModulePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main style={{ backgroundColor: '#FDFBF7' }}>
        {/* Hero Section */}
        <section className="pt-24 pb-4 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-2">Sales Training</h1>
            <p className="text-lg md:text-xl text-foreground font-medium max-w-3xl mx-auto">
              Master the craft of guiding, communicating, and closing with clarity.
            </p>
          </div>
        </section>

        {/* Intro Paragraph */}
        <section className="px-6 md:px-12 lg:px-20 pb-4">
          <div className="container-narrow">
            <p className="text-sm text-body leading-relaxed max-w-3xl mx-auto text-center">
              This section teaches you how to communicate with clients, run appointments with structure, and build trust through disciplined execution. These skills turn knowledge into results.
            </p>
          </div>
        </section>

        {/* Sales Training Tile Grid */}
        <section className="px-6 md:px-12 lg:px-20 pb-8">
          <div className="container-narrow">
            <div className="grid md:grid-cols-4 gap-4">
              {salesTrainingTiles.map((tile, index) => (
                <div
                  key={index}
                  className="group bg-white border border-[#EAE7E1] rounded-lg p-4 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_4px_30px_-2px_rgba(0,0,0,0.08)] hover:border-gold/30 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold/8 flex items-center justify-center flex-shrink-0">
                      <tile.icon className="w-4 h-4 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        {tile.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {tile.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Back to Training Hub */}
        <section className="px-6 md:px-12 lg:px-20 pb-8">
          <div className="container-narrow text-center">
            <Link
              to="/sales-training"
              className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg text-sm font-medium text-foreground hover:border-gold/40 hover:bg-gold/5 transition-all duration-200"
            >
              Back to Training Hub
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SalesTrainingModulePage;
