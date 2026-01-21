# Setup Link, Post-Login Routing, and Outlook Integration Code

This document contains the complete code for three related features:
1. **Setup Link / Invite Email** - Creating agents and sending setup emails
2. **Post-Login Routing** - Determining where users go after authentication
3. **Outlook / Microsoft Graph Integration** - Sending emails via connected Outlook accounts

---

## 1. Setup Link / Invite Email Functionality

### supabase/functions/create-agent/index.ts
Creates new agent accounts and sends setup emails via Resend.

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseAdmin, requireAdmin } from "../_shared/auth.ts";

interface CreateAgentRequest {
  email: string;
  fullName: string;
  managerId?: string | null;  // profile.id of the manager (null = direct to TIG)
  isExistingAgent: boolean;
  sendSetupEmail?: boolean;
  isTest?: boolean;
}

serve(async (req: Request): Promise<Response> => {
  console.log("=== create-agent function called ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    console.log("Starting request processing...");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL") || "https://www.tigagenthub.com";

    const supabaseAdmin = createSupabaseAdmin();
    console.log("Supabase admin client created");

    // Verify the requesting user is an admin
    console.log("Auth header present:", !!req.headers.get("Authorization"));
    const user = await requireAdmin(req, supabaseAdmin);
    console.log("User authenticated successfully:", user.id);

    // Parse and log request body
    let requestBody: CreateAgentRequest;
    try {
      requestBody = await req.json();
      console.log("Request body parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      throw new Error("Invalid request body: " + (parseError instanceof Error ? parseError.message : "Unknown error"));
    }

    const {
      email,
      fullName,
      managerId = null,  // null means direct to TIG (no upline)
      isExistingAgent,
      sendSetupEmail = true,
      isTest = false
    } = requestBody;

    if (!email || !fullName) {
      throw new Error("Email and full name are required");
    }

    console.log(`Creating agent: ${email}, managerId: ${managerId || 'direct-to-TIG'}, existing: ${isExistingAgent}, isTest: ${isTest}`);

    // Generate a random password (user won't know this - they'll set their own)
    const tempPassword = crypto.randomUUID();

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log(`User created: ${newUser.user.id} (${email})`);

    // Determine onboarding status based on agent type
    const onboardingStatus = isExistingAgent ? 'APPOINTED' : 'CONTRACTING_REQUIRED';

    // Insert a new profile row for the newly created user
    // manager_id is the profile.id of the upline manager (null = direct to TIG)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newUser.user.id,
        email: email,
        full_name: fullName,
        manager_id: managerId,
        onboarding_status: onboardingStatus,
        is_active: true,
        is_test: isTest || false,
      });

    if (profileError) {
      console.error("Failed to insert profile:", profileError);
      throw new Error(`Failed to insert profile: ${profileError.message}`);
    }

    console.log(`Profile inserted with manager_id: ${managerId || 'null (direct to TIG)'}, status: ${onboardingStatus}`);

    // Assign the agent role
    const agentRole = 'independent_agent';
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role: agentRole });

    if (roleError) {
      console.error("Failed to assign role:", roleError);
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    console.log(`Role assigned: ${agentRole} for user ${newUser.user.id}`);

    // Send setup email with password reset link if requested
    let emailSent = false;
    if (sendSetupEmail && resendApiKey) {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${siteUrl}/auth/set-password`,
        }
      });

      if (linkError) {
        console.error("Failed to generate recovery link:", linkError);
        throw new Error(`Failed to generate setup link: ${linkError.message}`);
      }

      const setupLink = linkData.properties.action_link;
      console.log(`Generated setup link for ${email}`);

      const firstName = fullName.split(' ')[0] || 'there';

      // Different email content based on agent type
      const emailContent = isExistingAgent
        ? `
          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
            Your Tyler Insurance Group agent account is ready.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 10px 0;">
            <strong>Start here:</strong>
          </p>

          <table border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
            <tr>
              <td style="background-color: #A38529; border-radius: 6px;">
                <a href="${setupLink}" style="display: inline-block; padding: 14px 28px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: 600;">
                  Set Your Password
                </a>
              </td>
            </tr>
          </table>

          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
            Once you set your password, you'll have full access to the agent portal where you can access carrier resources, training materials, and more.
          </p>
        `
        : `
          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
            Your account is set up and ready for activation.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 10px 0;">
            <strong>Start here:</strong>
          </p>

          <table border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
            <tr>
              <td style="background-color: #A38529; border-radius: 6px;">
                <a href="${setupLink}" style="display: inline-block; padding: 14px 28px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: 600;">
                  Activate Your Account
                </a>
              </td>
            </tr>
          </table>

          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
            When you sign in, you'll be guided through our contracting wizard. It takes about 15–20 minutes and covers:
          </p>

          <ul style="font-size: 16px; line-height: 1.8; color: #333333; margin: 0 0 20px 0; padding-left: 20px;">
            <li>Personal and licensing information</li>
            <li>Carrier selections</li>
            <li>Banking details for commission deposits</li>
            <li>Digital signatures</li>
          </ul>

          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
            Once complete, your contracting packet is automatically generated and sent to our team. We'll handle the carrier appointments from there.
          </p>
        `;

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Caroline Horn <caroline@tylerinsurancegroup.com>",
          to: [email],
          subject: isExistingAgent ? "Your Agent Account Is Ready" : "Welcome to Tyler Insurance Group",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                      <tr>
                        <td style="padding: 40px;">
                          <p style="font-size: 18px; line-height: 1.6; color: #333333; margin: 0 0 24px 0;">
                            Hi ${firstName},
                          </p>

                          ${emailContent}

                          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
                            If anything is unclear, reply to this email and our team will help.
                          </p>

                          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 24px 0;">
                            Welcome aboard.
                          </p>

                          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0;">
                            <strong>Caroline</strong><br>
                            Director of Operations<br>
                            Tyler Insurance Group<br>
                            <a href="mailto:caroline@tylerinsurancegroup.com" style="color: #A38529; text-decoration: none;">caroline@tylerinsurancegroup.com</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        }),
      });

      if (emailResponse.ok) {
        emailSent = true;
        console.log(`Setup email sent to ${email}`);

        await supabaseAdmin
          .from("profiles")
          .update({ setup_link_sent_at: new Date().toISOString() })
          .eq("user_id", newUser.user.id);
      } else {
        const errorText = await emailResponse.text();
        console.error("Failed to send setup email:", errorText);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUser.user.id,
        emailSent,
        isExistingAgent,
        isTest,
        message: emailSent
          ? `Agent created and setup email sent`
          : `Agent created successfully`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) }
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error in create-agent:", errorMessage);
    if (errorStack) {
      console.error("Error stack:", errorStack);
    }

    // Determine appropriate status code
    let statusCode = 400;
    if (errorMessage.includes("Unauthorized") || errorMessage.includes("No authorization")) {
      statusCode = 401;
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        message: errorMessage,
        details: errorMessage
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) }
      }
    );
  }
});
```

---

### supabase/functions/send-setup-link/index.ts
Resends setup email to existing users who haven't set their password.

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseAdmin, requireSuperAdmin, isAuthError, getErrorStatus, getErrorMessage } from "../_shared/auth.ts";

interface SendSetupLinkRequest {
  userId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("Email service not configured");
    }

    const supabaseAdmin = createSupabaseAdmin();

    // Verify the requesting user is a super admin
    await requireSuperAdmin(req, supabaseAdmin);

    const { userId }: SendSetupLinkRequest = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Get the target user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name, setup_link_sent_at")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("User not found");
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://www.tigagenthub.com";

    // Generate a password recovery link so user can set their own password
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: profile.email,
      options: {
        redirectTo: `${siteUrl}/auth/set-password`,
      }
    });

    if (linkError) {
      console.error("Failed to generate recovery link:", linkError);
      throw new Error(`Failed to generate setup link: ${linkError.message}`);
    }

    const setupLink = linkData.properties.action_link;
    const firstName = profile.full_name?.split(' ')[0] || 'there';

    // Send the setup email
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Caroline Horn <caroline@tylerinsurancegroup.com>",
        to: [profile.email],
        subject: "Your Agent Account Is Ready",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); overflow: hidden;">

                    <!-- Header with TIG Logo -->
                    <tr>
                      <td align="center" style="padding: 32px 40px 24px 40px; border-bottom: 1px solid #f1f5f9;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" valign="middle" style="width: 56px; height: 56px; background-color: #D4A855; border-radius: 50%; text-align: center; vertical-align: middle;">
                              <span style="color: #ffffff; font-size: 18px; font-weight: bold; font-family: Arial, sans-serif;">TIG</span>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding-top: 12px;">
                              <span style="font-size: 14px; color: #64748b; font-weight: 500;">Tyler Insurance Group</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 32px 40px 40px 40px;">
                        <p style="font-size: 18px; color: #1e293b; margin: 0 0 20px 0;">Hi ${firstName},</p>

                        <p style="font-size: 16px; color: #475569; margin: 0 0 24px 0;">Your agent account is set up and ready for activation.</p>

                        <!-- Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 8px 0 32px 0;">
                              <!--[if mso]>
                              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${setupLink}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%" fillcolor="#F59E0B" stroke="f">
                              <w:anchorlock/>
                              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Activate Your Account</center>
                              </v:roundrect>
                              <![endif]-->
                              <!--[if !mso]><!-->
                              <a href="${setupLink}" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);">Activate Your Account</a>
                              <!--<![endif]-->
                            </td>
                          </tr>
                        </table>

                        <p style="font-size: 15px; color: #475569; margin: 0 0 20px 0;">When you sign in, you'll land on the <strong style="color: #1e293b;">Contracting</strong> page. This guides you through everything needed before your full agent tools unlock.</p>

                        <p style="font-size: 15px; color: #1e293b; margin: 0 0 12px 0; font-weight: 600;">You'll be able to:</p>

                        <!-- Bullet List -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px 0;">
                          <tr>
                            <td style="font-size: 15px; color: #475569; padding: 6px 0 6px 0;">
                              <span style="color: #F59E0B; margin-right: 8px;">●</span> Download required forms
                            </td>
                          </tr>
                          <tr>
                            <td style="font-size: 15px; color: #475569; padding: 6px 0 6px 0;">
                              <span style="color: #F59E0B; margin-right: 8px;">●</span> Upload your documents
                            </td>
                          </tr>
                          <tr>
                            <td style="font-size: 15px; color: #475569; padding: 6px 0 6px 0;">
                              <span style="color: #F59E0B; margin-right: 8px;">●</span> Track what's complete and what needs attention
                            </td>
                          </tr>
                        </table>

                        <p style="font-size: 15px; color: #475569; margin: 0 0 24px 0;">Once everything is finished, the rest of your platform opens automatically.</p>

                        <p style="font-size: 15px; color: #475569; margin: 0 0 28px 0;">Questions? Just reply to this email.</p>

                        <!-- Divider -->
                        <div style="border-top: 1px solid #e2e8f0; margin: 0 0 24px 0;"></div>

                        <!-- Signature -->
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <p style="font-size: 15px; color: #1e293b; margin: 0 0 4px 0; font-weight: 600;">Caroline</p>
                              <p style="font-size: 14px; color: #64748b; margin: 0 0 2px 0;">Director of Operations</p>
                              <p style="font-size: 14px; color: #64748b; margin: 0 0 8px 0;">Tyler Insurance Group</p>
                              <a href="mailto:caroline@tylerinsurancegroup.com" style="font-size: 14px; color: #F59E0B; text-decoration: none;">caroline@tylerinsurancegroup.com</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td align="center" style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
                        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                          © ${new Date().getFullYear()} Tyler Insurance Group. All rights reserved.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Failed to send setup email:", errorText);
      throw new Error("Failed to send setup email");
    }

    // Update the profile to track when setup link was sent
    const { error: trackError } = await supabaseAdmin
      .from("profiles")
      .update({ setup_link_sent_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (trackError) {
      console.error("Failed to update setup_link_sent_at:", trackError);
    }

    console.log("Setup link sent successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Setup link sent successfully"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) }
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-setup-link:", error);
    const status = isAuthError(error) ? getErrorStatus(error) : 400;
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      {
        status,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) }
      }
    );
  }
});
```

---

### src/pages/auth/SetPasswordPage.tsx
Password setup page shown after clicking the setup link.

```typescript
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, CheckCircle, KeyRound, Check, X } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';

