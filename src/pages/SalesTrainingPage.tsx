import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { GraduationCap, Target, TrendingUp, Users, Newspaper, Library } from "lucide-react";

const trainingModules = [
  {
    title: "Medicare Fundamentals",
    subtitle: "The foundation of every Medicare agent.",
    icon: GraduationCap,
    link: "/medicare-fundamentals"
  },
  {
    title: "Sales Training",
    subtitle: "Master communication, appointment flow, and the art of closing.",
    icon: Target,
    link: "/sales-training-module"
  },
  {
    title: "Leads & Marketing",
    subtitle: "Generate consistent opportunities and build your pipeline.",
    icon: TrendingUp
  },
  {
    title: "Cross Selling",
    subtitle: "Increase client value and strengthen relationships the right way.",
    icon: Users
  },
  {
    title: "Industry & Market Updates",
    subtitle: "Stay current. Stay competitive. Stay sharp.",
    icon: Newspaper
  },
  {
    title: "Training Library",
    subtitle: "A complete archive of all videos, articles, and downloadable documents.",
    icon: Library
  }
];

const SalesTrainingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main style={{ backgroundColor: '#FDFBF7' }}>
        {/* Hero Section */}
        <section className="pt-32 pb-8 md:pt-36 md:pb-10 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-3">Training Hub</h1>
            <p className="text-lg md:text-xl text-foreground font-medium max-w-3xl mx-auto">
              Master the craft. Build your skills. Become an elite Medicare professional.
            </p>
          </div>
        </section>

        {/* Training Modules Grid */}
        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow">
            <div className="grid md:grid-cols-3 gap-5">
              {trainingModules.map((module, index) => (
                <div
                  key={index}
                  className="bg-white border border-[#E5E2DB] rounded-lg p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-150"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gold/8 flex items-center justify-center flex-shrink-0">
                      <module.icon className="w-5 h-5 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground mb-1.5">
                        {module.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {module.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-gold/60 font-medium tracking-wide">
                    Training in development
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="px-6 md:px-12 lg:px-20 py-4 bg-cream">
          <div className="container-narrow text-center">
            <h2 className="text-xl font-semibold mb-3">Questions About Training?</h2>
            <p className="text-sm text-body max-w-2xl mx-auto mb-5">
              Our training modules are being designed with precision and care. If you have questions or suggestions about what you'd like to see covered, reach out to our team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:austin@tylerinsurancegroup.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-gold rounded-lg text-sm font-medium text-white hover:bg-gold/90 transition-all duration-150"
              >
                Contact Austin Tyler
              </a>
              <a 
                href="mailto:andrew@tylerinsurancegroup.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-gold rounded-lg text-sm font-medium text-white hover:bg-gold/90 transition-all duration-150"
              >
                Contact Andrew Horn
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SalesTrainingPage;
