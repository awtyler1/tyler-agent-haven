import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { 
  GraduationCap, 
  User, 
  Building2, 
  Stethoscope, 
  Shield, 
  FileText, 
  Pill, 
  Heart, 
  Calendar, 
  Scale, 
  Users 
} from "lucide-react";

const fundamentalsTiles = [
  {
    title: "What Is Medicare",
    subtitle: "Understanding the basics of the Medicare system.",
    icon: GraduationCap
  },
  {
    title: "What Is a Medicare Broker",
    subtitle: "Your role, responsibilities, and value to clients.",
    icon: User
  },
  {
    title: "Part A — Hospital Insurance",
    subtitle: "Inpatient care, skilled nursing, and hospice coverage.",
    icon: Building2
  },
  {
    title: "Part B — Medical Insurance",
    subtitle: "Outpatient care, doctor visits, and preventive services.",
    icon: Stethoscope
  },
  {
    title: "Medicare Advantage (Part C)",
    subtitle: "Private plans that replace Original Medicare.",
    icon: Shield
  },
  {
    title: "Medicare Supplement (Medigap)",
    subtitle: "Supplemental coverage that fills Medicare gaps.",
    icon: FileText
  },
  {
    title: "Part D — Prescription Drug Coverage",
    subtitle: "How drug plans work and how to compare them.",
    icon: Pill
  },
  {
    title: "LIS & Medicaid",
    subtitle: "Extra help programs for low-income beneficiaries.",
    icon: Heart
  },
  {
    title: "Enrollment Periods",
    subtitle: "When clients can enroll, change, or disenroll.",
    icon: Calendar
  },
  {
    title: "Compliance Basics",
    subtitle: "Rules, regulations, and what you must follow.",
    icon: Scale
  },
  {
    title: "Common Client Scenarios",
    subtitle: "Real-world situations and how to navigate them.",
    icon: Users
  }
];

const MedicareFundamentalsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main style={{ backgroundColor: '#FDFBF7' }}>
        {/* Hero Section */}
        <section className="pt-28 pb-6 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-3">Medicare Fundamentals</h1>
            <p className="text-lg md:text-xl text-foreground font-medium max-w-3xl mx-auto">
              Your foundation as a Medicare professional.
            </p>
          </div>
        </section>

        {/* Intro Paragraph */}
        <section className="px-6 md:px-12 lg:px-20 pb-6">
          <div className="container-narrow">
            <p className="text-sm text-body leading-relaxed max-w-3xl mx-auto text-center">
              Medicare Fundamentals is the essential knowledge base every agent must master before serving clients. This section breaks down how Medicare works, what each part covers, how plans differ, and how to navigate the rules with confidence. Whether you're brand new to Medicare or sharpening your foundation, this is where disciplined agents begin.
            </p>
          </div>
        </section>

        {/* What You'll Learn Section */}
        <section className="px-6 md:px-12 lg:px-20 pb-8">
          <div className="container-narrow">
            <h2 className="text-xl font-semibold mb-4 text-center">What You'll Learn</h2>
            <ul className="space-y-2 max-w-2xl mx-auto text-sm text-body">
              <li className="flex items-start gap-3">
                <span className="text-gold mt-0.5">•</span>
                <span>Understand how Medicare works at a foundational level</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold mt-0.5">•</span>
                <span>Distinguish between Parts A, B, C, and D with clarity</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold mt-0.5">•</span>
                <span>Recognize client scenarios and how to navigate them</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold mt-0.5">•</span>
                <span>Identify enrollment periods and rules without confusion</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold mt-0.5">•</span>
                <span>Understand compliance basics and agent responsibilities</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold mt-0.5">•</span>
                <span>Build confidence in explaining Medicare to clients</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Fundamentals Tile Grid */}
        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow">
            <div className="grid md:grid-cols-3 gap-5">
              {fundamentalsTiles.map((tile, index) => (
                <div
                  key={index}
                  className="group bg-white border border-[#EAE7E1] rounded-lg p-6 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_4px_30px_-2px_rgba(0,0,0,0.08)] hover:border-gold/30 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gold/8 flex items-center justify-center flex-shrink-0">
                      <tile.icon className="w-5 h-5 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground mb-1.5">
                        {tile.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
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
        <section className="px-6 md:px-12 lg:px-20 pb-12">
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

export default MedicareFundamentalsPage;
