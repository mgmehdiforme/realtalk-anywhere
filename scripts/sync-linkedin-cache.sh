#!/usr/bin/env bash
# ==============================================================================
# Sync Local LinkedIn Browser Cache to Google Cloud Storage
# Target: gs://mehdigolzari-realtalk-data/linkedin-profile-cache.tar.gz
# ==============================================================================
set -euo pipefail

BUCKET_NAME="mehdigolzari-realtalk-data"
ARCHIVE_NAME="linkedin-profile-cache.tar.gz"
SOURCE_DIR=".linkedin-profile-cache"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Directory $SOURCE_DIR does not exist. Please launch the browser and log in first."
  exit 1
fi

echo "📦 Archiving $SOURCE_DIR into $ARCHIVE_NAME..."
tar -czf "$ARCHIVE_NAME" "$SOURCE_DIR"

echo "☁️ Uploading $ARCHIVE_NAME to gs://$BUCKET_NAME/$ARCHIVE_NAME..."
gcloud storage cp "$ARCHIVE_NAME" "gs://$BUCKET_NAME/$ARCHIVE_NAME"

echo "🎉 Successfully uploaded LinkedIn Profile Cache to GCS bucket $BUCKET_NAME!"
