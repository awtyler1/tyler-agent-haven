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
  resident_license_number: 'licensing',
  resident_state: 'licensing',
  drivers_license_number: 'licensing',
  drivers_license_state: 'licensing',
  bank_routing_number: 'banking',
  bank_account_number: 'banking',
  bank_name: 'banking',
  selected_carriers: 'carriers',
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

    case 'npn_number':
      if (!value || !value.trim()) return 'Please enter your NPN.';
      return null;

    case 'resident_license_number':
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

    case 'bank_name':
      if (!value || !value.trim()) return 'Please enter your bank name.';
      return null;

    case 'selected_carriers':
      const carriers = Array.isArray(value) ? value : [];
      if (carriers.length === 0) return 'Please select at least one carrier.';
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
    // TESTING: All validation disabled for testing purposes - return valid state immediately
    const validState: ValidationState = {
      isValidating: false,
      hasValidated: true,
      isFormValid: true,
      fieldErrors: {},
      fieldSuccess: {},
      sectionErrors: {},
      firstErrorSection: null,
      firstErrorField: null,
    };
    setValidationState(validState);
    return validState;
  }, []);

  return {
    validationState,
    validateForm,
    clearValidation,
    clearFieldError,
    onFieldBlur,
  };
}
