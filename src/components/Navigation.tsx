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
  { 
    name: "Agent Tools", 
    href: "/agent-tools",
    sections: [
      {
        title: "Quoting Tools",
        items: [
          { name: "Connect4Insurance", href: "https://pinnacle7.destinationrx.com/PC/Agent/Account/Login", external: true },
          { name: "Sunfire", href: "https://www.sunfirematrix.com/app/agent/pfs", external: true },
        ]
      },
      {
        title: "CRM",
        items: [
          { name: "BOSS CRM", href: "https://fmo.kizen.com/login", external: true },
        ]
      },
      {
        title: "Carrier Portal Links",
        items: [
          { name: "Aetna", href: "https://www.aetnamedicare.com/", external: true },
          { name: "Anthem", href: "https://www.anthem.com/", external: true },
          { name: "Devoted", href: "https://www.devoted.com/", external: true },
          { name: "Humana", href: "https://www.humana.com/", external: true },
          { name: "United Healthcare", href: "https://www.uhc.com/", external: true },
          { name: "Wellcare", href: "https://www.wellcare.com/", external: true },
        ]
      }
    ]
  },
  { name: "Compliance", href: "/compliance" },
  { name: "About", href: "/about" },
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
                        'external' in subitem && subitem.external ? (
                          <a
                            key={subitem.name}
                            href={subitem.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-muted transition-smooth"
                          >
                            {subitem.name}
                          </a>
                        ) : (
                          <Link
                            key={subitem.name}
                            to={subitem.href}
                            className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-muted transition-smooth"
                          >
                            {subitem.name}
                          </Link>
                        )
                      ))}
                    </div>
                  </div>
                )}
                
                {link.sections && openSubmenu === link.name && (
                  <div className="absolute top-full left-0 pt-2 w-64 animate-fade-in">
                    <div className="bg-background border border-border rounded-lg shadow-elevated py-2">
                      {link.sections.map((section, sectionIndex) => (
                        <div key={section.title}>
                          {sectionIndex > 0 && <div className="border-t border-border my-2" />}
                          <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">{section.title}</p>
                          {section.items.map((item) => (
                            <a
                              key={item.name}
                              href={item.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-muted transition-smooth"
                            >
                              {item.name}
                            </a>
                          ))}
                        </div>
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
                        'external' in subitem && subitem.external ? (
                          <a
                            key={subitem.name}
                            href={subitem.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsOpen(false)}
                            className="text-sm text-muted-foreground hover:text-gold transition-smooth py-1.5 block"
                          >
                            {subitem.name}
                          </a>
                        ) : (
                          <Link
                            key={subitem.name}
                            to={subitem.href}
                            onClick={() => setIsOpen(false)}
                            className="text-sm text-muted-foreground hover:text-gold transition-smooth py-1.5 block"
                          >
                            {subitem.name}
                          </Link>
                        )
                      ))}
                    </div>
                  )}
                  {link.sections && (
                    <div className="pl-4 border-l border-border ml-2">
                      {link.sections.map((section) => (
                        <div key={section.title} className="mt-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gold py-1">{section.title}</p>
                          {section.items.map((item) => (
                            <a
                              key={item.name}
                              href={item.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setIsOpen(false)}
                              className="text-sm text-muted-foreground hover:text-gold transition-smooth py-1.5 block"
                            >
                              {item.name}
                            </a>
                          ))}
                        </div>
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
