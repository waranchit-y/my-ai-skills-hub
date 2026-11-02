# ====================================================
# 🔄 USB Sync Importer & Merger
# ====================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Merge From USB - AI Skills Hub"

$rootDir = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$rootDir\GEMINI.md")) {
    $rootDir = $PSScriptRoot
}

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "📥 AI Skills Hub: USB Delta Importer & Merger" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Target Central Repository: $rootDir`n" -ForegroundColor Gray

# 1. Look for USB_SYNC_DELTA on removable drives
$detectedSource = $null
$drives = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Root -notmatch '^[Cc]:' }

foreach ($d in $drives) {
    $candidate = Join-Path $d.Root "USB_SYNC_DELTA"
    if (Test-Path $candidate) {
        $detectedSource = $candidate
        Write-Host "✓ Detected USB Sync folder at: $detectedSource" -ForegroundColor Green
        break
    }
}

if (-not $detectedSource) {
    Write-Host "⚠️ Automatic detection could not find 'USB_SYNC_DELTA' on external drives." -ForegroundColor Yellow
    $userInput = Read-Host "Please enter the folder path containing the files from work (or press Enter to cancel)"
    if ($userInput -and (Test-Path $userInput)) {
        $detectedSource = $userInput
    } else {
        Write-Host "Operation cancelled." -ForegroundColor Red
        Read-Host "Press Enter to exit..."
        exit
    }
}

Write-Host "`nSource: $detectedSource" -ForegroundColor Cyan
Write-Host "Scanning updated files..." -ForegroundColor Gray

$sourceFiles = Get-ChildItem -Path $detectedSource -Recurse | Where-Object { -not $_.PSIsContainer }
if ($sourceFiles.Count -eq 0) {
    Write-Host "No files found in source folder." -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit
}

Write-Host "`nFound $($sourceFiles.Count) file(s) to merge:" -ForegroundColor Green
$sourceFiles | ForEach-Object {
    $rel = $_.FullName.Substring($detectedSource.Length).TrimStart('\', '/')
    Write-Host "  + $rel ($([math]::Round($_.Length/1KB, 1)) KB)" -ForegroundColor White
}

$confirm = Read-Host "`nDo you want to merge these files into your Central Repository? (Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "Merge cancelled by user." -ForegroundColor Yellow
    exit
}

# 2. Backup overwritten files
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path $rootDir "_backups\merge_$timestamp"
$overwritten = 0

foreach ($file in $sourceFiles) {
    $rel = $file.FullName.Substring($detectedSource.Length).TrimStart('\', '/')
    $destFile = Join-Path $rootDir $rel
    if (Test-Path $destFile) {
        if (-not (Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        }
        $backupDest = Join-Path $backupDir $rel
        $backupDestDir = Split-Path -Parent $backupDest
        if (-not (Test-Path $backupDestDir)) {
            New-Item -ItemType Directory -Path $backupDestDir -Force | Out-Null
        }
        Copy-Item -Path $destFile -Destination $backupDest -Force
        $overwritten++
    }
}

if ($overwritten -gt 0) {
    Write-Host "✓ Backed up $overwritten existing file(s) to: $backupDir" -ForegroundColor Gray
}

# 3. Copy files
foreach ($file in $sourceFiles) {
    $rel = $file.FullName.Substring($detectedSource.Length).TrimStart('\', '/')
    $destFile = Join-Path $rootDir $rel
    $destSubDir = Split-Path -Parent $destFile
    if (-not (Test-Path $destSubDir)) {
        New-Item -ItemType Directory -Path $destSubDir -Force | Out-Null
    }
    Copy-Item -Path $file.FullName -Destination $destFile -Force
}

Write-Host "`n✅ Successfully merged all files into Central Repository!" -ForegroundColor Green

# 4. Trigger Web Portal Rebuild
Write-Host "`n🔄 Triggering Web Portal & Zip Bundle rebuild..." -ForegroundColor Cyan
$buildScript = Join-Path $rootDir "05_WEB_PORTAL\build_portal.js"
if (Test-Path $buildScript) {
    & node $buildScript
} else {
    Write-Host "Could not find build_portal.js to rebuild." -ForegroundColor Yellow
}

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "🎉 ALL DONE! Your Central Skills Library is up to date." -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Read-Host "Press Enter to exit..."
