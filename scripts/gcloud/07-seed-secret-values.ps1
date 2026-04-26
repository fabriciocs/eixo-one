param(
  [switch]$Apply,
  [switch]$RotateWebhookSecret
)

. (Join-Path $PSScriptRoot "00-config.ps1")

function Get-SecretVersionNames {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SecretName
  )

  $json = & $script:GcloudCommand secrets versions list $SecretName `
    --project $script:EixoOneConfig.ProjectId `
    --format=json 2>$null

  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace(($json | Out-String))) {
    return @()
  }

  return @(($json | ConvertFrom-Json) | Where-Object {
    $_.PSObject.Properties.Name -contains "state" -and $_.state -eq "ENABLED"
  } | ForEach-Object { $_.name })
}

function Add-SecretVersion {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SecretName,
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  $temporaryFile = [System.IO.Path]::GetTempFileName()

  try {
    Set-Content -LiteralPath $temporaryFile -Value $Value -NoNewline
    & $script:GcloudCommand secrets versions add $SecretName `
      --project $script:EixoOneConfig.ProjectId `
      --data-file $temporaryFile 1>$null

    if ($LASTEXITCODE -ne 0) {
      throw "Failed to add a version to secret $SecretName."
    }
  }
  finally {
    if (Test-Path $temporaryFile) {
      Remove-Item -LiteralPath $temporaryFile -Force
    }
  }
}

function New-RandomSecret {
  $bytes = New-Object byte[] 48
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
  }
  finally {
    $rng.Dispose()
  }
  return [Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')
}

if (-not (Test-ProjectAccess -ProjectId $script:EixoOneConfig.ProjectId)) {
  throw "Project '$($script:EixoOneConfig.ProjectId)' is not accessible. Create or grant access before seeding secrets."
}

$runtimeAppEnvironment = switch ($script:EixoOneConfig.Environment) {
  "prod" { "production" }
  "staging" { "staging" }
  "test" { "test" }
  default { "development" }
}

$appConfigPayload = [ordered]@{
  environment = $script:EixoOneConfig.Environment
  appEnvironment = $runtimeAppEnvironment
  projectId = $script:EixoOneConfig.ProjectId
  region = $script:EixoOneConfig.Region
  firestoreLocation = $script:EixoOneConfig.FirestoreLocation
  dataMode = "firebase"
} | ConvertTo-Json -Compress

$secretValues = [ordered]@{
  EIXOONE_FIREBASE_PROJECT_ID = $script:EixoOneConfig.ProjectId
  EIXOONE_API_ENV = $runtimeAppEnvironment
  EIXOONE_JWT_AUDIENCE = $script:EixoOneConfig.ProjectId
  EIXOONE_APP_CONFIG = $appConfigPayload
}

foreach ($entry in $secretValues.GetEnumerator()) {
  $versions = @(Get-SecretVersionNames -SecretName $entry.Key)
  if ($versions.Count -gt 0) {
    Write-Host ("[ok] Secret already seeded: {0}" -f $entry.Key)
    continue
  }

  if (-not $Apply) {
    Write-Host ("[plan] Seed value for {0}" -f $entry.Key)
    continue
  }

  Write-Step ("Seeding value for {0}" -f $entry.Key)
  Add-SecretVersion -SecretName $entry.Key -Value $entry.Value
}

$webhookVersions = @(Get-SecretVersionNames -SecretName "EIXOONE_WEBHOOK_SECRET")
$webhookSecretValue = Get-EnvironmentValue -Name "EIXOONE_WEBHOOK_SECRET_VALUE"

if ($RotateWebhookSecret -or $webhookVersions.Count -eq 0) {
  if ([string]::IsNullOrWhiteSpace($webhookSecretValue)) {
    $webhookSecretValue = New-RandomSecret
  }

  if (-not $Apply) {
    Write-Host "[plan] Seed value for EIXOONE_WEBHOOK_SECRET"
  }
  else {
    Write-Step "Seeding value for EIXOONE_WEBHOOK_SECRET"
    Add-SecretVersion -SecretName "EIXOONE_WEBHOOK_SECRET" -Value $webhookSecretValue
  }
}
else {
  Write-Host "[ok] Secret already seeded: EIXOONE_WEBHOOK_SECRET"
}
