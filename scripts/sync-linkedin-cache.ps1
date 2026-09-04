# ==============================================================================
# Sync Local LinkedIn Browser Cache to Google Cloud Storage
# Target: gs://mehdigolzari-realtalk-data/linkedin-profile-cache.tar.gz
# ==============================================================================

$ErrorActionPreference = "Stop"

$BucketName = "mehdigolzari-realtalk-data"
$ArchiveName = "linkedin-profile-cache.tar.gz"
$SourceDir = ".linkedin-profile-cache"

if (-not (Test-Path $SourceDir)) {
    Write-Error "Directory $SourceDir does not exist. Please launch the browser and log in first."
    exit 1
}

Write-Host "📦 Archiving $SourceDir into $ArchiveName..." -ForegroundColor Cyan
tar -czf $ArchiveName $SourceDir

$fileSizeMb = [math]::Round((Get-Item $ArchiveName).Length / 1MB, 2)
Write-Host "✅ Created $ArchiveName ($fileSizeMb MB)" -ForegroundColor Green

Write-Host "☁️ Uploading $ArchiveName to gs://$BucketName/$ArchiveName..." -ForegroundColor Cyan
gcloud storage cp $ArchiveName "gs://$BucketName/$ArchiveName"

Write-Host "🎉 Successfully uploaded LinkedIn Profile Cache to GCS bucket $BucketName!" -ForegroundColor Green
Write-Host "Because Cloud Run mounts this bucket at /app/data, the container can instantly read /app/data/$ArchiveName." -ForegroundColor Green
