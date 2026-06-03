import { useState, useCallback, useRef } from 'react';
import { ContractingApplication, EMPTY_ADDRESS, SelectedCarrier } from '@/types/contracting';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/lib/errors';
import { useContractingPdf } from './useContractingPdf';

/**
 * STATELESS, IN-MEMORY contracting application state.
 *
 * Unlike the platform version, nothing is persisted to a database or storage
 * bucket. The whole application lives in React state for the duration of the
 * session. On submit we:
 *   1. generate the filled PDF in memory (saveToStorage = false)
 *   2. collect every uploaded document (held as base64 in memory)
 *   3. email the PDF + all documents to the contracting team via the
 *      `send-contracting-packet` edge function
 *   4. discard everything
 *
 * Because there is no login, the agent's `email_address` is collected in the
 * Personal Info step rather than pulled from an auth session.
 */

const STORAGE_KEY_DRAFT = 'tig_contracting_draft_v1';

// A document the agent uploaded, kept in memory so we can attach it to the email.
interface PendingAttachment {
  fileName: string;
  base64: string; // raw base64, no data: prefix
  mimeType: string;
}

const createEmptyApplication = (): ContractingApplication => ({
  id: 'local',
  user_id: 'public',
  current_step: 1,
  completed_steps: [],
  status: 'in_progress',

  // Personal & Contact
  full_legal_name: null,
  agency_name: null,
  agency_tax_id: null,
  gender: null,
  birth_date: null,
  birth_city: null,
  birth_state: null,
  npn_number: null,
  insurance_license_number: null,
  tax_id: null,
  email_address: null,
  phone_mobile: null,
  phone_business: null,
  phone_home: null,
  fax: null,
  preferred_contact_methods: [],

  // Addresses
  home_address: { ...EMPTY_ADDRESS },
  mailing_address_same_as_home: true,
  mailing_address: { ...EMPTY_ADDRESS },
  ups_address_same_as_home: true,
  ups_address: { ...EMPTY_ADDRESS },
  previous_addresses: [],

  // Licensing
  resident_license_number: null,
  resident_state: null,
  license_expiration_date: null,
  non_resident_states: [],
  drivers_license_number: null,
  drivers_license_state: null,

  // Legal
  legal_questions: {},

  // Banking
  bank_routing_number: null,
  bank_account_number: null,
  bank_branch_name: null,
  beneficiary_name: null,
  beneficiary_relationship: null,
  beneficiary_birth_date: null,
  beneficiary_drivers_license_number: null,
  beneficiary_drivers_license_state: null,
  requesting_commission_advancing: false,

  // Training & E&O
  has_aml_course: null,
  aml_course_name: null,
  aml_course_date: null,
  aml_training_provider: null,
  aml_completion_date: null,
  has_ltc_certification: false,
  state_requires_ce: false,
  eo_not_yet_covered: false,
  eo_provider: null,
  eo_policy_number: null,
  eo_expiration_date: null,
  is_finra_registered: false,
  finra_broker_dealer_name: null,
  finra_crd_number: null,

  // Carriers
  selected_carriers: [],
  is_corporation: false,

  // Agreements & signature
  agreements: {},
  signature_name: null,
  signature_initials: null,
  signature_date: null,
  section_acknowledgments: {},
  disciplinary_entries: {},

  // Documents (truthy marker per type; bytes are kept separately for email)
  uploaded_documents: {},

  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  submitted_at: null,
});

// Convert a File to raw base64 (no data: prefix).
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Friendly label for a document type, used as the attachment file name.
const documentLabel = (documentType: string): string => {
  if (documentType.startsWith('non_resident_license_')) {
    return `Non-Resident License (${documentType.replace('non_resident_license_', '')})`;
  }
  const labels: Record<string, string> = {
    insurance_license: 'Resident License',
    eo_certificate: 'E&O Certificate',
    voided_check: 'Voided Check',
  };
  return labels[documentType] || documentType;
};

