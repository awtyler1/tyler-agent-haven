import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const WhatIsMedicare = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main style={{ backgroundColor: '#FDFBF7' }}>
        {/* Hero Section */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">What Is Medicare</h1>
            <p className="text-xl text-foreground font-medium">
              Understanding the federal health insurance program that serves millions of Americans.
            </p>
          </div>
        </section>

        {/* Overview */}
        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow">
            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Overview</h2>
              <p className="text-body leading-relaxed mb-4">
                Medicare is a federal health insurance program established in 1965 under Title XVIII of the Social Security Act. It provides health coverage to Americans aged 65 and older, as well as younger individuals with qualifying disabilities or End-Stage Renal Disease (ESRD). Medicare is administered by the Centers for Medicare & Medicaid Services (CMS), a division of the U.S. Department of Health and Human Services.
              </p>
              <p className="text-body leading-relaxed mb-4">
                Unlike Medicaid, which is a state and federal assistance program for low-income individuals, Medicare is an earned benefit. Most beneficiaries qualify through their work history and payroll tax contributions. Medicare provides a safety net of coverage that ensures access to hospital care, medical services, and prescription drugs for eligible Americans.
              </p>
              <p className="text-body leading-relaxed">
                As a Medicare professional, understanding the structure, eligibility, and purpose of this program is foundational to serving clients effectively and guiding them through their coverage options with confidence.
              </p>
            </div>
          </div>
        </section>

        {/* Core Learning Sections */}
        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow space-y-12">
            
            {/* Medicare Overview */}
            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-foreground mb-4">Medicare Overview</h3>
              <p className="text-body leading-relaxed mb-4">
                Medicare is divided into four parts: Part A (Hospital Insurance), Part B (Medical Insurance), Part C (Medicare Advantage), and Part D (Prescription Drug Coverage). Together, these parts provide comprehensive health coverage for eligible individuals. Part A and Part B are collectively referred to as "Original Medicare."
              </p>
              <p className="text-body leading-relaxed mb-4">
                Medicare Part A covers inpatient hospital stays, skilled nursing facility care, hospice care, and some home health care. Most beneficiaries do not pay a premium for Part A because they or their spouse paid Medicare taxes while working. Part B covers doctor visits, outpatient care, preventive services, and durable medical equipment. Part B requires a monthly premium, which is typically deducted from Social Security benefits.
              </p>
              <p className="text-body leading-relaxed mb-6">
                Medicare Advantage (Part C) and Part D are offered through private insurance companies approved by Medicare. These plans provide additional coverage options and benefits beyond Original Medicare. Understanding how these parts work together is essential for helping clients make informed decisions about their healthcare coverage.
              </p>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6 mb-4">
                <p className="text-sm font-medium text-gold">Video goes here</p>
              </div>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6">
                <p className="text-sm font-medium text-gold">Downloadable PDF goes here</p>
              </div>
            </div>

            {/* Eligibility */}
            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-foreground mb-4">Eligibility</h3>
              <p className="text-body leading-relaxed mb-4">
                Most Americans become eligible for Medicare when they turn 65, regardless of their health status or income. To qualify, individuals must be U.S. citizens or permanent legal residents who have lived in the United States for at least five consecutive years. Additionally, they or their spouse must have worked and paid Medicare taxes for at least 10 years (40 quarters).
              </p>
              <p className="text-body leading-relaxed mb-4">
                Individuals under 65 may qualify for Medicare if they receive Social Security Disability Insurance (SSDI) benefits for 24 consecutive months. After two years of disability benefits, they automatically become eligible for Medicare coverage. Additionally, individuals diagnosed with Amyotrophic Lateral Sclerosis (ALS) receive Medicare immediately upon receiving disability benefits, with no waiting period.
              </p>
              <p className="text-body leading-relaxed mb-6">
                People with End-Stage Renal Disease (ESRD) or permanent kidney failure requiring dialysis or a kidney transplant are also eligible for Medicare, regardless of age. Understanding these eligibility rules helps agents identify clients who qualify and ensure they enroll during the appropriate enrollment periods.
              </p>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6 mb-4">
                <p className="text-sm font-medium text-gold">Video goes here</p>
              </div>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6">
                <p className="text-sm font-medium text-gold">Downloadable PDF goes here</p>
              </div>
            </div>

            {/* Federal Structure */}
            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-foreground mb-4">Federal Structure</h3>
              <p className="text-body leading-relaxed mb-4">
                Medicare is a federally funded program overseen by the Centers for Medicare & Medicaid Services (CMS). CMS establishes the rules, regulations, and guidelines that govern Medicare coverage, benefits, and enrollment. The program is funded primarily through payroll taxes collected under the Federal Insurance Contributions Act (FICA), as well as premiums paid by beneficiaries and general federal revenue.
              </p>
              <p className="text-body leading-relaxed mb-4">
                The structure of Medicare ensures consistency across the country. Unlike Medicaid, which varies by state, Medicare benefits and rules are standardized nationwide. This uniformity allows beneficiaries to move between states without losing coverage or facing significant changes in their benefits. However, provider networks and plan availability may vary by geographic area, especially for Medicare Advantage and Part D plans.
              </p>
              <p className="text-body leading-relaxed mb-6">
                CMS contracts with private insurance companies to offer Medicare Advantage and Part D plans. These companies must follow CMS guidelines and meet strict quality and performance standards. As an agent, you must also comply with CMS marketing and sales regulations to ensure ethical and compliant interactions with beneficiaries.
              </p>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6 mb-4">
                <p className="text-sm font-medium text-gold">Video goes here</p>
              </div>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6">
                <p className="text-sm font-medium text-gold">Downloadable PDF goes here</p>
              </div>
            </div>

            {/* Original Medicare vs Medicaid */}
            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-foreground mb-4">Original Medicare vs Medicaid</h3>
              <p className="text-body leading-relaxed mb-4">
                Medicare and Medicaid are often confused, but they serve different populations and operate under different rules. Medicare is a federal health insurance program for individuals aged 65 and older, as well as certain younger people with disabilities. It is an earned benefit based on work history and payroll tax contributions. Medicaid, on the other hand, is a joint federal and state program that provides health coverage to low-income individuals and families, regardless of age.
              </p>
              <p className="text-body leading-relaxed mb-4">
                Some individuals qualify for both Medicare and Medicaid. These individuals are known as "dual eligibles" and may receive additional benefits and cost assistance through both programs. Medicaid can help pay for Medicare premiums, deductibles, and copayments for those who meet income and asset requirements. Understanding the difference between these programs is critical when working with clients who may qualify for both.
              </p>
              <p className="text-body leading-relaxed mb-6">
                Original Medicare (Part A and Part B) does not cover everything. There are gaps in coverage, such as deductibles, coinsurance, and services not covered by Medicare (like dental, vision, and hearing). This is where Medicare Supplement (Medigap) plans or Medicare Advantage plans come into play, offering additional protection and benefits.
              </p>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6 mb-4">
                <p className="text-sm font-medium text-gold">Video goes here</p>
              </div>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-6">
                <p className="text-sm font-medium text-gold">Downloadable PDF goes here</p>
              </div>
            </div>

            {/* Why Medicare Exists */}
            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-foreground mb-4">Why Medicare Exists</h3>
              <p className="text-body leading-relaxed mb-4">
                Before Medicare was established in 1965, nearly half of all seniors in the United States had no health insurance. Medical costs were a leading cause of financial hardship for older Americans. Medicare was created to provide a safety net of health coverage for seniors, ensuring access to necessary medical care without the burden of unaffordable costs.
              </p>
              <p className="text-body leading-relaxed mb-4">
                The program has evolved significantly since its inception. Initially, Medicare covered only hospital and medical services. Over time, coverage expanded to include prescription drugs (Part D in 2006) and private plan alternatives (Medicare Advantage). Today, Medicare serves over 65 million Americans and continues to adapt to meet the healthcare needs of an aging population.
              </p>
              <p className="text-body leading-relaxed mb-6">
                As a Medicare professional, you play a vital role in helping beneficiaries navigate this complex system. Your expertise ensures that clients understand their options, enroll in the right coverage, and receive the benefits they are entitled to. Medicare exists to protect the health and financial security of seniors, and your work directly supports that mission.
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

        {/* Key Points Summary */}
        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow">
            <div className="bg-cream border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Key Points Summary</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">Medicare is a federal health insurance program for Americans 65+ and certain younger individuals with disabilities or ESRD.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">Part A covers hospital care, Part B covers medical services, Part C is Medicare Advantage, and Part D covers prescription drugs.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">Medicare is an earned benefit based on work history and payroll tax contributions, unlike Medicaid which is need-based.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">Eligibility begins at age 65 for most Americans, or earlier for those receiving disability benefits or diagnosed with ESRD.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">Medicare is standardized nationwide and administered by CMS, ensuring consistent benefits across all states.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-body">Original Medicare has coverage gaps, which is why Medicare Supplement and Medicare Advantage plans exist.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agent Application */}
        <section className="px-6 md:px-12 lg:px-20 pb-12">
          <div className="container-narrow">
            <div className="bg-white border border-[#EAE7E1] rounded-lg p-8 shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)]">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Agent Application</h2>
              <p className="text-body leading-relaxed">
                When meeting with clients, start by confirming their Medicare eligibility and understanding their current situation. Many beneficiaries are unfamiliar with the differences between Original Medicare, Medicare Advantage, and Medigap. Your ability to explain these concepts clearly and confidently builds trust and positions you as an expert advisor. Use simple language, avoid jargon, and always confirm understanding before moving forward. This foundational knowledge is the basis for every appointment and client interaction you will have as a Medicare professional.
              </p>
            </div>
          </div>
        </section>

        {/* Back Button */}
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

export default WhatIsMedicare;
