import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import tylerLogo from "@/assets/tyler-logo.png";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Start Here", href: "/start-here" },
  { 
    name: "Training", 
    href: "/medicare-fundamentals",
    submenu: [
      { name: "Medicare Fundamentals", href: "/medicare-fundamentals" },
      { name: "Sales Training", href: "/sales-training" },
      { name: "Cross Selling", href: "/cross-selling" },
    ]
  },
  { 
    name: "Resources", 
    href: "/industry-updates",
    submenu: [
      { name: "Industry & Market Updates", href: "/industry-updates" },
      { name: "Leads & Marketing", href: "/leads-marketing" },
      { name: "Carrier Resources", href: "/carrier-resources" },
    ]
  },
  { name: "Agent Tools", href: "/agent-tools" },
  { name: "Compliance", href: "/compliance" },
  { name: "Contact", href: "/contact" },
];

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container-narrow mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={tylerLogo} 
              alt="Tyler Insurance Group" 
              className="h-14 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <div 
                key={link.name} 
                className="relative group"
                onMouseEnter={() => link.submenu && setOpenSubmenu(link.name)}
                onMouseLeave={() => setOpenSubmenu(null)}
              >
                <Link
                  to={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-gold transition-smooth tracking-wide uppercase flex items-center gap-1"
                >
                  {link.name}
                  {link.submenu && <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />}
                </Link>
                
                {link.submenu && openSubmenu === link.name && (
                  <div className="absolute top-full left-0 pt-2 w-56 animate-fade-in">
                    <div className="bg-background border border-border rounded-lg shadow-elevated py-2">
                      {link.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          to={subitem.href}
                          className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-muted transition-smooth"
                        >
                          {subitem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-foreground hover:text-gold transition-smooth"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-6 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <div key={link.name}>
                  <Link
                    to={link.href}
                    onClick={() => !link.submenu && setIsOpen(false)}
                    className="text-base font-medium text-muted-foreground hover:text-gold transition-smooth tracking-wide uppercase py-2 block"
                  >
                    {link.name}
                  </Link>
                  {link.submenu && (
                    <div className="pl-4 border-l border-border ml-2">
                      {link.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          to={subitem.href}
                          onClick={() => setIsOpen(false)}
                          className="text-sm text-muted-foreground hover:text-gold transition-smooth py-1.5 block"
                        >
                          {subitem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
