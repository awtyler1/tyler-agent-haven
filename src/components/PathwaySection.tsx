import { FileCheck, GraduationCap, TrendingUp } from "lucide-react";

const pathways = [
  {
    icon: FileCheck,
    title: "Get Contracted",
    description: "We give you a clean, guided contracting experience.",
  },
  {
    icon: GraduationCap,
    title: "Train and Execute",
    description: "Follow the step-by-step training pathway designed to build confidence fast.",
  },
  {
    icon: TrendingUp,
    title: "Grow and Lead",
    description: "Access advanced strategy, mentorship, and leadership opportunities.",
  },
];

const PathwaySection = () => {
  return (
    <section className="section-padding bg-cream">
      <div className="container-narrow">
        <h2 className="heading-section text-center mb-16">
          Your Path With Tyler Insurance Group
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {pathways.map((pathway, index) => (
            <div 
              key={index} 
              className="text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-gold flex items-center justify-center">
                <pathway.icon className="w-8 h-8 text-gold" />
              </div>
              <h3 className="heading-subsection mb-4">{pathway.title}</h3>
              <p className="text-body-small">{pathway.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PathwaySection;
