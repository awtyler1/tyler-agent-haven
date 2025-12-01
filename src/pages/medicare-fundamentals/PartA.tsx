import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const PartA = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main style={{ backgroundColor: '#FDFBF7' }}>
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">Part A — Hospital Insurance</h1>
            <p className="text-xl text-foreground font-medium">
              Understanding inpatient hospital care, skilled nursing, and related services under Medicare Part A.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow">
            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Overview</h2>
              <p className="text-body leading-relaxed mb-4">
                Medicare Part A is often called "Hospital Insurance" because it primarily covers inpatient hospital stays. However, Part A also covers skilled nursing facility care, hospice care, and some home health services. For most beneficiaries, Part A is premium-free because they or their spouse paid Medicare taxes during their working years.
              </p>
              <p className="text-body leading-relaxed mb-4">
                Part A operates on a benefit period system rather than a calendar year. A benefit period begins the day a beneficiary is admitted to a hospital or skilled nursing facility and ends when they have not received inpatient care for 60 consecutive days. Understanding benefit periods is critical when explaining cost-sharing to clients, as deductibles apply per benefit period, not per year.
              </p>
              <p className="text-body leading-relaxed">
                While Part A provides essential coverage for hospital care, it does not cover everything. There are deductibles, coinsurance amounts, and coverage limits that beneficiaries should understand. This is where Medicare Supplement plans or Medicare Advantage plans can help fill the gaps and provide additional financial protection.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow space-y-12">
            
            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-foreground mb-4">Part A Coverage</h3>
              <p className="text-body leading-relaxed mb-4">
                Part A covers inpatient hospital care, including semi-private rooms, meals, general nursing, and necessary services and supplies. This includes surgery, lab tests, X-rays, and medications administered during the hospital stay. Part A also covers intensive care and coronary care units when medically necessary.
              </p>
              <p className="text-body leading-relaxed mb-4">
                Skilled nursing facility (SNF) care is covered under Part A, but only under specific conditions. The beneficiary must have been in the hospital for at least three consecutive days (not counting the day of discharge) and must enter the SNF within 30 days of leaving the hospital. SNF care must be for skilled services, such as physical therapy or intravenous medications, not just custodial care.
              </p>
              <p className="text-body leading-relaxed mb-6">
                Hospice care is also covered under Part A for beneficiaries with a terminal illness and a life expectancy of six months or less. Hospice provides pain relief, symptom management, and support services for the patient and their family. Additionally, Part A covers limited home health services, such as part-time skilled nursing care, physical therapy, and medical social services, when medically necessary.
              </p>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6 mb-4">
                <p className="text-sm font-medium text-gold">Video goes here</p>
              </div>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6">
                <p className="text-sm font-medium text-gold">Downloadable PDF goes here</p>
              </div>
            </div>

            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-foreground mb-4">Premiums & Costs</h3>
              <p className="text-body leading-relaxed mb-4">
                Most Medicare beneficiaries do not pay a premium for Part A because they or their spouse worked and paid Medicare taxes for at least 10 years (40 quarters). If a beneficiary does not qualify for premium-free Part A, they may purchase it by paying a monthly premium. The premium amount varies based on how many quarters they or their spouse worked.
              </p>
              <p className="text-body leading-relaxed mb-4">
                Even though Part A is premium-free for most people, there are still out-of-pocket costs. Beneficiaries are responsible for a deductible each benefit period, which covers the first 60 days of hospital care. After the deductible is met, Part A covers the full cost of hospital care for days 1-60 of a benefit period.
              </p>
              <p className="text-body leading-relaxed mb-6">
                For hospital stays beyond 60 days, beneficiaries are responsible for daily coinsurance amounts. Days 61-90 require a coinsurance payment, and beneficiaries have 60 lifetime reserve days that can be used once the initial 90 days are exhausted. These lifetime reserve days also require a daily coinsurance amount, and once used, they cannot be replenished. Understanding these costs is essential when helping clients evaluate their coverage options.
              </p>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6 mb-4">
                <p className="text-sm font-medium text-gold">Video goes here</p>
              </div>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6">
                <p className="text-sm font-medium text-gold">Downloadable PDF goes here</p>
              </div>
            </div>

            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-foreground mb-4">Benefit Periods</h3>
              <p className="text-body leading-relaxed mb-4">
                A benefit period is a way of measuring a beneficiary's use of Part A services. It begins the day they are admitted as an inpatient in a hospital or skilled nursing facility and ends when they have not received inpatient care for 60 consecutive days. There is no limit to the number of benefit periods a beneficiary can have.
              </p>
              <p className="text-body leading-relaxed mb-4">
                Each benefit period has its own deductible and cost-sharing structure. If a beneficiary is readmitted to the hospital after more than 60 days of no inpatient care, a new benefit period begins, and they must pay the deductible again. This can create significant out-of-pocket costs for beneficiaries with multiple hospitalizations throughout the year.
              </p>
              <p className="text-body leading-relaxed mb-6">
                Understanding benefit periods is crucial when explaining Part A coverage to clients. Many beneficiaries assume that cost-sharing resets on January 1st each year, similar to commercial insurance. Clarifying the benefit period structure helps clients understand their potential costs and the value of supplemental coverage to protect against high out-of-pocket expenses.
              </p>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6 mb-4">
                <p className="text-sm font-medium text-gold">Video goes here</p>
              </div>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6">
                <p className="text-sm font-medium text-gold">Downloadable PDF goes here</p>
              </div>
            </div>

            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-foreground mb-4">Hospital & Skilled Nursing Rules</h3>
              <p className="text-body leading-relaxed mb-4">
                Part A covers hospital inpatient stays when a doctor admits the beneficiary as an inpatient for medically necessary care. Observation status, which is common in hospital emergency departments, does not count as an inpatient admission and is not covered under Part A. This distinction is important because observation stays are billed under Part B, which may result in higher out-of-pocket costs for the beneficiary.
              </p>
              <p className="text-body leading-relaxed mb-4">
                For skilled nursing facility coverage, strict rules apply. The beneficiary must have a qualifying hospital stay of at least three consecutive days (not counting the day of discharge), and the SNF admission must occur within 30 days of leaving the hospital. The care provided must be for skilled services, such as physical therapy, occupational therapy, or skilled nursing care, not custodial care like help with bathing or dressing.
              </p>
              <p className="text-body leading-relaxed mb-6">
                Part A covers the first 20 days of SNF care in full. For days 21-100, the beneficiary is responsible for a daily coinsurance amount. After 100 days, Part A does not cover SNF care, and the beneficiary must pay privately or through Medicaid if eligible. These rules can be confusing for clients, and clear explanations help them understand what is and is not covered.
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
                  <p className="text-body">Part A covers inpatient hospital care, skilled nursing facility care, hospice care, and some home health services.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">Most beneficiaries receive Part A premium-free if they or their spouse paid Medicare taxes for at least 10 years.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">Benefit periods determine cost-sharing for Part A services and reset after 60 days without inpatient care.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">Observation status does not count as an inpatient admission and is covered under Part B, not Part A.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">SNF coverage requires a three-day qualifying hospital stay and must be for skilled services, not custodial care.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">Part A has lifetime reserve days for extended hospital stays, but once used, they cannot be replenished.</p>
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
                When discussing Part A with clients, emphasize that while it is often premium-free, there are still significant out-of-pocket costs through deductibles and coinsurance. Explain the benefit period structure clearly, as many clients assume costs reset annually. Highlight the importance of supplemental coverage, such as Medicare Supplement or Medicare Advantage plans, to protect against high hospital and skilled nursing costs. Understanding Part A is foundational to helping clients make informed coverage decisions.
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

export default PartA;
