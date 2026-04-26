param(
  [switch]$Apply
)

. (Join-Path $PSScriptRoot "00-config.ps1")

if (-not (Test-ProjectAccess -ProjectId $script:EixoOneConfig.ProjectId)) {
  throw "Project '$($script:EixoOneConfig.ProjectId)' is not accessible. Create or grant access before enabling APIs."
}

$enabled = @(
  & $script:GcloudCommand services list --enabled --project $script:EixoOneConfig.ProjectId --format="value(config.name)" 2>$null
) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

$missing = $script:RequiredServices | Where-Object { $_ -notin $enabled }

if ($missing.Count -eq 0) {
  Write-Step "All required APIs are already enabled."
  exit 0
}

if (-not $Apply) {
  Write-Step "APIs pending enablement"
  $missing | ForEach-Object { Write-Host (" - {0}" -f $_) }
  Write-Host "Re-run with -Apply to enable the missing APIs."
  exit 0
}

Write-Step ("Enabling {0} API(s) in project {1}" -f $missing.Count, $script:EixoOneConfig.ProjectId)
& $script:GcloudCommand services enable @missing --project $script:EixoOneConfig.ProjectId

if ($LASTEXITCODE -ne 0) {
  throw "Failed to enable one or more APIs."
}

Write-Step "API enablement finished."