// Password validation helper
const validatePassword = (password: string): {
  isValid: boolean;
  message: string;
  strength: 'weak' | 'medium' | 'strong';
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
} => {
  const minLength = 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const checks = {
    length: password.length >= minLength,
    uppercase: hasUppercase,
    lowercase: hasLowercase,
    number: hasNumber,
    special: hasSpecial,
  };

  const meetsRequirements =
    checks.length &&
    checks.uppercase &&
    checks.lowercase &&
    checks.number &&
    checks.special;

  if (!meetsRequirements) {
    return {
      isValid: false,
      message: 'Password must be at least 12 characters with uppercase, lowercase, number, and special character.',
      strength: 'weak',
      checks,
    };
  }

  const strength = password.length >= 16 ? 'strong' : 'medium';

  return { isValid: true, message: '', strength, checks };
};

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasValidSession, setHasValidSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes - this will fire when Supabase processes the recovery token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (session) {
          setHasValidSession(true);
          setIsLoading(false);
          setError(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setHasValidSession(false);
      }
    });

    // Also check for existing session (in case the auth event already fired)
    const checkExistingSession = async () => {
      // Give Supabase a moment to process the hash params
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasValidSession(true);
      } else {
        // Check if there are recovery params in the URL hash
        const hash = window.location.hash;
        if (!hash.includes('access_token')) {
          setError('Invalid or expired link. Please contact your administrator for a new setup link.');
        }
      }
      setIsLoading(false);
    };

    checkExistingSession();

    return () => subscription.unsubscribe();
  }, []);

  // Memoized password validation
  const passwordValidation = useMemo(() => validatePassword(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Update profile to track password creation
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ password_created_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }

      setIsSuccess(true);
      toast.success('Password set successfully!');

      // Redirect directly to contracting page for new agents
      // Using full page redirect to ensure auth state is fully reloaded
      setTimeout(() => {
        window.location.href = '/contracting';
      }, 1500);
    } catch (err: any) {
      console.error('Error setting password:', err);
      setError(err.message || 'Failed to set password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
        <Card
          className="w-full max-w-[495px] rounded-[28px] border-0 relative"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
            boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
          }}
        >
          <CardContent className="pt-16 pb-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-6 text-primary" />
            <p className="text-muted-foreground/70 text-[15px]">Verifying your link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
        <Card
          className="w-full max-w-[495px] rounded-[28px] border-0 relative"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
            boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
          }}
        >
          <CardHeader className="text-center space-y-8 pt-14 pb-2">
            <div className="relative pb-6">
              <img src={tylerLogo} alt="Tyler Insurance Group" className="h-[60px] mx-auto" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
            </div>
            <div className="flex justify-center">
              <div className="rounded-full bg-green-50 p-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <div className="space-y-3">
              <CardTitle className="text-[2.125rem] font-serif" style={{ letterSpacing: '0.025em' }}>Password Set!</CardTitle>
              <CardDescription className="text-muted-foreground/60 font-light text-[13px] leading-[1.7]">
                Redirecting you to get started...
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-16 px-11">
            <Button
              onClick={() => window.location.href = '/contracting'}
              className="w-full h-[54px] text-white font-semibold text-[15px] rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)',
                boxShadow: '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)'
              }}
            >
              Continue to Contracting
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
      <Card
        className="w-full max-w-[495px] rounded-[28px] border-0 relative"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
          boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
        }}
      >
        <CardHeader className="text-center space-y-8 pt-14 pb-2">
          <div className="relative pb-6">
            <img src={tylerLogo} alt="Tyler Insurance Group" className="h-[60px] mx-auto" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
          </div>
          <div className="flex justify-center">
            <div className="rounded-full bg-secondary/60 p-4">
              <KeyRound className="h-10 w-10 text-muted-foreground/70" />
            </div>
          </div>
          <div className="space-y-3">
            <CardTitle className="text-[2.125rem] font-serif" style={{ letterSpacing: '0.025em' }}>Set Your Password</CardTitle>
            <CardDescription className="text-muted-foreground/60 font-light text-[13px] leading-[1.7]">
              Create a secure password to access your account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-11 pb-16">
          {!hasValidSession && error ? (
            <div className="text-center space-y-6">
              <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
              <Link to="/auth">
                <Button
                  variant="outline"
                  className="h-[50px] px-8 border-foreground/12 hover:bg-secondary/30 hover:border-primary/25 font-medium text-foreground/80 rounded-2xl transition-all duration-200"
                >
                  Go to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="password" className="text-[11px] font-medium uppercase tracking-widest text-foreground/55">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={12}
                    className="h-[56px] px-5 pr-12 text-[15px] bg-white border-border/30 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 focus:border-primary/50 focus:ring-0 focus:shadow-[0_0_0_4px_rgba(163,133,41,0.1),0_1px_3px_rgba(0,0,0,0.04)] placeholder:text-muted-foreground/35"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/70 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-3 pt-1">
                    {/* Strength bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordValidation.strength === 'strong'
                              ? 'w-full bg-green-500'
                              : passwordValidation.strength === 'medium'
                              ? 'w-2/3 bg-amber-500'
                              : 'w-1/3 bg-red-500'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          passwordValidation.strength === 'strong'
                            ? 'text-green-600'
                            : passwordValidation.strength === 'medium'
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {passwordValidation.strength === 'strong'
                          ? 'Strong'
                          : passwordValidation.strength === 'medium'
                          ? 'Medium'
                          : 'Weak'}
                      </span>
                    </div>

                    {/* Requirements checklist */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.length ? 'text-green-600' : 'text-muted-foreground/60'}`}>
                        {passwordValidation.checks.length ? <Check size={14} /> : <X size={14} />}
                        <span>12+ characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.uppercase ? 'text-green-600' : 'text-muted-foreground/60'}`}>
                        {passwordValidation.checks.uppercase ? <Check size={14} /> : <X size={14} />}
                        <span>Uppercase letter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.lowercase ? 'text-green-600' : 'text-muted-foreground/60'}`}>
                        {passwordValidation.checks.lowercase ? <Check size={14} /> : <X size={14} />}
                        <span>Lowercase letter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.number ? 'text-green-600' : 'text-muted-foreground/60'}`}>
                        {passwordValidation.checks.number ? <Check size={14} /> : <X size={14} />}
                        <span>Number</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.special ? 'text-green-600' : 'text-muted-foreground/60'}`}>
                        {passwordValidation.checks.special ? <Check size={14} /> : <X size={14} />}
                        <span>Special character</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-[11px] font-medium uppercase tracking-widest text-foreground/55">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="h-[56px] px-5 text-[15px] bg-white border-border/30 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 focus:border-primary/50 focus:ring-0 focus:shadow-[0_0_0_4px_rgba(163,133,41,0.1),0_1px_3px_rgba(0,0,0,0.04)] placeholder:text-muted-foreground/35"
                />
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-[54px] text-white font-semibold text-[15px] rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)',
                  boxShadow: '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(180deg, hsl(43, 58%, 38%) 0%, hsl(43, 62%, 30%) 100%)';
                  e.currentTarget.style.boxShadow = '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 8px 20px rgba(163, 133, 41, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)';
                  e.currentTarget.style.boxShadow = '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)';
                }}
                disabled={isSubmitting || !hasValidSession}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Set Password & Continue
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 2. Post-Login Routing

### src/hooks/useAuth.ts
Main auth hook that determines default routing.

```typescript
import { useProfile } from './useProfile';
import { useRole } from './useRole';

