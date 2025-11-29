const standards = [
  "Professionalism",
  "Integrity",
  "Reliability",
  "Respect",
  "Client-first mentality",
];

const support = [
  "Clear direction",
  "Carrier contracting assistance",
  "Call reviews",
  "Appointment guidance",
  "CRM help",
];

const StandardsSection = () => {
  return (
    <section className="section-padding bg-cream">
      <div className="container-narrow">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 mb-16">
          {/* Our Standards */}
          <div>
            <h3 className="heading-subsection text-gold mb-8 text-center md:text-left">
              Our Standards
            </h3>
            <ul className="space-y-3">
              {standards.map((item, index) => (
                <li key={index} className="text-body-small gold-marker">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Our Support */}
          <div>
            <h3 className="heading-subsection text-gold mb-8 text-center md:text-left">
              Our Support
            </h3>
            <ul className="space-y-3">
              {support.map((item, index) => (
                <li key={index} className="text-body-small gold-marker">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Closing Line */}
        <p className="text-body text-center max-w-2xl mx-auto font-serif italic">
          "You bring effort and integrity. We bring systems and support."
        </p>
      </div>
    </section>
  );
};

export default StandardsSection;
