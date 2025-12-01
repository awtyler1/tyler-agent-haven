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
  Users,
  UserCheck
} from "lucide-react";

const fundamentalsTopics = [
  {
    title: "What Is Medicare",
    subtitle: "Federal health insurance program for seniors and qualifying individuals",
    icon: BookOpen,
    href: "/medicare-fundamentals/what-is-medicare"
  },
  {
    title: "What Is a Medicare Broker",
    subtitle: "Your role as an independent advocate and trusted advisor",
    icon: UserCheck,
    href: "/medicare-fundamentals/what-is-a-broker"
  },
  {
    title: "Part A — Hospital Insurance",
    subtitle: "Inpatient hospital care, skilled nursing, and related services",
    icon: Building2,
    href: "/medicare-fundamentals/part-a"
  },
  {
    title: "Part B — Medical Insurance",
    subtitle: "Outpatient care, doctor visits, and preventive services",
    icon: Stethoscope,
    href: "/medicare-fundamentals/part-b"
  },
  {
    title: "Medicare Advantage (Part C)",
    subtitle: "Private plan alternatives with bundled coverage and benefits",
    icon: Shield,
    href: "/medicare-fundamentals/medicare-advantage"
  },
  {
    title: "Medicare Supplement (Medigap)",
    subtitle: "Gap coverage for Original Medicare out-of-pocket costs",
    icon: LifeBuoy,
    href: "/medicare-fundamentals/medicare-supplement"
  },
  {
    title: "Part D — Prescription Drug Coverage",
    subtitle: "Formularies, tiers, and drug plan selection",
    icon: Pill,
    href: "/medicare-fundamentals/part-d"
  },
  {
    title: "LIS & Medicaid",
    subtitle: "Low-Income Subsidy and dual eligibility programs",
    icon: HeartHandshake,
    href: "/medicare-fundamentals/lis-medicaid"
  },
  {
    title: "Enrollment Periods",
    subtitle: "When clients can enroll, switch plans, and make changes",
    icon: Calendar,
    href: "/medicare-fundamentals/enrollment-periods"
  },
  {
    title: "Compliance Basics",
    subtitle: "CMS guidelines, SOA requirements, and marketing rules",
    icon: FileCheck,
    href: "/medicare-fundamentals/compliance-basics"
  },
  {
    title: "Common Client Scenarios",
    subtitle: "Real-world situations and how to navigate them confidently",
    icon: Users,
    href: "/medicare-fundamentals/common-client-scenarios"
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
            <p className="text-xl md:text-2xl text-foreground font-medium max-w-3xl mx-auto">
              Your foundation as a Medicare professional.
            </p>
          </div>
        </section>

        {/* Intro Paragraph */}
        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-body leading-relaxed">
                This section provides a complete understanding of Medicare and prepares you for real-world selling and client service. Master these fundamentals to guide clients with clarity, confidence, and precision through every aspect of Medicare coverage.
              </p>
            </div>
          </div>
        </section>

        {/* Topic Tiles */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="grid md:grid-cols-2 gap-6">
              {fundamentalsTopics.map((topic, index) => (
                <Link
                  key={index}
                  to={topic.href}
                  className="group bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_4px_30px_-2px_rgba(0,0,0,0.08)] hover:border-gold/30 cursor-pointer block"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gold/8 flex items-center justify-center flex-shrink-0">
                      <topic.icon className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {topic.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {topic.subtitle}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
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
