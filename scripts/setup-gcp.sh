#!/usr/bin/env bash
# =============================================================================
# Automated GCP Setup Script for MehdiGolzari.dev (Project: mehdigolzari)
# =============================================================================
set -euo pipefail

PROJECT_ID="${1:-mehdigolzari}"
REGION="${2:-europe-west1}"
SERVICE_NAME="${3:-mehdi-golzari}"
ADMIN_USERNAME="${4:-mehdi}"
ADMIN_PASSWORD="${5:-}"
CRON_SECRET="${6:-mehdi_autonomous_cron_secret_2026}"
GEMINI_API_KEY="${7:-}"
GEMINI_MODEL="${8:-gemini-2.0-flash}"

echo "=========================================================="
echo "  🚀 MehdiGolzari.dev GCP Infrastructure Automation Setup  "
echo "=========================================================="

# 1. Set gcloud configuration
echo ""
echo "[1/5] Setting gcloud active project and region..."
gcloud config set project "$PROJECT_ID"
gcloud config set run/region "$REGION"

# 2. Enable Google Cloud APIs
echo ""
echo "[2/5] Enabling necessary Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  cloudscheduler.googleapis.com \
  aiplatform.googleapis.com \
  generativelanguage.googleapis.com \
  storage.googleapis.com \
  --project="$PROJECT_ID" || echo "⚠️ Ensure billing is enabled for $PROJECT_ID"

# 3. Create Artifact Registry Docker repo if missing
echo ""
echo "[3/5] Checking Artifact Registry repository 'realtalk' in $REGION..."
gcloud artifacts repositories create realtalk \
  --repository-format=docker \
  --location="$REGION" \
  --description="Docker repository for MehdiGolzari.dev" \
  --project="$PROJECT_ID" 2>/dev/null || true

# 4. Update Cloud Run environment variables
echo ""
echo "[4/5] Updating Cloud Run ($SERVICE_NAME) environment variables..."

ENV_VARS="ADMIN_USERNAME=${ADMIN_USERNAME},CRON_SECRET=${CRON_SECRET},GEMINI_MODEL=${GEMINI_MODEL},SITE_URL=https://mehdigolzari.dev"

if [ -n "$ADMIN_PASSWORD" ]; then
  ENV_VARS="${ENV_VARS},ADMIN_PASSWORD=${ADMIN_PASSWORD}"
fi

if [ -n "$GEMINI_API_KEY" ]; then
  ENV_VARS="${ENV_VARS},GEMINI_API_KEY=${GEMINI_API_KEY},GOOGLE_API_KEY=${GEMINI_API_KEY}"
fi

gcloud run services update "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --update-env-vars="$ENV_VARS"

# 5. Create or Update Cloud Scheduler 48-Hour Cron Job
echo ""
echo "[5/5] Provisioning 48-Hour Autonomous Blog Engine Cron Job..."

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format="value(status.url)" || echo "https://mehdigolzari.dev")
CRON_URI="${SERVICE_URL}/api/blog/cron-generate"

gcloud scheduler jobs delete autonomous-blog-generator --location="$REGION" --project="$PROJECT_ID" --quiet 2>/dev/null || true

gcloud scheduler jobs create http autonomous-blog-generator \
  --location="$REGION" \
  --schedule="0 0 */2 * *" \
  --uri="$CRON_URI" \
  --http-method=POST \
  --headers="Authorization=Bearer ${CRON_SECRET},Content-Type=application/json" \
  --time-zone="UTC" \
  --description="Triggers the Autonomous AI Blog Engine every 48 hours" \
  --project="$PROJECT_ID"

echo ""
echo "=========================================================="
echo "  ✅ GCP Setup Complete! Autonomous Blog Engine is Live.   "
echo "=========================================================="
echo "  • Cloud Run URL:    ${SERVICE_URL}"
echo "  • Cron Endpoint:    ${CRON_URI}"
echo "  • Admin Portal:     ${SERVICE_URL}/admin/blog"
echo "  • Active AI Model:  ${GEMINI_MODEL}"
echo "=========================================================="
