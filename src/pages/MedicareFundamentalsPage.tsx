import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FileText, Download, Play, ChevronRight } from "lucide-react";

const topics = [
  {
    id: "what-is-medicare",
    title: "What is Medicare",
    description: "Medicare is a federal health insurance program for people 65 and older, and certain younger people with disabilities or specific conditions.",
    keyPoints: [
      "Federal health insurance program",
      "Primarily for people 65+",
      "Also covers certain disabilities",
      "Administered by CMS"
    ]
  },
  {
    id: "part-a-b",
    title: "Part A and Part B",
    description: "Part A covers hospital insurance while Part B covers medical insurance. Together they form Original Medicare.",
    keyPoints: [
      "Part A: Hospital, skilled nursing, hospice",
      "Part B: Doctor visits, outpatient care, preventive services",
      "Part A is usually premium-free",
      "Part B has monthly premiums"
    ]
  },
  {
    id: "medicare-advantage",
    title: "Medicare Advantage",
    description: "Medicare Advantage (Part C) plans are offered by private insurers as an alternative to Original Medicare, often with additional benefits.",
    keyPoints: [
      "Combines Part A, B, and usually D",
      "Often includes extra benefits",
      "Network-based coverage",
      "Different plan types: HMO, PPO, PFFS"
    ]
  },
  {
    id: "medicare-supplement",
    title: "Medicare Supplement",
    description: "Medigap policies help pay costs that Original Medicare doesn't cover, like copays, coinsurance, and deductibles.",
    keyPoints: [
      "Standardized plans (A through N)",
      "Works alongside Original Medicare",
      "No network restrictions",
      "Guaranteed renewable"
    ]
  },
  {
    id: "part-d",
    title: "Part D",
    description: "Medicare Part D provides prescription drug coverage through private insurers approved by Medicare.",
    keyPoints: [
      "Standalone or included in MA",
      "Formulary-based coverage",
      "Coverage phases and donut hole",
      "Annual enrollment period"
    ]
  },
  {
    id: "lis-medicaid",
    title: "LIS and Medicaid",
    description: "Low-Income Subsidy (Extra Help) and Medicaid provide assistance for those with limited income and resources.",
    keyPoints: [
      "LIS helps with Part D costs",
      "Medicaid: state-run assistance",
      "Dual eligibility considerations",
      "Special enrollment rights"
    ]
  }
];

const MedicareFundamentalsPage = () => {
  const [activeTopic, setActiveTopic] = useState(topics[0].id);
  const currentTopic = topics.find(t => t.id === activeTopic);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">Medicare Fundamentals</h1>
            <p className="text-body max-w-2xl">
              Build your foundation. Master the basics before moving forward.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="grid lg:grid-cols-[280px_1fr] gap-8">
              {/* Sidebar Navigation */}
              <div className="lg:sticky lg:top-28 lg:self-start">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Topics</h3>
                <nav className="space-y-1">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setActiveTopic(topic.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-smooth flex items-center justify-between ${
                        activeTopic === topic.id 
                          ? "bg-gold/10 text-gold border-l-2 border-gold" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className="text-sm font-medium">{topic.title}</span>
                      <ChevronRight size={16} className={activeTopic === topic.id ? "opacity-100" : "opacity-0"} />
                    </button>
                  ))}
                </nav>
              </div>

              {/* Main Content */}
              <div className="animate-fade-in" key={activeTopic}>
                <div className="card-premium">
                  <h2 className="heading-section mb-4">{currentTopic?.title}</h2>
                  <p className="text-body mb-8">{currentTopic?.description}</p>

                  {/* Key Points */}
                  <div className="bg-muted rounded-lg p-6 mb-8">
                    <h3 className="font-medium text-foreground mb-4">Key Points</h3>
                    <ul className="space-y-3">
                      {currentTopic?.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-gold font-bold">◆</span>
                          <span className="text-body-small">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Resources */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <button className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-gold hover:bg-gold/5 transition-smooth text-left">
                      <Play className="w-5 h-5 text-gold" />
                      <div>
                        <p className="font-medium text-foreground text-sm">Watch Video</p>
                        <p className="text-xs text-muted-foreground">Training module</p>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-gold hover:bg-gold/5 transition-smooth text-left">
                      <Download className="w-5 h-5 text-gold" />
                      <div>
                        <p className="font-medium text-foreground text-sm">Download PDF</p>
                        <p className="text-xs text-muted-foreground">One-page summary</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default MedicareFundamentalsPage;
