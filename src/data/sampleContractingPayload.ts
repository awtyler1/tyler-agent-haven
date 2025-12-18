// Comprehensive sample contracting application payload for PDF generation testing
// This payload includes all fields with realistic test data

export const sampleContractingPayload = {
  // Personal Information
  full_legal_name: "John Michael Smith",
  birth_date: "1985-06-15",
  birth_city: "Louisville",
  birth_state: "Kentucky",
  gender: "Male",
  tax_id: "123-45-6789",
  
  // Contact Information
  email_address: "john.smith@example.com",
  phone_mobile: "(502) 555-1234",
  phone_home: "(502) 555-5678",
  phone_business: "(502) 555-9012",
  fax: "(502) 555-3456",
  preferred_contact_methods: ["email", "text", "phone"],
  
  // Home Address
  home_address: {
    street1: "123 Main Street",
    street2: "Suite 400",
    city: "Louisville",
    state: "KY",
    zip: "40202"
  },
  
  // Mailing Address
  mailing_address_same_as_home: false,
  mailing_address: {
    street1: "456 Business Park Drive",
    street2: "Building B",
    city: "Lexington",
    state: "KY",
    zip: "40507"
  },
  
  // UPS Address
  ups_address_same_as_home: false,
  ups_address: {
    street1: "789 Shipping Center Blvd",
    street2: "",
    city: "Louisville",
    state: "KY",
    zip: "40203"
  },
  
  // Previous Addresses (last 5 years)
  previous_addresses: [
    {
      street1: "100 Old Home Lane",
      street2: "",
      city: "Frankfort",
      state: "KY",
      zip: "40601",
      from_date: "2018-01-01",
      to_date: "2021-06-30"
    },
    {
      street1: "200 Former Residence Ave",
      street2: "Apt 12",
      city: "Bowling Green",
      state: "KY",
      zip: "42101",
      from_date: "2015-03-15",
      to_date: "2017-12-31"
    }
  ],
  
  // Licensing & Identification
  npn_number: "12345678",
  insurance_license_number: "KY-INS-987654",
  resident_state: "KY",
  resident_license_number: "RL-2024-001234",
  drivers_license_number: "S12-345-678-901",
  drivers_license_state: "KY",
  agency_name: "Smith Insurance Agency LLC",
  agency_tax_id: "98-7654321",
  is_corporation: true,
  
  // Non-Resident States
  non_resident_states: ["TN", "IN", "OH", "WV"],
  
  // FINRA Registration
  is_finra_registered: true,
  finra_broker_dealer_name: "National Securities Corp",
  finra_crd_number: "CRD-123456",
  
  // Legal Questions (all answered "No" for clean submission)
  legal_questions: {
    "1": { answer: "no", explanation: "" },
    "1a": { answer: "no", explanation: "" },
    "1b": { answer: "no", explanation: "" },
    "1c": { answer: "no", explanation: "" },
    "1d": { answer: "no", explanation: "" },
    "1e": { answer: "no", explanation: "" },
    "1f": { answer: "no", explanation: "" },
    "1g": { answer: "no", explanation: "" },
    "1h": { answer: "no", explanation: "" },
    "2": { answer: "no", explanation: "" },
    "2a": { answer: "no", explanation: "" },
    "2b": { answer: "no", explanation: "" },
    "2c": { answer: "no", explanation: "" },
    "2d": { answer: "no", explanation: "" },
    "3": { answer: "no", explanation: "" },
    "4": { answer: "no", explanation: "" },
    "5": { answer: "no", explanation: "" },
    "6": { answer: "no", explanation: "" },
    "7": { answer: "no", explanation: "" },
    "8": { answer: "no", explanation: "" },
    "8a": { answer: "no", explanation: "" },
    "9": { answer: "no", explanation: "" },
    "10": { answer: "no", explanation: "" },
    "11": { answer: "no", explanation: "" },
    "12": { answer: "no", explanation: "" },
    "13": { answer: "no", explanation: "" },
    "14": { answer: "no", explanation: "" },
    "14a": { answer: "no", explanation: "" },
    "14b": { answer: "no", explanation: "" },
    "14c": { answer: "no", explanation: "" },
    "15": { answer: "no", explanation: "" },
    "15a": { answer: "no", explanation: "" },
    "15b": { answer: "no", explanation: "" },
    "15c": { answer: "no", explanation: "" },
    "16": { answer: "no", explanation: "" },
    "17": { answer: "no", explanation: "" },
    "18": { answer: "no", explanation: "" },
    "19": { answer: "no", explanation: "" }
  },
  
  // Disciplinary Entries (empty for clean submission)
  disciplinary_entries: {},
  
  // Banking Information
  bank_routing_number: "083000137",
  bank_account_number: "1234567890123",
  bank_branch_name: "PNC Bank - Louisville Main",
  beneficiary_name: "Jane Elizabeth Smith",
  beneficiary_relationship: "Spouse",
  requesting_commission_advancing: true,
  
  // Training & Certifications
  has_aml_course: true,
  aml_course_name: "AHIP Anti-Money Laundering Certification",
  aml_course_date: "2024-09-15",
  aml_completion_date: "2024-09-15",
  aml_training_provider: "AHIP",
  has_ltc_certification: true,
  state_requires_ce: true,
  
  // E&O Insurance
  eo_provider: "NAPA E&O Insurance",
  eo_policy_number: "EO-2024-789456",
  eo_expiration_date: "2025-12-31",
  eo_not_yet_covered: false,
  
  // Carrier Selection
  selected_carriers: [
    { code: "AETNA", name: "Aetna", non_resident_states: ["TN", "IN"] },
    { code: "HUMANA", name: "Humana", non_resident_states: ["TN", "OH"] },
    { code: "UHC", name: "UnitedHealthcare", non_resident_states: ["KY"] },
    { code: "WELLCARE", name: "Wellcare", non_resident_states: [] },
    { code: "ANTHEM", name: "Anthem", non_resident_states: ["IN", "WV"] },
    { code: "DEVOTED", name: "Devoted Health", non_resident_states: [] }
  ],
  
  // Marketing Consent
  agreements: {
    marketing_consent: true,
    terms_accepted: true,
    privacy_policy_accepted: true,
    electronic_signature_consent: true
  },
  
  // Section Acknowledgments
  section_acknowledgments: {
    personal_info: { acknowledged: true, timestamp: "2024-12-18T10:30:00Z" },
    addresses: { acknowledged: true, timestamp: "2024-12-18T10:32:00Z" },
    licensing: { acknowledged: true, timestamp: "2024-12-18T10:35:00Z" },
    legal_questions: { acknowledged: true, timestamp: "2024-12-18T10:40:00Z" },
    banking: { acknowledged: true, timestamp: "2024-12-18T10:42:00Z" },
    training: { acknowledged: true, timestamp: "2024-12-18T10:45:00Z" },
    carriers: { acknowledged: true, timestamp: "2024-12-18T10:48:00Z" },
    agreements: { acknowledged: true, timestamp: "2024-12-18T10:50:00Z" }
  },
  
  // Signatures
  signature_name: "John Michael Smith",
  signature_date: "2024-12-18T10:52:00Z",
  signature_initials: "JMS",
  
  // Uploaded Documents (base64 placeholder - would be actual base64 in real use)
  uploaded_documents: {
    insurance_license: "contracting-documents/user123/license.pdf",
    voided_check: "contracting-documents/user123/voided_check.jpg",
    aml_certificate: "contracting-documents/user123/aml_cert.pdf",
    ce_certificate: "contracting-documents/user123/ce_cert.pdf",
    ltc_certificate: "contracting-documents/user123/ltc_cert.pdf",
    corporate_resolution: "contracting-documents/user123/corp_resolution.pdf",
    // Base64 signature images (sample placeholder - real would be actual base64)
    initials_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    background_signature_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    signature_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  },
  
  // Application Metadata
  id: "sample-app-uuid-12345",
  user_id: "sample-user-uuid-67890",
  status: "submitted",
  current_step: 9,
  completed_steps: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  created_at: "2024-12-01T09:00:00Z",
  updated_at: "2024-12-18T10:52:00Z",
  submitted_at: "2024-12-18T10:52:00Z"
};

