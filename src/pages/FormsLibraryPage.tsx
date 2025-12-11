import { Download } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FormsLibraryPage = () => {
  const formCategories = [
    {
      title: "Scope of Appointment (SOA) Forms",
      description: "Required before discussing Medicare Advantage or Prescription Drug Plans.",
      forms: [
        { name: "Download SOA (Standard)", file: "/downloads/Scope-of-Appointment_2026.pdf" }
      ]
    },
    {
      title: "Needs Assessment Forms",
      description: "Use these to understand client needs and recommend appropriate coverage.",
      forms: [
        { name: "Medicare Factfinder", file: "/downloads/Fillable_TIG_Medicare_Intake_Form.pdf" }
      ]
    },
    {
      title: "CMS Forms",
      description: "Official CMS model documents for required disclosures and communications.",
      forms: [
        { name: "CMS Form L564", file: "/downloads/CMS-40B.pdf" },
        { name: "CMS-40B", file: "/downloads/CMS-40B.pdf" }
      ]
    },
    {
      title: "Other Important Documents",
      description: "Commonly used forms for clean, compliant appointments.",
      forms: [
        { name: "Coming soon", file: "#" },
        { name: "Coming soon", file: "#" },
        { name: "Coming soon", file: "#" }
      ]
    }
  ];

  const quickAccessForms = [
    { name: "SOA (Standard)", file: "/downloads/Scope-of-Appointment_2026.pdf" },
    { name: "CMS-40B", file: "/downloads/CMS-40B.pdf" },
    { name: "CMS Form L564", file: "/downloads/CMS-40B.pdf" },
    { name: "Medicare Factfinder", file: "/downloads/Fillable_TIG_Medicare_Intake_Form.pdf" }
  ];


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="pt-32 pb-8 md:pt-36 md:pb-10 px-6 md:px-12 lg:px-20 bg-background">
          <div className="container-narrow text-center">
            <h1 className="heading-display text-foreground mb-3">Forms Library</h1>
            <p className="text-lg md:text-xl text-foreground font-medium max-w-3xl mx-auto">
              Essential sales forms and documents for your appointments.
            </p>
          </div>
        </section>

        {/* Quick Access Downloads */}
        <section className="section-padding bg-cream/20 border-b border-border">
          <div className="container-narrow">
            <h2 className="text-2xl font-serif font-semibold text-gold mb-6">Quick Access Downloads</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickAccessForms.map((form) => (
                <Button
                  key={form.name}
                  asChild
                  variant="outline"
                  className="h-auto py-4 justify-start border-[#E5E2DB] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-150"
                >
                  <a href={form.file} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2 text-gold" />
                    <span className="font-medium">{form.name}</span>
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Core Form Categories */}
        <section className="section-padding border-b border-border">
          <div className="container-narrow">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {formCategories.map((category) => (
                <Card key={category.title} className="border-[#E5E2DB] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-150">
                  <CardHeader>
                    <CardTitle className="text-xl font-serif text-gold">{category.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {category.forms.map((form) => (
                      <Button
                        key={form.name}
                        asChild
                        variant="ghost"
                        className="w-full justify-start text-left h-auto py-3 hover:bg-cream/30"
                      >
                        <a href={form.file} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2 text-gold flex-shrink-0" />
                          <span>{form.name}</span>
                        </a>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Dashboard Reminder */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-sm text-muted-foreground">
                This page is accessible anytime from the Dashboard tile for fast appointment prep.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FormsLibraryPage;
