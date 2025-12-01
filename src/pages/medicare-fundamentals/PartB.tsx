import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const PartB = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main style={{ backgroundColor: '#FDFBF7' }}>
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">Part B — Medical Insurance</h1>
            <p className="text-xl text-foreground font-medium">
              Understanding outpatient care, doctor visits, and preventive services under Medicare Part B.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow">
            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Overview</h2>
              <p className="text-body leading-relaxed mb-4">
                Medicare Part B is often called "Medical Insurance" because it covers medically necessary services and supplies needed to diagnose or treat a medical condition. Part B includes doctor visits, outpatient care, preventive services, durable medical equipment, and some home health services. Unlike Part A, Part B requires a monthly premium that most beneficiaries pay.
              </p>
              <p className="text-body leading-relaxed mb-4">
                Part B operates on a calendar year basis with an annual deductible. After the deductible is met, Medicare pays 80% of the Medicare-approved amount for covered services, and the beneficiary is responsible for the remaining 20% coinsurance. There is no out-of-pocket maximum under Original Medicare Part B, meaning costs can add up significantly for beneficiaries who require extensive medical care.
              </p>
              <p className="text-body leading-relaxed">
                Understanding Part B is essential for Medicare professionals because it covers the majority of outpatient services that beneficiaries use regularly. Agents must be able to explain premium structures, IRMAA adjustments, and the importance of supplemental coverage to protect clients from high out-of-pocket costs.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow space-y-12">
            
            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-foreground mb-4">Part B Coverage</h3>
              <p className="text-body leading-relaxed mb-4">
                Part B covers a wide range of outpatient services, including doctor visits, specialist consultations, outpatient surgery, and emergency room visits. It also covers lab tests, X-rays, and diagnostic screenings when medically necessary. Part B covers services provided in doctor's offices, outpatient facilities, and hospital outpatient departments.
              </p>
              <p className="text-body leading-relaxed mb-4">
                Preventive services are an important part of Part B coverage. Medicare covers annual wellness visits, screening tests, and vaccines at no cost to the beneficiary when received from a provider who accepts Medicare assignment. Preventive services include mammograms, colonoscopies, cardiovascular screenings, diabetes screenings, and flu shots, among others.
              </p>
              <p className="text-body leading-relaxed mb-6">
                Part B also covers durable medical equipment (DME) such as wheelchairs, walkers, hospital beds, and oxygen equipment when prescribed by a doctor and deemed medically necessary. Ambulance services, mental health services, and some home health services are also covered under Part B. Understanding the breadth of Part B coverage helps agents explain why this part of Medicare is so valuable to beneficiaries.
              </p>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6 mb-4">
                <p className="text-sm font-medium text-gold">Video goes here</p>
              </div>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6">
                <p className="text-sm font-medium text-gold">Downloadable PDF goes here</p>
              </div>
            </div>

            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-foreground mb-4">Premiums & IRMAA</h3>
              <p className="text-body leading-relaxed mb-4">
                All Medicare beneficiaries pay a monthly premium for Part B, which is typically deducted from their Social Security benefits. The standard Part B premium is set annually by CMS, but higher-income beneficiaries may pay more due to an Income-Related Monthly Adjustment Amount (IRMAA).
              </p>
              <p className="text-body leading-relaxed mb-4">
                IRMAA is an additional premium surcharge for beneficiaries whose modified adjusted gross income (MAGI) exceeds certain thresholds. IRMAA is determined based on income from two years prior. For example, 2026 Part B premiums would be based on 2024 income. There are multiple income tiers, each with a corresponding IRMAA surcharge added to the standard Part B premium.
              </p>
              <p className="text-body leading-relaxed mb-6">
                Beneficiaries who experience a life-changing event (such as retirement, divorce, or loss of income) may request a reduction in their IRMAA by filing Form SSA-44 with Social Security. Understanding IRMAA is important because it can significantly increase a beneficiary's out-of-pocket costs, and many clients are unaware of these surcharges until they receive their first Social Security check.
              </p>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6 mb-4">
                <p className="text-sm font-medium text-gold">Video goes here</p>
              </div>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6">
                <p className="text-sm font-medium text-gold">Downloadable PDF goes here</p>
              </div>
            </div>

            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-foreground mb-4">Cost Structure</h3>
              <p className="text-body leading-relaxed mb-4">
                Part B operates with a calendar-year deductible that beneficiaries must meet before Medicare begins paying its share. Once the deductible is met, Medicare pays 80% of the Medicare-approved amount for covered services, and the beneficiary is responsible for the remaining 20% coinsurance. There is no annual out-of-pocket maximum under Original Medicare Part B, which means costs can accumulate throughout the year.
              </p>
              <p className="text-body leading-relaxed mb-4">
                The 20% coinsurance can add up quickly, especially for beneficiaries who require frequent medical care, expensive procedures, or long-term treatments. For example, if a beneficiary has a surgery that costs $50,000, they would be responsible for $10,000 in coinsurance under Part B. This is where Medicare Supplement plans or Medicare Advantage plans provide value by covering or limiting these out-of-pocket costs.
              </p>
              <p className="text-body leading-relaxed mb-6">
                Providers who accept Medicare assignment agree to accept the Medicare-approved amount as full payment. Beneficiaries who see providers that do not accept assignment may face higher costs, as these providers can charge up to 15% more than the Medicare-approved amount. Agents should educate clients about the importance of seeing providers who accept assignment to control costs.
              </p>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6 mb-4">
                <p className="text-sm font-medium text-gold">Video goes here</p>
              </div>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6">
                <p className="text-sm font-medium text-gold">Downloadable PDF goes here</p>
              </div>
            </div>

            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-foreground mb-4">Preventive and Outpatient Care</h3>
              <p className="text-body leading-relaxed mb-4">
                Medicare emphasizes preventive care to help beneficiaries stay healthy and detect health issues early. Part B covers many preventive services at no cost to the beneficiary when received from a provider who accepts Medicare assignment. These services include annual wellness visits, cardiovascular screenings, diabetes screenings, cancer screenings, and vaccines such as the flu shot, pneumonia vaccine, and hepatitis B vaccine.
              </p>
              <p className="text-body leading-relaxed mb-4">
                Outpatient care under Part B includes a wide range of services. This includes outpatient surgery, physical therapy, occupational therapy, speech-language pathology, and mental health services. Part B also covers outpatient hospital services, such as emergency department visits, observation services, and outpatient surgeries performed in a hospital setting.
              </p>
              <p className="text-body leading-relaxed mb-6">
                Understanding the difference between preventive and diagnostic services is important. Preventive services are designed to detect or prevent illness and are often covered at no cost. Diagnostic services, on the other hand, are used to investigate symptoms or diagnose a condition and are subject to the Part B deductible and coinsurance. Agents should help clients understand this distinction to avoid confusion about costs.
              </p>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6 mb-4">
                <p className="text-sm font-medium text-gold">Video goes here</p>
              </div>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6">
                <p className="text-sm font-medium text-gold">Downloadable PDF goes here</p>
              </div>
            </div>

            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-foreground mb-4">Enrollment Timing Challenges</h3>
              <p className="text-body leading-relaxed mb-4">
                Enrolling in Part B at the right time is critical to avoid penalties and coverage gaps. The Initial Enrollment Period (IEP) begins three months before the month of a beneficiary's 65th birthday and extends for three months after. Beneficiaries who do not enroll during their IEP may face a late enrollment penalty unless they qualify for a Special Enrollment Period (SEP).
              </p>
              <p className="text-body leading-relaxed mb-4">
                The Part B late enrollment penalty is 10% of the standard premium for each 12-month period a beneficiary was eligible but did not enroll. This penalty lasts for as long as the beneficiary has Part B, making it a permanent increase in their monthly premium. Agents must educate clients about enrollment rules and the importance of enrolling on time.
              </p>
              <p className="text-body leading-relaxed mb-6">
                Beneficiaries who have employer-sponsored health coverage may delay enrolling in Part B without penalty, as long as the coverage is creditable and the employer has 20 or more employees. When employer coverage ends, they qualify for a Special Enrollment Period to enroll in Part B without penalty. Understanding these rules is essential for agents working with clients who are still employed or covered by a spouse's employer plan.
              </p>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6 mb-4">
                <p className="text-sm font-medium text-gold">Video goes here</p>
              </div>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6">
                <p className="text-sm font-medium text-gold">Downloadable PDF goes here</p>
              </div>
            </div>

          </div>
        </section>

        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow">
            <div className="bg-cream border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Key Points Summary</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">Part B covers outpatient care, doctor visits, preventive services, and durable medical equipment.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">All beneficiaries pay a monthly premium for Part B, with higher-income individuals subject to IRMAA surcharges.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">After meeting the annual deductible, Medicare pays 80% of approved costs, and the beneficiary pays 20% coinsurance.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">Original Medicare Part B has no out-of-pocket maximum, meaning costs can accumulate significantly.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">Preventive services are covered at no cost when received from providers who accept Medicare assignment.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">Late enrollment penalties for Part B are permanent and can significantly increase lifetime costs.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow">
            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Agent Application</h2>
              <p className="text-body leading-relaxed">
                When discussing Part B with clients, emphasize the importance of enrolling on time to avoid permanent penalties. Explain the 80/20 cost-sharing structure and the lack of an out-of-pocket maximum, highlighting why supplemental coverage is valuable. Educate clients about IRMAA and how income affects their premiums. Understanding Part B coverage and costs is essential to helping clients evaluate their options and choose the right plan for their needs.
              </p>
            </div>
          </div>
        </section>

        <section className="pb-16 px-6">
          <div className="container-narrow text-center">
            <Link 
              to="/medicare-fundamentals"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-gold rounded-lg text-sm font-medium text-gold hover:bg-gold hover:text-white transition-all duration-200"
            >
              Back to Medicare Fundamentals
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PartB;
