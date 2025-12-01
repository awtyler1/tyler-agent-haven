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
        { name: "Download SOA (Standard)", file: "/downloads/Scope-of-Appointment_2026.pdf" },
        { name: "Download SOA — Telephonic Version", file: "/downloads/Scope-of-Appointment_2026.pdf" },
        { name: "Download SOA — Spanish", file: "/downloads/Scope-of-Appointment_2026.pdf" }
      ]
    },
    {
      title: "Enrollment & Client Forms",
      description: "Documents used during and after the enrollment process.",
      forms: [
        { name: "HIPAA Authorization Form", file: "#" },
        { name: "Enrollment Worksheet", file: "#" },
        { name: "Plan Comparison Documentation", file: "#" },
        { name: "Star Ratings Disclosure", file: "#" },
        { name: "Statement of Understanding", file: "#" },
        { name: "Prescription Drug Worksheet", file: "#" }
      ]
    },
    {
      title: "Needs Assessment Forms",
      description: "Use these to understand client needs and recommend appropriate coverage.",
      forms: [
        { name: "Medicare Factfinder", file: "/downloads/Fillable_TIG_Medicare_Intake_Form.pdf" },
        { name: "Health & Lifestyle Questionnaire", file: "#" },
        { name: "Chronic Condition Assessment (C-SNP)", file: "/downloads/Blank_Verification_of_Chronic_Condition_VCC.pdf" }
      ]
    },
    {
      title: "CMS Model Forms",
      description: "Official CMS model documents for required disclosures and communications.",
      forms: [
        { name: "CMS Model Enrollment Checklist", file: "#" },
        { name: "CMS Model Drug Coverage Form", file: "#" },
        { name: "CMS Annual Notice Templates", file: "#" },
        { name: "Other CMS Standard Forms", file: "#" }
      ]
    },
    {
      title: "Other Important Documents",
      description: "Commonly used forms for clean, compliant appointments.",
      forms: [
        { name: "Complaint / Grievance Form", file: "#" },
        { name: "Cancellation Request Form", file: "#" },
        { name: "Provider Search Guide", file: "#" }
      ]
    }
  ];

  const quickAccessForms = [
    { name: "SOA (Standard)", file: "/downloads/Scope-of-Appointment_2026.pdf" },
    { name: "HIPAA Form", file: "#" },
    { name: "Enrollment Worksheet", file: "#" },
    { name: "Medicare Factfinder", file: "/downloads/Fillable_TIG_Medicare_Intake_Form.pdf" }
  ];

  const bestPractices = [
    "Complete the SOA before discussing benefits.",
    "Keep a digital and printed copy of required forms.",
    "Use the Enrollment Worksheet to ensure accuracy and avoid corrections.",
    "Review the Star Rating disclosure during the appointment.",
    "Upload completed documents to your CRM or client file."
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1">
        {/* Title Section */}
        <section className="section-padding border-b border-border">
          <div className="container-narrow">
            <h1 className="heading-display text-foreground mb-4">Forms Library</h1>
            <p className="text-xl text-gold font-medium mb-4">
              Essential sales forms and documents for your appointments.
            </p>
            <p className="text-body max-w-3xl">
              Download the forms you need before, during, and after client appointments. These documents support compliant, clean, and professional sales interactions.
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
                  className="h-auto py-4 justify-start border-gold/30 hover:border-gold hover:bg-gold/5"
                >
                  <a href={form.file} download>
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
                <Card key={category.title} className="border-border">
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
                        <a href={form.file} download>
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

        {/* Best Practices */}
        <section className="section-padding border-b border-border bg-cream/10">
          <div className="container-narrow">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-serif font-semibold text-gold mb-6">Best Practices</h2>
              <ul className="space-y-3 mb-6">
                {bestPractices.map((practice, index) => (
                  <li key={index} className="flex items-start text-foreground">
                    <span className="text-gold mr-3 font-bold">•</span>
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground italic border-l-2 border-gold pl-4">
                These forms support compliant, efficient, and professional Medicare appointments.
              </p>
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
