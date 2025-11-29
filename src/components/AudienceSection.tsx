const AudienceSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-narrow">
        <h2 className="heading-section text-center mb-16">Who This Platform Is For</h2>

        <div className="grid md:grid-cols-2 gap-8 md:gap-16 mb-16">
          {/* New Agents */}
          <div className="card-premium">
            <h3 className="heading-subsection text-gold mb-6">New Agents</h3>
            <ul className="space-y-4">
              <li className="text-body-small gold-marker">Clear step-by-step direction</li>
              <li className="text-body-small gold-marker">Simple scripts and structure</li>
              <li className="text-body-small gold-marker">Support when needed</li>
            </ul>
          </div>

          {/* Experienced Agents */}
          <div className="card-premium">
            <h3 className="heading-subsection text-gold mb-6">Experienced Agents</h3>
            <ul className="space-y-4">
              <li className="text-body-small gold-marker">Better systems</li>
              <li className="text-body-small gold-marker">Strong back-office support</li>
              <li className="text-body-small gold-marker">Clean contracting experience</li>
            </ul>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-body text-center max-w-2xl mx-auto">
          Wherever you are starting, this platform shows you what to do next.
        </p>
      </div>
    </section>
  );
};

export default AudienceSection;
