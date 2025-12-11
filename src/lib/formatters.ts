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
