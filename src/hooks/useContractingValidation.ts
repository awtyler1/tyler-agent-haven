import { ContractingApplication, Address, SelectedCarrier, Carrier } from '@/types/contracting';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
}

// Helper to check if address is complete
const isAddressComplete = (address: Address | null): boolean => {
  if (!address) return false;
  return !!(address.street?.trim() && address.city?.trim() && address.state && address.zip?.trim());
};

// Step 2: Personal Info validation
export const validatePersonalInfo = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  
  if (!app.full_legal_name?.trim()) {
    errors.push('Full legal name is required');
    fieldErrors.full_legal_name = 'Required';
  }
  if (!app.phone_mobile?.trim()) {
    errors.push('Mobile phone is required');
    fieldErrors.phone_mobile = 'Required';
  }
  if (!app.email_address?.trim()) {
    errors.push('Email address is required');
    fieldErrors.email_address = 'Required';
  }
  if (!isAddressComplete(app.home_address as Address)) {
    errors.push('Complete home address is required');
    fieldErrors.home_address = 'Complete address required';
  }
  
  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 3: Licensing validation
export const validateLicensing = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  
  if (!app.birth_date) {
    errors.push('Date of birth is required');
    fieldErrors.birth_date = 'Required';
  }
  if (!app.tax_id?.trim()) {
    const msg = app.is_corporation ? 'EIN required' : 'SSN required';
    errors.push(app.is_corporation ? 'EIN is required' : 'SSN is required');
    fieldErrors.tax_id = msg;
  }
  if (!app.npn_number?.trim()) {
    errors.push('NPN number is required');
    fieldErrors.npn_number = 'Required';
  }
  if (!app.insurance_license_number?.trim()) {
    errors.push('Insurance license number is required');
    fieldErrors.insurance_license_number = 'Required';
  }
  if (!app.resident_state) {
    errors.push('Resident state is required');
    fieldErrors.resident_state = 'Required';
  }
  if (!app.license_expiration_date) {
    errors.push('License expiration date is required');
    fieldErrors.license_expiration_date = 'Required';
  }
  if (!app.uploaded_documents?.insurance_license) {
    errors.push('Insurance license document is required');
    fieldErrors.insurance_license = 'Upload required';
  }
  if (!app.uploaded_documents?.government_id) {
    errors.push('Government ID is required');
    fieldErrors.government_id = 'Upload required';
  }
  if (app.is_corporation && !app.agency_name?.trim()) {
    errors.push('Business name is required for corporations');
    fieldErrors.agency_name = 'Required';
  }
  
  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 4: Legal Questions - Already has acknowledgment validation in component
export const validateLegalQuestions = (app: ContractingApplication, acknowledged: boolean): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  
  if (!acknowledged) {
    errors.push('You must acknowledge the attestation');
    fieldErrors.attestation = 'Acknowledgment required';
  }
  
  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 5: Banking validation
export const validateBanking = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  
  if (!app.bank_routing_number?.trim()) {
    errors.push('Routing number is required');
    fieldErrors.bank_routing_number = 'Required';
  } else if (!/^\d{9}$/.test(app.bank_routing_number.trim())) {
    errors.push('Routing number must be 9 digits');
    fieldErrors.bank_routing_number = 'Must be 9 digits';
  }
  if (!app.bank_account_number?.trim()) {
    errors.push('Account number is required');
    fieldErrors.bank_account_number = 'Required';
  }
  if (!app.uploaded_documents?.voided_check) {
    errors.push('Voided check or bank letter is required');
    fieldErrors.voided_check = 'Upload required';
  }
  
  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 6: Training - Optional with FINRA validation
export const validateTraining = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  
  if (app.is_finra_registered) {
    if (!app.finra_broker_dealer_name?.trim()) {
      errors.push('Broker/Dealer name is required');
      fieldErrors.finra_broker_dealer_name = 'Required';
    }
    if (!app.finra_crd_number?.trim()) {
      errors.push('CRD number is required');
      fieldErrors.finra_crd_number = 'Required';
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
    fieldErrors.carriers = 'Select at least one carrier';
  }
  
  // Check if corporate resolution is needed
  if (app.is_corporation) {
    const needsResolution = selectedCarriers.some(sc => {
      const carrier = carriers.find(c => c.id === sc.carrier_id);
      return carrier?.requires_corporate_resolution;
    });
    
    if (needsResolution && !app.uploaded_documents?.corporate_resolution) {
      errors.push('Corporate resolution is required for your selected carriers');
      fieldErrors.corporate_resolution = 'Upload required';
    }
  }
  
  return { isValid: errors.length === 0, errors, fieldErrors };
};

// Step 8: Agreements - Already has validation in component
export const validateAgreements = (app: ContractingApplication): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  const agreements = (app.agreements as Record<string, boolean>) || {};
  
  const requiredAgreementIds = ['info_accurate', 'receive_emails', 'enter_info', 'facsimile_signature'];
  const missingAgreements = requiredAgreementIds.filter(id => !agreements[id]);
  
  if (missingAgreements.length > 0) {
    errors.push('All required agreements must be accepted');
    fieldErrors.agreements = 'All agreements required';
  }
  if (!app.signature_name?.trim()) {
    errors.push('Signature name is required');
    fieldErrors.signature_name = 'Required';
  }
  if (!app.signature_initials?.trim()) {
    errors.push('Initials are required');
    fieldErrors.signature_initials = 'Required';
  }
  
  return { isValid: errors.length === 0, errors, fieldErrors };
};
