Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-EnvironmentValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [string]$Default = ""
  )

  $item = Get-Item -Path "Env:$Name" -ErrorAction SilentlyContinue
  if ($null -ne $item -and -not [string]::IsNullOrWhiteSpace($item.Value)) {
    return $item.Value.Trim()
  }

  return $Default
}

function Get-GcloudConfigValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Key
  )

  $value = & $script:GcloudCommand config get-value $Key 2>$null
  if ($LASTEXITCODE -ne 0) {
    return ""
  }

  $text = ($value | Select-Object -First 1).Trim()
  if ([string]::IsNullOrWhiteSpace($text) -or $text -eq "(unset)") {
    return ""
  }

  return $text
}

function Write-Step {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Message
  )

  Write-Host "[eixoone] $Message"
}

function Test-Executable {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

$script:GcloudCommand = if (Test-Executable -Name "gcloud.cmd") { "gcloud.cmd" } else { "gcloud" }
$script:GcloudExecutablePath = (Get-Command $script:GcloudCommand -ErrorAction Stop).Source
$script:FirebaseCommand = if (Test-Executable -Name "firebase.cmd") {
  "firebase.cmd"
}
elseif (Test-Executable -Name "firebase") {
  "firebase"
}
else {
  ""
}
$script:FirebaseExecutablePath = if ([string]::IsNullOrWhiteSpace($script:FirebaseCommand)) {
  ""
}
else {
  (Get-Command $script:FirebaseCommand -ErrorAction Stop).Source
}

function Test-ProjectAccess {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId
  )

  $commandLine = '"{0}" projects describe "{1}" --format=value(projectId) >nul 2>nul' -f $script:GcloudExecutablePath, $ProjectId
  cmd.exe /d /c $commandLine *> $null
  return $LASTEXITCODE -eq 0
}

function Get-ProjectIamPolicy {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId
  )

  $json = & $script:GcloudCommand projects get-iam-policy $ProjectId --format=json 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace(($json | Out-String))) {
    return $null
  }

  return $json | ConvertFrom-Json
}

function Get-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

$script:EixoOneConfig = [ordered]@{
  ProjectId = Get-EnvironmentValue -Name "EIXOONE_PROJECT_ID" -Default "eixoone-dev"
  ProjectName = Get-EnvironmentValue -Name "EIXOONE_PROJECT_NAME" -Default "EixoOne"
  BillingAccountId = Get-EnvironmentValue -Name "EIXOONE_BILLING_ACCOUNT_ID"
  Region = Get-EnvironmentValue -Name "EIXOONE_REGION" -Default "southamerica-east1"
  FirestoreLocation = Get-EnvironmentValue -Name "EIXOONE_FIRESTORE_LOCATION" -Default "southamerica-east1"
  Environment = Get-EnvironmentValue -Name "EIXOONE_ENVIRONMENT" -Default "dev"
  SupportEmail = Get-EnvironmentValue -Name "EIXOONE_SUPPORT_EMAIL" -Default (Get-GcloudConfigValue -Key "account")
  AppName = Get-EnvironmentValue -Name "EIXOONE_APP_NAME" -Default "eixoone"
  ServicePrefix = Get-EnvironmentValue -Name "EIXOONE_SERVICE_PREFIX" -Default "eixoone"
  OrgId = Get-EnvironmentValue -Name "EIXOONE_ORG_ID"
  FolderId = Get-EnvironmentValue -Name "EIXOONE_FOLDER_ID"
  DomainAllowed = Get-EnvironmentValue -Name "EIXOONE_DOMAIN_ALLOWED"
}

$script:RequiredServices = @(
  "cloudresourcemanager.googleapis.com",
  "serviceusage.googleapis.com",
  "firebase.googleapis.com",
  "firebasestorage.googleapis.com",
  "firestore.googleapis.com",
  "storage.googleapis.com",
  "cloudfunctions.googleapis.com",
  "run.googleapis.com",
  "cloudbuild.googleapis.com",
  "artifactregistry.googleapis.com",
  "secretmanager.googleapis.com",
  "iam.googleapis.com",
  "iamcredentials.googleapis.com",
  "logging.googleapis.com",
  "monitoring.googleapis.com",
  "clouderrorreporting.googleapis.com",
  "cloudtrace.googleapis.com",
  "eventarc.googleapis.com",
  "pubsub.googleapis.com",
  "cloudscheduler.googleapis.com",
  "appengine.googleapis.com",
  "firebaseappcheck.googleapis.com"
)

$script:ServiceAccountDefinitions = @(
  [pscustomobject]@{
    Name = "{0}-api-{1}" -f $script:EixoOneConfig.ServicePrefix, $script:EixoOneConfig.Environment
    Description = "Runtime da API HTTP do EixoOne"
    Roles = @(
      "roles/logging.logWriter",
      "roles/monitoring.metricWriter",
      "roles/datastore.user",
      "roles/storage.objectUser"
    )
  },
  [pscustomobject]@{
    Name = "{0}-functions-{1}" -f $script:EixoOneConfig.ServicePrefix, $script:EixoOneConfig.Environment
    Description = "Runtime das Cloud Functions do EixoOne"
    Roles = @(
      "roles/logging.logWriter",
      "roles/monitoring.metricWriter",
      "roles/datastore.user",
      "roles/storage.objectUser"
    )
  },
  [pscustomobject]@{
    Name = "{0}-ci-{1}" -f $script:EixoOneConfig.ServicePrefix, $script:EixoOneConfig.Environment
    Description = "Execucao de CI para build e validacao"
    Roles = @(
      "roles/cloudbuild.builds.builder"
    )
  },
  [pscustomobject]@{
    Name = "{0}-deploy-{1}" -f $script:EixoOneConfig.ServicePrefix, $script:EixoOneConfig.Environment
    Description = "Deploy controlado de Cloud Run e Functions"
    Roles = @(
      "roles/run.developer",
      "roles/cloudfunctions.developer",
      "roles/iam.serviceAccountUser"
    )
  },
  [pscustomobject]@{
    Name = "{0}-observability-{1}" -f $script:EixoOneConfig.ServicePrefix, $script:EixoOneConfig.Environment
    Description = "Rotinas de observabilidade e diagnostico"
    Roles = @(
      "roles/logging.logWriter",
      "roles/monitoring.metricWriter"
    )
  }
)

$script:SecretDefinitions = @(
  [pscustomobject]@{
    Name = "EIXOONE_FIREBASE_PROJECT_ID"
    Access = @("api", "functions")
  },
  [pscustomobject]@{
    Name = "EIXOONE_API_ENV"
    Access = @("api", "functions")
  },
  [pscustomobject]@{
    Name = "EIXOONE_JWT_AUDIENCE"
    Access = @("api")
  },
  [pscustomobject]@{
    Name = "EIXOONE_WEBHOOK_SECRET"
    Access = @("api", "functions")
  },
  [pscustomobject]@{
    Name = "EIXOONE_APP_CONFIG"
    Access = @("api", "functions")
  }
)

function Get-ServiceAccountEmail {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  return "{0}@{1}.iam.gserviceaccount.com" -f $Name, $script:EixoOneConfig.ProjectId
}

function Get-ServiceAccountNameByAlias {
  param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("api", "functions", "ci", "deploy", "observability")]
    [string]$Alias
  )

  return "{0}-{1}-{2}" -f $script:EixoOneConfig.ServicePrefix, $Alias, $script:EixoOneConfig.Environment
}

function Get-ArtifactRepositoryName {
  return "{0}-api-{1}" -f $script:EixoOneConfig.ServicePrefix, $script:EixoOneConfig.Environment
}
