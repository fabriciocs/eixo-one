param(
  [switch]$Json
)

. (Join-Path $PSScriptRoot "00-config.ps1")

$projectAccessible = Test-ProjectAccess -ProjectId $script:EixoOneConfig.ProjectId
$firebaseRegistered = $false

if (-not [string]::IsNullOrWhiteSpace($script:FirebaseExecutablePath)) {
  $firebaseCommandLine = '"{0}" projects:list --json 2>nul' -f $script:FirebaseExecutablePath
  $firebaseJson = cmd.exe /d /c $firebaseCommandLine
  if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($firebaseJson | Out-String))) {
    $firebaseRegistered = (($firebaseJson | ConvertFrom-Json).result.projectId -contains $script:EixoOneConfig.ProjectId)
  }
}

$summary = [ordered]@{
  TargetProject = $script:EixoOneConfig.ProjectId
  TargetProjectAccessible = $projectAccessible
  ConfiguredProject = Get-GcloudConfigValue -Key "project"
  ConfiguredAccount = Get-GcloudConfigValue -Key "account"
  FirebaseRegistered = $firebaseRegistered
  EnabledServices = @()
  ServiceAccounts = @()
  Secrets = @()
  ArtifactRepositories = @()
}

if ($projectAccessible) {
  $summary.EnabledServices = @(
    & $script:GcloudCommand services list --enabled --project $script:EixoOneConfig.ProjectId --format="value(config.name)" 2>$null
  ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

  $summary.ServiceAccounts = @(
    & $script:GcloudCommand iam service-accounts list --project $script:EixoOneConfig.ProjectId --format="value(email)" 2>$null
  ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

  $summary.Secrets = @(
    & $script:GcloudCommand secrets list --project $script:EixoOneConfig.ProjectId --format="value(name)" 2>$null
  ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

  $artifactListCommandLine = '"{0}" artifacts repositories list --project="{1}" --location="{2}" --format=value(name) 2>nul' -f `
    $script:GcloudExecutablePath,
    $script:EixoOneConfig.ProjectId,
    $script:EixoOneConfig.Region
  $summary.ArtifactRepositories = @(
    cmd.exe /d /c $artifactListCommandLine
  ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
}

if ($Json) {
  $summary | ConvertTo-Json -Depth 5
  exit 0
}

Write-Step "GCloud foundation summary"
$summary.GetEnumerator() | ForEach-Object {
  if ($_.Value -is [System.Collections.IEnumerable] -and -not ($_.Value -is [string])) {
    Write-Host (" - {0}:" -f $_.Key)
    foreach ($item in $_.Value) {
      Write-Host ("   * {0}" -f $item)
    }
    return
  }

  Write-Host (" - {0}: {1}" -f $_.Key, $_.Value)
}
