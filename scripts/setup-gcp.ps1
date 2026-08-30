<#
.SYNOPSIS
  Automated GCP Setup Script for MehdiGolzari.dev (Project: mehdigolzari)
.DESCRIPTION
  Enables required APIs (Vertex AI, Cloud Scheduler, Cloud Run, Artifact Registry),
  provisions Artifact Registry, configures Cloud Run env variables (including Vertex AI Global & Admin credentials),
  and sets up the 48-hour autonomous Cloud Scheduler blog generation job.
#>

param(
  [string]$ProjectId = "mehdigolzari",
  [string]$Region = "europe-west1",
  [string]$VertexLocation = "global",
  [string]$ServiceName = "mehdi-golzari",
  [string]$AdminUsername = "mehdi",
  [string]$AdminPassword = "",
  [string]$CronSecret = "mehdi-autonomous-cron-secret-2026",
  [string]$GeminiApiKey = "AIzaSyBV5yYg_ebQLMSod_hAPTVePvBxpah2BDU",
  [string]$GeminiModel = "gemini-3.7-flash",
  [string]$GeminiContentModel = "gemini-3.7-flash"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  🚀 MehdiGolzari.dev GCP Infrastructure Automation Setup  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Set gcloud configuration
Write-Host "`n[1/5] Setting gcloud active project and region..." -ForegroundColor Yellow
gcloud config set project $ProjectId
gcloud config set run/region $Region

# 2. Enable Google Cloud APIs
Write-Host "`n[2/5] Enabling necessary Google Cloud APIs..." -ForegroundColor Yellow
gcloud services enable `
  run.googleapis.com `
  artifactregistry.googleapis.com `
  cloudbuild.googleapis.com `
  cloudscheduler.googleapis.com `
  aiplatform.googleapis.com `
  generativelanguage.googleapis.com `
  apikeys.googleapis.com `
  storage.googleapis.com `
  --project=$ProjectId

if ($LASTEXITCODE -ne 0) {
  Write-Host "⚠️ Failed to enable some APIs. Please make sure Google Cloud Billing is enabled for $ProjectId." -ForegroundColor Red
}

# 3. Create Artifact Registry Docker repo if missing
Write-Host "`n[3/5] Checking Artifact Registry repository 'realtalk' in $Region..." -ForegroundColor Yellow
gcloud artifacts repositories create realtalk `
  --repository-format=docker `
  --location=$Region `
  --description="Docker repository for MehdiGolzari.dev" `
  --project=$ProjectId 2>$null

# 4. Update Cloud Run environment variables
Write-Host "`n[4/5] Updating Cloud Run ($ServiceName) environment variables..." -ForegroundColor Yellow

$envPairs = @(
  "ADMIN_USERNAME=$AdminUsername",
  "CRON_SECRET=$CronSecret",
  "GOOGLE_CLOUD_PROJECT=$ProjectId",
  "GOOGLE_CLOUD_LOCATION=$VertexLocation",
  "VERTEX_PROJECT_ID=$ProjectId",
  "VERTEX_LOCATION=$VertexLocation",
  "GEMINI_MODEL=$GeminiModel",
  "GEMINI_RESEARCH_MODEL=$GeminiModel",
  "GEMINI_DEEPRESEARCH_MODEL=$GeminiModel",
  "GEMINI_CONTENT_MODEL=$GeminiContentModel",
  "SITE_URL=https://mehdigolzari.dev"
)

if ($AdminPassword -ne "") {
  $envPairs += "ADMIN_PASSWORD=$AdminPassword"
}

if ($GeminiApiKey -ne "") {
  $envPairs += "GEMINI_API_KEY=$GeminiApiKey"
  $envPairs += "GOOGLE_API_KEY=$GeminiApiKey"
}

$envString = $envPairs -join ","

gcloud run services update $ServiceName `
  --region=$Region `
  --project=$ProjectId `
  --update-env-vars="$envString"

# 5. Create or Update Cloud Scheduler 48-Hour Cron Job
Write-Host "`n[5/5] Provisioning 48-Hour Autonomous Blog Engine Cron Job..." -ForegroundColor Yellow

$serviceUrl = gcloud run services describe $ServiceName --region=$Region --project=$ProjectId --format="value(status.url)"
if (-not $serviceUrl) {
  $serviceUrl = "https://mehdigolzari.dev"
}
$cronUri = "$serviceUrl/api/blog/cron-generate"

# Delete existing job if any to ensure clean idempotent creation
gcloud scheduler jobs delete autonomous-blog-generator --location=$Region --project=$ProjectId --quiet 2>$null

gcloud scheduler jobs create http autonomous-blog-generator `
  --location=$Region `
  --schedule="0 0 */2 * *" `
  --uri="$cronUri" `
  --http-method=POST `
  --headers="Authorization=Bearer $CronSecret,Content-Type=application/json" `
  --time-zone="UTC" `
  --description="Triggers the Autonomous AI Blog Engine every 48 hours" `
  --project=$ProjectId

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  ✅ GCP Setup Complete! Autonomous Blog Engine is Live.   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  • Cloud Run URL:       $serviceUrl" -ForegroundColor Cyan
Write-Host "  • Cron Endpoint:       $cronUri" -ForegroundColor Cyan
Write-Host "  • Admin Portal:        $serviceUrl/admin/blog" -ForegroundColor Cyan
Write-Host "  • Vertex Location:     $VertexLocation" -ForegroundColor Cyan
Write-Host "  • Active AI Model:     $GeminiModel" -ForegroundColor Cyan
Write-Host "  • Content Model:       $GeminiContentModel" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
