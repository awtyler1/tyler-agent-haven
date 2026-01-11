#!/bin/bash

# Deploy all Edge Functions with correct JWT settings
# Run this instead of deploying functions individually

echo "Deploying Edge Functions with JWT settings from config.toml..."

# Deploy all functions at once - this reads config.toml
supabase functions deploy --project-ref mgczpsrtkdkkjzmztpyd

echo ""
echo "Deployment complete!"
echo ""
echo "If JWT issues persist, manually disable in Dashboard:"
echo "  1. Go to: https://supabase.com/dashboard/project/mgczpsrtkdkkjzmztpyd/functions"
echo "  2. Click each function → Settings → Disable 'Enforce JWT Verification'"
echo ""
echo "Functions that should have JWT DISABLED:"
echo "  - create-agent"
echo "  - create-admin"
echo "  - send-setup-link"
echo "  - delete-user"
echo "  - reset-user-password"
echo "  - reset-contracting-status"
echo "  - send-contracting-packet"
echo "  - generate-contracting-pdf"
echo "  - microsoft-send-email"
echo "  - send-agent-inquiry"
echo "  - extract-pdf-fields"
echo "  - pdf-field-audit"
echo "  - validate-password"
echo "  - microsoft-oauth-start"
echo "  - microsoft-oauth-callback"
