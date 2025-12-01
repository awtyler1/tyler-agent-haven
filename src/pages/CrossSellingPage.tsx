import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { 
  Shield, 
  Clock, 
  Building2, 
  Eye, 
  HeartPulse, 
  Coins, 
  FileCheck, 
  Users 
} from "lucide-react";

const learningTopics = [
  {
    title: "What Cross Selling Really Is",
    description: "Understand the ethical foundation of cross selling: it's not about pressure, it's about protection, value, and long-term client relationships.",
    icon: Shield
  },
  {
    title: "When to Introduce Additional Products",
    description: "Learn the right timing and approach to introduce ancillary products naturally, without disrupting the Medicare enrollment process.",
    icon: Clock
  },
  {
    title: "Hospital Indemnity",
    description: "Master how to position hospital indemnity coverage as financial protection against out-of-pocket hospital costs and deductibles.",
    icon: Building2
  },
  {
    title: "Dental, Vision & Hearing",
    description: "Understand when and how to recommend standalone DVH coverage to fill gaps in Medicare Advantage plans or Original Medicare.",
    icon: Eye
  },
  {
    title: "Cancer, Heart & Stroke",
    description: "Learn how to introduce specified disease policies that provide lump sum benefits for critical health events and family history risks.",
    icon: HeartPulse
  },
  {
    title: "Final Expense",
    description: "Understand how to guide clients through final expense conversations with dignity, focusing on legacy protection and family relief.",
    icon: Coins
  },
  {
    title: "Compliance Rules for Cross Selling",
    description: "Master CMS compliance requirements, separation of appointments, documentation standards, and ethical boundaries for ancillary products.",
    icon: FileCheck
  },
  {
    title: "Real Appointment Examples",
    description: "Study real-world scenarios showing how to introduce, position, and close ancillary products naturally during client appointments.",
    icon: Users
  }
];

const CrossSellingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main style={{ backgroundColor: '#FDFBF7' }}>
        {/* Hero Section */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-4">Cross Selling</h1>
            <p className="text-xl md:text-2xl text-foreground font-medium mb-6 max-w-3xl mx-auto">
              Increase client value. Strengthen relationships. Protect your book.
            </p>
            <p className="text-sm text-gold/80 font-medium tracking-wide">
              Full module launches January 2026.
            </p>
          </div>
        </section>

        {/* Intro Paragraph */}
        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-body leading-relaxed">
                This module teaches agents how to introduce additional coverage ethically, clearly, and confidently. Cross selling is not about pressure — it is about protection, value, and long-term retention. Master the art of identifying client needs and presenting solutions that genuinely serve their best interests.
              </p>
            </div>
          </div>
        </section>

        {/* Core Learning Sections */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="grid md:grid-cols-2 gap-6">
              {learningTopics.map((topic, index) => (
                <div 
                  key={index}
                  className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gold/8 flex items-center justify-center flex-shrink-0">
                      <topic.icon className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {topic.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {topic.description}
                      </p>
                      <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-gold/10 border border-gold/20">
                        <span className="text-xs font-medium text-gold">
                          Module Launching January 2026
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to Apply This Module */}
        <section className="section-padding bg-cream">
          <div className="container-narrow">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
                <h2 className="text-2xl font-semibold text-foreground mb-4">How to Apply This Module</h2>
                <p className="text-body leading-relaxed">
                  Once this module launches in January 2026, you'll receive structured guidance on identifying cross-selling opportunities, introducing products ethically, navigating compliance requirements, and closing with confidence. Each section will include real appointment examples, compliance checklists, and scripting frameworks to help you serve clients completely while protecting your business and reputation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon Banner */}
        <section className="section-padding">
          <div className="container-narrow text-center">
            <div className="inline-flex items-center px-6 py-3 rounded-md bg-gold/10 border border-gold/20">
              <span className="text-sm font-medium text-gold">
                Full Cross Selling training launches January 2026.
              </span>
            </div>
          </div>
        </section>

        {/* Back Button */}
        <section className="pb-16 px-6">
          <div className="container-narrow text-center">
            <Link 
              to="/sales-training"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-gold rounded-lg text-sm font-medium text-gold hover:bg-gold hover:text-white transition-all duration-200"
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

export default CrossSellingPage;
