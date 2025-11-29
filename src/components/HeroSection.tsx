import { Link } from "react-router-dom";
import tylerLogo from "@/assets/tyler-logo.png";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center pt-20 section-padding bg-background">
      <div className="container-narrow text-center">
        {/* Logo */}
        <div className="mb-12 animate-fade-in">
          <img
            src={tylerLogo}
            alt="Tyler Insurance Group"
            className="h-32 md:h-40 w-auto mx-auto"
          />
        </div>

        {/* Headline */}
        <h1 className="heading-display mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          Welcome to Tyler Insurance Group Agents
        </h1>

        {/* Subheadline */}
        <p 
          className="text-body max-w-2xl mx-auto mb-12 animate-fade-in-up" 
          style={{ animationDelay: "0.2s" }}
        >
          Your hub for contracting, training, tools, and support. One place. Clear steps. No confusion.
        </p>

        {/* CTA Buttons */}
        <div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          <Link to="/contracting" className="btn-primary-gold w-full sm:w-auto text-center">
            Start Contracting
          </Link>
          <Link to="/training" className="btn-outline-gold w-full sm:w-auto text-center">
            Training Portal
          </Link>
          <Link to="/resources" className="btn-outline-gold w-full sm:w-auto text-center">
            Resources & Downloads
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="mt-20 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-gold/50 to-gold mx-auto" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
