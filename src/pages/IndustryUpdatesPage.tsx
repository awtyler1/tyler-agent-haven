import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Calendar, ChevronRight, FileText, TrendingUp, Building2, Package } from "lucide-react";

const categories = [
  { id: "cms", name: "CMS Updates", icon: FileText },
  { id: "carrier", name: "Carrier Updates", icon: Building2 },
  { id: "product", name: "Product Updates", icon: Package },
  { id: "trends", name: "Trend Reports", icon: TrendingUp },
];

const updates = [
  {
    id: 1,
    category: "cms",
    title: "2026 Medicare Parts A & B Premiums and Deductibles",
    date: "2025-11-14",
    excerpt: "Official CMS announcement of 2026 Medicare Part B premiums and deductibles.",
    url: "https://www.cms.gov/newsroom/fact-sheets/2026-medicare-parts-b-premiums-deductibles"
  },
];

const IndustryUpdatesPage = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredUpdates = activeCategory 
    ? updates.filter(u => u.category === activeCategory)
    : updates;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">Industry & Market Updates</h1>
            <p className="text-body max-w-2xl">
              Stay sharp. Stay informed. Know what's changing in the market.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="px-6 md:px-12 lg:px-20 py-8 border-b border-border">
          <div className="container-narrow">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-smooth ${
                  activeCategory === null 
                    ? "bg-gold text-primary-foreground" 
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                All Updates
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-smooth flex items-center gap-2 ${
                    activeCategory === cat.id 
                      ? "bg-gold text-primary-foreground" 
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <cat.icon size={14} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Updates List */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="space-y-4">
              {filteredUpdates.map((update) => (
                <article 
                  key={update.id}
                  className="card-premium flex items-start justify-between gap-4 cursor-pointer group"
                  onClick={() => update.url && window.open(update.url, '_blank')}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-gold">
                        {categories.find(c => c.id === update.category)?.name}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar size={12} />
                        {new Date(update.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    <h3 className="heading-subsection mb-2 group-hover:text-gold transition-smooth">
                      {update.title}
                    </h3>
                    <p className="text-body-small">{update.excerpt}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-gold transition-smooth flex-shrink-0 mt-2" />
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default IndustryUpdatesPage;
