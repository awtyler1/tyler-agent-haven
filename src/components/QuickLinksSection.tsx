import { Link } from "react-router-dom";
import { FileText, GraduationCap, FolderOpen, Headphones } from "lucide-react";

const quickLinks = [
  {
    icon: FileText,
    title: "Contracting Hub",
    href: "/contracting",
  },
  {
    icon: GraduationCap,
    title: "Training Portal",
    href: "/training",
  },
  {
    icon: FolderOpen,
    title: "Resources & Downloads",
    href: "/resources",
  },
  {
    icon: Headphones,
    title: "Support & Contact",
    href: "/support",
  },
];

const QuickLinksSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-narrow">
        <h2 className="heading-section text-center mb-12">Quick Links</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              to={link.href}
              className="card-premium text-center group hover:border-gold"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-smooth">
                <link.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-serif text-lg font-medium group-hover:text-gold transition-smooth">
                {link.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickLinksSection;
