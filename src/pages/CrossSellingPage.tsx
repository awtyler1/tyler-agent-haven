import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Package, Clock, AlertTriangle, Download, ChevronRight } from "lucide-react";

const sections = [
  { id: "products", title: "Ancillary Products", icon: Package },
  { id: "timing", title: "When & How to Introduce", icon: Clock },
  { id: "compliance", title: "Compliance Dos & Don'ts", icon: AlertTriangle },
];

const products = [
  {
    name: "Dental, Vision, Hearing",
    description: "Standalone or bundled coverage for common senior needs.",
    opportunities: ["MA plans without DVH benefits", "Supplement clients", "During AEP/OEP"]
  },
  {
    name: "Hospital Indemnity",
    description: "Cash benefits for hospital stays to cover out-of-pocket costs.",
    opportunities: ["MA clients with hospital stays", "High-deductible plans", "Recent health events"]
  },
  {
    name: "Cancer/Heart/Stroke",
    description: "Specified disease policies providing lump sum or periodic benefits.",
    opportunities: ["Family history discussions", "Supplement clients", "Risk-aware seniors"]
  },
  {
    name: "Final Expense",
    description: "Whole life policies designed to cover end-of-life costs.",
    opportunities: ["Estate planning conversations", "Funeral cost concerns", "Legacy discussions"]
  },
  {
    name: "Annuities",
    description: "Retirement income products for asset protection and growth.",
    opportunities: ["Retirement planning", "CD renewals", "Market volatility concerns"]
  }
];

const CrossSellingPage = () => {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  const renderContent = () => {
    switch (activeSection) {
      case "products":
        return (
          <div>
            <h2 className="heading-section mb-4">Ancillary Products</h2>
            <p className="text-body mb-8">
              Increase lifetime value and strengthen client retention with complementary products.
            </p>
            <div className="space-y-6">
              {products.map((product, index) => (
                <div key={index} className="p-6 bg-muted rounded-lg">
                  <h3 className="font-medium text-foreground text-lg mb-2">{product.name}</h3>
                  <p className="text-body-small mb-4">{product.description}</p>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gold mb-2">Best Opportunities</p>
                    <ul className="space-y-1">
                      {product.opportunities.map((opp, i) => (
                        <li key={i} className="flex items-center gap-2 text-body-small">
                          <span className="text-gold">◆</span>
                          {opp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "timing":
        return (
          <div>
            <h2 className="heading-section mb-4">When & How to Introduce</h2>
            <p className="text-body mb-8">
              Timing and approach matter. Here's when to introduce ancillary products.
            </p>
            
            <div className="space-y-6">
              <div className="p-6 border border-border rounded-lg">
                <h3 className="font-medium text-foreground mb-4">Best Timing</h3>
                <ul className="space-y-3">
                  {[
                    "After the primary Medicare enrollment is complete",
                    "During annual reviews when coverage gaps appear",
                    "When client mentions specific health concerns",
                    "30-60 days after initial enrollment",
                    "During birthday calls and check-ins"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-gold font-bold">◆</span>
                      <span className="text-body-small">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 border border-border rounded-lg">
                <h3 className="font-medium text-foreground mb-4">Introduction Framework</h3>
                <ol className="space-y-3">
                  {[
                    "Identify the gap or concern naturally in conversation",
                    "Ask permission: 'Would it be helpful if I shared some options?'",
                    "Present one or two relevant solutions only",
                    "Explain benefits in terms of their specific situation",
                    "Offer to follow up - no pressure"
                  ].map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-gold text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-body-small">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        );
      case "compliance":
        return (
          <div>
            <h2 className="heading-section mb-4">Compliance Dos & Don'ts</h2>
            <p className="text-body mb-8">
              Protect yourself and your clients. Know the rules.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <h3 className="font-medium text-green-800 dark:text-green-400 mb-4 flex items-center gap-2">
                  <span className="text-lg">✓</span> Do
                </h3>
                <ul className="space-y-3">
                  {[
                    "Complete Medicare enrollment first",
                    "Get separate permission for ancillary discussion",
                    "Document all conversations",
                    "Explain products are not Medicare",
                    "Allow time between enrollments",
                    "Use carrier-approved materials"
                  ].map((item, index) => (
                    <li key={index} className="text-body-small text-green-900 dark:text-green-300">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                <h3 className="font-medium text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">
                  <span className="text-lg">✗</span> Don't
                </h3>
                <ul className="space-y-3">
                  {[
                    "Bundle ancillary with Medicare enrollment",
                    "Pressure or rush the decision",
                    "Misrepresent products as Medicare",
                    "Use Medicare marketing events for ancillary",
                    "Cross-sell during SOA process",
                    "Imply required purchase"
                  ].map((item, index) => (
                    <li key={index} className="text-body-small text-red-900 dark:text-red-300">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">Cross Selling</h1>
            <p className="text-body max-w-2xl">
              Increase lifetime value. Strengthen client relationships. Serve complete needs.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="grid lg:grid-cols-[280px_1fr] gap-8">
              {/* Sidebar */}
              <div className="lg:sticky lg:top-28 lg:self-start">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Sections</h3>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-smooth flex items-center gap-3 ${
                        activeSection === section.id 
                          ? "bg-gold/10 text-gold border-l-2 border-gold" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <section.icon size={16} />
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Main Content */}
              <div className="card-premium animate-fade-in" key={activeSection}>
                {renderContent()}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CrossSellingPage;
