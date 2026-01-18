# Send Setup Link Feature

## Overview

The "Send Setup Link" feature allows administrators to send a password setup email to newly created users. This enables users to activate their agent account and set their own password.

## How It Works

### User Flow

1. Admin creates a new user account in the system
2. Admin navigates to the user's detail page (`/admin/users/:userId`)
3. Admin clicks "Send Setup Link" button in the User Settings card
4. System sends an email with a secure activation link
5. User receives email with "Activate Your Account" button
6. User clicks the link and is redirected to `/auth/set-password` to create their password
7. Once password is set, user can log in and begin the contracting process

### UI Location

The button is located in `UserDetailPage.tsx` within the "User Settings" card:

```typescript
// src/pages/admin/UserDetailPage.tsx:621-636
<Button
  variant="outline"
  onClick={handleSendSetupLink}
  disabled={sendingLink}
  className="w-full justify-start"
>
  {sendingLink ? (
    <Loader2 className="h-4 w-4 animate-spin mr-2" />
  ) : (
    <Send className="h-4 w-4 mr-2" />
  )}
  {user.setup_link_sent_at ? 'Resend Setup Link' : 'Send Setup Link'}
</Button>
```

- Shows "Send Setup Link" if never sent before
- Shows "Resend Setup Link" if previously sent (based on `setup_link_sent_at`)

## Technical Implementation

### Frontend Handler

**File:** `src/pages/admin/UserDetailPage.tsx:159-186`

```typescript
const handleSendSetupLink = async () => {
  if (!user) return;
  setSendingLink(true);
  try {
    const { data: result, error } = await supabase.functions.invoke('send-setup-link', {
      body: { userId: user.user_id },
    });

    if (error) throw error;
    if (result?.error) throw new Error(result.error);

    toast.success('Setup link sent successfully');
    // Refresh user data to update setup_link_sent_at
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.user_id)
      .single();

    if (updatedProfile) {
      setUser(prev => prev ? { ...prev, ...updatedProfile } : null);
    }
  } catch (err: any) {
    toast.error(`Failed to send setup link: ${err.message}`);
  } finally {
    setSendingLink(false);
  }
};
```

### Edge Function

**File:** `supabase/functions/send-setup-link/index.ts`

#### Request

```typescript
interface SendSetupLinkRequest {
  userId: string;
}
```

#### Process

1. **Authorization Check**: Verifies the requesting user is a super admin via `requireSuperAdmin()`
2. **Profile Lookup**: Fetches the target user's profile (email, full_name, setup_link_sent_at)
3. **Link Generation**: Uses Supabase Auth Admin API to generate a password recovery link:
   ```typescript
   const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
     type: 'recovery',
     email: profile.email,
     options: {
       redirectTo: `${siteUrl}/auth/set-password`,
     }
   });
   ```
4. **Email Sending**: Sends a branded HTML email via Resend API
5. **Tracking**: Updates `setup_link_sent_at` timestamp in the profiles table

#### Response

```typescript
// Success
{ success: true, message: "Setup link sent successfully" }

// Error
{ error: "Error message here" }
```

## Email Template

The email is sent from `caroline@tylerinsurancegroup.com` with the following content:

- **Subject:** "Your Agent Account Is Ready"
- **From:** "Caroline Horn <caroline@tylerinsurancegroup.com>"
- **Branding:** TIG logo, gold accent colors
- **CTA Button:** "Activate Your Account" (links to password setup)
- **Content:**
  - Personalized greeting using first name
  - Explanation that they'll land on the Contracting page
  - Bullet list of what they can do (download forms, upload documents, track progress)
  - Signature from Caroline, Director of Operations

## Database Fields

The `profiles` table tracks the onboarding timeline:

| Field | Type | Description |
|-------|------|-------------|
| `setup_link_sent_at` | timestamp | When the setup link was sent |
| `password_created_at` | timestamp | When the user set their password |
| `first_login_at` | timestamp | When the user first logged in |

## Timeline Display

The User Detail page shows an "Account Timeline" section that visualizes these milestones:

1. Setup Link Sent - Shows date/time if sent
2. Password Created - Shows date/time if password was set
3. First Login - Shows date/time if user has logged in

Completed steps show a green checkmark, pending steps show an empty circle.

## Security Considerations

- Only super admins can invoke the edge function (enforced by `requireSuperAdmin()`)
- The link uses Supabase's built-in password recovery mechanism (secure tokens)
- Links expire based on Supabase's default token expiration settings
- CORS headers are properly configured via `getCorsHeaders()`

## Dependencies

- **Supabase Auth Admin API**: For generating secure recovery links
- **Resend API**: For sending branded HTML emails
- **Environment Variables:**
  - `RESEND_API_KEY`: API key for Resend email service
  - `SITE_URL`: Base URL for the application (default: `https://www.tigagenthub.com`)

## Related Files

- `src/pages/admin/UserDetailPage.tsx` - Frontend UI and handler
- `supabase/functions/send-setup-link/index.ts` - Edge function
- `supabase/functions/_shared/auth.ts` - Shared auth utilities
- `supabase/functions/_shared/cors.ts` - CORS configuration
