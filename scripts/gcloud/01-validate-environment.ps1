param(
  [switch]$Json
)

. (Join-Path $PSScriptRoot "00-config.ps1")

function Get-CommandVersion {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [scriptblock]$Command
  )

  if (-not (Test-Executable -Name $Name)) {
    return "missing"
  }

  try {
    $value = & $Command
    return (($value | Select-Object -First 1).ToString()).Trim()
  }
  catch {
    return "error"
  }
}

$repoRoot = Get-RepoRoot
$gcloudAccount = Get-GcloudConfigValue -Key "account"
$gcloudProject = Get-GcloudConfigValue -Key "project"
$gcloudVersionJson = & $script:GcloudCommand version --format=json 2>$null
$gcloudVersion = if ($LASTEXITCODE -eq 0) { (($gcloudVersionJson | ConvertFrom-Json).'Google Cloud SDK') } else { "missing" }

$summary = [ordered]@{
  PowerShell = $PSVersionTable.PSVersion.ToString()
  GCloud = $gcloudVersion
  GCloudAccount = $gcloudAccount
  GCloudProject = $gcloudProject
  Node = Get-CommandVersion -Name "node" -Command { node --version }
  Npm = Get-CommandVersion -Name "npm" -Command { npm --version }
  Git = Get-CommandVersion -Name "git" -Command { git --version }
  Flutter = if (Test-Path (Join-Path $repoRoot "apps/mobile_flutter/pubspec.yaml")) { Get-CommandVersion -Name "flutter" -Command { flutter --version } } else { "not-required" }
  Dart = if (Test-Path (Join-Path $repoRoot "apps/mobile_flutter/pubspec.yaml")) { Get-CommandVersion -Name "dart" -Command { dart --version } } else { "not-required" }
  FirebaseCli = if (Test-Path (Join-Path $repoRoot "firebase.json")) { Get-CommandVersion -Name "firebase" -Command { firebase --version } } else { "not-required" }
  Paths = [ordered]@{
    Readme = Test-Path (Join-Path $repoRoot "README.md")
    FirebaseJson = Test-Path (Join-Path $repoRoot "firebase.json")
    Firebaserc = Test-Path (Join-Path $repoRoot ".firebaserc")
    EnvExample = Test-Path (Join-Path $repoRoot ".env.example")
    BackendPackage = Test-Path (Join-Path $repoRoot "backend/api_node/package.json")
    FlutterPubspec = Test-Path (Join-Path $repoRoot "apps/mobile_flutter/pubspec.yaml")
    FirebaseRules = Test-Path (Join-Path $repoRoot "firebase/rules")
    Docs = Test-Path (Join-Path $repoRoot "docs")
  }
  TargetConfig = $script:EixoOneConfig
}

if ($Json) {
  $summary | ConvertTo-Json -Depth 6
  exit 0
}

Write-Step "Environment validation summary"
$summary.GetEnumerator() | ForEach-Object {
  if ($_.Key -eq "Paths" -or $_.Key -eq "TargetConfig") {
    return
  }

  Write-Host (" - {0}: {1}" -f $_.Key, $_.Value)
}

Write-Host " - Paths:"
$summary.Paths.GetEnumerator() | ForEach-Object {
  Write-Host ("   * {0}: {1}" -f $_.Key, $_.Value)
}

Write-Host " - TargetConfig:"
$summary.TargetConfig.GetEnumerator() | ForEach-Object {
  Write-Host ("   * {0}: {1}" -f $_.Key, $_.Value)
}
