import { Button } from '@/components/ui/button';
import { Loader2, User } from 'lucide-react';
import { ContractingApplication, Address, LEGAL_QUESTIONS, Carrier } from '@/types/contracting';

interface TestProfile {
  id: string;
  label: string;
  color: string;
  data: Partial<ContractingApplication>;
}

// Generate test initials image
const generateInitialsImage = (initials: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000';
    ctx.font = 'italic 40px serif';
    ctx.fillText(initials, 50, 55);
  }
  return canvas.toDataURL('image/png');
};

// Generate test signature image
const generateSignatureImage = (name: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000';
    ctx.font = 'italic 32px cursive';
    ctx.fillText(name, 20, 60);
  }
  return canvas.toDataURL('image/png');
};

// Create legal questions with distinct answers per profile
const createLegalQuestions = (profileLetter: string, yesCount: number): Record<string, { answer: boolean; explanation?: string }> => {
  const result: Record<string, { answer: boolean; explanation?: string }> = {};
  LEGAL_QUESTIONS.forEach((q, index) => {
    const answer = index < yesCount;
    result[q.id] = {
      answer,
      explanation: answer ? `EXPLANATION_${profileLetter}_Q${q.id}: Test explanation for profile ${profileLetter}` : undefined,
    };
  });
  return result;
};

// Create address with profile-specific values
const createAddress = (profileLetter: string, type: string): Address => ({
  street: `${100 + profileLetter.charCodeAt(0)}${type.toUpperCase()}_ST_${profileLetter}`,
  city: `CITY_${type.toUpperCase()}_${profileLetter}`,
  state: ['KY', 'TN', 'OH', 'IN', 'IL'][profileLetter.charCodeAt(0) - 65] || 'KY',
  zip: `4020${profileLetter.charCodeAt(0) - 64}`,
  county: `COUNTY_${type.toUpperCase()}_${profileLetter}`,
});

// Create section acknowledgments
const createAcknowledgments = (initials: string): Record<string, { acknowledged: boolean; acknowledgedAt: string | null; initials?: string }> => {
  const now = new Date().toISOString();
  return {
    personal: { acknowledged: true, acknowledgedAt: now, initials },
    address: { acknowledged: true, acknowledgedAt: now, initials },
    licensing: { acknowledged: true, acknowledgedAt: now, initials },
    legal: { acknowledged: true, acknowledgedAt: now, initials },
    banking: { acknowledged: true, acknowledgedAt: now, initials },
    training: { acknowledged: true, acknowledgedAt: now, initials },
    carriers: { acknowledged: true, acknowledgedAt: now, initials },
  };
};

