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
  fieldSuccess: Record<string, boolean>;
  sectionErrors: Record<string, SectionValidation>;
  firstErrorSection: string | null;
  firstErrorField: string | null;
}

// Field to section mapping for single-field validation
const FIELD_SECTIONS: Record<string, string> = {
  full_legal_name: 'personal',
  email_address: 'personal',
  phone_mobile: 'personal',
  tax_id: 'licensing',
  birth_date: 'personal',
  birth_city: 'personal',
  birth_state: 'personal',
  gender: 'personal',
  home_address: 'home-address',
  npn_number: 'licensing',
  insurance_license_number: 'licensing',
  resident_state: 'licensing',
  drivers_license_number: 'licensing',
  drivers_license_state: 'licensing',
  bank_routing_number: 'banking',
  bank_account_number: 'banking',
  bank_branch_name: 'banking',
  doc_insurance_license: 'documents',
  doc_eo_certificate: 'documents',
  doc_voided_check: 'documents',
  background_questions: 'background',
  signature_name: 'signature',
  signature_initials: 'initials',
  signature_date: 'signature',
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
const isValidRouting = (routing: string): boolean => routing.replace(/\D/g, '').length === 9;

// Validate a single field - returns error message or null if valid
const validateSingleField = (
  fieldName: string,
  value: any,
  application: ContractingApplication
): string | null => {
  switch (fieldName) {
    case 'full_legal_name':
      if (!value || !value.trim()) return 'Please enter your full legal name.';
      return null;

    case 'email_address':
      if (!value || !value.trim()) return 'Please enter your email address.';
      if (!isValidEmail(value)) return "That doesn't look like an email address.";
      return null;

    case 'phone_mobile':
      if (!value || !value.trim()) return 'Please enter your phone number.';
      if (!isValidPhone(value)) return 'Please enter a 10-digit phone number.';
      return null;

    case 'tax_id':
      if (!value || !value.trim()) return 'Please enter your Social Security number.';
      if (!isValidSSN(value)) return 'Please enter 9 digits.';
      return null;

    case 'birth_date':
      if (!value) return 'Please enter your date of birth.';
      return null;

    case 'birth_city':
      if (!value || !value.trim()) return 'Please enter your city of birth.';
      return null;

    case 'birth_state':
      if (!value || !value.trim()) return 'Please select your state of birth.';
      return null;

    case 'gender':
      if (!value) return 'Please select your gender.';
      return null;

    case 'home_address':
      if (!isAddressComplete(value)) return 'Please complete all address fields.';
      return null;

    // Address sub-fields
    case 'home_address.street':
      if (!value || !value.trim()) return 'Please enter your street address.';
      return null;

    case 'home_address.city':
      if (!value || !value.trim()) return 'Please enter your city.';
      return null;

    case 'home_address.state':
      if (!value) return 'Please select your state.';
      return null;

    case 'home_address.zip':
      if (!value || !value.trim()) return 'Please enter your ZIP code.';
      return null;

    case 'npn_number':
      if (!value || !value.trim()) return 'Please enter your NPN.';
      return null;

    case 'insurance_license_number':
      if (!value || !value.trim()) return 'Please enter your license number.';
      return null;

    case 'resident_state':
      if (!value) return 'Please select your resident state.';
      return null;

    case 'drivers_license_number':
      if (!value || !value.trim()) return 'Please enter your driver\'s license number.';
      return null;

    case 'drivers_license_state':
      if (!value) return 'Please select your driver\'s license state.';
      return null;

    case 'bank_routing_number':
      if (!value || !value.trim()) return 'Please enter your routing number.';
      if (!isValidRouting(value)) return 'Routing numbers are 9 digits.';
      return null;

    case 'bank_account_number':
      if (!value || !value.trim()) return 'Please enter your account number.';
      return null;

    case 'bank_branch_name':
      if (!value || !value.trim()) return 'Please enter your bank name.';
      return null;

    case 'doc_insurance_license':
      if (!value || !value.trim()) return 'Please upload your insurance license.';
      return null;

    case 'doc_eo_certificate':
      if (!value || !value.trim()) return 'Please upload your E&O certificate.';
      return null;

    case 'doc_voided_check':
      if (!value || !value.trim()) return 'Please upload a voided check or direct deposit form.';
      return null;

    case 'background_questions':
      // Check that all background questions are answered
      const questions = value as Record<string, { answer: boolean | null; explanation?: string }> | null;
      if (!questions) return 'Please answer all background questions.';

      // Sub-question hierarchy - sub-questions only need answers if parent is "Yes"
      const subQuestionParents: Record<string, string> = {
        '1a': '1', '1b': '1', '1c': '1', '1d': '1', '1e': '1', '1f': '1', '1g': '1', '1h': '1',
        '2a': '2', '2b': '2', '2c': '2', '2d': '2',
        '5a': '5', '5b': '5', '5c': '5',
        '8a': '8', '8b': '8',
        '14a': '14', '14c': '14',
        '15a': '15', '15b': '15', '15c': '15',
      };

      // Only validate main (parent) questions, not sub-questions
      const mainQuestions = LEGAL_QUESTIONS.filter(q => !('isSubQuestion' in q && q.isSubQuestion));

      for (const question of mainQuestions) {
        const q = questions[question.id];
        if (!q || q.answer === null || q.answer === undefined) {
          return 'Please answer all background questions.';
        }
      }

      // Check sub-questions only if their parent is "Yes"
      for (const [subId, parentId] of Object.entries(subQuestionParents)) {
        const parentAnswer = questions[parentId]?.answer;
        if (parentAnswer === true) {
          const subQ = questions[subId];
          if (!subQ || subQ.answer === null || subQ.answer === undefined) {
            return 'Please answer all follow-up questions for "Yes" answers.';
          }
        }
      }

      return null;

    case 'signature_name':
      if (!value || !value.trim()) return 'Please sign to continue.';
      return null;

    case 'signature_initials':
      if (!value || !value.trim()) return 'Please add your initials.';
      return null;

    case 'signature_date':
      if (!value) return 'Please confirm the date.';
      return null;

    default:
      return null;
  }
};

export function useFormValidation() {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    hasValidated: false,
    isFormValid: true,
    fieldErrors: {},
    fieldSuccess: {},
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
      fieldSuccess: {},
      sectionErrors: {},
      firstErrorSection: null,
      firstErrorField: null,
    });
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setValidationState(prev => {
      const { [fieldName]: _, ...restErrors } = prev.fieldErrors;
      const { [fieldName]: __, ...restSuccess } = prev.fieldSuccess;

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
        fieldSuccess: restSuccess,
        sectionErrors: updatedSectionErrors,
        isFormValid,
      };
    });
  }, []);

  // Validate a single field on blur
  const onFieldBlur = useCallback((
    fieldName: string,
    value: any,
    application: ContractingApplication
  ) => {
    const error = validateSingleField(fieldName, value, application);

    setValidationState(prev => {
      if (error) {
        // Field has error: add to fieldErrors, remove from fieldSuccess
        const { [fieldName]: _, ...restSuccess } = prev.fieldSuccess;
        const newFieldErrors = { ...prev.fieldErrors, [fieldName]: error };

        return {
          ...prev,
          fieldErrors: newFieldErrors,
          fieldSuccess: restSuccess,
          isFormValid: Object.keys(newFieldErrors).length === 0,
        };
      } else {
        // Field is valid: remove from fieldErrors, add to fieldSuccess
        const { [fieldName]: _, ...restErrors } = prev.fieldErrors;
        const newFieldSuccess = { ...prev.fieldSuccess, [fieldName]: true };

        return {
          ...prev,
          fieldErrors: restErrors,
          fieldSuccess: newFieldSuccess,
          isFormValid: Object.keys(restErrors).length === 0,
        };
      }
    });
  }, []);

  const validateForm = useCallback((
    application: ContractingApplication,
    sectionStatuses: Record<string, SectionStatus>,
    carriers: Carrier[]
  ): ValidationState => {
    const fieldErrors: Record<string, string> = {};
    const fieldSuccess: Record<string, boolean> = {};
    const sectionErrors: Record<string, SectionValidation> = {};
    let firstErrorSection: string | null = null;
    let firstErrorField: string | null = null;

    // Define required fields per section (in display order)
    const sectionFields: Record<string, { fields: string[]; name: string }> = {
      'personal': {
        name: 'Personal Information',
        fields: ['full_legal_name', 'email_address', 'phone_mobile', 'birth_date', 'birth_city', 'birth_state', 'gender']
      },
      'home-address': {
        name: 'Home Address',
        fields: ['home_address']
      },
      'licensing': {
        name: 'Licensing Information',
        fields: ['npn_number', 'resident_license_number', 'resident_state', 'tax_id', 'drivers_license_number', 'drivers_license_state']
      },
      'banking': {
        name: 'Banking Information',
        fields: ['bank_routing_number', 'bank_account_number'] // bank_name is optional
      },
      'documents': {
        name: 'Required Documents',
        fields: ['doc_insurance_license', 'doc_eo_certificate', 'doc_voided_check']
      },
      'background': {
        name: 'Background Questions',
        fields: ['background_questions']
      },
      'signature': {
        name: 'Signature',
        fields: ['signature_name', 'signature_date']
      },
      'initials': {
        name: 'Initials',
        fields: ['signature_initials']
      }
    };

    // Section order for determining first error
    const sectionOrder = ['personal', 'home-address', 'licensing', 'banking', 'documents', 'background', 'signature', 'initials'];

    // Get field value from application
    const getFieldValue = (fieldName: string): any => {
      switch (fieldName) {
        case 'full_legal_name': return application.full_legal_name;
        case 'email_address': return application.email_address;
        case 'phone_mobile': return application.phone_mobile;
        case 'birth_date': return application.birth_date;
        case 'birth_city': return application.birth_city;
        case 'birth_state': return application.birth_state;
        case 'gender': return application.gender;
        case 'home_address': return application.home_address;
        case 'npn_number': return application.npn_number;
        case 'insurance_license_number': return application.insurance_license_number;
        case 'resident_state': return application.resident_state;
        case 'tax_id': return application.tax_id;
        case 'drivers_license_number': return application.drivers_license_number;
        case 'drivers_license_state': return application.drivers_license_state;
        case 'bank_routing_number': return application.bank_routing_number;
        case 'bank_account_number': return application.bank_account_number;
        case 'bank_branch_name': return application.bank_branch_name;
        case 'doc_insurance_license': return application.uploaded_documents?.insurance_license;
        case 'doc_eo_certificate': return application.uploaded_documents?.eo_certificate;
        case 'doc_voided_check': return application.uploaded_documents?.voided_check;
        case 'background_questions': return application.legal_questions;
        case 'signature_name': return application.signature_name;
        case 'signature_date': return application.signature_date;
        case 'signature_initials': return application.signature_initials;
        default: return undefined;
      }
    };

    // Validate each section
    for (const sectionId of sectionOrder) {
      const sectionConfig = sectionFields[sectionId];
      if (!sectionConfig) continue;

      const sectionFieldErrors: FieldError[] = [];

      for (const fieldName of sectionConfig.fields) {
        const value = getFieldValue(fieldName);
        const error = validateSingleField(fieldName, value, application);

        if (error) {
          fieldErrors[fieldName] = error;
          sectionFieldErrors.push({
            field: fieldName,
            message: error,
            sectionId
          });

          // Track first error
          if (!firstErrorSection) {
            firstErrorSection = sectionId;
            firstErrorField = fieldName;
          }
        } else {
          fieldSuccess[fieldName] = true;
        }
      }

      sectionErrors[sectionId] = {
        sectionId,
        sectionName: sectionConfig.name,
        isValid: sectionFieldErrors.length === 0,
        errors: sectionFieldErrors,
        needsAcknowledgment: false
      };
    }

    const isFormValid = Object.keys(fieldErrors).length === 0;

    const result: ValidationState = {
      isValidating: false,
      hasValidated: true,
      isFormValid,
      fieldErrors,
      fieldSuccess,
      sectionErrors,
      firstErrorSection,
      firstErrorField,
    };

    setValidationState(result);
    return result;
  }, []);

  return {
    validationState,
    validateForm,
    clearValidation,
    clearFieldError,
    onFieldBlur,
  };
}
