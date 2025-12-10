export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
}

export interface LegalQuestion {
  answer: boolean | null;
  explanation?: string;
}

export interface SelectedCarrier {
  carrier_id: string;
  carrier_name: string;
  non_resident_states: string[];
}

export interface ContractingApplication {
  id: string;
  user_id: string;
  current_step: number;
  completed_steps: number[];
  status: 'in_progress' | 'submitted' | 'approved' | 'rejected';
  
  // Step 1: Personal & Contact
  full_legal_name: string | null;
  agency_name: string | null;
  gender: string | null;
  birth_date: string | null;
  npn_number: string | null;
  insurance_license_number: string | null;
  tax_id: string | null;
  email_address: string | null;
  phone_mobile: string | null;
  phone_business: string | null;
  phone_home: string | null;
  fax: string | null;
  preferred_contact_methods: string[];
  
  // Step 2: Addresses
  home_address: Address;
  mailing_address_same_as_home: boolean;
  mailing_address: Address;
  ups_address_same_as_home: boolean;
  ups_address: Address;
  previous_addresses: Address[];
  
  // Step 3: Licensing
  resident_license_number: string | null;
  resident_state: string | null;
  license_expiration_date: string | null;
  non_resident_states: string[];
  drivers_license_number: string | null;
  drivers_license_state: string | null;
  
  // Step 4: Legal Questions
  legal_questions: Record<string, LegalQuestion>;
  
  // Step 5: Banking
  bank_routing_number: string | null;
  bank_account_number: string | null;
  bank_branch_name: string | null;
  beneficiary_name: string | null;
  beneficiary_relationship: string | null;
  requesting_commission_advancing: boolean;
  
  // Step 6: Training
  aml_training_provider: string | null;
  aml_completion_date: string | null;
  has_ltc_certification: boolean;
  state_requires_ce: boolean;
  
  // Step 7: Carriers
  selected_carriers: SelectedCarrier[];
  is_corporation: boolean;
  
  // Step 8: Agreements
  agreements: Record<string, boolean>;
  signature_name: string | null;
  signature_initials: string | null;
  signature_date: string | null;
  
