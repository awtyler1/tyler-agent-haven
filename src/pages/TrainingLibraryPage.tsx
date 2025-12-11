import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Video, FileText, Download } from "lucide-react";

const TrainingLibraryPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
        {/* Hero Section */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-4">Training Library</h1>
            <p className="text-xl md:text-2xl text-foreground font-medium max-w-3xl mx-auto">
              Your complete archive of training videos, guides, articles, and documents.
            </p>
          </div>
        </section>

        {/* Video Library Section */}
        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow">
            <div className="bg-white border border-[#E5E2DB] rounded-lg p-8 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] transition-all duration-150">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gold/8 flex items-center justify-center flex-shrink-0">
                  <Video className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">Video Library</h2>
              </div>
              <p className="text-body leading-relaxed mb-6">
                Training videos will be organized here as they become available. Each video will include clear titles, descriptions, and categorization for easy navigation.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div 
                    key={item}
                    className="aspect-video bg-muted/30 rounded-lg border border-[#EAE7E1] flex items-center justify-center"
                  >
                    <span className="text-sm text-muted-foreground">Video Placeholder</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Article Archive Section */}
        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow">
            <div className="bg-white border border-[#E5E2DB] rounded-lg p-8 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] transition-all duration-150">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gold/8 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">Article Archive</h2>
              </div>
              <p className="text-body leading-relaxed mb-6">
                Written articles, educational guides, and leadership content will be published here. Each article will include publication date, category, and estimated reading time.
              </p>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div 
                    key={item}
                    className="p-6 border border-[#EAE7E1] rounded-lg hover:border-gold/30 transition-all duration-200"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-2">Article Title Placeholder</h3>
                    <p className="text-sm text-muted-foreground mb-2">Brief description of the article content will appear here.</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Category</span>
                      <span>•</span>
                      <span>5 min read</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Download Center Section */}
        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow">
            <div className="bg-white border border-[#E5E2DB] rounded-lg p-8 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] transition-all duration-150">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gold/8 flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">Download Center</h2>
              </div>
              <p className="text-body leading-relaxed mb-6">
                All PDFs, guides, cheat sheets, and downloadable worksheets will be organized here by category. Documents will include clear titles, descriptions, and file sizes.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div 
                    key={item}
                    className="p-6 border border-[#E5E2DB] rounded-lg hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded bg-gold/8 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">Document Title</h3>
                        <p className="text-xs text-muted-foreground">PDF • 2.5 MB</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Brief description of the downloadable resource.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Back Button */}
        <section className="pb-16 px-6">
          <div className="container-narrow text-center">
            <Link 
              to="/sales-training"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-gold rounded-lg text-sm font-medium text-gold hover:bg-gold hover:text-white transition-all duration-150"
            >
              Back to Training Hub
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TrainingLibraryPage;
