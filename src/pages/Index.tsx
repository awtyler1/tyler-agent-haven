import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import StartHereSection from "@/components/StartHereSection";
import AudienceSection from "@/components/AudienceSection";
import PathwaySection from "@/components/PathwaySection";
import QuickLinksSection from "@/components/QuickLinksSection";
import StandardsSection from "@/components/StandardsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HeroSection />
        <StartHereSection />
        <AudienceSection />
        <PathwaySection />
        <QuickLinksSection />
        <StandardsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
