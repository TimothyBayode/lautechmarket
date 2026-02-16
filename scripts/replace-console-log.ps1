# PowerShell script to replace console.log with logger.log in TypeScript files
# This script helps automate the logger replacement process

param(
    [string]$FilePath
)

$content = Get-Content $FilePath -Raw

# Add logger import if not present
if ($content -notmatch 'import.*logger.*from.*logger') {
    # Find the last import statement
    $lines = $content -split "`r?`n"
    $lastImportIndex = -1
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^import ') {
            $lastImportIndex = $i
        } elseif ($lastImportIndex -ge 0 -and $lines[$i] -match '^\s*$') {
            break
        }
    }
    
    if ($lastImportIndex -ge 0) {
        # Calculate relative path to logger
        $fileDir = Split-Path $FilePath -Parent
        $projectRoot = "c:\Users\PREMIUM\Documents\Lautech market\lautechmarket\src"
        $relPath = (Resolve-Path -Relative -Path $projectRoot -RelativeBasePath $fileDir).Replace('\', '/')
        $loggerPath = ($relPath -replace '^\.\/', '') + '/utils/logger'
        
        $lines = @($lines[0..$lastImportIndex]) + "import { logger } from `"$loggerPath`";" + @($lines[($lastImportIndex + 1)..($lines.Count - 1)])
        $content = $lines -join "`r`n"
    }
}

# Replace console.log with logger.log (but not console.error or console.warn lines that use logger already)
$content = $content -replace 'console\.log\(', 'logger.log('
$content = $content -replace 'console\.warn\(', 'logger.warn('
# Don't replace console.error - keep as is for production error logging

Set-Content -Path $FilePath -Value $content -NoNewline

Write-Host "Updated: $FilePath"