  // Documents
  uploaded_documents: Record<string, string>;
  
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export interface Carrier {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  requires_non_resident_states: boolean;
  requires_corporate_resolution: boolean;
}

export const WIZARD_STEPS = [
  { id: 1, name: 'Welcome', shortName: 'Welcome' },
  { id: 2, name: 'Personal & Contact Info', shortName: 'Personal' },
  { id: 3, name: 'Addresses', shortName: 'Addresses' },
  { id: 4, name: 'Licensing & IDs', shortName: 'Licensing' },
  { id: 5, name: 'Legal Questions', shortName: 'Legal' },
  { id: 6, name: 'Banking & Direct Deposit', shortName: 'Banking' },
  { id: 7, name: 'Training & Certificates', shortName: 'Training' },
  { id: 8, name: 'Carrier Selection', shortName: 'Carriers' },
  { id: 9, name: 'Agreements & Signature', shortName: 'Signature' },
  { id: 10, name: 'Review & Submit', shortName: 'Submit' },
] as const;

export const LEGAL_QUESTIONS = [
  { id: '1', text: 'Have you ever been charged or convicted of, or plead guilty to, or no contest to, any Felony, Misdemeanor, federal and/or state insurance, and/or securities or investments regulations and/or statutes? Have you ever been on probation?', isParent: true },
  { id: '1a', text: 'Have you ever been convicted of, or plead guilty or no contest to, any Felony?', isSubQuestion: true },
  { id: '1b', text: 'Have you ever been convicted of, or plead guilty or no contest to, any Misdemeanor?', isSubQuestion: true },
  { id: '1c', text: 'Have you ever been convicted of, or plead guilty or no contest to, any violation of federal or state securities or investment related regulations?', isSubQuestion: true },
  { id: '1d', text: 'Have you ever been convicted of, or plead guilty or no contest to, any violation of state insurance department regulation or statute?', isSubQuestion: true },
  { id: '1e', text: 'Has any foreign government, court, regulatory agency, and/or exchange ever entered an order against you related to investments and/or fraud?', isSubQuestion: true },
  { id: '1f', text: 'Have you ever been charged with any Felony?', isSubQuestion: true },
  { id: '1g', text: 'Have you ever been charged with any Misdemeanor?', isSubQuestion: true },
  { id: '1h', text: 'Have you ever been on probation?', isSubQuestion: true },
  { id: '2', text: 'Have you ever been, or are you currently being, investigated, have any pending indictments, lawsuits, and/or have ever been in a lawsuit with any insurance companies?', isParent: true },
  { id: '2a', text: 'Are you currently under investigation by any legal or regulatory authorities?', isSubQuestion: true },
  { id: '2b', text: 'Are you currently under investigation by any insurance companies?', isSubQuestion: true },
  { id: '2c', text: 'Have you ever been, or are you currently involved in, any pending indictments, lawsuits, civil judgments, and/or other legal proceedings (civil or criminal)? (You may omit family court.)', isSubQuestion: true },
  { id: '2d', text: 'Have you ever been named as a defendant or co-defendant in any lawsuit, or have you ever sued, or been sued, by any insurance companies?', isSubQuestion: true },
  { id: '3', text: 'Have you ever been alleged to have engaged in any fraud?' },
  { id: '4', text: 'Have you ever been found to have engaged in any fraud?' },
  { id: '5', text: 'Has any insurance or financial services company, or broker-dealer, terminated your contract or appointment, or permitted you to resign for any reason other than lack of sales?', isParent: true },
  { id: '5a', text: 'Were you terminated and/or resigned because you were accused of violating insurance and/or investment-related statutes, regulations, rules, and/or industry standards of conduct?', isSubQuestion: true },
  { id: '5b', text: 'Were you terminated and/or resigned because you were accused of fraud and/or the wrongful taking of property?', isSubQuestion: true },
  { id: '5c', text: 'Were you terminated and/or resigned because of failure to supervise in connection with insurance and/or investment-related statutes, regulations, rules, and/or industry standards of conduct?', isSubQuestion: true },
  { id: '6', text: 'Have you ever had an appointment with any insurance companies terminated for cause and/or been denied any appointment(s)?' },
  { id: '7', text: 'Does any insurer, insured, and/or other person claim any commission charge-back and/or other indebtedness from you as a result of any insurance transactions and/or business?' },
  { id: '8', text: 'Has any lawsuit or claim ever been made against your surety company, and/or errors and omissions insurer, arising out of your sales and/or practices, or, have you been refused surety bonding and/or E&O coverage?', isParent: true },
  { id: '8a', text: 'Has a bonding and/or surety company ever denied, paid on, and/or revoked a bond for you? Or, have you ever had a claim filed against your surety company?', isSubQuestion: true },
  { id: '8b', text: 'Has any Errors & Omissions (E&O) carrier ever denied, paid claims on, and/or canceled your coverage? Or, have you ever had a claim filed against your E&O carrier?', isSubQuestion: true },
  { id: '9', text: 'Have you ever had an insurance and/or securities license denied, suspended, canceled, and/or revoked?' },
  { id: '10', text: 'Has any state and/or federal regulatory body found you to have been a cause of an investment- and/or insurance-related business having its authorization to do business denied, suspended, revoked, and/or restricted?' },
  { id: '11', text: 'Has any state and/or federal regulatory agency revoked and/or suspended your license as an attorney, accountant, and/or federal contractor?' },
  { id: '12', text: 'Has any state and/or federal regulatory agency found you to have made any false statements or omissions, and/or have been dishonest, unfair, and/or unethical?' },
  { id: '13', text: 'Have you had any interruptions in licensing?' },
  { id: '14', text: 'Has any state, federal, and/or self-regulatory agency filed a complaint against you, fined, sanctioned, censured, penalized, and/or otherwise disciplined you for a violation of their regulations, and/or state and/or federal statutes? Have you ever been the subject of a consumer initiated complaint?', isParent: true },
  { id: '14a', text: 'Has any regulatory body ever sanctioned, censured, penalized, and/or otherwise disciplined you?', isSubQuestion: true },
  { id: '14c', text: 'Have you ever been the subject of a consumer initiated complaint?', isSubQuestion: true },
  { id: '15', text: 'Have you personally, and/or any insurance and/or securities brokerage firms with whom you have been associated, filed a bankruptcy petition and/or declared bankruptcy?', isParent: true },
  { id: '15a', text: 'Have you personally filed a bankruptcy petition or declared bankruptcy?', isSubQuestion: true },
  { id: '15b', text: 'Has any insurance or securities brokerage firm with whom you have been associated filed a bankruptcy petition and/or been declared bankrupt either during your association and/or within five years after termination of such association?', isSubQuestion: true },
  { id: '15c', text: 'Is the bankruptcy pending?', isSubQuestion: true },
  { id: '16', text: 'Have you ever had any judgments, garnishments, and/or liens against you?' },
  { id: '17', text: 'Are you connected in any way with a bank, savings and loan association, and/or other lending or financial institutions?' },
  { id: '18', text: 'Have you ever used any other names or aliases?' },
  { id: '19', text: 'Do you have any unresolved matters pending with the Internal Revenue Service and/or other taxing authorities?' },
] as const;

export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
] as const;

export const EMPTY_ADDRESS: Address = {
  street: '',
  city: '',
  state: '',
  zip: '',
  county: '',
};

export const getEmptyApplication = (userId: string): Partial<ContractingApplication> => ({
  user_id: userId,
  current_step: 1,
  completed_steps: [],
  status: 'in_progress',
  full_legal_name: null,
  agency_name: null,
  gender: null,
  birth_date: null,
  npn_number: null,
  insurance_license_number: null,
  tax_id: null,
  email_address: null,
  phone_mobile: null,
  phone_business: null,
  phone_home: null,
  fax: null,
  preferred_contact_methods: [],
  home_address: EMPTY_ADDRESS,
  mailing_address_same_as_home: true,
  mailing_address: EMPTY_ADDRESS,
  ups_address_same_as_home: true,
  ups_address: EMPTY_ADDRESS,
  previous_addresses: [],
  resident_license_number: null,
  resident_state: null,
  license_expiration_date: null,
  non_resident_states: [],
  drivers_license_number: null,
  drivers_license_state: null,
  legal_questions: {},
  bank_routing_number: null,
  bank_account_number: null,
  bank_branch_name: null,
  beneficiary_name: null,
  beneficiary_relationship: null,
  requesting_commission_advancing: false,
  aml_training_provider: null,
  aml_completion_date: null,
  has_ltc_certification: false,
  state_requires_ce: false,
  selected_carriers: [],
  is_corporation: false,
  agreements: {},
  signature_name: null,
  signature_initials: null,
  signature_date: null,
  uploaded_documents: {},
});