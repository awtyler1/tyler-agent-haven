# PowerShell script to deploy all Edge Functions
# Run this instead of deploying functions individually

Write-Host "Deploying Edge Functions with JWT settings from config.toml..." -ForegroundColor Cyan

# Deploy all functions at once - this reads config.toml
supabase functions deploy --project-ref mgczpsrtkdkkjzmztpyd

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "If JWT issues persist, manually disable in Dashboard:" -ForegroundColor Yellow
Write-Host "  1. Go to: https://supabase.com/dashboard/project/mgczpsrtkdkkjzmztpyd/functions"
Write-Host "  2. Click each function -> Settings -> Disable 'Enforce JWT Verification'"
Write-Host ""
Write-Host "Functions that should have JWT DISABLED:" -ForegroundColor Yellow
$functions = @(
    "create-agent",
    "create-admin",
    "send-setup-link",
    "delete-user",
    "reset-user-password",
    "reset-contracting-status",
    "send-contracting-packet",
    "generate-contracting-pdf",
    "microsoft-send-email",
    "send-agent-inquiry",
    "extract-pdf-fields",
    "pdf-field-audit",
    "validate-password",
    "microsoft-oauth-start",
    "microsoft-oauth-callback"
)
foreach ($fn in $functions) {
    Write-Host "  - $fn"
}
