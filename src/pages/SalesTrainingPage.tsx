import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { BookOpen, Phone, Users, UserCheck, RefreshCw, Briefcase, Calendar, Brain, Target, ChevronRight, Download, Play } from "lucide-react";

const modules = [
  { id: "fundamentals", title: "Sales Fundamentals", icon: BookOpen },
  { id: "appointments", title: "Running an Appointment", icon: Users },
  { id: "dialing", title: "Dialing Leads", icon: Phone },
  { id: "seminars", title: "Hosting Seminars", icon: Users },
  { id: "enrolling", title: "Enrolling a Member", icon: UserCheck },
  { id: "followup", title: "Follow Up System", icon: RefreshCw },
  { id: "business", title: "Business Ownership", icon: Briefcase },
  { id: "discipline", title: "Daily Discipline", icon: Calendar },
  { id: "mindset", title: "Mindset Shifts", icon: Brain },
  { id: "expectations", title: "Expectation Setting", icon: Target },
];

const moduleContent: Record<string, { description: string; steps: string[]; resources: string[] }> = {
  fundamentals: {
    description: "Master the core principles of consultative selling in the Medicare space.",
    steps: [
      "Understand the client's needs first",
      "Present solutions, not products",
      "Build trust through transparency",
      "Ask questions, listen actively",
      "Guide the decision, don't push"
    ],
    resources: ["Sales Fundamentals PDF", "Consultative Selling Video"]
  },
  appointments: {
    description: "A structured approach to running effective client appointments.",
    steps: [
      "Prepare materials before the call",
      "Open with rapport building",
      "Conduct needs assessment",
      "Present relevant options",
      "Handle objections professionally",
      "Close with clear next steps"
    ],
    resources: ["Appointment Checklist", "Needs Assessment Template"]
  },
  dialing: {
    description: "Systematic approach to outbound calling that gets results.",
    steps: [
      "Block dedicated dialing time",
      "Use a proven script framework",
      "Track all call outcomes",
      "Set 3-5 appointments per session",
      "Review and improve weekly"
    ],
    resources: ["Dialing Scripts", "Call Tracking Sheet"]
  },
  enrolling: {
    description: "Complete the enrollment process correctly and compliantly.",
    steps: [
      "Verify eligibility",
      "Review SOA requirements",
      "Present plan details clearly",
      "Complete enrollment accurately",
      "Confirm submission",
      "Schedule follow-up"
    ],
    resources: ["Enrollment Checklist", "SOA Templates"]
  },
  followup: {
    description: "Systematic follow-up that converts and retains.",
    steps: [
      "48-hour post-appointment call",
      "Weekly check-in during waiting period",
      "Effective date confirmation",
      "30-day satisfaction check",
      "Annual review scheduling"
    ],
    resources: ["Follow-Up Calendar Template", "Client Retention Guide"]
  },
  discipline: {
    description: "Daily habits that separate top producers from the rest.",
    steps: [
      "Morning routine and planning",
      "Time-blocked activities",
      "Lead generation first",
      "Admin in batches",
      "End-of-day review",
      "Weekly scoreboard review"
    ],
    resources: ["Daily Schedule Template", "Weekly Planning Sheet"]
  },
  mindset: {
    description: "The mental framework for sustained success in sales.",
    steps: [
      "Embrace rejection as data",
      "Focus on activity, not outcomes",
      "Maintain abundance mentality",
      "Continuous learning commitment",
      "Long-term relationship focus"
    ],
    resources: ["Mindset Training Video", "Recommended Reading List"]
  },
  expectations: {
    description: "Set proper expectations for yourself and your clients.",
    steps: [
      "Communicate timelines clearly",
      "Explain the process upfront",
      "Set realistic income expectations",
      "Define success metrics",
      "Create accountability systems"
    ],
    resources: ["Expectation Setting Script", "New Agent Timeline"]
  }
};

const SalesTrainingPage = () => {
  const [activeModule, setActiveModule] = useState(modules[0].id);
  const content = moduleContent[activeModule] || { description: "Content coming soon.", steps: [], resources: [] };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">Sales Training</h1>
            <p className="text-body max-w-2xl">
              Treat sales like mastery. Elevate the craft. Execute with discipline.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="grid lg:grid-cols-[280px_1fr] gap-8">
              {/* Sidebar */}
              <div className="lg:sticky lg:top-28 lg:self-start">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Modules</h3>
                <nav className="space-y-1">
                  {modules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-smooth flex items-center gap-3 ${
                        activeModule === module.id 
                          ? "bg-gold/10 text-gold border-l-2 border-gold" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <module.icon size={16} />
                      <span className="text-sm font-medium">{module.title}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Main Content */}
              <div className="card-premium animate-fade-in" key={activeModule}>
                <h2 className="heading-section mb-4">
                  {modules.find(m => m.id === activeModule)?.title}
                </h2>
                <p className="text-body mb-8">{content.description}</p>

                {content.steps.length > 0 && (
                  <div className="bg-muted rounded-lg p-6 mb-8">
                    <h3 className="font-medium text-foreground mb-4">Step-by-Step</h3>
                    <ol className="space-y-3">
                      {content.steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-gold text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-body-small">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {content.resources.length > 0 && (
                  <div>
                    <h3 className="font-medium text-foreground mb-4">Resources</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {content.resources.map((resource, index) => (
                        <button 
                          key={index}
                          className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-gold hover:bg-gold/5 transition-smooth text-left"
                        >
                          {resource.includes("Video") ? (
                            <Play className="w-5 h-5 text-gold" />
                          ) : (
                            <Download className="w-5 h-5 text-gold" />
                          )}
                          <span className="font-medium text-foreground text-sm">{resource}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SalesTrainingPage;
