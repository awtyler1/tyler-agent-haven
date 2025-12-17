import { useState, useCallback, useRef } from 'react';
import { ContractingApplication, Address, SelectedCarrier, Carrier, LegalQuestion, LEGAL_QUESTIONS } from '@/types/contracting';
import { SectionStatus } from '@/components/contracting/ContractingForm';

export interface FieldError {
  field: string;
  message: string;
  sectionId: string;
}

export interface SectionValidation {
  sectionId: string;
  sectionName: string;
  isValid: boolean;
  errors: FieldError[];
  needsAcknowledgment: boolean;
}

export interface ValidationState {
  isValidating: boolean;
  hasValidated: boolean;
  isFormValid: boolean;
  fieldErrors: Record<string, string>;
  sectionErrors: Record<string, SectionValidation>;
  firstErrorSection: string | null;
  firstErrorField: string | null;
}

// Validation messages - calm, neutral, factual (Apple-inspired tone)
const MESSAGES = {
  required: 'This field is required.',
  invalidEmail: 'Please enter a valid email address.',
  invalidPhone: 'Please enter a valid phone number.',
  invalidSSN: 'Please enter a valid format.',
  invalidEIN: 'Please enter a valid format.',
  explanationRequired: 'Please provide a brief explanation.',
  documentRequired: 'Please upload the required document.',
  numbersOnly: 'Numbers only.',
  invalidDate: 'Please enter a valid date.',
  selectRequired: 'Please make a selection.',
  addressIncomplete: 'Please complete all address fields.',
  signatureRequired: 'Please sign to continue.',
  carrierRequired: 'Please select at least one carrier.',
  initialsRequired: 'Please draw your initials.',
  sectionNeedsAcknowledgment: 'Please confirm this section.',
  backgroundSignatureRequired: 'Please sign to confirm.',
  invalidRouting: 'Please enter a valid 9-digit routing number.',
};

// Helpers
const isAddressComplete = (address: Address | null | undefined): boolean => {
  if (!address) return false;
  const addr = address as Address;
  return !!(addr.street?.trim() && addr.city?.trim() && addr.state && addr.zip?.trim());
};

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone: string): boolean => phone.replace(/\D/g, '').length === 10;
const isValidSSN = (ssn: string): boolean => ssn.replace(/\D/g, '').length === 9;

