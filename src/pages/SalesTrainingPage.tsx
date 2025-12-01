import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { GraduationCap, Target, TrendingUp, Users, Newspaper, Library } from "lucide-react";

const trainingModules = [
  {
    title: "Medicare Fundamentals",
    subtitle: "The foundation of every Medicare agent.",
    icon: GraduationCap
  },
  {
    title: "Sales Training",
    subtitle: "Master communication, appointment flow, and the art of closing.",
    icon: Target
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
              {trainingModules.map((module, index) => {
                const moduleLinks: { [key: string]: string } = {
                  "Medicare Fundamentals": "/medicare-fundamentals"
                };
                
                const hasLink = moduleLinks[module.title];
                const tileContent = (
                  <div className="flex items-start gap-4">
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
                );
                
                return hasLink ? (
                  <Link
                    key={index}
                    to={moduleLinks[module.title]}
                    className="group bg-white border border-[#EAE7E1] rounded-lg p-6 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_4px_30px_-2px_rgba(0,0,0,0.08)] hover:border-gold/30 cursor-pointer"
                  >
                    {tileContent}
                  </Link>
                ) : (
                  <div
                    key={index}
                    className="group bg-white border border-[#EAE7E1] rounded-lg p-6 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_4px_30px_-2px_rgba(0,0,0,0.08)] hover:border-gold/30 cursor-pointer"
                  >
                    {tileContent}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="px-6 md:px-12 lg:px-20 py-10 bg-cream">
          <div className="container-narrow text-center">
            <h2 className="text-xl font-semibold mb-3">Questions About Training?</h2>
            <p className="text-sm text-body max-w-2xl mx-auto mb-5">
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
