import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const checklistItems = [
  "Review the Contracting Hub",
  "Submit your carrier contracting",
  "Begin the Day 1–30 Training Pathway",
  "Download core scripts and CRM resources",
  "Reach out through Support if you need help",
];

const StartHereSection = () => {
  return (
    <section className="section-padding bg-cream">
      <div className="container-narrow">
        <div className="max-w-2xl mx-auto">
          <h2 className="heading-section text-center mb-12">Start Here</h2>
          
          <div className="space-y-5 mb-10">
            {checklistItems.map((item, index) => (
              <div 
                key={index} 
                className="flex items-start gap-4 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4 text-gold" />
                </div>
                <p className="text-body">{item}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/contracting" className="btn-primary-gold inline-block">
              Open Contracting Hub
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StartHereSection;