// Generate test profiles with distinct values
const generateTestProfiles = (carriers: Carrier[]): TestProfile[] => {
  const profiles: TestProfile[] = [];
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const colors = ['bg-blue-100 text-blue-700 border-blue-300', 'bg-green-100 text-green-700 border-green-300', 'bg-purple-100 text-purple-700 border-purple-300', 'bg-orange-100 text-orange-700 border-orange-300', 'bg-pink-100 text-pink-700 border-pink-300'];
  const genders = ['Male', 'Female', 'Male', 'Female', 'Male'];
  const states = ['KY', 'TN', 'OH', 'IN', 'IL'];
  const nonResidentStates = [['TN'], ['KY', 'OH'], ['IN', 'IL'], ['KY', 'TN', 'OH'], ['IL']];
  const yesAnswerCounts = [0, 1, 2, 3, 0]; // How many legal questions answered YES

  letters.forEach((letter, idx) => {
    const initials = `${letter}${letter}`;
    const fullName = `FIRSTNAME_${letter} LASTNAME_${letter}`;
    const now = new Date().toISOString();
    
    // Select different carriers for each profile
    const selectedCarriers = carriers.slice(idx, idx + 2).map(c => ({
      carrier_id: c.id,
      carrier_name: c.name,
      non_resident_states: nonResidentStates[idx],
    }));

    profiles.push({
      id: letter,
      label: `Profile ${letter}`,
      color: colors[idx],
      data: {
        // Personal Information
        full_legal_name: fullName,
        gender: genders[idx],
        birth_date: `198${idx}-0${idx + 1}-1${idx}`,
        birth_city: `BIRTHCITY_${letter}`,
        birth_state: states[idx],

        // Contact Information
        email_address: `email_${letter.toLowerCase()}@testprofile.com`,
        phone_mobile: `(50${idx}) 111-${letter.charCodeAt(0)}${letter.charCodeAt(0)}${letter.charCodeAt(0)}${letter.charCodeAt(0)}`,
        phone_business: `(50${idx}) 222-${letter.charCodeAt(0)}${letter.charCodeAt(0)}${letter.charCodeAt(0)}${letter.charCodeAt(0)}`,
        phone_home: `(50${idx}) 333-${letter.charCodeAt(0)}${letter.charCodeAt(0)}${letter.charCodeAt(0)}${letter.charCodeAt(0)}`,
        fax: `(50${idx}) 444-${letter.charCodeAt(0)}${letter.charCodeAt(0)}${letter.charCodeAt(0)}${letter.charCodeAt(0)}`,
        preferred_contact_methods: idx % 2 === 0 ? ['email', 'mobile'] : ['email', 'mobile', 'business', 'home', 'fax'],

        // Addresses
        home_address: createAddress(letter, 'home'),
        mailing_address_same_as_home: idx % 2 === 0,
        mailing_address: idx % 2 === 0 ? undefined : createAddress(letter, 'mail'),
        ups_address_same_as_home: idx % 3 === 0,
        ups_address: idx % 3 === 0 ? undefined : createAddress(letter, 'ups'),

        // Licensing & Identification
        npn_number: `NPN_${letter}_${1000000 + idx}`,
        insurance_license_number: `LIC_${letter}_${states[idx]}${100000 + idx}`,
        tax_id: `${idx}${idx}${idx}-${idx}${idx}-${idx}${idx}${idx}${idx}`,
        agency_name: idx % 2 === 0 ? `AGENCY_${letter}_LLC` : undefined,
        agency_tax_id: idx % 2 === 0 ? `${idx}${idx}-${idx}${idx}${idx}${idx}${idx}${idx}${idx}` : undefined,
        resident_license_number: `RESLIC_${letter}_${100000 + idx}`,
        resident_state: states[idx],
        drivers_license_number: `DL_${letter}_${letter}${idx}${idx}${idx}${idx}${idx}${idx}`,
        drivers_license_state: states[idx],

        // Legal Questions
        legal_questions: createLegalQuestions(letter, yesAnswerCounts[idx]),

        // Banking & Direct Deposit
        bank_routing_number: `${idx}${idx}${idx}${idx}${idx}${idx}${idx}${idx}${idx}`,
        bank_account_number: `ACCT_${letter}_${idx}${idx}${idx}${idx}${idx}${idx}`,
        bank_branch_name: `BANK_${letter}_BRANCH_${states[idx]}`,
        beneficiary_name: `BENEFICIARY_${letter}`,
        beneficiary_relationship: ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'][idx],
        // Profiles A, C, E = true (Yes), B, D = false (No) - always explicit boolean
        requesting_commission_advancing: idx % 2 === 0 ? true : false,

        // Training & Certifications
        has_aml_course: idx !== 2, // Profile C has no AML
        aml_course_name: idx !== 2 ? `AMLCOURSE_${letter}` : undefined,
        aml_course_date: idx !== 2 ? `2024-0${idx + 1}-15` : undefined,
        aml_training_provider: idx !== 2 ? `PROVIDER_${letter}` : undefined,
        aml_completion_date: idx !== 2 ? `2024-0${idx + 1}-15` : undefined,
        has_ltc_certification: idx % 2 === 1,
        state_requires_ce: idx !== 4,

        // E&O Insurance
        eo_not_yet_covered: idx === 4, // Profile E has no E&O yet
        eo_provider: idx !== 4 ? `EOPROVIDER_${letter}` : undefined,
        eo_policy_number: idx !== 4 ? `EOPOL_${letter}_${10000 + idx}` : undefined,
        eo_expiration_date: idx !== 4 ? `2025-1${Math.min(idx, 2)}-${20 + idx}` : undefined, // Valid dates only

        // FINRA Registration
        is_finra_registered: idx % 2 === 1,
        finra_broker_dealer_name: idx % 2 === 1 ? `FINRADEALER_${letter}` : undefined,
        finra_crd_number: idx % 2 === 1 ? `CRD_${letter}_${100000 + idx}` : undefined,

        // Carrier Selection
        selected_carriers: selectedCarriers,
        is_corporation: idx % 2 === 0,
        non_resident_states: nonResidentStates[idx],

        // Signatures & Acknowledgments
        signature_initials: initials,
        signature_name: fullName,
        signature_date: now,
        section_acknowledgments: createAcknowledgments(initials),

        // Agreements
        agreements: {
          marketing_consent: idx !== 3, // Profile D opts out
          terms_accepted: true,
          privacy_accepted: true,
        },

        // Disciplinary/Action History entries (new dedicated namespace)
        disciplinary_entries: {
          ...(yesAnswerCounts[idx] >= 1 ? {
            entry1: {
              date_of_action: `202${idx}-0${idx + 1}-1${Math.min(idx, 5)}`,
              action: `ACTION_ENTRY1_${letter}`,
              reason: `REASON_ENTRY1_${letter}`,
              explanation: `EXPLANATION_ENTRY1_${letter}: Detailed explanation for first disciplinary action.`,
            },
          } : {}),
          ...(yesAnswerCounts[idx] >= 2 ? {
            entry2: {
              date_of_action: `202${idx}-0${Math.min(idx + 2, 9)}-1${Math.min(idx + 5, 8)}`,
              action: `ACTION_ENTRY2_${letter}`,
              reason: `REASON_ENTRY2_${letter}`,
              explanation: `EXPLANATION_ENTRY2_${letter}: Detailed explanation for second disciplinary action.`,
            },
          } : {}),
          ...(yesAnswerCounts[idx] >= 3 ? {
            entry3: {
              date_of_action: `202${idx}-0${Math.min(idx + 3, 9)}-0${idx + 1}`,
              action: `ACTION_ENTRY3_${letter}`,
              reason: `REASON_ENTRY3_${letter}`,
              explanation: `EXPLANATION_ENTRY3_${letter}: Detailed explanation for third disciplinary action.`,
            },
          } : {}),
        },

        // Uploaded Documents (signatures only, no background explanation fields)
        uploaded_documents: {
          initials_image: generateInitialsImage(initials),
          signature_image: generateSignatureImage(fullName),
          background_signature_image: generateSignatureImage(fullName),
        },
      },
    });
  });

  return profiles;
};

interface TestProfileHarnessProps {
  carriers: Carrier[];
  onFillProfile: (data: Partial<ContractingApplication>) => void;
  loading?: boolean;
}

export function TestProfileHarness({ carriers, onFillProfile, loading }: TestProfileHarnessProps) {
  const profiles = generateTestProfiles(carriers);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {profiles.map((profile) => (
        <Button
          key={profile.id}
          variant="outline"
          size="sm"
          onClick={() => onFillProfile(profile.data)}
          disabled={loading || carriers.length === 0}
          className={`gap-1 text-xs h-7 px-2 border ${profile.color}`}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <User className="h-3 w-3" />
          )}
          {profile.label}
        </Button>
      ))}
    </div>
  );
}
