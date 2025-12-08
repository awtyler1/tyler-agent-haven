import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, Shield } from "lucide-react";
import tylerLogo from "@/assets/tyler-logo.png";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { name: "Dashboard", href: "/" },
  { name: "Onboarding", href: "/start-here" },
  { name: "Contracting Hub", href: "/contracting-hub" },
  { name: "Certifications", href: "/certifications" },
  { name: "Training Hub", href: "/sales-training" },
  { name: "Agent Tools", href: "/agent-tools" },
  { name: "Compliance", href: "/compliance" },
  { name: "Support", href: "/contact" },
];

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { isSuperAdmin } = useAuth();

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
          <div className="hidden lg:flex items-center gap-5">
            {navLinks.map((link) => (
              <div 
                key={link.name} 
                className="relative group"
                onMouseEnter={() => (('submenu' in link && link.submenu) || ('sections' in link && link.sections)) && setOpenSubmenu(link.name)}
                onMouseLeave={() => setOpenSubmenu(null)}
              >
                <Link
                  to={link.href}
                  onClick={() => window.scrollTo(0, 0)}
                  className="text-[13px] font-medium text-muted-foreground hover:text-gold transition-smooth tracking-wide flex items-center gap-1 whitespace-nowrap"
                >
                  {link.name}
                  {(('submenu' in link && link.submenu) || ('sections' in link && link.sections)) && <ChevronDown size={12} className="transition-transform group-hover:rotate-180" />}
                </Link>
                
                {'submenu' in link && link.submenu && openSubmenu === link.name && Array.isArray(link.submenu) && (
                  <div className="absolute top-full left-0 pt-2 w-56 animate-fade-in">
                    <div className="bg-background border border-border rounded-lg shadow-elevated py-2">
                      {(link.submenu as Array<{name: string; href: string; external?: boolean}>).map((subitem) => (
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
                
                {'sections' in link && link.sections && openSubmenu === link.name && Array.isArray(link.sections) && (
                  <div className="absolute top-full left-0 pt-2 w-64 animate-fade-in">
                    <div className="bg-background border border-border rounded-lg shadow-elevated py-2">
                      {link.sections.map((section, sectionIndex) => (
                        <div key={section.title}>
                          {sectionIndex > 0 && <div className="border-t border-border my-2" />}
                          <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">{section.title}</p>
                          {section.items.map((item) => (
                            item.external ? (
                              <a
                                key={item.name}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-muted transition-smooth"
                              >
                                {item.name}
                              </a>
                            ) : (
                              <Link
                                key={item.name}
                                to={item.href}
                                className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-muted transition-smooth"
                              >
                                {item.name}
                              </Link>
                            )
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Admin Link - Only for Super Admins */}
            {isSuperAdmin() && (
              <Link
                to="/admin/super"
                className="text-[13px] font-medium text-primary hover:text-gold transition-smooth tracking-wide flex items-center gap-1.5 whitespace-nowrap"
              >
                <Shield size={14} />
                Admin
              </Link>
            )}
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
                    onClick={() => !('submenu' in link && link.submenu) && setIsOpen(false)}
                    className="text-base font-medium text-muted-foreground hover:text-gold transition-smooth tracking-wide uppercase py-2 block"
                  >
                    {link.name}
                  </Link>
                  {'submenu' in link && link.submenu && Array.isArray(link.submenu) && (
                    <div className="pl-4 border-l border-border ml-2">
                      {(link.submenu as Array<{name: string; href: string; external?: boolean}>).map((subitem) => (
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
                  {'sections' in link && link.sections && Array.isArray(link.sections) && (
                    <div className="pl-4 border-l border-border ml-2">
                      {link.sections.map((section) => (
                        <div key={section.title} className="mt-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gold py-1">{section.title}</p>
                          {section.items.map((item) => (
                            item.external ? (
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
                            ) : (
                              <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-muted-foreground hover:text-gold transition-smooth py-1.5 block"
                              >
                                {item.name}
                              </Link>
                            )
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Admin Link - Only for Super Admins */}
              {isSuperAdmin() && (
                <Link
                  to="/admin/super"
                  onClick={() => setIsOpen(false)}
                  className="text-base font-medium text-primary hover:text-gold transition-smooth tracking-wide uppercase py-2 flex items-center gap-2"
                >
                  <Shield size={16} />
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
