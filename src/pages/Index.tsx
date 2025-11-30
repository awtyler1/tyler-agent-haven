import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Users, Shield, Handshake, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-6">Tyler Insurance Group</h1>
            <p className="text-body max-w-2xl mx-auto mb-4">A disciplined operating system for agents who take their business seriously.</p>
            <p className="text-muted-foreground text-sm uppercase tracking-widest mb-12">Structure • Standards • Support</p>
            <Link to="/start-here" className="btn-primary-gold inline-flex items-center gap-2 text-lg">Start Here <ArrowRight size={20} /></Link>
          </div>
        </section>

        <section className="section-padding">
          <div className="container-narrow">
            <h2 className="heading-section text-center mb-4">Who We Serve</h2>
            <p className="text-body text-center mb-12 max-w-xl mx-auto">This platform is built for agents who are ready to work.</p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card-premium text-center">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-5"><Users className="w-6 h-6 text-gold" /></div>
                <h3 className="heading-subsection mb-3">New Agents</h3>
                <p className="text-body-small">Clear direction, foundational training, and step-by-step guidance from day one.</p>
              </div>
              <div className="card-premium text-center">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-5"><Shield className="w-6 h-6 text-gold" /></div>
                <h3 className="heading-subsection mb-3">Experienced Agents</h3>
                <p className="text-body-small">Better systems, strong back-office support, and streamlined operations.</p>
              </div>
              <div className="card-premium text-center">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-5"><Handshake className="w-6 h-6 text-gold" /></div>
                <h3 className="heading-subsection mb-3">Those Seeking Structure</h3>
                <p className="text-body-small">A proven framework for agents who want discipline and accountability.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section-padding bg-cream">
          <div className="container-narrow">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
              <div>
                <h2 className="heading-section mb-8">What We Expect From You</h2>
                <ul className="space-y-4">
                  {["Professionalism in every interaction", "Integrity with clients and carriers", "Consistency in your daily activity", "Coachability and willingness to learn", "Client-first mentality at all times", "Accountability for your results"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3"><span className="text-gold font-bold">◆</span><span className="text-body">{item}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="heading-section mb-8">What You Can Expect From Us</h2>
                <ul className="space-y-4">
                  {["Clear systems and processes", "Structured training pathways", "Responsive support team", "Carrier contracting assistance", "Call reviews and coaching", "Leadership opportunities"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3"><span className="text-gold font-bold">◆</span><span className="text-body">{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section-padding">
          <div className="container-narrow text-center">
            <h2 className="heading-section mb-4">Ready to Begin?</h2>
            <p className="text-body max-w-xl mx-auto mb-10">Whether you're new to Medicare or looking for better structure, your path forward starts here.</p>
            <Link to="/start-here" className="btn-primary-gold inline-flex items-center gap-2 text-lg">Start Here <ArrowRight size={20} /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