export function useAuth() {
  const profile = useProfile();
  const role = useRole();

  const loading = profile.loading || role.loading;

  // Determine where user should be routed after login
  const getDefaultRoute = (): string => {
    // If not authenticated, go to auth
    if (!profile.isAuthenticated) {
      return '/auth';
    }

    // If agent needs contracting, send to contracting
    if (role.isAgent() && profile.isContractingRequired) {
      return '/contracting';
    }

    // If admin, can access admin dashboard
    if (role.canAccessAdmin()) {
      return '/admin';
    }

    // Default to main dashboard
    return '/';
  };

  // Check if user can access a specific route
  const canAccessRoute = (route: string): boolean => {
    if (!profile.isAuthenticated) {
      return route === '/auth';
    }

    // Admin routes
    if (route.startsWith('/admin')) {
      return role.canAccessAdmin();
    }

    // Agent in contracting mode can only access contracting
    if (role.isAgent() && profile.isContractingRequired) {
      return route === '/contracting' || route === '/auth';
    }

    return true;
  };

  return {
    // Profile exports
    ...profile,

    // Role exports
    ...role,

    // Combined
    loading,
    getDefaultRoute,
    canAccessRoute,
  };
}
```

---

### src/components/ProtectedRoute.tsx
Route guard that enforces access control.

```typescript
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireAgent?: boolean;
  allowContractingOnly?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireSuperAdmin = false,
  requireAgent = false,
  allowContractingOnly = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const {
    isAuthenticated,
    loading,
    isAdmin,
    isSuperAdmin,
    isAgent,
    isContractingRequired,
  } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check super admin access
  if (requireSuperAdmin && !isSuperAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Check admin access
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Check agent access
  if (requireAgent && !isAgent()) {
    return <Navigate to="/" replace />;
  }

  // Special case: agents who need contracting should be redirected
  if (isAgent() && isContractingRequired && !allowContractingOnly) {
    return <Navigate to="/contracting" replace />;
  }

  // Special case: agents on allowContractingOnly routes must need contracting
  if (allowContractingOnly && (!isAgent() || !isContractingRequired)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

---

### src/pages/AuthPage.tsx
Login page with post-auth redirect.

```typescript
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Mail, Phone, CheckCircle2, Send } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';
import { formatPhoneNumber } from '@/lib/formatters';
import { logActivity, ActivityAction } from '@/utils/activityLogger';

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, getDefaultRoute } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Inquiry form state
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(getDefaultRoute(), { replace: true });
    }
  }, [isAuthenticated, loading, navigate, getDefaultRoute]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Check if user account is active
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('user_id', data.user.id)
          .single();

        if (profile && !profile.is_active) {
          // Sign out the inactive user immediately
          await supabase.auth.signOut();
          toast.error('Your account has been deactivated. Please contact support.');
          return;
        }
      }

      // Log successful login
      await logActivity(ActivityAction.LOGIN);

      toast.success('Welcome back!');
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... inquiry form handlers omitted for brevity ...

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    // ... JSX for login form ...
  );
}
```

---

### src/App.tsx (Relevant Routing Sections)
Main app routing with recovery redirect handler.

```typescript
// Component to handle recovery token redirects
function RecoveryRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if this is a recovery redirect (has type=recovery in hash)
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      // Redirect to set-password page while preserving the hash
      navigate('/auth/set-password' + hash, { replace: true });
    }
  }, [navigate, location]);

  return null;
}

// Key routes for auth and contracting
<Routes>
  {/* Auth */}
  <Route path="/auth" element={<AuthPage />} />
  <Route path="/auth/set-password" element={<SetPasswordPage />} />
  <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

  {/* Agent contracting (accessible only to agents needing contracting) */}
  <Route
    path="/contracting"
    element={
      <ProtectedRoute requireAgent allowContractingOnly>
        <ContractingPage />
      </ProtectedRoute>
    }
  />

  {/* Admin routes */}
  <Route
    path="/admin"
    element={
      <ProtectedRoute requireAdmin>
        <AdminDashboard />
      </ProtectedRoute>
    }
  />
  {/* ... more routes ... */}
</Routes>
```

---

## 3. Outlook / Microsoft Graph Integration

### supabase/functions/microsoft-oauth-start/index.ts
Initiates OAuth flow with Microsoft.

```typescript
/**
 * Microsoft OAuth Start
 *
 * Redirects the user to Microsoft's login page to authorize the app.
 * After login, Microsoft redirects back to microsoft-oauth-callback.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { getErrorMessage } from "../_shared/auth.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    // Get environment variables
    const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
    const tenantId = Deno.env.get("MICROSOFT_TENANT_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!clientId || !tenantId) {
      throw new Error("Missing Microsoft OAuth configuration");
    }

    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Build the redirect URI
    const redirectUri = `${supabaseUrl}/functions/v1/microsoft-oauth-callback`;

    // Build state parameter (includes user ID for security)
    const state = btoa(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
      nonce: crypto.randomUUID()
    }));

    // Build Microsoft OAuth URL
    const authUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_mode", "query");
    authUrl.searchParams.set("scope", "openid profile email Mail.Send offline_access");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("prompt", "consent"); // Always show consent to ensure refresh token

    console.log("Redirecting to Microsoft OAuth:", authUrl.toString());

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      {
        status: 200,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }
      }
    );

  } catch (error: unknown) {
    console.error("OAuth start error:", error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
```

---

### supabase/functions/microsoft-oauth-callback/index.ts
Handles OAuth callback and stores tokens.

```typescript
/**
 * Microsoft OAuth Callback
 *
 * Handles the redirect from Microsoft after user authorizes.
 * Exchanges the authorization code for access/refresh tokens.
 * Stores tokens in the database for later use.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Get frontend URL first (needed for error redirects)
  const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://tyler-agent-haven.vercel.app";

  try {
    // Validate required environment variables
    const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
    const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");
    const tenantId = Deno.env.get("MICROSOFT_TENANT_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!clientId || !clientSecret || !tenantId || !supabaseUrl || !supabaseServiceKey) {
      console.error("Missing required environment variables for OAuth");
      return Response.redirect(
        `${frontendUrl}/admin/settings?error=${encodeURIComponent("Server configuration error")}`,
        302
      );
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    // Handle errors from Microsoft
    if (error) {
      console.error("Microsoft OAuth error:", error, errorDescription);
      return Response.redirect(
        `${frontendUrl}/admin/settings?error=${encodeURIComponent(errorDescription || error)}`,
        302
      );
    }

    if (!code || !state) {
      console.error("Missing code or state");
      return Response.redirect(
        `${frontendUrl}/admin/settings?error=${encodeURIComponent("Missing authorization code")}`,
        302
      );
    }

    // Decode and validate state
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch (e) {
      console.error("Invalid state:", e);
      return Response.redirect(
        `${frontendUrl}/admin/settings?error=${encodeURIComponent("Invalid state parameter")}`,
        302
      );
    }

    const { userId, timestamp } = stateData;

    // Check state isn't too old (10 minutes max)
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return Response.redirect(
        `${frontendUrl}/admin/settings?error=${encodeURIComponent("Authorization expired, please try again")}`,
        302
      );
    }

    // Exchange code for tokens
    const redirectUri = `${supabaseUrl}/functions/v1/microsoft-oauth-callback`;

    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          scope: "openid profile email Mail.Send offline_access",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return Response.redirect(
        `${frontendUrl}/admin/settings?error=${encodeURIComponent("Failed to get access token")}`,
        302
      );
    }

    const tokens = await tokenResponse.json();

    // Get user info from Microsoft to store their email
    const userInfoResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    let microsoftEmail = null;
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      microsoftEmail = userInfo.mail || userInfo.userPrincipalName;
    }

    // Store tokens in database using service role (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Upsert tokens (insert or update if exists)
    const { error: upsertError } = await supabaseAdmin
      .from("microsoft_oauth_tokens")
      .upsert({
        user_id: userId,
        access_token_encrypted: tokens.access_token, // TODO: Add encryption
        refresh_token_encrypted: tokens.refresh_token, // TODO: Add encryption
        expires_at: expiresAt,
        scope: tokens.scope,
        microsoft_email: microsoftEmail,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (upsertError) {
      console.error("Failed to store OAuth tokens");
      return Response.redirect(
        `${frontendUrl}/admin/settings?error=${encodeURIComponent("Failed to save authorization")}`,
        302
      );
    }

    // Redirect back to frontend with success
    return Response.redirect(
      `${frontendUrl}/admin/settings?outlook_connected=true`,
      302
    );

  } catch (error) {
    console.error("OAuth callback error:", error);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://tyler-agent-haven.vercel.app";
    return Response.redirect(
      `${frontendUrl}/admin/settings?error=${encodeURIComponent("An unexpected error occurred")}`,
      302
    );
  }
});
```

---

### supabase/functions/microsoft-send-email/index.ts
Sends emails via Microsoft Graph API.

```typescript
/**
 * Microsoft Send Email
 *
 * Sends an email via Microsoft Graph API using the user's connected Outlook account.
 * Supports attachments and saves to the user's Sent folder.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { getErrorMessage } from "../_shared/auth.ts";

interface Attachment {
  name: string;
  contentType: string;
  contentBytes: string; // Base64 encoded
}

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  attachments?: Attachment[];
  agentId?: string; // For logging purposes
  communicationType?: string; // 'initial_contracting' | 'resend_link' | 'other'
  carriersIncluded?: string[]; // For logging
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
} | null> {
  const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
  const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");
  const tenantId = Deno.env.get("MICROSOFT_TENANT_ID");

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: "openid profile email Mail.Send offline_access",
      }),
    }
  );

  if (!response.ok) {
    console.error("Failed to refresh token:", await response.text());
    return null;
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user with anon key
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const emailRequest: EmailRequest = await req.json();
    const { to, subject, body, attachments, agentId, communicationType, carriersIncluded } = emailRequest;

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Get user's Microsoft tokens using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("microsoft_oauth_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({
          error: "Outlook not connected",
          code: "OUTLOOK_NOT_CONNECTED",
          message: "Please connect your Outlook account first"
        }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    let accessToken = tokenData.access_token_encrypted; // TODO: Decrypt

    // Check if token is expired or about to expire (within 5 minutes)
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt <= fiveMinutesFromNow) {
      const newTokens = await refreshAccessToken(tokenData.refresh_token_encrypted);

      if (!newTokens) {
        return new Response(
          JSON.stringify({
            error: "Token refresh failed",
            code: "TOKEN_REFRESH_FAILED",
            message: "Please reconnect your Outlook account"
          }),
          { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      // Update tokens in database
      const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

      await supabaseAdmin
        .from("microsoft_oauth_tokens")
        .update({
          access_token_encrypted: newTokens.access_token,
          refresh_token_encrypted: newTokens.refresh_token,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      accessToken = newTokens.access_token;
    }

    // Build the email message for Microsoft Graph
    const graphMessage: any = {
      message: {
        subject: subject,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
      },
      saveToSentItems: true, // Save to Sent folder
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      graphMessage.message.attachments = attachments.map((att) => ({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: att.name,
        contentType: att.contentType,
        contentBytes: att.contentBytes,
      }));
    }

    // Send email via Microsoft Graph
    const sendResponse = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graphMessage),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error("Microsoft Graph send failed:", sendResponse.status, errorText);

      // Check if it's an auth error
      if (sendResponse.status === 401) {
        return new Response(
          JSON.stringify({
            error: "Authentication failed",
            code: "AUTH_FAILED",
            message: "Please reconnect your Outlook account"
          }),
          { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errorText }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Log the communication in our database
    if (agentId) {
      const { error: logError } = await supabaseAdmin
        .from("contracting_communications")
        .insert({
          agent_id: agentId,
          communication_type: communicationType || "other",
          recipient_email: to,
          subject: subject,
          body_html: body,
          carriers_included: carriersIncluded || [],
          attachments: attachments?.map(a => a.name) || [],
          sent_by: user.id,
          sent_at: new Date().toISOString(),
        });

      if (logError) {
        console.error("Failed to log communication");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        sentAt: new Date().toISOString()
      }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Send email error:", error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
```

---

### src/hooks/useSendEmail.ts
React hook for sending emails via Microsoft Graph.

```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/lib/errors';

export interface EmailAttachment {
  name: string;
  contentType: string;
  contentBytes: string; // Base64 encoded
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
  agentId?: string;
  communicationType?: 'initial_contracting' | 'resend_link' | 'other';
  carriersIncluded?: string[];
}

export interface SendEmailResult {
  success: boolean;
  message?: string;
  sentAt?: string;
  error?: string;
  code?: string;
}

/**
 * Fetches a file from a URL and converts it to base64
 * Works with Supabase storage signed URLs or any accessible URL
 */
export async function fileUrlToBase64(url: string): Promise<{
  contentBytes: string;
  contentType: string;
} | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch file:', response.status, response.statusText);
      return null;
    }

    const blob = await response.blob();
    const contentType = blob.type || 'application/octet-stream';

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Extract base64 portion after the data URL prefix
        const base64 = dataUrl.split(',')[1];
        resolve({ contentBytes: base64, contentType });
      };
      reader.onerror = () => {
        console.error('FileReader error');
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Error converting file to base64:', err);
    return null;
  }
}

/**
 * Hook for sending emails via Microsoft Graph through our edge function
 */
export function useSendEmail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (params: SendEmailParams): Promise<SendEmailResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('microsoft-send-email', {
        body: {
          to: params.to,
          subject: params.subject,
          body: params.body,
          attachments: params.attachments,
          agentId: params.agentId,
          communicationType: params.communicationType,
          carriersIncluded: params.carriersIncluded,
        },
      });

      if (fnError) {
        console.error('Send email function error:', fnError);
        const errorMessage = fnError.message || 'Failed to send email';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (data?.error) {
        const errorMessage = data.message || data.error;
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
          code: data.code,
        };
      }

      return {
        success: true,
        message: data.message,
        sentAt: data.sentAt,
      };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      console.error('Send email error:', err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendEmail,
    isLoading,
    error,
  };
}
```

---

### src/components/admin/OutlookConnectButton.tsx
Button to initiate Outlook OAuth connection.

```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Mail, Check, Loader2, AlertCircle } from 'lucide-react';

export function OutlookConnectButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to connect Outlook');
      }

      // Check if token is expired
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();

      if (now > expiresAt) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          throw new Error('Session expired. Please log in again.');
        }
      }

      const { data, error: fnError } = await supabase.functions.invoke('microsoft-oauth-start');

      if (fnError) {
        console.error('OAuth function error:', fnError);
        throw new Error(fnError.message || 'Edge function error');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL returned from function');
      }
    } catch (err) {
      console.error('OAuth start error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start OAuth');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleConnect}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        Connect Outlook
      </Button>

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
```

---

### src/components/admin/TestEmailButton.tsx
Button to test Outlook email integration.

```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function TestEmailButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleTestEmail = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      // Get the logged-in user's email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase.functions.invoke('microsoft-send-email', {
        body: {
          to: user.email,
          subject: 'TIG Platform Test Email',
          body: `
            <h2>Test Email from TIG Agent Platform</h2>
            <p>If you're seeing this, the Microsoft Graph integration is working correctly!</p>
            <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated test email.</p>
          `,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.message || data.error);
      }

      setStatus('success');
      setMessage('Test email sent! Check your inbox.');
    } catch (err) {
      console.error('Test email error:', err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleTestEmail}
        disabled={loading}
        variant={status === 'success' ? 'outline' : 'default'}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {loading ? 'Sending...' : status === 'success' ? 'Email Sent!' : 'Send Test Email'}
      </Button>

      {message && (
        <p className={`text-sm flex items-center gap-1 ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {status === 'error' && <AlertCircle className="h-4 w-4" />}
          {message}
        </p>
      )}
    </div>
  );
}
```

---

### src/pages/admin/AdminSettingsPage.tsx
Admin settings page with Outlook integration UI.

```typescript
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { CreateAdminDialog } from '@/components/admin/CreateAdminDialog';
import { OutlookConnectButton } from '@/components/admin/OutlookConnectButton';
import { TestEmailButton } from '@/components/admin/TestEmailButton';