// Alternate sample with "Yes" answers to legal questions for testing explanations
export const sampleContractingPayloadWithDisclosures = {
  ...sampleContractingPayload,
  full_legal_name: "Robert James Wilson",
  birth_date: "1978-03-22",
  email_address: "r.wilson@testinsurance.com",
  
  legal_questions: {
    ...sampleContractingPayload.legal_questions,
    "1": { answer: "yes", explanation: "Minor traffic violation in 2019, fully resolved." },
    "5": { answer: "yes", explanation: "Left previous agency due to relocation in 2020." },
    "15": { answer: "yes", explanation: "Filed Chapter 7 bankruptcy in 2015, discharged 2016." }
  },
  
  disciplinary_entries: {
    entry1: {
      date_of_action: "2019-05-15",
      action: "Traffic Citation",
      reason: "Speeding ticket",
      explanation: "Received speeding ticket, paid fine, no further action required."
    },
    entry2: {
      date_of_action: "2020-08-01",
      action: "Agency Departure",
      reason: "Relocation",
      explanation: "Left previous agency due to family relocation to Kentucky."
    },
    entry3: {
      date_of_action: "2015-11-20",
      action: "Bankruptcy Filing",
      reason: "Medical Debt",
      explanation: "Filed Chapter 7 due to medical expenses, fully discharged in 2016."
    }
  }
};

// Minimal sample for quick testing
export const minimalSamplePayload = {
  full_legal_name: "Test Agent",
  birth_date: "1990-01-01",
  birth_city: "Louisville",
  birth_state: "Kentucky",
  gender: "Male",
  tax_id: "000-00-0000",
  email_address: "test@test.com",
  phone_mobile: "(000) 000-0000",
  preferred_contact_methods: ["email"],
  home_address: {
    street1: "123 Test St",
    city: "Louisville",
    state: "KY",
    zip: "40202"
  },
  mailing_address_same_as_home: true,
  ups_address_same_as_home: true,
  npn_number: "00000000",
  resident_state: "KY",
  is_corporation: false,
  is_finra_registered: false,
  legal_questions: {},
  disciplinary_entries: {},
  bank_routing_number: "000000000",
  bank_account_number: "0000000000",
  bank_branch_name: "Test Bank",
  beneficiary_name: "Test Beneficiary",
  beneficiary_relationship: "Spouse",
  requesting_commission_advancing: false,
  has_aml_course: false,
  has_ltc_certification: false,
  state_requires_ce: false,
  selected_carriers: [],
  agreements: { marketing_consent: false },
  signature_name: "Test Agent",
  signature_date: new Date().toISOString(),
  signature_initials: "TA",
  uploaded_documents: {}
};
