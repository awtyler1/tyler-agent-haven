# Software Architecture Analysis

**Project:** Tyler Agent Haven (TIG Agent Hub)
**Analysis Date:** January 12, 2026
**Analyst:** Senior Software Architect Review

---

## Executive Summary

This codebase demonstrates a well-structured React/TypeScript application with Supabase backend, but reveals several architectural concerns that will impede scaling and maintainability. The most critical issues center around:

1. **Single Responsibility Violations** in core hooks (`useUserManagement`, `useContractingApplication`, `useContractingPdf`)
2. **Significant DRY Violations** with identical code duplicated across 18 edge functions and validation logic in 3+ locations
3. **Missing Abstraction Layer** for data access with Supabase queries scattered across 30+ files
4. **Type Safety Gaps** with 60+ instances of `any` type and unsafe type assertions
5. **No React Error Boundaries** leaving the app vulnerable to render crashes

**Overall Architecture Health Score: 6.5/10**

The foundation is solid, but targeted refactoring will significantly improve developer velocity and reduce bug risk as the team scales.

---

## Table of Contents

1. [Detailed Findings](#detailed-findings)
2. [Patterns to Preserve](#patterns-to-preserve)
3. [Recommended Refactoring Roadmap](#recommended-refactoring-roadmap)
4. [Architecture Diagrams](#architecture-diagrams)

---

## Detailed Findings

### SRP-001: useUserManagement Hook Violates Single Responsibility

**Location:** `src/hooks/useUserManagement.ts`

**Problem:**
This hook performs 6 distinct responsibilities in 176 lines:
- Fetching and mapping user data (lines 24-71)
- Creating new users via edge function (lines 73-98)
- Sending setup links (lines 100-116)
- Updating user roles (lines 118-140)
- Toggling user active status (lines 142-158)
- Updating user profiles (lines 160-176)

Each operation is tightly coupled to toast notifications, making the hook impossible to use without UI side effects.

**Impact:**
- Changeability: Adding a new user operation requires modifying this 176-line file
- Risk: Changes to one operation (e.g., create user) could inadvertently affect others
- Developer Experience: Cannot import just "user creation" without the entire management system

**Solution:**
Split into focused hooks with single responsibilities:
```typescript
// Before: One massive hook
const { users, createUser, sendSetupLink, updateRole, toggleActive } = useUserManagement();

// After: Composable focused hooks
const { users, loading } = useFetchUsers();
const { createUser, isCreating } = useCreateUser();
const { updateRole } = useUserRole();
const { toggleActive } = useUserActivation();
```

**Priority:** Critical

---

### SRP-002: useContractingApplication Hook - 6 Responsibilities

**Location:** `src/hooks/useContractingApplication.ts`

**Problem:**
Single hook manages:
1. Fetching/creating application and carriers (lines 38-103)
2. Debounced auto-save with refs (lines 106-128)
3. Single field updates (lines 131-152)
4. Bulk field updates (lines 155-175)
5. Application submission with PDF generation (lines 197-253)
6. Document upload/deletion (lines 256-308)

Complex internal state with `saveTimeoutRef` and `pendingUpdatesRef` makes this hook difficult to understand and test.

**Impact:**
- Changeability: Any modification to save behavior risks breaking document uploads
- Risk: Ref-based state can lead to stale closures and subtle bugs
- Developer Experience: 300+ lines to understand for any contracting change

**Solution:**
```typescript
// Decompose into focused hooks
const { application, carriers } = useFetchApplication(userId);
const { updateField, saving, lastSaved } = useApplicationAutoSave(application);
const { submit, submitting } = useApplicationSubmission(application);
const { uploadDocument, deleteDocument } = useApplicationDocuments(applicationId);
```

**Priority:** Critical

---

### SRP-003: useContractingPdf Contains 339-Line Method

**Location:** `src/hooks/useContractingPdf.ts` (lines 73-411)

**Problem:**
The `generatePdf` method spans 339 lines handling:
- Application validation
- Template fetching
- Array normalization
- Session validation
- Edge function invocation
- 401 error handling with retry logic (120 lines duplicated!)
- Success/error handling

Lines 174-240 and 266-329 contain nearly identical edge function call logic.

**Impact:**
- Changeability: Any PDF generation change requires understanding 339 lines
- Risk: Duplicated retry logic can diverge over time
- Developer Experience: Impossible to unit test individual pieces

**Solution:**
```typescript
// Extract into composable functions
const validateApplication = (app: ContractingApplication): ValidationResult => {...};
const fetchPdfTemplate = async (): Promise<Uint8Array> => {...};
const invokeGeneratePdf = async (params: PdfParams): Promise<PdfResult> => {...};

// Main hook becomes orchestrator
const generatePdf = async (application) => {
  const validation = validateApplication(application);
  if (!validation.isValid) return { success: false, errors: validation.errors };

  const template = await fetchPdfTemplate();
  return invokeGeneratePdf({ application, template });
};
```

**Priority:** High

---

### DRY-001: CORS Headers Duplicated Across 18 Edge Functions

**Location:** All files in `supabase/functions/*/index.ts`

**Problem:**
Every edge function contains identical CORS configuration:
```typescript
const allowedOrigins = [
  "https://www.tigagenthub.com",
  "https://tigagenthub.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}
```

Note: `delete-user` has a slightly different version with `localhost:8080` added, demonstrating drift.

**Impact:**
- Changeability: Adding a new allowed origin requires editing 18 files
- Risk: CORS configurations have already diverged (delete-user differs)
- Developer Experience: Copy-paste when creating new functions

**Solution:**
Create shared Deno module:
```typescript
// supabase/functions/_shared/cors.ts
export const ALLOWED_ORIGINS = [
  "https://www.tigagenthub.com",
  "https://tigagenthub.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

export function getCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("Origin") || "";
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}
```

**Priority:** Critical

---

### DRY-002: Authentication Logic Duplicated in 14 Edge Functions

**Location:** `supabase/functions/{create-admin,create-agent,send-setup-link,delete-user,...}/index.ts`

**Problem:**
Same authentication pattern repeated:
```typescript
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  throw new Error("No authorization header");
}

const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
  authHeader.replace("Bearer ", "")
);

if (authError || !user) {
  throw new Error("Unauthorized");
}

const { data: roles, error: rolesError } = await supabaseAdmin
  .from("user_roles")
  .select("role")
  .eq("user_id", user.id)
  .in("role", ["super_admin", "admin"]);

if (!roles || roles.length === 0) {
  throw new Error("Unauthorized: Admin role required");
}
```

Different functions have slightly different role requirements with no centralization.

**Impact:**
- Changeability: Security policy changes require 14 file edits
- Risk: Authentication bugs could be fixed in some functions but not others
- Developer Experience: Easy to forget a security check when creating new functions

**Solution:**
```typescript
// supabase/functions/_shared/auth.ts
export async function requireAdmin(req: Request, supabase: SupabaseClient): Promise<User> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new AuthError("No authorization header", 401);

  const { data: { user }, error } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (error || !user) throw new AuthError("Unauthorized", 401);

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["super_admin", "admin"]);

  if (!roles?.length) throw new AuthError("Admin role required", 403);
  return user;
}

export async function requireSuperAdmin(req: Request, supabase: SupabaseClient): Promise<User> {...}
export async function requireAuthenticated(req: Request, supabase: SupabaseClient): Promise<User> {...}
```

**Priority:** Critical

---

### DRY-003: Validation Functions Duplicated Across Files

**Location:**
- `src/hooks/useFormValidation.ts` (lines 65-68)
- `src/hooks/useContractingValidation.ts` (lines 34-55)
- `src/lib/formatters.ts` (implicit validation)

**Problem:**
Same validation logic defined multiple times:
```typescript
// useFormValidation.ts:65-68
const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone: string): boolean => phone.replace(/\D/g, '').length === 10;
const isValidSSN = (ssn: string): boolean => ssn.replace(/\D/g, '').length === 9;
const isValidRouting = (routing: string): boolean => routing.replace(/\D/g, '').length === 9;

// useContractingValidation.ts:34-55 - IDENTICAL LOGIC
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
const isValidPhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10;
};
```

Additionally, `formatters.ts` has full ABA checksum validation for routing numbers that the hooks don't use.

**Impact:**
- Changeability: Phone validation change requires updates in 2+ files
- Risk: `formatters.ts` has better routing validation than hooks - inconsistency
- Developer Experience: Which validation function to use?

**Solution:**
```typescript
// src/lib/validation.ts - Single source of truth
export const validators = {
  email: (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone: string): boolean => phone.replace(/\D/g, '').length === 10,
  ssn: (ssn: string): boolean => ssn.replace(/\D/g, '').length === 9,
  routingNumber: (routing: string): boolean => {
    const digits = routing.replace(/\D/g, '');
    if (digits.length !== 9) return false;
    // Include ABA checksum validation
    return validateABAChecksum(digits);
  },
  address: (addr: Address | null): boolean => {
    if (!addr) return false;
    return !!(addr.street?.trim() && addr.city?.trim() && addr.state && addr.zip?.trim());
  },
};
```

**Priority:** High

---

### DRY-004: getFieldClass Duplicated in 5+ Form Sections

**Location:**
- `src/components/contracting/sections/PersonalInfoSection.tsx` (lines 27-34)
- `src/components/contracting/sections/LicensingSection.tsx` (lines 22-29)
- `src/components/contracting/sections/BankingSection.tsx` (lines 27-34)
- `src/components/contracting/sections/SignSubmitSection.tsx` (lines 31-38)
- `src/components/contracting/sections/HomeAddressSection.tsx` (lines 33-40)

**Problem:**
Identical function in every form section:
```typescript
const getFieldClass = (fieldName: string) => {
  const hasError = fieldErrors[fieldName] && (showValidation || fieldErrors[fieldName]);
  const isSuccess = fieldSuccess[fieldName];

  if (hasError) return "border-amber-400 focus:ring-amber-400/20";
  if (isSuccess) return "border-green-400/50";
  return "border-slate-200";
};
```

**Impact:**
- Changeability: Styling change requires 5+ file edits
- Risk: Easy to miss a file when updating validation styles
- Developer Experience: Copy-paste when creating new sections

**Solution:**
```typescript
// src/components/contracting/utils/fieldStyles.ts
export function getFieldClass(
  fieldName: string,
  fieldErrors: Record<string, string>,
  fieldSuccess: Record<string, boolean>,
  showValidation: boolean
): string {
  const hasError = fieldErrors[fieldName] && (showValidation || fieldErrors[fieldName]);
  const isSuccess = fieldSuccess[fieldName];

  if (hasError) return "border-amber-400 focus:ring-amber-400/20";
  if (isSuccess) return "border-green-400/50";
  return "border-slate-200";
}

// Or use a hook
export function useFieldStyles(fieldErrors, fieldSuccess, showValidation) {
  return useCallback((fieldName: string) => getFieldClass(...), [fieldErrors, fieldSuccess, showValidation]);
}
```

**Priority:** Medium

---

### DRY-005: QUESTION_HIERARCHY Defined in 3 Locations

**Location:**
- `src/components/contracting/ContractingForm.tsx` (lines 373-380)
- `src/components/contracting/sections/BackgroundQuestionsSection1.tsx` (lines 10-17)
- `src/hooks/useFormValidation.ts` (implicit in switch statement)

**Problem:**
```typescript
const QUESTION_HIERARCHY = {
  '1': ['1a', '1b', '1c', '1d', '1e', '1f', '1g', '1h'],
  '2': ['2a', '2b', '2c', '2d'],
  '5': ['5a', '5b', '5c'],
  '8': ['8a', '8b'],
  '14': ['14a', '14c'],
  '15': ['15a', '15b', '15c'],
};
```

**Impact:**
- Changeability: Adding question 16 requires 3 file updates
- Risk: Hierarchy can get out of sync between files
- Developer Experience: Which is the "real" hierarchy?

**Solution:**
```typescript
// src/data/legalQuestions.ts
export const QUESTION_HIERARCHY: Record<string, string[]> = {
  '1': ['1a', '1b', '1c', '1d', '1e', '1f', '1g', '1h'],
  '2': ['2a', '2b', '2c', '2d'],
  '5': ['5a', '5b', '5c'],
  '8': ['8a', '8b'],
  '14': ['14a', '14c'],
  '15': ['15a', '15b', '15c'],
};

export const getSubQuestions = (parentId: string): string[] =>
  QUESTION_HIERARCHY[parentId] || [];

export const hasSubQuestions = (questionId: string): boolean =>
  questionId in QUESTION_HIERARCHY;
```

**Priority:** Medium

---

### ORTH-001: Contracting Form Sections Tightly Coupled to Parent

**Location:** `src/components/contracting/sections/*.tsx`

**Problem:**
All 12 form sections receive identical 8-prop pattern:
```typescript
<PersonalInfoSection
  application={application}
  onUpdate={updateFieldWithStatus}
  disabled={!initialsEntered}
  fieldErrors={validationState.fieldErrors}
  fieldSuccess={validationState.fieldSuccess}
  showValidation={validationState.hasValidated && !validationState.isFormValid}
  onClearError={clearFieldError}
  onFieldBlur={onFieldBlur}
/>
```

No section can function independently - they all require the parent's validation ecosystem.

**Impact:**
- Changeability: Adding validation requires touching both parent and children
- Risk: Sections cannot be reused in other contexts (e.g., profile editing)
- Developer Experience: Must understand entire validation system to work on any section

**Solution:**
Use React Context for form/validation state:
```typescript
// FormValidationContext.tsx
const FormValidationContext = createContext<FormValidationState | null>(null);

export function FormValidationProvider({ children, validation }) {
  return (
    <FormValidationContext.Provider value={validation}>
      {children}
    </FormValidationContext.Provider>
  );
}

export function useFormValidationContext() {
  const ctx = useContext(FormValidationContext);
  if (!ctx) throw new Error('Must be used within FormValidationProvider');
  return ctx;
}

// Sections become simpler
function PersonalInfoSection({ application, onUpdate, disabled }) {
  const { fieldErrors, fieldSuccess, showValidation, clearFieldError, onFieldBlur } =
    useFormValidationContext();
  // ... component logic
}
```

**Priority:** High

---

### DATA-001: No Data Access Layer - Supabase Queries Scattered

**Location:** 30+ files across hooks, pages, and components

**Problem:**
Profile queries exist in 4+ locations:
- `src/hooks/useProfile.ts` (lines 60-64)
- `src/hooks/useAgentProfile.ts` (lines 30-34)
- `src/pages/admin/AgentsPage.tsx` (lines 73-77)
- `src/hooks/useUserManagement.ts` (lines 36-38)

Each uses slightly different select patterns and error handling.

**Impact:**
- Changeability: Profile schema change requires finding/updating all query locations
- Risk: Inconsistent data shapes returned from different queries
- Developer Experience: "Where is the profile query?" - answer: everywhere

**Solution:**
Create data access layer:
```typescript
// src/services/profileService.ts
export const profileService = {
  async getByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw new DatabaseError('Failed to fetch profile', error);
    return data;
  },

  async getAll(options?: { excludeTest?: boolean }): Promise<Profile[]> {
    let query = supabase.from('profiles').select('*');

    if (options?.excludeTest) {
      query = query.or('is_test.is.null,is_test.eq.false');
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new DatabaseError('Failed to fetch profiles', error);
    return data ?? [];
  },

  async update(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new DatabaseError('Failed to update profile', error);
    return data;
  },
};
```

**Priority:** High

---

### TYPE-001: 60+ Instances of `any` Type

**Location:** Throughout codebase, concentrated in:
- Error handling: `catch (err: any)` - 15+ instances
- Render loops: `plans.map((plan: any, ...)` - 4 instances
- Validation: `validateSingleField(fieldName, value: any, ...)` - multiple

**Problem:**
`any` undermines TypeScript's value proposition. Examples:
```typescript
// useUserManagement.ts:65 - Unsafe error access
} catch (err: any) {
  setError(err.message);  // err might not have message property
}

// CarrierPlansPage.tsx:162 - No type safety on plan structure
{plans.map((plan: any, planIndex: number) => (
  <div>{plan.planName}</div>  // plan could be anything
))}
```

**Impact:**
- Changeability: Can't rely on TypeScript to catch errors when refactoring
- Risk: Runtime errors from incorrect property access
- Developer Experience: No IDE autocomplete or type checking

**Solution:**
```typescript
// For errors - use unknown with type guard
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  setError(message);
}

// For data - define proper types
interface CarrierPlan {
  planName: string;
  nonCommissionable: boolean;
  // ... all fields
}

{plans.map((plan: CarrierPlan, index) => (
  <div>{plan.planName}</div>  // Type-safe
))}
```

**Priority:** High

---

### TYPE-002: Unsafe Type Assertions with `as unknown as`

**Location:** `src/hooks/useContractingApplication.ts` (lines 65, 82)

**Problem:**
Double assertions bypass type checking:
```typescript
setApplication(existingApp as unknown as ContractingApplication);
setApplication(createdApp as unknown as ContractingApplication);
```

The `as unknown as` pattern is a code smell indicating the type system is being circumvented.

**Impact:**
- Changeability: Database schema changes won't be caught by TypeScript
- Risk: Runtime errors if data doesn't match expected shape
- Developer Experience: False sense of type safety

**Solution:**
Use Zod for runtime validation:
```typescript
import { z } from 'zod';

const ContractingApplicationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: z.enum(['in_progress', 'submitted', 'approved', 'rejected']),
  full_legal_name: z.string().nullable(),
  // ... all fields
});

type ContractingApplication = z.infer<typeof ContractingApplicationSchema>;

// Safe parsing with validation
const result = ContractingApplicationSchema.safeParse(existingApp);
if (result.success) {
  setApplication(result.data);
} else {
  console.error('Invalid application data:', result.error);
  toast.error('Data validation failed');
}
```

**Priority:** High

---

### ERR-001: No React Error Boundaries

**Location:** `src/main.tsx`, `src/App.tsx`

**Problem:**
No error boundary wrapping the application. A single component render error crashes the entire app.

**Impact:**
- Changeability: Fear of breaking changes since any error is catastrophic
- Risk: Production users see white screen on any component error
- Developer Experience: Hard to debug which component caused crash

**Solution:**
```typescript
// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-8 text-center">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// main.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Priority:** Critical

---

### ERR-002: Inconsistent Error Handling Patterns

**Location:** Throughout hooks and edge functions

**Problem:**
Four different error handling patterns observed:

1. **Check then throw** (hooks): `if (error) throw error;`
2. **Toast-based** (useContractingApplication): `toast.error('Failed to save');`
3. **Silent failures** (useSystemStatus): `console.error(...); // continues`
4. **Structured responses** (edge functions): `{ status: 400, error: message }`

**Impact:**
- Changeability: No consistent pattern to follow when writing new code
- Risk: Some errors silently swallowed while others surface to users
- Developer Experience: Must read each function to understand its error behavior

**Solution:**
Establish error handling standard:
```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly userMessage: string,
    public readonly severity: 'info' | 'warning' | 'error' = 'error'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Hook pattern
export function useUserManagement() {
  const handleError = useCallback((error: unknown, operation: string) => {
    const appError = error instanceof AppError
      ? error
      : new AppError(
          error instanceof Error ? error.message : 'Unknown error',
          'UNKNOWN',
          `Failed to ${operation}. Please try again.`
        );

    console.error(`${operation} failed:`, appError);
    toast.error(appError.userMessage);
    return appError;
  }, []);

  // Use in operations
  const createUser = async (data: CreateUserData) => {
    try {
      // ... operation
    } catch (err) {
      handleError(err, 'create user');
    }
  };
}
```

**Priority:** Medium

---

## Patterns to Preserve

The codebase demonstrates several excellent patterns that should be maintained and extended:

### 1. Custom Hooks for Domain Logic
Hooks like `useProfile`, `useRole`, and `useContractingApplication` properly encapsulate domain logic. The pattern is correct - the issue is scope, not approach.

### 2. Type-Safe Form Updates with Generics
```typescript
// useContractingApplication.ts - Excellent pattern
const updateField = useCallback(<K extends keyof ContractingApplication>(
  field: K,
  value: ContractingApplication[K]
) => {...}, []);
```
This prevents field/value type mismatches at compile time.

### 3. Toast Notifications for User Feedback
Consistent use of `sonner` toast library provides uniform user feedback. Keep this pattern.

### 4. Graceful Degradation
```typescript
// AddressAutocomplete.tsx - Falls back to plain input
if (!GOOGLE_MAPS_API_KEY || loadError) {
  return <Input ... />;
}
```
External service failures don't break the application.

### 5. Role-Based Access Control Structure
The `useRole` hook with `hasRole()`, `isAdmin()`, `isSuperAdmin()` provides clean permission checking. The pattern is solid.

### 6. shadcn/ui Component Library
Well-structured UI components with consistent styling. Continue using this pattern.

### 7. Feature Flag System
`FeatureFlagsContext` provides clean feature toggling. Good for gradual rollouts.

---

## Recommended Refactoring Roadmap

### Phase 1: Risk Reduction (Week 1-2)

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P0 | Add React Error Boundary | 2 hours | Prevents app crashes |
| P0 | Create shared CORS module for edge functions | 4 hours | Eliminates 18x duplication |
| P0 | Create shared auth module for edge functions | 4 hours | Centralizes security |
| P1 | Replace `any` in error handlers with `unknown` | 4 hours | Type safety |
| P1 | Add Zod validation for ContractingApplication | 8 hours | Runtime safety |

### Phase 2: Developer Velocity (Week 3-4)

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P1 | Extract validation utilities to single file | 4 hours | DRY principle |
| P1 | Create FormValidationContext | 8 hours | Reduces prop drilling |
| P1 | Extract `getFieldClass` to shared utility | 2 hours | DRY principle |
| P2 | Create data access layer (profileService) | 16 hours | Centralized queries |
| P2 | Split `useUserManagement` into focused hooks | 8 hours | SRP compliance |

### Phase 3: Long-term Maintainability (Week 5-6)

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P2 | Split `useContractingApplication` | 12 hours | SRP compliance |
| P2 | Refactor `useContractingPdf.generatePdf` | 8 hours | Testability |
| P2 | Create email template system | 8 hours | DRY, maintainability |
| P3 | Consolidate `QUESTION_HIERARCHY` | 2 hours | Single source of truth |
| P3 | Create discriminated union types | 4 hours | Better domain modeling |

### Quick Wins (Can be done anytime)

- [ ] Remove unused exports from `formatters.ts` (maskSSN, maskEIN, formatEIN, etc.)
- [ ] Remove 4 debug `console.log` statements
- [ ] Extract `fileUrlToBase64` from `useSendEmail.ts` to utilities
- [ ] Standardize error response codes in edge functions

---

## Architecture Diagrams

### Current State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React)                                  │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Pages (32)    │───▶│  Components     │    │  Custom Hooks   │         │
│  │                 │    │  (100+)         │    │  (14)           │         │
│  │  Direct Supabase│    │                 │    │                 │         │
│  │  calls ❌       │    │  Prop drilling  │    │  SRP violations │         │
│  └─────────────────┘    │  (8 props) ❌   │    │  ❌             │         │
│           │             └─────────────────┘    └────────┬────────┘         │
│           │                                             │                   │
│           └────────────────────┬────────────────────────┘                   │
│                                │                                            │
│                    ┌───────────▼───────────┐                               │
│                    │   Supabase Client     │                               │
│                    │   (Scattered queries) │                               │
│                    │   ❌ No DAL           │                               │
│                    └───────────┬───────────┘                               │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────────────┐
│                         EDGE FUNCTIONS (18)                                  │
│                                                                              │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│    │ create-  │  │ create-  │  │ delete-  │  │ send-    │                  │
│    │ admin    │  │ agent    │  │ user     │  │ setup    │  ... x14 more    │
│    │          │  │          │  │          │  │          │                  │
│    │ CORS ❌  │  │ CORS ❌  │  │ CORS ❌  │  │ CORS ❌  │                  │
│    │ Auth ❌  │  │ Auth ❌  │  │ Auth ❌  │  │ Auth ❌  │                  │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘                  │
│                                                                              │
│    ❌ = Duplicated code in each function                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Target State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React)                                  │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Pages (32)    │───▶│  Components     │◀───│  Contexts       │         │
│  │                 │    │  (100+)         │    │  - FormValidation│        │
│  │  Uses hooks     │    │                 │    │  - FeatureFlags │         │
│  │  only ✓        │    │  Context-based  │    │                 │         │
│  └─────────────────┘    │  props ✓       │    └─────────────────┘         │
│           │             └─────────────────┘                                 │
│           │                                                                 │
│  ┌────────▼────────────────────────────────────────────────────────┐       │
│  │                    Focused Hooks Layer                           │       │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │       │
│  │  │useFetchUsers│ │useCreateUser│ │useProfile │ │useRole    │   │       │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │       │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │       │
│  │  │useAppFetch │ │useAppSave  │ │useAppSubmit│ │useAppDocs │   │       │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │       │
│  └────────────────────────────────────┬────────────────────────────┘       │
│                                       │                                     │
│  ┌────────────────────────────────────▼────────────────────────────┐       │
│  │                    Data Access Layer                             │       │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │       │
│  │  │profileService│ │userService   │ │appService    │             │       │
│  │  └──────────────┘ └──────────────┘ └──────────────┘             │       │
│  └────────────────────────────────────┬────────────────────────────┘       │
│                                       │                                     │
│                           ┌───────────▼───────────┐                        │
│                           │   Supabase Client     │                        │
│                           └───────────┬───────────┘                        │
└───────────────────────────────────────┼─────────────────────────────────────┘
                                        │
┌───────────────────────────────────────┼─────────────────────────────────────┐
│                          EDGE FUNCTIONS (18)                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                    Shared Utilities (_shared/)                   │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │        │
│  │  │ cors.ts  │  │ auth.ts  │  │ email.ts │  │ error.ts │        │        │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│           │               │               │               │                  │
│           ▼               ▼               ▼               ▼                  │
│    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│    │ create-  │    │ create-  │    │ delete-  │    │ send-    │             │
│    │ admin    │    │ agent    │    │ user     │    │ setup    │  ... x14   │
│    │          │    │          │    │          │    │          │             │
│    │ imports  │    │ imports  │    │ imports  │    │ imports  │             │
│    │ shared ✓ │    │ shared ✓ │    │ shared ✓ │    │ shared ✓ │             │
│    └──────────┘    └──────────┘    └──────────┘    └──────────┘             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Conclusion

This codebase has a solid foundation with good patterns in place. The primary issues are:

1. **Scope creep in hooks** - hooks grew to handle too many responsibilities
2. **Copy-paste development** - especially in edge functions
3. **Missing abstraction layers** - direct Supabase calls scattered throughout

None of these issues are architectural flaws - they're natural accumulation of technical debt during rapid development. The recommended refactoring roadmap addresses them in priority order:

1. **First**: Add safety nets (error boundaries, type safety)
2. **Second**: Reduce friction (DRY, prop drilling)
3. **Third**: Improve structure (SRP, data access layer)

Following this roadmap will transform the codebase from "works but fragile" to "works and welcomes change."

---

*This analysis was conducted using static code analysis and architectural pattern evaluation. Recommendations are prioritized by risk reduction, developer velocity impact, and implementation effort.*
