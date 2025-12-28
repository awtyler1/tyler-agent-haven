# Contracting Flow - File Inventory

This document provides a comprehensive inventory of all files related to the contracting flow in the Tyler Agent Haven platform.

## Table of Contents
1. [Pages](#pages)
2. [Components](#components)
3. [Edge Functions](#edge-functions)
4. [Hooks](#hooks)
5. [Types & Utilities](#types--utilities)
6. [Data Files](#data-files)
7. [Templates & Assets](#templates--assets)

---

## Pages

### Main Contracting Pages

- **`src/pages/ContractingPage.tsx`**
  - Route: `/contracting`
  - Main contracting wizard page (locked to agents with `CONTRACTING_REQUIRED` status)
  - Renders `ContractingForm` component
  - Protected route that only allows agents who need to complete contracting

- **`src/pages/ContractingHubPage.tsx`**
  - Route: `/contracting-hub`
  - Contracting hub page for agents who have completed the wizard
  - Also renders `ContractingForm` component
  - Accessible to agents after completing initial contracting

### Admin Pages

- **`src/pages/admin/ContractingQueuePage.tsx`**
  - Route: `/admin/contracting`
  - Admin interface for reviewing and managing contracting submissions
  - Displays list of submissions with filtering and search
  - Shows agents waiting to complete the wizard
  - Integrates with `ContractingSubmissionDetail` component for detailed views

---

## Components

### Main Contracting Components

- **`src/components/contracting/ContractingWizard.tsx`**
  - Main wizard container component
  - Manages wizard state, navigation, and step progression
  - Handles auto-save functionality
  - Includes progress indicator and step navigation
  - Integrates all wizard steps

- **`src/components/contracting/ContractingForm.tsx`**
  - Alternative form-based view of contracting (used in hub)
  - Section-based layout instead of step-based
  - Includes test mode features for debugging PDF generation
  - Handles document uploads and form validation

### Wizard Steps

All step components are located in `src/components/contracting/steps/`:

- **`src/components/contracting/steps/WelcomeStep.tsx`**
  - Step 1: Welcome screen with initials entry

- **`src/components/contracting/steps/PersonalInfoStep.tsx`**
  - Step 2: Personal & Contact Information
  - Name, DOB, SSN, contact details

- **`src/components/contracting/steps/LicensingStep.tsx`**
  - Step 3: Licensing & ID Information
  - NPN, state license, license upload, driver's license

- **`src/components/contracting/steps/LegalQuestionsStep.tsx`**
  - Step 4: Legal Background Questions
  - Handles yes/no questions with explanations

- **`src/components/contracting/steps/BankingStep.tsx`**
  - Step 5: Banking & Direct Deposit
  - Bank account info, voided check upload, beneficiary info

- **`src/components/contracting/steps/TrainingStep.tsx`**
  - Step 6: Training & Certificates
  - AML course, LTC certification, E&O insurance, CE requirements

- **`src/components/contracting/steps/AgreementsStep.tsx`**
  - Step 7: Agreements & Signature
  - Terms acceptance, signature capture

- **`src/components/contracting/steps/ReviewStep.tsx`**
  - Step 8: Review & Submit
  - Final review of all entered data before submission

### Section Components

Section components are located in `src/components/contracting/sections/` and are used by the form-based view:

- **`src/components/contracting/sections/InitialsEntrySection.tsx`**
  - Initials entry for form acknowledgment

- **`src/components/contracting/sections/PersonalInfoSection.tsx`**
  - Personal information fields

- **`src/components/contracting/sections/AddressSection.tsx`**
  - Address input component (reusable for home, mailing, UPS addresses)

- **`src/components/contracting/sections/LicensingSection.tsx`**
  - Licensing information fields

- **`src/components/contracting/sections/LegalQuestionsSection.tsx`**
  - Legal questions form

- **`src/components/contracting/sections/BankingSection.tsx`**
  - Banking information fields

- **`src/components/contracting/sections/TrainingSection.tsx`**
  - Training and certification fields

- **`src/components/contracting/sections/CarrierSelectionSection.tsx`**
  - Carrier selection interface (if used in form view)

- **`src/components/contracting/sections/SignatureSection.tsx`**
  - Signature capture component

- **`src/components/contracting/sections/BackgroundSignatureSection.tsx`**
  - Background check signature component

- **`src/components/contracting/sections/MarketingConsentSection.tsx`**
  - Marketing consent checkbox

### Supporting Components

- **`src/components/contracting/WizardProgress.tsx`**
  - Progress indicator showing current step and completion status

- **`src/components/contracting/SectionNav.tsx`**
  - Navigation component for section-based form view

- **`src/components/contracting/SectionAcknowledgment.tsx`**
  - Component for section-level acknowledgments

- **`src/components/contracting/FileDropZone.tsx`**
  - File upload component with drag-and-drop support

- **`src/components/contracting/FormFieldError.tsx`**
  - Error display component for form fields

- **`src/components/contracting/ValidationBanner.tsx`**
  - Validation error banner component

- **`src/components/contracting/InitialsPad.tsx`**
  - Initials input component with signature pad

- **`src/components/contracting/SignaturePad.tsx`**
  - Signature capture component

- **`src/components/contracting/InitialsAcknowledgmentBar.tsx`**
  - Bar component showing initials acknowledgment status

### Test Mode Components

These components are used for debugging and testing PDF generation:

- **`src/components/contracting/TestModeValidationReport.tsx`**
  - Displays validation results in test mode

- **`src/components/contracting/TestModeSnapshotPanel.tsx`**
  - Shows snapshot of submission data

- **`src/components/contracting/TestModeSchemaPanel.tsx`**
  - Displays schema information

- **`src/components/contracting/TestModeMappingReport.tsx`**
  - Shows PDF field mapping report

- **`src/components/contracting/TestModeSignatureFieldsPanel.tsx`**
  - Displays signature field information

- **`src/components/contracting/TestModeEdgeLogsPanel.tsx`**
  - Shows edge function logs for debugging

- **`src/components/contracting/TestModePdfPreviewPanel.tsx`**
  - PDF preview component for test mode

- **`src/components/contracting/TestModePdfDebugPanel.tsx`**
  - PDF debugging information panel

### Admin Components

- **`src/components/admin/ContractingSubmissionDetail.tsx`**
  - Detailed view of a contracting submission
  - Used in the admin contracting queue
  - Displays all submission data, documents, and allows status updates
  - Includes carrier status panel and hierarchy assignment

---

## Edge Functions

All edge functions are located in `supabase/functions/`:

- **`supabase/functions/generate-contracting-pdf/index.ts`**
  - Generates the contracting packet PDF from application data
  - Maps form fields to PDF template fields
  - Handles signature placement and document generation
  - Version 5 (Form Data Compatible)
  - Returns PDF as base64 and mapping report

- **`supabase/functions/send-contracting-packet/index.ts`**
  - Sends the contracting packet via email using Resend API
  - Attaches generated PDF and uploaded documents
  - Validates submission data before sending
  - Handles file attachments and email formatting

- **`supabase/functions/reset-contracting-status/index.ts`**
  - Admin utility to reset an agent's contracting status
  - Clears contracting application data
  - Removes uploaded documents from storage
  - Resets carrier statuses
  - Requires super admin role
  - Used for testing and re-onboarding agents

---

## Hooks

- **`src/hooks/useContractingApplication.ts`**
  - Main hook for managing contracting application state
  - Handles loading, saving, and updating application data
  - Auto-save functionality with debouncing
  - Document upload and deletion
  - Application submission
  - Integrates with Supabase `contracting_applications` table

- **`src/hooks/useContractingPdf.ts`**
  - Hook for PDF generation functionality
  - Calls `generate-contracting-pdf` edge function
  - Handles PDF download and preview
  - Returns mapping reports and signature field information
  - Error handling for PDF generation

- **`src/hooks/useContractingValidation.ts`**
  - Validation logic for contracting forms
  - Validates all form fields and sections
  - Returns validation results with error messages
  - Used by form components to ensure data completeness
  - Includes field-level and form-level validation

---

## Types & Utilities

- **`src/types/contracting.ts`**
  - TypeScript type definitions for contracting
  - `ContractingApplication` interface
  - `Address`, `LegalQuestion`, `SelectedCarrier` interfaces
  - `WIZARD_STEPS` constant array
  - `LEGAL_QUESTIONS` constant array
  - `PRODUCT_TAGS` constant array
  - `Carrier` interface
  - Helper functions for empty application creation

---

## Data Files

- **`src/data/sampleContractingPayload.ts`**
  - Sample contracting application payload for testing
  - Comprehensive test data including all form fields
  - Used for PDF generation testing and development
  - Includes realistic test values for all sections

---

## Templates & Assets

### PDF Templates

- **`public/templates/TIG_Contracting_Packet_Template.pdf`**
  - Original contracting packet PDF template

- **`public/templates/TIG_Contracting_Packet_SIGNATURES_FIXED.pdf`**
  - Updated template with fixed signature fields

- **`public/downloads/Tyler_Insurance_Group_Contracting_Packet.pdf`**
  - Generated contracting packet (download location)

---

## Database Tables

The contracting flow uses the following Supabase tables:

- **`contracting_applications`**
  - Main table storing all contracting application data
  - Includes all form fields, status, step tracking, documents

- **`profiles`**
  - User profiles with `onboarding_status` field
  - Status values: `CONTRACTING_REQUIRED`, `CONTRACTING_IN_PROGRESS`, etc.

- **`carrier_statuses`**
  - Tracks carrier contracting status for each agent

- **`contracting-documents`** (Storage bucket)
  - Stores uploaded documents (licenses, E&O, voided checks, etc.)
  - Organized by user_id

---

## Routes

Contracting-related routes defined in `src/App.tsx`:

- `/contracting` - Main contracting wizard (protected, requires `CONTRACTING_REQUIRED` status)
- `/contracting-hub` - Contracting hub for completed agents
- `/admin/contracting` - Admin contracting queue (requires admin role)

---

## Key Features

1. **8-Step Wizard Flow**
   - Welcome → Personal Info → Licensing → Legal → Banking → Training → Agreements → Review

2. **Auto-Save**
   - Automatic saving with 800ms debounce
   - Progress tracking and step completion

3. **Document Upload**
   - Multiple document types (license, E&O, voided check, etc.)
   - Storage in Supabase storage bucket

4. **PDF Generation**
   - Dynamic PDF generation from form data
   - Field mapping to PDF template
   - Signature placement

5. **Validation**
   - Comprehensive form validation
   - Field-level and section-level validation
   - Real-time error display

6. **Admin Review**
   - Queue interface for reviewing submissions
   - Status management (submitted, approved, rejected)
   - Document viewing and download

---

## Notes

- The wizard is locked to agents with `CONTRACTING_REQUIRED` onboarding status
- Auto-save occurs on field changes with debouncing
- PDF generation requires all required fields and signatures
- Test mode available for debugging PDF generation and field mapping
- Edge functions handle PDF generation and email sending server-side
- All uploaded documents are stored in Supabase storage with user_id organization

---

## Database Schema

### `contracting_applications` Table

| Column | Data Type | Nullable | Description |
|--------|-----------|----------|-------------|
| `id` | uuid | No | Primary key |
| `user_id` | uuid | No | Foreign key to auth.users |
| `current_step` | integer | No | Current step in wizard (1-8) |
| `completed_steps` | integer[] | No | Array of completed step numbers |
| `status` | text | No | Status: 'in_progress', 'submitted', 'approved', 'rejected' |
| `is_test` | boolean | Yes | Whether this is test data |
| `submitted_at` | timestamptz | Yes | When application was submitted |
| `created_at` | timestamptz | No | Creation timestamp |
| `updated_at` | timestamptz | No | Last update timestamp |

**Personal Information:**
- `full_legal_name` (text)
- `agency_name` (text)
- `agency_tax_id` (text)
- `gender` (text)
- `birth_date` (date)
- `birth_city` (text)
- `birth_state` (text)
- `npn_number` (text)
- `insurance_license_number` (text)
- `tax_id` (text)
- `email_address` (text)
- `phone_mobile` (text)
- `phone_business` (text)
- `phone_home` (text)
- `fax` (text)
- `preferred_contact_methods` (text[])

**Addresses (JSONB):**
- `home_address` (jsonb)
- `mailing_address_same_as_home` (boolean)
- `mailing_address` (jsonb)
- `ups_address_same_as_home` (boolean)
- `ups_address` (jsonb)
- `previous_addresses` (jsonb array)

**Licensing:**
- `resident_license_number` (text)
- `resident_state` (text)
- `license_expiration_date` (date)
- `non_resident_states` (text[])
- `drivers_license_number` (text)
- `drivers_license_state` (text)

**Legal Questions (JSONB):**
- `legal_questions` (jsonb) - Stores answers and explanations for all legal questions

**Banking:**
- `bank_routing_number` (text)
- `bank_account_number` (text)
- `bank_branch_name` (text)
- `beneficiary_name` (text)
- `beneficiary_relationship` (text)
- `beneficiary_birth_date` (date)
- `beneficiary_drivers_license_number` (text)
- `beneficiary_drivers_license_state` (text)
- `requesting_commission_advancing` (boolean)

**Training & Certificates:**
- `has_aml_course` (boolean)
- `aml_course_name` (text)
- `aml_course_date` (date)
- `aml_training_provider` (text)
- `aml_completion_date` (date)
- `has_ltc_certification` (boolean)
- `state_requires_ce` (boolean)
- `eo_not_yet_covered` (boolean)
- `eo_provider` (text)
- `eo_policy_number` (text)
- `eo_expiration_date` (date)
- `is_finra_registered` (boolean)
- `finra_broker_dealer_name` (text)
- `finra_crd_number` (text)

**Carriers & Agreements:**
- `selected_carriers` (jsonb array)
- `is_corporation` (boolean)
- `agreements` (jsonb)
- `section_acknowledgments` (jsonb)

**Signatures:**
- `signature_name` (text)
- `signature_initials` (text)
- `signature_date` (timestamptz)

**Documents:**
- `uploaded_documents` (jsonb) - Maps document types to storage paths

**Other:**
- `contract_level` (varchar(50))
- `upline_id` (varchar(100))
- `sent_to_upline_at` (timestamptz)
- `sent_to_upline_by` (uuid)
- `disciplinary_entries` (jsonb)

### `carriers` Table

| Column | Data Type | Nullable | Description |
|--------|-----------|----------|-------------|
| `id` | uuid | No | Primary key |
| `name` | text | No | Carrier name |
| `code` | text | No | Unique carrier code |
| `display_name` | text | Yes | Display name for UI |
| `is_active` | boolean | No | Whether carrier is active |
| `state_availability` | text[] | Yes | Array of available states |
| `product_tags` | text[] | Yes | Product categories/tags |
| `requires_corporate_resolution` | boolean | No | Requires corporate resolution |
| `requires_non_resident_states` | boolean | No | Requires non-resident states info |
| `notes` | text | Yes | Additional notes |
| `created_at` | timestamptz | No | Creation timestamp |
| `updated_at` | timestamptz | No | Last update timestamp |

### `carrier_statuses` Table

| Column | Data Type | Nullable | Description |
|--------|-----------|----------|-------------|
| `id` | uuid | No | Primary key |
| `user_id` | uuid | No | Foreign key to auth.users |
| `carrier_id` | uuid | No | Foreign key to carriers |
| `contracting_status` | text | No | Status: 'not_started', 'in_progress', 'contracted', 'issue' |
| `contracting_submitted_at` | timestamptz | Yes | When contracting was submitted to carrier |
| `contracted_at` | timestamptz | Yes | When agent was contracted/appointed |
| `issue_description` | text | Yes | Description of any issues |
| `contracting_link_url` | text | Yes | URL to carrier contracting application |
| `contracting_link_sent_at` | timestamptz | Yes | When contracting link was sent |
| `link_resend_requested_at` | timestamptz | Yes | When resend was requested |
| `created_at` | timestamptz | No | Creation timestamp |
| `updated_at` | timestamptz | No | Last update timestamp |

**Constraints:**
- Unique constraint on (`user_id`, `carrier_id`)

### `profiles` Table (Contracting-Related Fields)

| Column | Data Type | Nullable | Description |
|--------|-----------|----------|-------------|
| `user_id` | uuid | No | Foreign key to auth.users |
| `onboarding_status` | enum | Yes | Status: 'CONTRACTING_REQUIRED', 'CONTRACTING_SUBMITTED', 'APPOINTED', 'SUSPENDED' |
| `appointed_at` | timestamptz | Yes | When agent was appointed |
| `contracting_notes` | text | Yes | Admin notes on contracting |

---

## Current Flow Diagram

### Agent Contracting Flow

```
1. AGENT CREATION
   └─> Admin creates agent via /admin/agents
       └─> Profile created with onboarding_status = 'CONTRACTING_REQUIRED'
       └─> Setup email sent (if enabled)
       └─> Agent receives email with setup link

2. AGENT SETUP
   └─> Agent clicks setup link
       └─> Creates password
       └─> Logs in
       └─> Redirected to /contracting (locked to CONTRACTING_REQUIRED status)

3. CONTRACTING WIZARD (8 Steps)
   └─> Step 1: Welcome
       └─> Enter initials
       └─> Auto-saved to contracting_applications.signature_initials
   
   └─> Step 2: Personal & Contact Info
       └─> Full legal name, DOB, SSN, contact info
       └─> Auto-saved on field change (800ms debounce)
   
   └─> Step 3: Licensing & ID
       └─> NPN, state license, license upload
       └─> Driver's license info
       └─> Documents uploaded to: contracting-documents/{user_id}/{document_type}/
   
   └─> Step 4: Legal Questions
       └─> Yes/No questions with explanations
       └─> Stored in legal_questions JSONB field
   
   └─> Step 5: Banking
       └─> Bank routing/account numbers
       └─> Voided check upload
       └─> Beneficiary information
   
   └─> Step 6: Training & Certificates
       └─> AML course info
       └─> E&O insurance details
       └─> E&O certificate upload
   
   └─> Step 7: Agreements & Signature
       └─> Accept terms and agreements
       └─> Capture signature (stored as image)
       └─> Signature date recorded
   
   └─> Step 8: Review & Submit
       └─> Final review of all data
       └─> Click "Submit Application"

4. SUBMISSION PROCESS
   └─> PDF Generation
       └─> Calls generate-contracting-pdf edge function
       └─> Maps all form fields to PDF template
       └─> Embeds signature images
       └─> Generates PDF as base64
       └─> Saves PDF to storage: contracting-documents/{user_id}/contracting_packet/
   
   └─> Database Updates
       └─> contracting_applications.status = 'submitted'
       └─> contracting_applications.submitted_at = now()
       └─> profiles.onboarding_status = 'CONTRACTING_SUBMITTED'
   
   └─> Email Notification (if enabled)
       └─> Calls send-contracting-packet edge function
       └─> Sends confirmation email to agent with PDF attachment
       └─> (Internal email to Caroline is currently disabled - see TODOs)

5. ADMIN REVIEW
   └─> Admin views queue at /admin/contracting
       └─> Sees list of submissions
       └─> Filters by status (submitted, approved, rejected)
       └─> Views submission details
       └─> Reviews uploaded documents
       └─> Checks carrier statuses
   
   └─> Admin Actions
       └─> Approve: Sets status to 'approved', updates profile to 'APPOINTED'
       └─> Reject: Sets status to 'rejected'
       └─> Update carrier statuses individually
       └─> Assign hierarchy/manager

6. APPOINTMENT
   └─> When admin approves:
       └─> contracting_applications.status = 'approved'
       └─> profiles.onboarding_status = 'APPOINTED'
       └─> profiles.appointed_at = now()
       └─> Agent can now access full platform
```

### Document Storage Structure

```
contracting-documents/
└── {user_id}/
    ├── insurance_license/
    │   └── {timestamp}_license.pdf
    ├── eo_certificate/
    │   └── {timestamp}_eo.pdf
    ├── voided_check/
    │   └── {timestamp}_check.pdf
    ├── background_signature/
    │   └── {timestamp}_signature.png
    ├── signature_image/
    │   └── {timestamp}_signature.png
    └── contracting_packet/
        └── {timestamp}_contracting_packet.pdf
```

---

## Key Files Content

### Main Contracting Wizard Page

**File:** `src/components/contracting/ContractingWizard.tsx`

```typescript
import { Loader2, LogOut, Check } from 'lucide-react';
import { useContractingApplication } from '@/hooks/useContractingApplication';
import { WizardProgress } from './WizardProgress';
import { WelcomeStep } from './steps/WelcomeStep';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { LicensingStep } from './steps/LicensingStep';
import { LegalQuestionsStep } from './steps/LegalQuestionsStep';
import { BankingStep } from './steps/BankingStep';
import { TrainingStep } from './steps/TrainingStep';
import { AgreementsStep } from './steps/AgreementsStep';
import { ReviewStep } from './steps/ReviewStep';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { useState, useEffect } from 'react';

export function ContractingWizard() {
  const { profile } = useProfile();
  const {
    application,
    loading,
    saving,
    lastSaved,
    updateField,
    goToStep,
    completeStepAndNext,
    submitApplication,
    uploadDocument,
    deleteDocument,
  } = useContractingApplication();

  // Track when to show "Saved" confirmation
  const [showSaved, setShowSaved] = useState(false);
  
  useEffect(() => {
    if (lastSaved) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.log('Logout error:', error);
    }
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    toast.success("Logged out successfully");
    window.location.href = '/auth';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground/70">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
        <p className="text-muted-foreground">Unable to load application</p>
      </div>
    );
  }

  // Show submitted state
  if (application.status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
        <Card 
          className="max-w-lg w-full text-center rounded-[28px] border-0"
          style={{ 
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
            boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
          }}
        >
          <CardHeader className="space-y-6 pt-12">
            <div className="relative pb-6">
              <img src={tylerLogo} alt="Tyler Insurance Group" className="h-14 mx-auto" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
            </div>
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-serif" style={{ letterSpacing: '0.025em' }}>Contracting Under Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pb-12 px-10">
            <p className="text-muted-foreground/70 text-[15px] leading-relaxed">
              Your contracting documents have been submitted and are being reviewed. You'll receive an email once approved.
            </p>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="gap-2 h-12 px-6 border-foreground/12 hover:bg-secondary/30 rounded-2xl"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStep = () => {
    const progressProps = {
      currentStep: application.current_step,
      completedSteps: application.completed_steps,
      onStepClick: goToStep,
    };

    switch (application.current_step) {
      case 1:
        return (
          <WelcomeStep
            fullName={profile?.full_name || application.full_legal_name}
            initials={application.signature_initials}
            onInitialsChange={(initials) => updateField('signature_initials', initials)}
            onContinue={() => completeStepAndNext(1)}
          />
        );
      case 2:
        return (
          <PersonalInfoStep
            application={application}
            initials={application.signature_initials}
            onUpdate={updateField}
            onBack={() => goToStep(1)}
            onContinue={() => completeStepAndNext(2)}
            progressProps={progressProps}
          />
        );
      case 3:
        return (
          <LicensingStep
            application={application}
            initials={application.signature_initials}
            onUpdate={updateField}
            onUpload={uploadDocument}
            onRemove={deleteDocument}
            onBack={() => goToStep(2)}
            onContinue={() => completeStepAndNext(3)}
            progressProps={progressProps}
          />
        );
      case 4:
        return (
          <LegalQuestionsStep
            application={application}
            initials={application.signature_initials}
            onUpdate={updateField}
            onUpload={uploadDocument}
            onRemove={deleteDocument}
            onBack={() => goToStep(3)}
            onContinue={() => completeStepAndNext(4)}
            progressProps={progressProps}
          />
        );
      case 5:
        return (
          <BankingStep
            application={application}
            initials={application.signature_initials}
            onUpdate={updateField}
            onUpload={uploadDocument}
            onRemove={deleteDocument}
            onBack={() => goToStep(4)}
            onContinue={() => completeStepAndNext(5)}
            progressProps={progressProps}
          />
        );
      case 6:
        return (
          <TrainingStep
            application={application}
            initials={application.signature_initials}
            onUpdate={updateField}
            onUpload={uploadDocument}
            onRemove={deleteDocument}
            onBack={() => goToStep(5)}
            onContinue={() => completeStepAndNext(6)}
            progressProps={progressProps}
          />
        );
      case 7:
        return (
          <AgreementsStep
            application={application}
            initials={application.signature_initials}
            onUpdate={updateField}
            onBack={() => goToStep(6)}
            onContinue={() => completeStepAndNext(7)}
            progressProps={progressProps}
          />
        );
      case 8:
        return (
          <ReviewStep
            application={application}
            onBack={() => goToStep(7)}
            onSubmit={submitApplication}
            progressProps={progressProps}
          />
        );
      default:
        return null;
    }
  };

  const isEarlyStep = application.current_step <= 2;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
      {/* Header with logo and logout - subtle on early steps */}
      <div className={`border-b backdrop-blur-sm ${isEarlyStep ? 'border-transparent bg-transparent' : 'border-border/20 bg-white/60'}`}>
        <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {isEarlyStep ? (
            <div /> 
          ) : (
            <img src={tylerLogo} alt="Tyler Insurance Group" className="h-8" />
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className={`gap-2 ${isEarlyStep ? 'text-muted-foreground/30 hover:text-muted-foreground/60 opacity-60' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LogOut className="h-3.5 w-3.5" />
            {!isEarlyStep && 'Log Out'}
          </Button>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto py-2 px-4 flex flex-col flex-1">
        {/* Elegant auto-save indicator - subtle and non-intrusive */}
        <div className="h-5 flex items-center justify-center">
          <div 
            className={`flex items-center gap-1.5 text-[11px] transition-all duration-300 ${
              saving 
                ? 'opacity-60 text-muted-foreground/50' 
                : showSaved 
                  ? 'opacity-100 text-primary/70' 
                  : 'opacity-0'
            }`}
          >
            {saving ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                <span>Saving</span>
              </>
            ) : showSaved ? (
              <>
                <Check className="h-3 w-3" />
                <span>Saved</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Current step - progress is now inside each step card */}
        <div className="flex-1">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
```

### Contracting Queue Page (Admin View)

**File:** `src/pages/admin/ContractingQueuePage.tsx`

[Full source code is 391 lines - see file for complete implementation]

**Key Features:**
- Two-panel layout: submissions list on left, details on right
- Search by name, email, or NPN
- Filter by status (All, New, Approved, Rejected)
- Toggle to hide test data
- "Waiting on Agent" section for agents who haven't started wizard
- Auto-selects first submission
- Integrates with `ContractingSubmissionDetail` component

### PDF Generation Edge Function

**File:** `supabase/functions/generate-contracting-pdf/index.ts`

[Full source code is 1086 lines - see file for complete implementation]

**Key Features:**
- Version 5 (Form Data Compatible)
- Handles both `street` and `street1/street2` address formats
- Maps all form fields to PDF template fields
- Handles legal questions with radio groups
- Carrier selection with checkboxes and non-resident states
- Signature image embedding
- Field mapping report generation
- Optional storage saving

### Send Contracting Packet Edge Function

**File:** `supabase/functions/send-contracting-packet/index.ts`

[Full source code is 201 lines - see file for complete implementation]

**Key Features:**
- Validates submission data
- Sends confirmation email to agent with PDF attachment
- Internal email to Caroline is currently disabled (see TODOs)
- Uses Resend API for email delivery

---

## Known Issues & TODOs

### TODOs Found in Code

1. **`supabase/functions/send-contracting-packet/index.ts` (Line 101)**
   ```typescript
   // TODO: Re-enable this when ready for production
   ```
   - Internal email notification to Caroline is currently disabled
   - Code is commented out but ready to be enabled
   - Should be re-enabled before production deployment

### Known Issues

1. **Carrier Selection Removed from Wizard**
   - The wizard originally had carrier selection as Step 7, but it was removed
   - Current wizard is 8 steps (carrier selection happens elsewhere or is handled differently)
   - Reference in `src/types/contracting.ts` shows carrier selection was part of the flow

2. **Appointment Status Update**
   - Currently requires manual admin action to mark agent as "APPOINTED"
   - No automatic status update when all carriers are appointed
   - Gap identified in `PlatformExperienceMapPage.tsx`: "Need celebration UI, automatic status update when all carriers appointed"

3. **PDF Field Mapping**
   - Some PDF fields may not map correctly if template changes
   - Field mapping relies on exact field names from PDF template
   - Test mode available for debugging field mappings

4. **Document Storage Paths**
   - Document paths stored in `uploaded_documents` JSONB field
   - Path format: `{user_id}/{document_type}/{timestamp}_{filename}`
   - Ensure consistency when accessing documents

5. **Address Format Handling**
   - PDF generation handles both `street` and `street1/street2` formats
   - Form may use one format while PDF expects another
   - Conversion logic exists in `generate-contracting-pdf` function

6. **Test Mode**
   - Test mode available via feature flag
   - Test submissions marked with `is_test` flag
   - Can be filtered in admin queue

### Incomplete Features

1. **Carrier Status Tracking**
   - `carrier_statuses` table exists but may not be fully integrated
   - Per-carrier appointment tracking needs verification
   - Status updates may require manual admin intervention

2. **Email Notifications**
   - Agent confirmation email works
   - Internal notification email disabled
   - No email sent when status changes to approved/rejected

3. **Automatic Status Updates**
   - No automatic update from `CONTRACTING_SUBMITTED` to `APPOINTED`
   - Requires manual admin approval
   - No automatic update when all carriers are appointed

### Debug/Development Notes

1. **Test Mode Debugging**
   - Extensive test mode components for PDF debugging
   - Debug logs captured from edge functions
   - Mapping reports show field-by-field status

2. **Console Logging**
   - Debug logging in `ContractingForm.tsx` for submission data
   - PDF generation logs mapping successes/failures
   - Edge function logs available via `fetch-edge-logs` function

3. **Field Validation**
   - Validation happens client-side via `useContractingValidation`
   - Server-side validation in edge functions
   - Some fields may be optional but should be required for submission

