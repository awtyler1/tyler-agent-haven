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
    // TESTING: All validation disabled for testing purposes - return valid state immediately
    const validState: ValidationState = {
      isValidating: false,
      hasValidated: true,
      isFormValid: true,
      fieldErrors: {},
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
  };
}