export function useContractingApplication() {
  const { generatePdf, generating: generatingPdf } = useContractingPdf();

  const [application, setApplication] = useState<ContractingApplication>(() => {
    // Light-touch draft restore for the current step's text fields only.
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_DRAFT);
        if (raw) {
          return { ...createEmptyApplication(), ...JSON.parse(raw) };
        }
      } catch {
        // ignore corrupt drafts
      }
    }
    return createEmptyApplication();
  });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Uploaded document bytes, kept out of React state (no re-render needed).
  const attachmentsRef = useRef<Record<string, PendingAttachment>>({});
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist a lightweight draft (everything except big base64 blobs) so a
  // page refresh mid-flow doesn't lose typed answers. Uploaded files are NOT
  // persisted — they live only in memory.
  const persistDraft = useCallback((app: ContractingApplication) => {
    if (typeof window === 'undefined') return;
    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    draftTimeoutRef.current = setTimeout(() => {
      try {
        const { uploaded_documents, ...rest } = app;
        // Keep only the inline signature/initials images (small), drop file markers.
        const slimDocs: Record<string, string> = {};
        for (const key of ['initials_image', 'background_signature', 'final_signature']) {
          if (uploaded_documents[key]) slimDocs[key] = uploaded_documents[key];
        }
        localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify({ ...rest, uploaded_documents: slimDocs }));
        setLastSaved(new Date());
      } catch {
        // storage full / unavailable — non-fatal
      }
    }, 600);
  }, []);

  const updateField = useCallback(<K extends keyof ContractingApplication>(
    field: K,
    value: ContractingApplication[K]
  ) => {
    setApplication((prev) => {
      const next = { ...prev, [field]: value, updated_at: new Date().toISOString() };
      persistDraft(next);
      return next;
    });
  }, [persistDraft]);

  // Hold the uploaded file in memory and mark the type as present.
  const uploadDocument = useCallback(async (file: File, documentType: string, _expiresAt?: string) => {
    try {
      const base64 = await fileToBase64(file);
      attachmentsRef.current[documentType] = {
        fileName: `${documentLabel(documentType)}${getExtension(file.name)}`,
        base64,
        mimeType: file.type || 'application/octet-stream',
      };
      setApplication((prev) => {
        const next = {
          ...prev,
          uploaded_documents: { ...prev.uploaded_documents, [documentType]: file.name },
          updated_at: new Date().toISOString(),
        };
        return next;
      });
      toast.success(`${documentLabel(documentType)} added`);
      return file.name;
    } catch (error) {
      toast.error('Failed to read file: ' + getErrorMessage(error));
      return null;
    }
  }, []);

  const deleteDocument = useCallback((documentType: string) => {
    delete attachmentsRef.current[documentType];
    setApplication((prev) => {
      const updatedDocs = { ...prev.uploaded_documents };
      delete updatedDocs[documentType];
      return { ...prev, uploaded_documents: updatedDocs, updated_at: new Date().toISOString() };
    });
    toast.success('Document removed');
  }, []);

  const submitApplication = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const normalized: ContractingApplication = {
        ...application,
        requesting_commission_advancing: application.requesting_commission_advancing === true,
      };

      // 1. Generate the filled PDF in memory (no storage).
      const pdfResult = await generatePdf(normalized, false);
      if (!pdfResult.success || !pdfResult.pdf) {
        toast.error('Failed to generate contracting packet: ' + (pdfResult.error || 'Unknown error'));
        return false;
      }

      // 2. Assemble attachments: the packet PDF + every uploaded document.
      const files = [
        {
          name: pdfResult.filename || 'Contracting_Packet.pdf',
          fileName: pdfResult.filename || 'Contracting_Packet.pdf',
          content: pdfResult.pdf,
          type: 'application/pdf',
        },
        ...Object.values(attachmentsRef.current).map((att) => ({
          name: att.fileName,
          fileName: att.fileName,
          content: att.base64,
          type: att.mimeType,
        })),
      ];

      const selectedCarrierNames = (application.selected_carriers as SelectedCarrier[])
        .map((c) => c.carrier_name)
        .filter(Boolean);

      // 3. Email everything to the contracting team.
      const { data, error } = await supabase.functions.invoke('send-contracting-packet', {
        body: {
          name: application.full_legal_name,
          npn: (application.npn_number || '').replace(/\D/g, ''),
          email: application.email_address || undefined,
          residentState: application.resident_state,
          selectedCarriers: selectedCarrierNames,
          files,
        },
      });

      if (error || (data && data.success === false)) {
        const msg = (data && data.error) || getErrorMessage(error) || 'Failed to send packet';
        toast.error('Failed to submit: ' + msg);
        return false;
      }

      // 4. Done — clear the in-memory state and any draft.
      attachmentsRef.current = {};
      if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY_DRAFT);
      setApplication((prev) => ({ ...prev, status: 'submitted', submitted_at: new Date().toISOString() }));
      return true;
    } catch (error) {
      toast.error('Failed to submit application: ' + getErrorMessage(error));
      return false;
    } finally {
      setSaving(false);
    }
  }, [application, generatePdf]);

  return {
    application,
    loading: false,
    saving: saving || generatingPdf,
    lastSaved,
    updateField,
    uploadDocument,
    deleteDocument,
    submitApplication,
  };
}

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx) : '';
}
