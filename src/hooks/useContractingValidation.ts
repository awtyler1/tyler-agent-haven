import { ContractingApplication, Address, SelectedCarrier, Carrier } from '@/types/contracting';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Helper to check if address is complete
const isAddressComplete = (address: Address | null): boolean => {
  if (!address) return false;
  return !!(address.street?.trim() && address.city?.trim() && address.state && address.zip?.trim());
};

// Step 2: Personal Info validation
export const validatePersonalInfo = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  
  if (!app.full_legal_name?.trim()) {
    errors.push('Full legal name is required');
  }
  if (!app.phone_mobile?.trim()) {
    errors.push('Mobile phone is required');
  }
  if (!app.email_address?.trim()) {
    errors.push('Email address is required');
  }
  if (!isAddressComplete(app.home_address as Address)) {
    errors.push('Complete home address is required');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Step 3: Licensing validation
export const validateLicensing = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  
  if (!app.birth_date) {
    errors.push('Date of birth is required');
  }
  if (!app.tax_id?.trim()) {
    errors.push(app.is_corporation ? 'EIN is required' : 'SSN is required');
  }
  if (!app.npn_number?.trim()) {
    errors.push('NPN number is required');
  }
  if (!app.insurance_license_number?.trim()) {
    errors.push('Insurance license number is required');
  }
  if (!app.resident_state) {
    errors.push('Resident state is required');
  }
  if (!app.license_expiration_date) {
    errors.push('License expiration date is required');
  }
  if (!app.uploaded_documents?.insurance_license) {
    errors.push('Insurance license document is required');
  }
  if (!app.uploaded_documents?.government_id) {
    errors.push('Government ID is required');
  }
  if (app.is_corporation && !app.agency_name?.trim()) {
    errors.push('Business name is required for corporations');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Step 4: Legal Questions - Already has acknowledgment validation in component
export const validateLegalQuestions = (app: ContractingApplication, acknowledged: boolean): ValidationResult => {
  const errors: string[] = [];
  
  if (!acknowledged) {
    errors.push('You must acknowledge the attestation');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Step 5: Banking validation
export const validateBanking = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  
  if (!app.beneficiary_name?.trim()) {
    errors.push('Name on account is required');
  }
  if (!app.beneficiary_relationship?.trim()) {
    errors.push('Relationship to you is required');
  }
  if (!app.bank_routing_number?.trim()) {
    errors.push('Routing number is required');
  } else if (!/^\d{9}$/.test(app.bank_routing_number.trim())) {
    errors.push('Routing number must be 9 digits');
  }
  if (!app.bank_account_number?.trim()) {
    errors.push('Account number is required');
  }
  if (!app.uploaded_documents?.voided_check) {
    errors.push('Voided check or bank letter is required');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Step 6: Training - Optional (continue allowed)
export const validateTraining = (_app: ContractingApplication): ValidationResult => {
  return { isValid: true, errors: [] };
};

// Step 7: Carrier Selection validation
export const validateCarrierSelection = (
  app: ContractingApplication, 
  carriers: Carrier[]
): ValidationResult => {
  const errors: string[] = [];
  const selectedCarriers = (app.selected_carriers as SelectedCarrier[]) || [];
  
  if (selectedCarriers.length === 0) {
    errors.push('Please select at least one carrier');
  }
  
  // Check if corporate resolution is needed
  if (app.is_corporation) {
    const needsResolution = selectedCarriers.some(sc => {
      const carrier = carriers.find(c => c.id === sc.carrier_id);
      return carrier?.requires_corporate_resolution;
    });
    
    if (needsResolution && !app.uploaded_documents?.corporate_resolution) {
      errors.push('Corporate resolution is required for your selected carriers');
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

// Step 8: Agreements - Already has validation in component
export const validateAgreements = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  const agreements = (app.agreements as Record<string, boolean>) || {};
  
  const requiredAgreementIds = ['info_accurate', 'receive_emails', 'enter_info', 'facsimile_signature'];
  const missingAgreements = requiredAgreementIds.filter(id => !agreements[id]);
  
  if (missingAgreements.length > 0) {
    errors.push('All required agreements must be accepted');
  }
  if (!app.signature_name?.trim()) {
    errors.push('Signature name is required');
  }
  if (!app.signature_initials?.trim()) {
    errors.push('Initials are required');
  }
  
  return { isValid: errors.length === 0, errors };
};