export function useFormValidation() {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    hasValidated: false,
    isFormValid: true,
    fieldErrors: {},
    sectionErrors: {},
    firstErrorSection: null,
    firstErrorField: null,
  });

  const clearValidation = useCallback(() => {
    setValidationState({
      isValidating: false,
      hasValidated: false,
      isFormValid: true,
      fieldErrors: {},
      sectionErrors: {},
      firstErrorSection: null,
      firstErrorField: null,
    });
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setValidationState(prev => {
      const { [fieldName]: _, ...restErrors } = prev.fieldErrors;
      
      // Also update section errors - recalculate section validity based on remaining errors
      const updatedSectionErrors = { ...prev.sectionErrors };
      Object.keys(updatedSectionErrors).forEach(sectionId => {
        const section = updatedSectionErrors[sectionId];
        // Remove the cleared field from section errors
        const remainingErrors = section.errors.filter(e => e.field !== fieldName);
        updatedSectionErrors[sectionId] = {
          ...section,
          errors: remainingErrors,
          isValid: remainingErrors.length === 0,
        };
      });
      
      // Recalculate overall form validity
      const isFormValid = Object.keys(restErrors).length === 0;
      
      return {
        ...prev,
        fieldErrors: restErrors,
        sectionErrors: updatedSectionErrors,
        isFormValid,
      };
    });
  }, []);

  const validateForm = useCallback((
    application: ContractingApplication,
    sectionStatuses: Record<string, SectionStatus>,
    carriers: Carrier[]
  ): ValidationState => {
    const fieldErrors: Record<string, string> = {};
    const sectionErrors: Record<string, SectionValidation> = {};
    let firstErrorSection: string | null = null;
    let firstErrorField: string | null = null;

    // Track first error by section order
    const sectionOrder = ['initials', 'personal', 'address', 'licensing', 'legal', 'banking', 'training', 'carriers', 'signature'];
    
    const addError = (field: string, message: string, sectionId: string) => {
      fieldErrors[field] = message;
      // Only set first error if this section comes before the current first error section
      if (!firstErrorSection || sectionOrder.indexOf(sectionId) < sectionOrder.indexOf(firstErrorSection)) {
        firstErrorField = field;
        firstErrorSection = sectionId;
      }
    };

    const uploadedDocs = (application.uploaded_documents || {}) as Record<string, string>;

    // ========== INITIALS SECTION ==========
    const initialsErrors: FieldError[] = [];
    if (!application.signature_initials?.trim()) {
      addError('signature_initials', MESSAGES.initialsRequired, 'initials');
      initialsErrors.push({ field: 'signature_initials', message: MESSAGES.initialsRequired, sectionId: 'initials' });
    }
    if (!uploadedDocs.initials_image) {
      addError('initials_image', MESSAGES.initialsRequired, 'initials');
      initialsErrors.push({ field: 'initials_image', message: MESSAGES.initialsRequired, sectionId: 'initials' });
    }
    sectionErrors['initials'] = {
      sectionId: 'initials',
      sectionName: 'Get Started',
      isValid: initialsErrors.length === 0,
      errors: initialsErrors,
      needsAcknowledgment: false,
    };

    // ========== PERSONAL INFO SECTION ==========
    const personalErrors: FieldError[] = [];
    if (!application.full_legal_name?.trim()) {
      addError('full_legal_name', MESSAGES.required, 'personal');
      personalErrors.push({ field: 'full_legal_name', message: MESSAGES.required, sectionId: 'personal' });
    }
    if (!application.gender) {
      addError('gender', MESSAGES.selectRequired, 'personal');
      personalErrors.push({ field: 'gender', message: MESSAGES.selectRequired, sectionId: 'personal' });
    }
    if (!application.phone_mobile?.trim()) {
      addError('phone_mobile', MESSAGES.required, 'personal');
      personalErrors.push({ field: 'phone_mobile', message: MESSAGES.required, sectionId: 'personal' });
    } else if (!isValidPhone(application.phone_mobile)) {
      addError('phone_mobile', MESSAGES.invalidPhone, 'personal');
      personalErrors.push({ field: 'phone_mobile', message: MESSAGES.invalidPhone, sectionId: 'personal' });
    }
    if (!application.email_address?.trim()) {
      addError('email_address', MESSAGES.required, 'personal');
      personalErrors.push({ field: 'email_address', message: MESSAGES.required, sectionId: 'personal' });
    } else if (!isValidEmail(application.email_address)) {
      addError('email_address', MESSAGES.invalidEmail, 'personal');
      personalErrors.push({ field: 'email_address', message: MESSAGES.invalidEmail, sectionId: 'personal' });
    }
    
    // Check section acknowledgment
    const personalAck = !sectionStatuses['personal']?.acknowledged;
    if (personalAck) {
      addError('personal_ack', MESSAGES.sectionNeedsAcknowledgment, 'personal');
      personalErrors.push({ field: 'personal_ack', message: MESSAGES.sectionNeedsAcknowledgment, sectionId: 'personal' });
    }
    sectionErrors['personal'] = {
      sectionId: 'personal',
      sectionName: 'Personal Information',
      isValid: personalErrors.length === 0,
      errors: personalErrors,
      needsAcknowledgment: personalAck,
    };

    // ========== ADDRESS SECTION ==========
    const addressErrors: FieldError[] = [];
    if (!isAddressComplete(application.home_address as Address)) {
      addError('home_address', MESSAGES.addressIncomplete, 'address');
      addressErrors.push({ field: 'home_address', message: MESSAGES.addressIncomplete, sectionId: 'address' });
    }
    const addressAck = !sectionStatuses['address']?.acknowledged;
    if (addressAck) {
      addError('address_ack', MESSAGES.sectionNeedsAcknowledgment, 'address');
      addressErrors.push({ field: 'address_ack', message: MESSAGES.sectionNeedsAcknowledgment, sectionId: 'address' });
    }
    sectionErrors['address'] = {
      sectionId: 'address',
      sectionName: 'Addresses',
      isValid: addressErrors.length === 0,
      errors: addressErrors,
      needsAcknowledgment: addressAck,
    };

    // ========== LICENSING SECTION ==========
    const licensingErrors: FieldError[] = [];
    if (!application.birth_date) {
      addError('birth_date', MESSAGES.required, 'licensing');
      licensingErrors.push({ field: 'birth_date', message: MESSAGES.required, sectionId: 'licensing' });
    }
    if (!application.tax_id?.trim()) {
      addError('tax_id', MESSAGES.required, 'licensing');
      licensingErrors.push({ field: 'tax_id', message: MESSAGES.required, sectionId: 'licensing' });
    } else if (!isValidSSN(application.tax_id)) {
      addError('tax_id', MESSAGES.invalidSSN, 'licensing');
      licensingErrors.push({ field: 'tax_id', message: MESSAGES.invalidSSN, sectionId: 'licensing' });
    }
    if (!application.drivers_license_number?.trim()) {
      addError('drivers_license_number', MESSAGES.required, 'licensing');
      licensingErrors.push({ field: 'drivers_license_number', message: MESSAGES.required, sectionId: 'licensing' });
    }
    if (!application.drivers_license_state) {
      addError('drivers_license_state', MESSAGES.selectRequired, 'licensing');
      licensingErrors.push({ field: 'drivers_license_state', message: MESSAGES.selectRequired, sectionId: 'licensing' });
    }
    if (!application.npn_number?.trim()) {
      addError('npn_number', MESSAGES.required, 'licensing');
      licensingErrors.push({ field: 'npn_number', message: MESSAGES.required, sectionId: 'licensing' });
    }
    if (!application.insurance_license_number?.trim()) {
      addError('insurance_license_number', MESSAGES.required, 'licensing');
      licensingErrors.push({ field: 'insurance_license_number', message: MESSAGES.required, sectionId: 'licensing' });
    }
    if (!application.resident_state) {
      addError('resident_state', MESSAGES.selectRequired, 'licensing');
      licensingErrors.push({ field: 'resident_state', message: MESSAGES.selectRequired, sectionId: 'licensing' });
    }
    // License expiration date - not required
    // TESTING: Document uploads disabled for testing
    // if (!uploadedDocs.insurance_license) {
    //   addError('insurance_license', MESSAGES.documentRequired, 'licensing');
    //   licensingErrors.push({ field: 'insurance_license', message: MESSAGES.documentRequired, sectionId: 'licensing' });
    // }
    // if (!uploadedDocs.government_id) {
    //   addError('government_id', MESSAGES.documentRequired, 'licensing');
    //   licensingErrors.push({ field: 'government_id', message: MESSAGES.documentRequired, sectionId: 'licensing' });
    // }
    const licensingAck = !sectionStatuses['licensing']?.acknowledged;
    if (licensingAck) {
      addError('licensing_ack', MESSAGES.sectionNeedsAcknowledgment, 'licensing');
      licensingErrors.push({ field: 'licensing_ack', message: MESSAGES.sectionNeedsAcknowledgment, sectionId: 'licensing' });
    }
    sectionErrors['licensing'] = {
      sectionId: 'licensing',
      sectionName: 'Licensing & Identification',
      isValid: licensingErrors.length === 0,
      errors: licensingErrors,
      needsAcknowledgment: licensingAck,
    };

    // ========== LEGAL QUESTIONS SECTION ==========
    const legalErrors: FieldError[] = [];
    const legalQuestions = (application.legal_questions || {}) as Record<string, LegalQuestion>;
    
    // TESTING: Explanation requirement disabled for testing
    // Object.entries(legalQuestions).forEach(([id, q]) => {
    //   if (q?.answer === true && !q?.explanation?.trim()) {
    //     addError(`legal_explanation_${id}`, MESSAGES.explanationRequired, 'legal');
    //     legalErrors.push({ field: `legal_explanation_${id}`, message: MESSAGES.explanationRequired, sectionId: 'legal' });
    //   }
    // });
    
    // TESTING: Background signature disabled for testing
    // if (!uploadedDocs.background_signature) {
    //   addError('background_signature', MESSAGES.backgroundSignatureRequired, 'legal');
    //   legalErrors.push({ field: 'background_signature', message: MESSAGES.backgroundSignatureRequired, sectionId: 'legal' });
    // }
    const legalAck = !sectionStatuses['legal']?.acknowledged;
    if (legalAck) {
      addError('legal_ack', MESSAGES.sectionNeedsAcknowledgment, 'legal');
      legalErrors.push({ field: 'legal_ack', message: MESSAGES.sectionNeedsAcknowledgment, sectionId: 'legal' });
    }
    sectionErrors['legal'] = {
      sectionId: 'legal',
      sectionName: 'Background Questions',
      isValid: legalErrors.length === 0,
      errors: legalErrors,
      needsAcknowledgment: legalAck,
    };

    // ========== BANKING SECTION ==========
    const bankingErrors: FieldError[] = [];
    if (!application.bank_routing_number?.trim()) {
      addError('bank_routing_number', MESSAGES.required, 'banking');
      bankingErrors.push({ field: 'bank_routing_number', message: MESSAGES.required, sectionId: 'banking' });
    } else if (!/^\d{9}$/.test(application.bank_routing_number.replace(/\D/g, ''))) {
      addError('bank_routing_number', MESSAGES.invalidRouting, 'banking');
      bankingErrors.push({ field: 'bank_routing_number', message: MESSAGES.invalidRouting, sectionId: 'banking' });
    }
    if (!application.bank_account_number?.trim()) {
      addError('bank_account_number', MESSAGES.required, 'banking');
      bankingErrors.push({ field: 'bank_account_number', message: MESSAGES.required, sectionId: 'banking' });
    }
    // TESTING: Voided check disabled for testing
    // if (!uploadedDocs.voided_check) {
    //   addError('voided_check', MESSAGES.documentRequired, 'banking');
    //   bankingErrors.push({ field: 'voided_check', message: MESSAGES.documentRequired, sectionId: 'banking' });
    // }
    const bankingAck = !sectionStatuses['banking']?.acknowledged;
    if (bankingAck) {
      addError('banking_ack', MESSAGES.sectionNeedsAcknowledgment, 'banking');
      bankingErrors.push({ field: 'banking_ack', message: MESSAGES.sectionNeedsAcknowledgment, sectionId: 'banking' });
    }
    sectionErrors['banking'] = {
      sectionId: 'banking',
      sectionName: 'Banking & Direct Deposit',
      isValid: bankingErrors.length === 0,
      errors: bankingErrors,
      needsAcknowledgment: bankingAck,
    };

    // ========== TRAINING SECTION ==========
    const trainingErrors: FieldError[] = [];
    // TESTING: E&O certificate disabled for testing
    // if (!application.eo_not_yet_covered && !uploadedDocs.eo_certificate) {
    //   addError('eo_certificate', MESSAGES.documentRequired, 'training');
    //   trainingErrors.push({ field: 'eo_certificate', message: MESSAGES.documentRequired, sectionId: 'training' });
    // }
    if (application.is_finra_registered) {
      if (!application.finra_broker_dealer_name?.trim()) {
        addError('finra_broker_dealer_name', MESSAGES.required, 'training');
        trainingErrors.push({ field: 'finra_broker_dealer_name', message: MESSAGES.required, sectionId: 'training' });
      }
      if (!application.finra_crd_number?.trim()) {
        addError('finra_crd_number', MESSAGES.required, 'training');
        trainingErrors.push({ field: 'finra_crd_number', message: MESSAGES.required, sectionId: 'training' });
      }
    }
    const trainingAck = !sectionStatuses['training']?.acknowledged;
    if (trainingAck) {
      addError('training_ack', MESSAGES.sectionNeedsAcknowledgment, 'training');
      trainingErrors.push({ field: 'training_ack', message: MESSAGES.sectionNeedsAcknowledgment, sectionId: 'training' });
    }
    sectionErrors['training'] = {
      sectionId: 'training',
      sectionName: 'Training & Certifications',
      isValid: trainingErrors.length === 0,
      errors: trainingErrors,
      needsAcknowledgment: trainingAck,
    };

    // ========== CARRIER SELECTION SECTION ==========
    const carrierErrors: FieldError[] = [];
    const selectedCarriers = (application.selected_carriers as SelectedCarrier[]) || [];
    if (selectedCarriers.length === 0) {
      addError('selected_carriers', MESSAGES.carrierRequired, 'carriers');
      carrierErrors.push({ field: 'selected_carriers', message: MESSAGES.carrierRequired, sectionId: 'carriers' });
    }
    // Check corporate resolution if needed
    if (application.is_corporation && selectedCarriers.length > 0) {
      const needsResolution = selectedCarriers.some(sc => {
        const carrier = carriers.find(c => c.id === sc.carrier_id);
        return carrier?.requires_corporate_resolution;
      });
      // TESTING: Corporate resolution disabled for testing
      // if (needsResolution && !uploadedDocs.corporate_resolution) {
      //   addError('corporate_resolution', MESSAGES.documentRequired, 'carriers');
      //   carrierErrors.push({ field: 'corporate_resolution', message: MESSAGES.documentRequired, sectionId: 'carriers' });
      // }
    }
    const carriersAck = !sectionStatuses['carriers']?.acknowledged;
    if (carriersAck) {
      addError('carriers_ack', MESSAGES.sectionNeedsAcknowledgment, 'carriers');
      carrierErrors.push({ field: 'carriers_ack', message: MESSAGES.sectionNeedsAcknowledgment, sectionId: 'carriers' });
    }
    sectionErrors['carriers'] = {
      sectionId: 'carriers',
      sectionName: 'Carrier Selection',
      isValid: carrierErrors.length === 0,
      errors: carrierErrors,
      needsAcknowledgment: carriersAck,
    };

    // ========== SIGNATURE SECTION ==========
    const signatureErrors: FieldError[] = [];
    if (!application.signature_name?.trim()) {
      addError('signature_name', MESSAGES.signatureRequired, 'signature');
      signatureErrors.push({ field: 'signature_name', message: MESSAGES.signatureRequired, sectionId: 'signature' });
    }
    if (!uploadedDocs.final_signature) {
      addError('final_signature', MESSAGES.signatureRequired, 'signature');
      signatureErrors.push({ field: 'final_signature', message: MESSAGES.signatureRequired, sectionId: 'signature' });
    }
    sectionErrors['signature'] = {
      sectionId: 'signature',
      sectionName: 'Electronic Signature',
      isValid: signatureErrors.length === 0,
      errors: signatureErrors,
      needsAcknowledgment: false,
    };

    const isFormValid = Object.keys(fieldErrors).length === 0;

    const newState: ValidationState = {
      isValidating: false,
      hasValidated: true,
      isFormValid,
      fieldErrors,
      sectionErrors,
      firstErrorSection,
      firstErrorField,
    };

    setValidationState(newState);
    return newState;
  }, []);

  return {
    validationState,
    validateForm,
    clearValidation,
    clearFieldError,
  };
}
