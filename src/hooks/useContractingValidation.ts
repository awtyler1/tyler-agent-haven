import { ContractingApplication, Address, SelectedCarrier, Carrier, LegalQuestion, LEGAL_QUESTIONS } from '@/types/contracting';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
}

// Validation messages - Apple-style, calm and direct
export const VALIDATION_MESSAGES = {
  required: 'This field is required.',
  invalidEmail: 'Please enter a valid format.',
  invalidPhone: 'Please enter a valid format.',
  invalidSSN: 'Please enter a valid format.',
  invalidEIN: 'Please enter a valid format.',
  explanationRequired: 'An explanation is required.',
  documentRequired: 'Please upload the required document.',
  numbersOnly: 'Numbers only.',
  invalidDate: 'Please enter a valid date.',
  selectRequired: 'Please make a selection.',
  addressRequired: 'Please complete all address fields.',
  agreementsRequired: 'Please accept all required agreements.',
  signatureRequired: 'Your signature is required.',
  carrierRequired: 'Please select at least one carrier.',
};

// Helper to check if address is complete
const isAddressComplete = (address: Address | null): boolean => {
  if (!address) return false;
  return !!(address.street?.trim() && address.city?.trim() && address.state && address.zip?.trim());
};

// Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (US format)
const isValidPhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10;
};

// SSN validation (9 digits)
const isValidSSN = (ssn: string): boolean => {
  const digitsOnly = ssn.replace(/\D/g, '');
  return digitsOnly.length === 9;
};

// EIN validation (9 digits)
const isValidEIN = (ein: string): boolean => {
  const digitsOnly = ein.replace(/\D/g, '');
  return digitsOnly.length === 9;
};

// Step 2: Personal Info validation
export const validatePersonalInfo = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // Full legal name required
  if (!app.full_legal_name?.trim()) {
    errors.push('Full legal name is required');
    fieldErrors.full_legal_name = VALIDATION_MESSAGES.required;
  }

  // Email required and valid
  if (!app.email_address?.trim()) {
    errors.push('Email address is required');
    fieldErrors.email_address = VALIDATION_MESSAGES.required;
  } else if (!isValidEmail(app.email_address)) {
    errors.push('Email address is invalid');
    fieldErrors.email_address = VALIDATION_MESSAGES.invalidEmail;
  }

  // Mobile phone required and valid
  if (!app.phone_mobile?.trim()) {
    errors.push('Mobile phone is required');
    fieldErrors.phone_mobile = VALIDATION_MESSAGES.required;
  } else if (!isValidPhone(app.phone_mobile)) {
    errors.push('Mobile phone is invalid');
    fieldErrors.phone_mobile = VALIDATION_MESSAGES.invalidPhone;
  }

  // Tax ID (SSN) required and valid
  if (!app.tax_id?.trim()) {
    errors.push('Tax ID/SSN is required');
    fieldErrors.tax_id = VALIDATION_MESSAGES.required;
  } else if (!isValidSSN(app.tax_id)) {
    errors.push('Tax ID/SSN is invalid');
    fieldErrors.tax_id = VALIDATION_MESSAGES.invalidSSN;
  }

  // Birth date required
  if (!app.birth_date) {
    errors.push('Birth date is required');
    fieldErrors.birth_date = VALIDATION_MESSAGES.required;
  }

  // Birth city required
  if (!app.birth_city?.trim()) {
    errors.push('Birth city is required');
    fieldErrors.birth_city = VALIDATION_MESSAGES.required;
  }

  // Birth state required
  if (!app.birth_state?.trim()) {
    errors.push('Birth state is required');
    fieldErrors.birth_state = VALIDATION_MESSAGES.required;
  }

  // Home address completeness
  if (!isAddressComplete(app.home_address as Address | null)) {
    errors.push('Home address is incomplete');
    fieldErrors.home_address = VALIDATION_MESSAGES.addressRequired;
  }

  // Mailing address if not same as home
  if (!app.mailing_address_same_as_home && !isAddressComplete(app.mailing_address as Address | null)) {
    errors.push('Mailing address is incomplete');
    fieldErrors.mailing_address = VALIDATION_MESSAGES.addressRequired;
  }

  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 3: Licensing validation
export const validateLicensing = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // NPN number required
  if (!app.npn_number?.trim()) {
    errors.push('NPN number is required');
    fieldErrors.npn_number = VALIDATION_MESSAGES.required;
  }

  // Resident license number required
  if (!app.resident_license_number?.trim()) {
    errors.push('Resident license number is required');
    fieldErrors.resident_license_number = VALIDATION_MESSAGES.required;
  }

  // Resident state required
  if (!app.resident_state?.trim()) {
    errors.push('Resident state is required');
    fieldErrors.resident_state = VALIDATION_MESSAGES.selectRequired;
  }

  // License expiration date required
  if (!app.license_expiration_date) {
    errors.push('License expiration date is required');
    fieldErrors.license_expiration_date = VALIDATION_MESSAGES.required;
  }

  // Driver's license number required
  if (!app.drivers_license_number?.trim()) {
    errors.push("Driver's license number is required");
    fieldErrors.drivers_license_number = VALIDATION_MESSAGES.required;
  }

  // Driver's license state required
  if (!app.drivers_license_state?.trim()) {
    errors.push("Driver's license state is required");
    fieldErrors.drivers_license_state = VALIDATION_MESSAGES.selectRequired;
  }

  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 4: Legal Questions validation
