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
  // TESTING: All validation disabled for testing purposes
  return { isValid: true, errors: [], fieldErrors: {} };
};

// Step 3: Licensing validation
export const validateLicensing = (app: ContractingApplication): ValidationResult => {
  // TESTING: All validation disabled for testing purposes
  return { isValid: true, errors: [], fieldErrors: {} };
};

// Step 4: Legal Questions validation
export const validateLegalQuestions = (
  app: ContractingApplication, 
  signature: string
): ValidationResult => {
  // TESTING: All validation disabled for testing purposes
  return { isValid: true, errors: [], fieldErrors: {} };
};

// Step 5: Banking validation
export const validateBanking = (app: ContractingApplication): ValidationResult => {
  // TESTING: All validation disabled for testing purposes
  return { isValid: true, errors: [], fieldErrors: {} };
};

// Step 6: Training - E&O required + FINRA validation
export const validateTraining = (app: ContractingApplication): ValidationResult => {
  // TESTING: All validation disabled for testing purposes
  return { isValid: true, errors: [], fieldErrors: {} };
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
  // TESTING: All validation disabled for testing purposes
  return { isValid: true, errors: [], fieldErrors: {} };
};
