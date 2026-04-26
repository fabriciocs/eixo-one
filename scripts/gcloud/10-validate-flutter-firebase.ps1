param(
  [switch]$Json
)

. (Join-Path $PSScriptRoot "00-config.ps1")

$repoRoot = Get-RepoRoot
$flutterRoot = Join-Path $repoRoot "apps/mobile_flutter"
$flutterFirebaseJsonPath = Join-Path $flutterRoot "firebase.json"
$firebaseOptionsPath = Join-Path $flutterRoot "lib/firebase_options.dart"
$androidConfigPath = Join-Path $flutterRoot "android/app/google-services.json"
$iosConfigPath = Join-Path $flutterRoot "ios/Runner/GoogleService-Info.plist"
$pubspecPath = Join-Path $flutterRoot "pubspec.yaml"

$summary = [ordered]@{
  ProjectId = $script:EixoOneConfig.ProjectId
  FlutterProjectExists = Test-Path $pubspecPath
  FlutterFireManifestExists = Test-Path $flutterFirebaseJsonPath
  FirebaseOptionsExists = Test-Path $firebaseOptionsPath
  AndroidGoogleServicesExists = Test-Path $androidConfigPath
  IosGoogleServiceInfoExists = Test-Path $iosConfigPath
  FirebaseOptionsProjectMatch = $false
  FirebaseOptionsStorageBucketMatch = $false
  AndroidProjectMatch = $false
  IosProjectMatch = $false
  RegisteredPlatforms = @()
}

if ($summary.FirebaseOptionsExists) {
  $firebaseOptionsContent = Get-Content $firebaseOptionsPath -Raw
  $summary.FirebaseOptionsProjectMatch = $firebaseOptionsContent.Contains(("projectId: '{0}'" -f $script:EixoOneConfig.ProjectId))
  $summary.FirebaseOptionsStorageBucketMatch = $firebaseOptionsContent.Contains(("storageBucket: '{0}.firebasestorage.app'" -f $script:EixoOneConfig.ProjectId))
}

if ($summary.AndroidGoogleServicesExists) {
  $androidConfig = Get-Content $androidConfigPath -Raw | ConvertFrom-Json
  $summary.AndroidProjectMatch = $androidConfig.project_info.project_id -eq $script:EixoOneConfig.ProjectId
}

if ($summary.IosGoogleServiceInfoExists) {
  $iosConfigContent = Get-Content $iosConfigPath -Raw
  $summary.IosProjectMatch = $iosConfigContent.Contains($script:EixoOneConfig.ProjectId)
}

if (-not [string]::IsNullOrWhiteSpace($script:FirebaseExecutablePath) -and (Test-ProjectAccess -ProjectId $script:EixoOneConfig.ProjectId)) {
  $firebaseCommandLine = '"{0}" apps:list --project "{1}" --json 2>nul' -f $script:FirebaseExecutablePath, $script:EixoOneConfig.ProjectId
  $firebaseJson = cmd.exe /d /c $firebaseCommandLine
  if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($firebaseJson | Out-String))) {
    $firebaseApps = (($firebaseJson | Out-String) | ConvertFrom-Json).result
    if ($firebaseApps -is [System.Collections.IEnumerable]) {
      $summary.RegisteredPlatforms = @(
        $firebaseApps |
          ForEach-Object { $_.platform } |
          Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
          Sort-Object -Unique
      )
    }
  }
}

if ($Json) {
  $summary | ConvertTo-Json -Depth 4
  exit 0
}

Write-Step "Flutter Firebase validation summary"
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
