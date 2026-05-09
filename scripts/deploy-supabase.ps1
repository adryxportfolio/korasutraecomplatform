param(
  [string]$ProjectRef = "iltyypblxerkwqglfvct",
  [string]$CsvPath = "C:\Users\Admin\Downloads\products_export_1.csv",
  [switch]$RepairCatalog
)

$ErrorActionPreference = "Stop"

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$CommandArgs
  )

  & $Command @CommandArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $Command $($CommandArgs -join ' ')"
  }
}

$requiredEnvKeys = @(
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
)

$envText = Get-Content -LiteralPath ".env" -Raw
foreach ($key in $requiredEnvKeys) {
  if ($envText -notmatch "(?m)^$key=\S+") {
    throw "Missing required deployment secret in .env: $key"
  }
}

$hasAccessToken = [bool]$env:SUPABASE_ACCESS_TOKEN
$hasCliProfile = Test-Path (Join-Path $HOME ".supabase\profile")
if (-not $hasAccessToken -and -not $hasCliProfile) {
  throw "Supabase CLI is not authenticated. Run 'supabase login' or set SUPABASE_ACCESS_TOKEN, then rerun this script."
}

Invoke-Checked supabase link --project-ref $ProjectRef
Invoke-Checked supabase db push --linked
Invoke-Checked supabase secrets set --env-file .env --project-ref $ProjectRef

$functions = @(
  "admin-login",
  "admin-commerce",
  "admin-upload-image",
  "place-order",
  "coupon-validate",
  "razorpay-create-order",
  "razorpay-verify",
  "razorpay-webhook",
  "track-order",
  "my-account",
  "whatsapp-send-otp",
  "whatsapp-verify-otp"
)

foreach ($functionName in $functions) {
  Invoke-Checked supabase functions deploy $functionName --project-ref $ProjectRef
}

if ($RepairCatalog) {
  Invoke-Checked bun scripts/repair-admin-and-sync-products.mjs $CsvPath
}