export default function AdminSettingsPage() {
  const navigate = useNavigate();

  return (
    <AdminLayout showBackButton backLabel="Dashboard" onBack={() => navigate('/admin')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-medium text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">User management</p>
        </div>
        <CreateAdminDialog />
      </div>

      {/* Outlook Connect Button - Temporary for testing */}
      <div className="mb-8 bg-white rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Outlook Integration</h2>
        <OutlookConnectButton />
        <div className="mt-4 pt-4 border-t border-border">
          <TestEmailButton />
        </div>
      </div>

      {/* User Management */}
      <UserManagementTable />
    </AdminLayout>
  );
}
```

---

## Summary

### Setup Link / Invite Email Flow
1. Admin creates agent via `create-agent` edge function
2. Function creates auth user, profile, and role
3. Generates recovery link via Supabase Auth
4. Sends welcome email via Resend API
5. User clicks link, lands on `/auth/set-password`
6. `SetPasswordPage` validates password and updates user
7. After success, redirects to `/contracting`

### Post-Login Routing Flow
1. User logs in via `AuthPage`
2. `useAuth` hook determines `getDefaultRoute()`
   - If agent needs contracting: `/contracting`
   - If admin: `/admin`
   - Otherwise: `/`
3. `ProtectedRoute` enforces access control
   - Redirects unauthenticated users to `/auth`
   - Redirects contracting-required agents to `/contracting`
   - Checks role requirements for admin routes

### Microsoft Graph / Outlook Flow
1. Admin clicks "Connect Outlook" on settings page
2. `OutlookConnectButton` invokes `microsoft-oauth-start`
3. User is redirected to Microsoft login
4. After authorization, Microsoft redirects to `microsoft-oauth-callback`
5. Callback exchanges code for tokens and stores in DB
6. Admin can now send emails via `microsoft-send-email`
7. `useSendEmail` hook provides React interface for email sending
