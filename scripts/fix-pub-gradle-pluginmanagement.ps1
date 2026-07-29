param(
  [string]$PubCachePath = "$env:LOCALAPPDATA\Pub\Cache\hosted\pub.dev"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $PubCachePath)) {
  throw "Pub cache path not found: $PubCachePath"
}

$settingsFiles = Get-ChildItem -LiteralPath $PubCachePath -Directory |
  ForEach-Object {
    $settingsPath = Join-Path $_.FullName "android\settings.gradle"
    if (Test-Path -LiteralPath $settingsPath) {
      Get-Item -LiteralPath $settingsPath
    }
  }

$patched = 0

foreach ($settingsFile in $settingsFiles) {
  $text = Get-Content -Raw -LiteralPath $settingsFile.FullName

  if ($text -notmatch "pluginManagement\s*\{") {
    continue
  }

  if ($text -match "^\s*pluginManagement\s*\{") {
    continue
  }

  $match = [regex]::Match($text, "(?s)pluginManagement\s*\{.*?`n\}")
  if (-not $match.Success) {
    Write-Warning "Could not move pluginManagement block in $($settingsFile.FullName)"
    continue
  }

  $pluginManagementBlock = $match.Value.Trim()
  $remainingScript = $text.Remove($match.Index, $match.Length).Trim()
  $updatedScript = $pluginManagementBlock + "`r`n`r`n" + $remainingScript + "`r`n"

  Set-Content -LiteralPath $settingsFile.FullName -Value $updatedScript -NoNewline
  $patched++
  Write-Output "Patched $($settingsFile.Directory.Parent.Name)"
}

Write-Output "Patched $patched settings.gradle file(s)."
