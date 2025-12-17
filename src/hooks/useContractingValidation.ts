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
  
  if (!app.full_legal_name?.trim()) {
    errors.push('Full legal name is required');
    fieldErrors.full_legal_name = VALIDATION_MESSAGES.required;
  }
  
  if (!app.phone_mobile?.trim()) {
    errors.push('Mobile phone is required');
    fieldErrors.phone_mobile = VALIDATION_MESSAGES.required;
  } else if (!isValidPhone(app.phone_mobile)) {
    errors.push('Invalid phone format');
    fieldErrors.phone_mobile = VALIDATION_MESSAGES.invalidPhone;
  }
  
  if (!app.email_address?.trim()) {
    errors.push('Email address is required');
    fieldErrors.email_address = VALIDATION_MESSAGES.required;
  } else if (!isValidEmail(app.email_address)) {
    errors.push('Invalid email format');
    fieldErrors.email_address = VALIDATION_MESSAGES.invalidEmail;
  }
  
  if (!isAddressComplete(app.home_address as Address)) {
    errors.push('Complete home address is required');
    fieldErrors.home_address = VALIDATION_MESSAGES.addressRequired;
  }
  
  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 3: Licensing validation
export const validateLicensing = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  
  if (!app.birth_date) {
    errors.push('Date of birth is required');
    fieldErrors.birth_date = VALIDATION_MESSAGES.required;
  }
  
  // SSN validation only (no EIN requirement for corporations)
  if (!app.tax_id?.trim()) {
    errors.push('SSN is required');
    fieldErrors.tax_id = VALIDATION_MESSAGES.required;
  } else if (!isValidSSN(app.tax_id)) {
    errors.push('Invalid SSN format');
    fieldErrors.tax_id = VALIDATION_MESSAGES.invalidSSN;
  }
  
  // Driver's License validation (required)
  if (!app.drivers_license_number?.trim()) {
    errors.push('Driver\'s license number is required');
    fieldErrors.drivers_license_number = VALIDATION_MESSAGES.required;
  }
  
  if (!app.drivers_license_state) {
    errors.push('Driver\'s license state is required');
    fieldErrors.drivers_license_state = VALIDATION_MESSAGES.selectRequired;
  }
  
  if (!app.npn_number?.trim()) {
    errors.push('NPN number is required');
    fieldErrors.npn_number = VALIDATION_MESSAGES.required;
  } else if (!/^\d+$/.test(app.npn_number.trim())) {
    errors.push('NPN must be numbers only');
    fieldErrors.npn_number = VALIDATION_MESSAGES.numbersOnly;
  }
  
  if (!app.insurance_license_number?.trim()) {
    errors.push('Insurance license number is required');
    fieldErrors.insurance_license_number = VALIDATION_MESSAGES.required;
  }
  
  if (!app.resident_state) {
    errors.push('Resident state is required');
    fieldErrors.resident_state = VALIDATION_MESSAGES.selectRequired;
  }
  
  // License expiration date - removed as required
  // Government ID upload - removed as required
  
  if (!app.uploaded_documents?.insurance_license) {
    errors.push('Insurance license document is required');
    fieldErrors.insurance_license = VALIDATION_MESSAGES.documentRequired;
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
  const legalQuestions = (app.legal_questions as Record<string, LegalQuestion>) || {};
  
  // Group questions for validation
  const primaryQuestions = LEGAL_QUESTIONS.filter(q => !('isSubQuestion' in q && q.isSubQuestion));
  
  // Check if all primary questions are answered
  const unansweredQuestions = primaryQuestions.filter(q => {
    const answer = legalQuestions[q.id];
    return answer?.answer === undefined || answer?.answer === null;
  });
  
  if (unansweredQuestions.length > 0) {
    errors.push('Please answer all questions');
    unansweredQuestions.forEach(q => {
      fieldErrors[`question_${q.id}`] = VALIDATION_MESSAGES.required;
    });
  }
  
  // Check for missing explanations on Yes answers
  primaryQuestions.forEach(q => {
    const answer = legalQuestions[q.id];
    if (answer?.answer === true) {
      // Check if this question has sub-questions
      const hasSubQuestions = LEGAL_QUESTIONS.some(
        subQ => 'isSubQuestion' in subQ && subQ.isSubQuestion && subQ.id.startsWith(q.id)
      );
      
      if (!hasSubQuestions && !answer.explanation?.trim()) {
        errors.push(`Explanation required for question ${q.id}`);
        fieldErrors[`explanation_${q.id}`] = VALIDATION_MESSAGES.explanationRequired;
      }
    }
  });
  
  // Check sub-questions with Yes answers
  LEGAL_QUESTIONS.filter(q => 'isSubQuestion' in q && q.isSubQuestion).forEach(subQ => {
    const answer = legalQuestions[subQ.id];
    if (answer?.answer === true && !answer.explanation?.trim()) {
      errors.push(`Explanation required for question ${subQ.id}`);
      fieldErrors[`explanation_${subQ.id}`] = VALIDATION_MESSAGES.explanationRequired;
    }
  });
  
  // Check signature
  if (!signature?.trim() || signature.trim().length < 2) {
    errors.push('Signature is required');
    fieldErrors.signature = VALIDATION_MESSAGES.signatureRequired;
  }
  
  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 5: Banking validation
export const validateBanking = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  
  if (!app.bank_routing_number?.trim()) {
    errors.push('Routing number is required');
    fieldErrors.bank_routing_number = VALIDATION_MESSAGES.required;
  } else if (!/^\d{9}$/.test(app.bank_routing_number.trim())) {
    errors.push('Routing number must be 9 digits');
    fieldErrors.bank_routing_number = VALIDATION_MESSAGES.numbersOnly;
  }
  
  if (!app.bank_account_number?.trim()) {
    errors.push('Account number is required');
    fieldErrors.bank_account_number = VALIDATION_MESSAGES.required;
  } else if (!/^\d+$/.test(app.bank_account_number.trim())) {
    errors.push('Account number must be numbers only');
    fieldErrors.bank_account_number = VALIDATION_MESSAGES.numbersOnly;
  }
  
  if (!app.uploaded_documents?.voided_check) {
    errors.push('Voided check or bank letter is required');
    fieldErrors.voided_check = VALIDATION_MESSAGES.documentRequired;
  }
  
  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 6: Training - E&O required + FINRA validation
export const validateTraining = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  
  // E&O Certificate is required
  if (!app.uploaded_documents?.eo_certificate) {
    errors.push('E&O certificate is required');
    fieldErrors.eo_certificate = VALIDATION_MESSAGES.documentRequired;
  }
  
  if (app.is_finra_registered) {
    if (!app.finra_broker_dealer_name?.trim()) {
      errors.push('Broker/Dealer name is required');
      fieldErrors.finra_broker_dealer_name = VALIDATION_MESSAGES.required;
    }
    if (!app.finra_crd_number?.trim()) {
      errors.push('CRD number is required');
      fieldErrors.finra_crd_number = VALIDATION_MESSAGES.required;
    } else if (!/^\d+$/.test(app.finra_crd_number.trim())) {
      errors.push('CRD number must be numbers only');
      fieldErrors.finra_crd_number = VALIDATION_MESSAGES.numbersOnly;
    }
  }
  
  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 7: Carrier Selection validation
export const validateCarrierSelection = (
  app: ContractingApplication, 
  carriers: Carrier[]
): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  const selectedCarriers = (app.selected_carriers as SelectedCarrier[]) || [];
  
  if (selectedCarriers.length === 0) {
    errors.push('Please select at least one carrier');
    fieldErrors.carriers = VALIDATION_MESSAGES.carrierRequired;
  }
  
  // Check if corporate resolution is needed
  if (app.is_corporation) {
    const needsResolution = selectedCarriers.some(sc => {
      const carrier = carriers.find(c => c.id === sc.carrier_id);
      return carrier?.requires_corporate_resolution;
    });
    
    if (needsResolution && !app.uploaded_documents?.corporate_resolution) {
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
  
  const requiredAgreementIds = ['info_accurate', 'receive_emails', 'enter_info', 'facsimile_signature'];
  const missingAgreements = requiredAgreementIds.filter(id => !agreements[id]);
  
  if (missingAgreements.length > 0) {
    errors.push('All required agreements must be accepted');
    fieldErrors.agreements = VALIDATION_MESSAGES.agreementsRequired;
  }
  
  if (!app.signature_name?.trim()) {
    errors.push('Signature name is required');
    fieldErrors.signature_name = VALIDATION_MESSAGES.signatureRequired;
  }
  
  if (!app.signature_initials?.trim()) {
    errors.push('Initials are required');
    fieldErrors.signature_initials = VALIDATION_MESSAGES.required;
  }
  
  return { isValid: errors.length === 0, errors, fieldErrors };
};
