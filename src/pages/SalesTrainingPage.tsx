import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { GraduationCap, Target, TrendingUp, Users, Newspaper, Library } from "lucide-react";

const trainingModules = [
  {
    title: "Medicare Fundamentals",
    subtitle: "The foundation of every Medicare agent.",
    icon: GraduationCap,
    label: "Module Launching January 2026"
  },
  {
    title: "Sales Training",
    subtitle: "Master communication, appointment flow, and the art of closing.",
    icon: Target,
    label: "Module Launching January 2026"
  },
  {
    title: "Leads & Marketing",
    subtitle: "Generate consistent opportunities and build your pipeline.",
    icon: TrendingUp,
    label: "Module Launching January 2026"
  },
  {
    title: "Cross Selling",
    subtitle: "Increase client value and strengthen relationships the right way.",
    icon: Users,
    label: "Module Launching January 2026"
  },
  {
    title: "Industry & Market Updates",
    subtitle: "Stay current. Stay competitive. Stay sharp.",
    icon: Newspaper,
    label: "Updated throughout the year — full module coming 2026."
  },
  {
    title: "Training Library",
    subtitle: "A complete archive of all videos, articles, and downloadable documents.",
    icon: Library,
    label: "Access Now",
    href: "/training-library"
  }
];

const SalesTrainingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main style={{ backgroundColor: '#FDFBF7' }}>
        {/* Hero Section */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-4">Training Hub</h1>
            <p className="text-xl md:text-2xl text-foreground font-medium mb-6 max-w-3xl mx-auto">
              Master the craft. Build your skills. Become an elite Medicare professional.
            </p>
            <p className="text-sm text-gold/80 font-medium tracking-wide">
              Full modules launch January 2026.
            </p>
          </div>
        </section>

        {/* Training Modules Grid */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="grid md:grid-cols-3 gap-6">
              {trainingModules.map((module, index) => (
                module.href ? (
                  <Link
                    key={index}
                    to={module.href}
                    className="group bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_4px_30px_-2px_rgba(0,0,0,0.08)] hover:border-gold/30 cursor-pointer block"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gold/8 flex items-center justify-center flex-shrink-0">
                        <module.icon className="w-6 h-6 text-gold" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {module.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {module.subtitle}
                        </p>
                        <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-gold/10 border border-gold/20">
                          <span className="text-xs font-medium text-gold">
                            {module.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div 
                    key={index}
                    className="group bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] transition-all duration-300"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gold/8 flex items-center justify-center flex-shrink-0">
                        <module.icon className="w-6 h-6 text-gold" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {module.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {module.subtitle}
                        </p>
                        <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-gold/10 border border-gold/20">
                          <span className="text-xs font-medium text-gold">
                            {module.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="section-padding bg-cream">
          <div className="container-narrow text-center">
            <h2 className="heading-section mb-4">Questions About Training?</h2>
            <p className="text-body max-w-2xl mx-auto mb-6">
              Our training modules are being designed with precision and care. If you have questions or suggestions about what you'd like to see covered, reach out to our team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:austin@tylerinsurancegroup.com"
                className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg text-sm font-medium text-foreground hover:border-gold/40 hover:bg-gold/5 transition-all duration-200"
              >
                Contact Austin Tyler
              </a>
              <a 
                href="mailto:andrew@tylerinsurancegroup.com"
                className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg text-sm font-medium text-foreground hover:border-gold/40 hover:bg-gold/5 transition-all duration-200"
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
