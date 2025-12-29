// Phone number formatting - auto-formats as user types
export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = digits.slice(0, 10);
  
  // Format as (XXX) XXX-XXXX
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}

// SSN formatting - formats as XXX-XX-XXXX
export function formatSSN(value: string): string {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 9);
  
  if (limited.length === 0) return '';
  if (limited.length <= 3) return limited;
  if (limited.length <= 5) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`;
}

/**
 * Format phone as (XXX) XXX-XXXX
 */
export const formatPhone = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = digits.slice(0, 10);
  
  // Format
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
};

/**
 * Format routing number - just limit to 9 digits
 */
export const formatRoutingNumber = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 9);
};

/**
 * Format account number - just limit to 17 digits (max for US accounts)
 */
export const formatAccountNumber = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 17);
};

/**
 * Format NPN - just digits, max 10
 */
export const formatNPN = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 10);
};

/**
 * Validate routing number (basic checksum validation)
 */
export const isValidRoutingNumber = (routing: string): boolean => {
  const digits = routing.replace(/\D/g, '');
  if (digits.length !== 9) return false;
  
  // ABA routing number checksum
  const checksum = 
    3 * (parseInt(digits[0]) + parseInt(digits[3]) + parseInt(digits[6])) +
    7 * (parseInt(digits[1]) + parseInt(digits[4]) + parseInt(digits[7])) +
    1 * (parseInt(digits[2]) + parseInt(digits[5]) + parseInt(digits[8]));
  
  return checksum % 10 === 0;
};

/**
 * Get bank name from routing number (common banks)
 */
export const getBankName = (routing: string): string | null => {
  const digits = routing.replace(/\D/g, '');
  if (digits.length !== 9) return null;
  
  // Common bank routing numbers (first 4 digits identify region/bank)
  const bankMap: Record<string, string> = {
    '0210': 'JPMorgan Chase',
    '0220': 'JPMorgan Chase',
    '0260': 'Bank of America',
    '0420': 'PNC Bank',
    '0440': 'PNC Bank',
    '0530': 'US Bank',
    '0610': 'Wells Fargo',
    '0710': 'Wells Fargo',
    '0720': 'Wells Fargo',
    '0830': 'Fifth Third Bank',
    '0840': 'Fifth Third Bank',
    '1010': 'TD Bank',
    '1110': 'Capital One',
    '1210': 'Regions Bank',
    '1240': 'Republic Bank',
    '2420': 'Community Trust Bank',
    '2830': 'Truist',
    '3140': 'Ally Bank',
  };
  
  const prefix = digits.slice(0, 4);
  return bankMap[prefix] || null;
};

// EIN formatting - formats as XX-XXXXXXX
export function formatEIN(value: string): string {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 9);
  
  if (limited.length === 0) return '';
  if (limited.length <= 2) return limited;
  return `${limited.slice(0, 2)}-${limited.slice(2)}`;
}

// Mask SSN for display - shows only last 4 digits
export function maskSSN(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return value;
  return `•••-••-${digits.slice(-4)}`;
}

// Mask EIN for display - shows only last 4 digits  
export function maskEIN(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return value;
  return `••-•••${digits.slice(-4)}`;
}

// Get raw digits from formatted value
export function getDigitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

// ZIP code formatting - 5 digits or ZIP+4 (XXXXX or XXXXX-XXXX)
export function formatZipCode(value: string): string {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 9);
  
  if (limited.length === 0) return '';
  if (limited.length <= 5) return limited;
  return `${limited.slice(0, 5)}-${limited.slice(5)}`;
}

// Validate ZIP code (5 digits or ZIP+4)
export function isValidZipCode(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 5 || digits.length === 9;
}