export const validateLegalQuestions = (
  app: ContractingApplication,
  signature: string
): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  const legalAnswers = (app.legal_questions as Record<string, LegalQuestion>) || {};

  // Check that all LEGAL_QUESTIONS have answers
  for (const question of LEGAL_QUESTIONS) {
    const answer = legalAnswers[question.id];

    // Check if question has an answer
    if (!answer || answer.answer === undefined || answer.answer === null) {
      errors.push(`Question ${question.id} requires an answer`);
      fieldErrors[`legal_question_${question.id}`] = VALIDATION_MESSAGES.required;
    } else if (answer.answer === true && !answer.explanation?.trim()) {
      // "Yes" answers require explanations
      errors.push(`Question ${question.id} requires an explanation`);
      fieldErrors[`legal_question_${question.id}_explanation`] = VALIDATION_MESSAGES.explanationRequired;
    }
  }

  // Signature required
  if (!signature?.trim()) {
    errors.push('Signature is required');
    fieldErrors.legal_signature = VALIDATION_MESSAGES.signatureRequired;
  }

  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 5: Banking validation
export const validateBanking = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // Bank routing number required and must be 9 digits
  if (!app.bank_routing_number?.trim()) {
    errors.push('Bank routing number is required');
    fieldErrors.bank_routing_number = VALIDATION_MESSAGES.required;
  } else {
    const digitsOnly = app.bank_routing_number.replace(/\D/g, '');
    if (digitsOnly.length !== 9) {
      errors.push('Bank routing number must be 9 digits');
      fieldErrors.bank_routing_number = VALIDATION_MESSAGES.numbersOnly;
    }
  }

  // Bank account number required
  if (!app.bank_account_number?.trim()) {
    errors.push('Bank account number is required');
    fieldErrors.bank_account_number = VALIDATION_MESSAGES.required;
  }

  // Bank branch name required
  if (!app.bank_branch_name?.trim()) {
    errors.push('Bank branch name is required');
    fieldErrors.bank_branch_name = VALIDATION_MESSAGES.required;
  }

  // Beneficiary name required
  if (!app.beneficiary_name?.trim()) {
    errors.push('Beneficiary name is required');
    fieldErrors.beneficiary_name = VALIDATION_MESSAGES.required;
  }

  // Beneficiary relationship required
  if (!app.beneficiary_relationship?.trim()) {
    errors.push('Beneficiary relationship is required');
    fieldErrors.beneficiary_relationship = VALIDATION_MESSAGES.required;
  }

  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 6: Training - E&O required + FINRA validation
export const validateTraining = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  const uploadedDocs = (app.uploaded_documents as Record<string, string>) || {};

  // E&O insurance document required
  if (!uploadedDocs.eo_insurance) {
    errors.push('E&O insurance document is required');
    fieldErrors.eo_insurance = VALIDATION_MESSAGES.documentRequired;
  }

  // If FINRA registered, require broker dealer name and CRD number
  if (app.is_finra_registered) {
    if (!app.finra_broker_dealer_name?.trim()) {
      errors.push('FINRA broker dealer name is required');
      fieldErrors.finra_broker_dealer_name = VALIDATION_MESSAGES.required;
    }
    if (!app.finra_crd_number?.trim()) {
      errors.push('FINRA CRD number is required');
      fieldErrors.finra_crd_number = VALIDATION_MESSAGES.required;
    }
  }

  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 7: Carrier Selection validation (carrier selection removed from wizard)
export const validateCarrierSelection = (
  app: ContractingApplication,
  carriers: Carrier[]
): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  
  // Carrier selection removed from wizard - no longer required
  // Keep corporate resolution check for future use if needed
  if (app.is_corporation && app.uploaded_documents?.corporate_resolution === undefined) {
    const selectedCarriers = (app.selected_carriers as SelectedCarrier[]) || [];
    const needsResolution = selectedCarriers.some(sc => {
      const carrier = carriers.find(c => c.id === sc.carrier_id);
      return carrier?.requires_corporate_resolution;
    });

    if (needsResolution) {
      errors.push('Corporate resolution is required for your selected carriers');
      fieldErrors.corporate_resolution = VALIDATION_MESSAGES.documentRequired;
    }
  }

  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 8: Agreements validation
export const validateAgreements = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  const agreements = (app.agreements as Record<string, boolean>) || {};

  // Terms of service required
  if (!agreements.terms_of_service) {
    errors.push('Terms of service agreement is required');
    fieldErrors.terms_of_service = VALIDATION_MESSAGES.agreementsRequired;
  }

  // Privacy policy required
  if (!agreements.privacy_policy) {
    errors.push('Privacy policy agreement is required');
    fieldErrors.privacy_policy = VALIDATION_MESSAGES.agreementsRequired;
  }

  // Compliance agreement required
  if (!agreements.compliance_agreement) {
    errors.push('Compliance agreement is required');
    fieldErrors.compliance_agreement = VALIDATION_MESSAGES.agreementsRequired;
  }

  // Signature name required
  if (!app.signature_name?.trim()) {
    errors.push('Signature is required');
    fieldErrors.signature_name = VALIDATION_MESSAGES.signatureRequired;
  }

  return { isValid: errors.length === 0, errors, fieldErrors };
};
