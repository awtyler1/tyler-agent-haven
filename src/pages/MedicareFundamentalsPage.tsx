import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Building2, 
  Stethoscope, 
  Shield, 
  LifeBuoy, 
  Pill, 
  HeartHandshake, 
  Calendar, 
  FileCheck, 
  Users 
} from "lucide-react";

const learningTopics = [
  {
    title: "What Is Medicare",
    description: "Understand the federal health insurance program, eligibility requirements, and how it serves Americans 65+ and those with qualifying disabilities.",
    icon: BookOpen
  },
  {
    title: "Part A – Hospital Insurance",
    description: "Learn what hospital coverage includes, when it applies, premium structures, and how to explain it clearly to clients.",
    icon: Building2
  },
  {
    title: "Part B – Medical Insurance",
    description: "Master outpatient care, doctor visits, preventive services, and how Part B premiums work for beneficiaries.",
    icon: Stethoscope
  },
  {
    title: "Medicare Advantage (Part C)",
    description: "Explore private plan alternatives to Original Medicare, including HMO, PPO, and Special Needs Plans with bundled benefits.",
    icon: Shield
  },
  {
    title: "Medicare Supplement (Medigap)",
    description: "Understand standardized Medigap plans, how they work alongside Original Medicare, and when to recommend them.",
    icon: LifeBuoy
  },
  {
    title: "Part D – Prescription Drug Coverage",
    description: "Navigate formularies, coverage phases, the donut hole, and how to guide clients through drug plan selection.",
    icon: Pill
  },
  {
    title: "LIS & Medicaid",
    description: "Learn about Low-Income Subsidy (Extra Help), dual eligibility, and how these programs support beneficiaries with limited resources.",
    icon: HeartHandshake
  },
  {
    title: "Enrollment Periods",
    description: "Master IEP, AEP, OEP, and SEPs — when clients can enroll, switch plans, and the compliance rules around each period.",
    icon: Calendar
  },
  {
    title: "Compliance Basics",
    description: "Understand CMS guidelines, SOA requirements, marketing rules, and how to conduct compliant appointments every time.",
    icon: FileCheck
  },
  {
    title: "Common Client Scenarios",
    description: "Prepare for real-world situations: dual eligibles, plan switches, drug coverage questions, and handling objections with confidence.",
    icon: Users
  }
];

const MedicareFundamentalsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main style={{ backgroundColor: '#FDFBF7' }}>
        {/* Hero Section */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-4">Medicare Fundamentals</h1>
            <p className="text-xl md:text-2xl text-foreground font-medium mb-6 max-w-3xl mx-auto">
              The essential foundation every Medicare professional must master.
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
                This module provides the core framework every Medicare agent must understand. It equips new agents with a clear foundation and gives experienced agents a reliable reference point. Mastering these fundamentals ensures you can confidently guide clients through every aspect of Medicare with clarity and precision.
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

        {/* How to Study Section */}
        <section className="section-padding bg-cream">
          <div className="container-narrow">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
                <h2 className="text-2xl font-semibold text-foreground mb-4">How to Study This Module</h2>
                <p className="text-body leading-relaxed">
                  Once this module launches in January 2026, you'll receive a structured learning path with video lessons, reference materials, quizzes, and practical scenarios. Each section will build on the previous one, ensuring you develop a complete understanding of Medicare fundamentals. Until then, explore the topics above to see what's coming.
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
                Full Medicare Fundamentals training launches January 2026.
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

export default MedicareFundamentalsPage;
